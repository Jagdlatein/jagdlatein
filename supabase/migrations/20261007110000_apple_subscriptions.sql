BEGIN;
SET LOCAL search_path = pg_catalog, public;

-- Prepared infrastructure only: purchases stay disabled in server configuration.
-- Public Apple certificate roots are not API credentials. In-App Purchase keys
-- remain server-only secrets and are never stored in these tables.
DO $$
BEGIN
  IF to_regclass('public.userprofile') IS NULL THEN RAISE EXCEPTION 'JL_APPLE_SETUP: userprofile is missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role' AND (rolbypassrls OR rolsuper)) THEN
    RAISE EXCEPTION 'JL_APPLE_SETUP: service_role must bypass RLS';
  END IF;
END $$;

ALTER TABLE public.userprofile ADD COLUMN IF NOT EXISTS account_generation uuid NOT NULL DEFAULT gen_random_uuid();

CREATE TABLE IF NOT EXISTS public.apple_account_tokens (
  app_account_token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_email text UNIQUE CHECK (account_email = lower(btrim(account_email)) AND length(account_email) BETWEEN 3 AND 320),
  account_generation uuid NOT NULL UNIQUE,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK ((account_email IS NULL) = (deleted_at IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS public.apple_subscriptions (
  environment text NOT NULL CHECK (environment IN ('Sandbox','Production')),
  original_transaction_id text NOT NULL CHECK (original_transaction_id ~ '^[0-9]{1,30}$'),
  app_account_token uuid NOT NULL REFERENCES public.apple_account_tokens(app_account_token),
  latest_transaction_id text NOT NULL CHECK (latest_transaction_id ~ '^[0-9]{1,30}$'),
  status integer NOT NULL CHECK (status BETWEEN 1 AND 5),
  auto_renew boolean NOT NULL,
  access_until timestamptz,
  is_trial boolean NOT NULL DEFAULT false,
  grace_until timestamptz,
  verified_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (environment, original_transaction_id)
);
CREATE INDEX IF NOT EXISTS apple_subscriptions_account ON public.apple_subscriptions(app_account_token, environment);

CREATE TABLE IF NOT EXISTS public.apple_subscription_transactions (
  environment text NOT NULL,
  transaction_id text NOT NULL CHECK (transaction_id ~ '^[0-9]{1,30}$'),
  original_transaction_id text NOT NULL,
  app_account_token uuid NOT NULL REFERENCES public.apple_account_tokens(app_account_token),
  product_id text NOT NULL CHECK (product_id ~ '^de[.]jagdlatein[.][A-Za-z0-9._-]{1,100}$'),
  purchased_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  signed_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revocation_reversed_at timestamptz,
  is_upgraded boolean NOT NULL,
  is_trial boolean NOT NULL,
  PRIMARY KEY (environment, transaction_id),
  FOREIGN KEY (environment, original_transaction_id) REFERENCES public.apple_subscriptions(environment, original_transaction_id),
  CHECK (expires_at > purchased_at AND expires_at <= purchased_at + interval '400 days')
);

CREATE TABLE IF NOT EXISTS public.apple_subscription_notifications (
  environment text NOT NULL CHECK (environment IN ('Sandbox','Production')),
  notification_id uuid NOT NULL,
  original_transaction_id text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (environment, notification_id),
  FOREIGN KEY (environment, original_transaction_id) REFERENCES public.apple_subscriptions(environment, original_transaction_id)
);

ALTER TABLE public.apple_account_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apple_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apple_subscription_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apple_subscription_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.apple_account_tokens, public.apple_subscriptions, public.apple_subscription_transactions,
  public.apple_subscription_notifications FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.apple_account_tokens, public.apple_subscriptions,
  public.apple_subscription_transactions, public.apple_subscription_notifications TO service_role;

CREATE OR REPLACE FUNCTION public.ensure_apple_account_token(p_email text, p_account_generation uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE result public.apple_account_tokens%ROWTYPE;
BEGIN
  IF p_email IS NULL OR p_email <> lower(btrim(p_email)) OR p_account_generation IS NULL THEN RAISE EXCEPTION 'JL_APPLE_ACCOUNT'; END IF;
  -- The bounded service-only function owns its profile lock; the service role
  -- does not need broad UPDATE rights on premium/admin account flags.
  -- Lock order matches account deletion. Recreating the same email cannot revive
  -- the old account token or buy using a stale in-flight account generation.
  PERFORM 1 FROM public.userprofile WHERE lower(btrim(email)) = p_email AND account_generation = p_account_generation FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JL_APPLE_ACCOUNT'; END IF;
  INSERT INTO public.apple_account_tokens(account_email, account_generation)
    VALUES(p_email, p_account_generation) ON CONFLICT (account_email) DO NOTHING;
  SELECT * INTO STRICT result FROM public.apple_account_tokens WHERE account_email = p_email FOR UPDATE;
  IF result.account_generation <> p_account_generation OR result.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'JL_APPLE_ACCOUNT'; END IF;
  RETURN to_jsonb(result);
END $$;

CREATE OR REPLACE FUNCTION public.detach_apple_account(p_email text, p_account_generation uuid)
RETURNS void LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  -- Keep a non-reassignable, pseudonymous transaction identity for reconciliation.
  -- No email, account data or signed raw receipt is retained in its ledger.
  UPDATE public.apple_account_tokens SET account_email = NULL, deleted_at = clock_timestamp()
    WHERE account_email = p_email AND account_generation = p_account_generation;
END $$;

CREATE OR REPLACE FUNCTION public.apply_apple_subscription_snapshot(p_snapshot jsonb)
RETURNS jsonb LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE
  owner public.apple_account_tokens%ROWTYPE;
  existing_subscription public.apple_subscriptions%ROWTYPE;
  existing_transaction public.apple_subscription_transactions%ROWTYPE;
  latest_transaction public.apple_subscription_transactions%ROWTYPE;
  incoming jsonb;
  original_id text := p_snapshot->>'original_transaction_id';
  token uuid := (p_snapshot->>'app_account_token')::uuid;
  provider_environment text := p_snapshot->>'environment';
  observed timestamptz := (p_snapshot->>'observed_at')::timestamptz;
  incoming_signed timestamptz;
  incoming_revoked timestamptz;
  selected_latest text := p_snapshot->'transactions'->0->>'transaction_id';
  result_access_until timestamptz;
BEGIN
  IF observed IS NULL OR observed > clock_timestamp() + interval '5 minutes' OR
      p_snapshot->>'account_generation' IS NULL OR
      jsonb_typeof(p_snapshot->'transactions') IS DISTINCT FROM 'array' OR
      jsonb_array_length(p_snapshot->'transactions') NOT BETWEEN 1 AND 2 OR
      (p_snapshot->>'status')::integer NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'JL_APPLE_SNAPSHOT'; END IF;
  SELECT * INTO owner FROM public.apple_account_tokens WHERE app_account_token = token FOR UPDATE;
  IF NOT FOUND OR owner.account_generation <> (p_snapshot->>'account_generation')::uuid OR
      owner.account_email IS DISTINCT FROM (p_snapshot->>'account_email') THEN RAISE EXCEPTION 'JL_APPLE_ACCOUNT'; END IF;

  INSERT INTO public.apple_subscriptions(environment, original_transaction_id, app_account_token, latest_transaction_id,
      status, auto_renew, verified_at)
    VALUES(provider_environment, original_id, token, selected_latest, (p_snapshot->>'status')::integer,
      (p_snapshot->>'auto_renew')::boolean, observed) ON CONFLICT (environment, original_transaction_id) DO NOTHING;
  SELECT * INTO STRICT existing_subscription FROM public.apple_subscriptions
    WHERE environment = provider_environment AND original_transaction_id = original_id FOR UPDATE;
  IF existing_subscription.app_account_token <> token THEN RAISE EXCEPTION 'JL_APPLE_ACCOUNT'; END IF;

  FOR incoming IN SELECT value FROM jsonb_array_elements(p_snapshot->'transactions') LOOP
    IF incoming->>'environment' IS DISTINCT FROM provider_environment OR
      incoming->>'original_transaction_id' IS DISTINCT FROM original_id OR
      (incoming->>'app_account_token')::uuid IS DISTINCT FROM token THEN RAISE EXCEPTION 'JL_APPLE_ACCOUNT'; END IF;
    incoming_signed := (incoming->>'signed_at')::timestamptz;
    incoming_revoked := (incoming->>'revoked_at')::timestamptz;
    IF incoming_signed IS NULL OR incoming_signed > clock_timestamp() + interval '5 minutes' THEN RAISE EXCEPTION 'JL_APPLE_SNAPSHOT'; END IF;
    SELECT * INTO existing_transaction FROM public.apple_subscription_transactions
      WHERE environment = provider_environment AND transaction_id = incoming->>'transaction_id' FOR UPDATE;
    IF FOUND THEN
      IF existing_transaction.original_transaction_id <> original_id OR existing_transaction.app_account_token <> token OR
        existing_transaction.product_id <> incoming->>'product_id' OR
        existing_transaction.purchased_at <> (incoming->>'purchased_at')::timestamptz THEN RAISE EXCEPTION 'JL_APPLE_ACCOUNT'; END IF;
      -- A refunded transaction remains refunded after replay. A verified refund
      -- reversal is handled only with its current API status and newer Apple JWS.
      UPDATE public.apple_subscription_transactions SET
        revoked_at = CASE WHEN coalesce((p_snapshot->>'allow_revocation_reversal')::boolean, false) AND
          transaction_id = selected_latest AND incoming_signed > signed_at AND incoming_revoked IS NULL THEN NULL
          WHEN revocation_reversed_at IS NOT NULL AND incoming_signed <= revocation_reversed_at THEN revoked_at
          ELSE coalesce(revoked_at, incoming_revoked) END,
        revocation_reversed_at = CASE WHEN coalesce((p_snapshot->>'allow_revocation_reversal')::boolean, false) AND
          transaction_id = selected_latest AND incoming_signed > signed_at AND incoming_revoked IS NULL
          THEN incoming_signed ELSE revocation_reversed_at END,
        is_upgraded = is_upgraded OR (incoming->>'is_upgraded')::boolean,
        expires_at = CASE WHEN incoming_signed > signed_at THEN (incoming->>'expires_at')::timestamptz ELSE expires_at END,
        signed_at = greatest(signed_at, incoming_signed)
        WHERE environment = provider_environment AND transaction_id = existing_transaction.transaction_id;
    ELSE
      INSERT INTO public.apple_subscription_transactions(environment, transaction_id, original_transaction_id, app_account_token,
          product_id, purchased_at, expires_at, signed_at, revoked_at, is_upgraded, is_trial)
        VALUES(provider_environment, incoming->>'transaction_id', original_id, token, incoming->>'product_id',
          (incoming->>'purchased_at')::timestamptz, (incoming->>'expires_at')::timestamptz, incoming_signed, incoming_revoked,
          (incoming->>'is_upgraded')::boolean, (incoming->>'is_trial')::boolean);
    END IF;
  END LOOP;
  IF observed >= existing_subscription.verified_at THEN
    UPDATE public.apple_subscriptions SET status = (p_snapshot->>'status')::integer,
      latest_transaction_id = selected_latest, auto_renew = (p_snapshot->>'auto_renew')::boolean,
      grace_until = CASE WHEN (p_snapshot->>'status')::integer = 4 THEN (p_snapshot->>'grace_until')::timestamptz ELSE NULL END,
      verified_at = observed WHERE environment = provider_environment AND original_transaction_id = original_id;
  END IF;
  SELECT * INTO STRICT existing_subscription FROM public.apple_subscriptions
    WHERE environment = provider_environment AND original_transaction_id = original_id;
  SELECT * INTO STRICT latest_transaction FROM public.apple_subscription_transactions
    WHERE environment = provider_environment AND transaction_id = existing_subscription.latest_transaction_id;
  IF latest_transaction.revoked_at IS NOT NULL AND existing_subscription.status IN (1,4) THEN
    UPDATE public.apple_subscriptions SET status = 5
      WHERE environment = provider_environment AND original_transaction_id = original_id;
    existing_subscription.status := 5;
  END IF;
  result_access_until := NULL;
  IF existing_subscription.status IN (1,4) AND latest_transaction.revoked_at IS NULL AND NOT latest_transaction.is_upgraded THEN
    result_access_until := latest_transaction.expires_at;
    IF existing_subscription.status = 4 AND existing_subscription.grace_until > result_access_until THEN
      result_access_until := existing_subscription.grace_until;
    END IF;
  END IF;
  UPDATE public.apple_subscriptions SET access_until = result_access_until, is_trial = latest_transaction.is_trial
    WHERE environment = provider_environment AND original_transaction_id = original_id;
  IF p_snapshot->>'notification_id' IS NOT NULL THEN
    INSERT INTO public.apple_subscription_notifications(environment, notification_id, original_transaction_id)
      VALUES(provider_environment, (p_snapshot->>'notification_id')::uuid, original_id)
      ON CONFLICT (environment, notification_id) DO NOTHING;
  END IF;
  SELECT * INTO STRICT existing_subscription FROM public.apple_subscriptions
    WHERE environment = provider_environment AND original_transaction_id = original_id;
  RETURN to_jsonb(existing_subscription);
END $$;

REVOKE ALL ON FUNCTION public.ensure_apple_account_token(text, uuid), public.detach_apple_account(text, uuid),
  public.apply_apple_subscription_snapshot(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_apple_account_token(text, uuid), public.detach_apple_account(text, uuid),
  public.apply_apple_subscription_snapshot(jsonb) TO service_role;
COMMIT;
