BEGIN;
SET LOCAL search_path = pg_catalog, public;

-- Event time and notification signing time are different from an API JWS's
-- signing time. A freshly signed stale API response is not a new refund.
ALTER TABLE public.apple_subscription_transactions
  ADD COLUMN IF NOT EXISTS revocation_event_at timestamptz,
  ADD COLUMN IF NOT EXISTS revocation_notification_signed_at timestamptz;

-- Only actual revocation dates can be recovered from the old rows. In
-- particular, never invent a notification time from signed_at, processed_at,
-- or the legacy revocation_reversed_at field (formerly an API signing time).
UPDATE public.apple_subscription_transactions
  SET revocation_event_at = revoked_at
  WHERE revocation_event_at IS NULL AND revoked_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.apply_apple_subscription_snapshot(p_snapshot jsonb)
RETURNS jsonb LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE
  owner public.apple_account_tokens%ROWTYPE;
  existing_subscription public.apple_subscriptions%ROWTYPE;
  existing_transaction public.apple_subscription_transactions%ROWTYPE;
  latest_transaction public.apple_subscription_transactions%ROWTYPE;
  notice_transaction public.apple_subscription_transactions%ROWTYPE;
  incoming jsonb;
  incoming_order bigint;
  original_id text := p_snapshot->>'original_transaction_id';
  token uuid := (p_snapshot->>'app_account_token')::uuid;
  provider_environment text := p_snapshot->>'environment';
  observed timestamptz := (p_snapshot->>'observed_at')::timestamptz;
  incoming_signed timestamptz;
  incoming_revoked timestamptz;
  selected_latest text := p_snapshot->'transactions'->0->>'transaction_id';
  result_access_until timestamptz;
  notification_uuid uuid := (p_snapshot->>'notification_id')::uuid;
  reserved_notification uuid;
  duplicate_original_id text;
  notice jsonb := p_snapshot->'revocation_notification';
  notice_type text;
  notice_id text;
  notice_signed timestamptz;
  notice_transaction_signed timestamptz;
  notice_revoked timestamptz;
  notice_is_new boolean;
  accept_revocation boolean;
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

  -- Reserve under the existing account/subscription locks, before changing any
  -- transaction or existing subscription state. The unique index also serializes
  -- competing UUIDs for different accounts/contracts; a failed RPC rolls back
  -- the reservation. The placeholder above is necessary for the existing FK.
  IF notification_uuid IS NOT NULL THEN
    INSERT INTO public.apple_subscription_notifications(environment, notification_id, original_transaction_id)
      VALUES(provider_environment, notification_uuid, original_id)
      ON CONFLICT (environment, notification_id) DO NOTHING
      RETURNING notification_id INTO reserved_notification;
    IF reserved_notification IS NULL THEN
      SELECT original_transaction_id INTO STRICT duplicate_original_id
        FROM public.apple_subscription_notifications
        WHERE environment = provider_environment AND notification_id = notification_uuid;
      IF duplicate_original_id IS DISTINCT FROM original_id THEN RAISE EXCEPTION 'JL_APPLE_ACCOUNT'; END IF;
      RETURN to_jsonb(existing_subscription);
    END IF;
  END IF;

  IF notice IS NOT NULL THEN
    IF jsonb_typeof(notice) IS DISTINCT FROM 'object' OR notification_uuid IS NULL OR
        jsonb_array_length(p_snapshot->'transactions') <> 2 THEN RAISE EXCEPTION 'JL_APPLE_SNAPSHOT'; END IF;
    notice_type := notice->>'notification_type';
    notice_id := notice->>'transaction_id';
    notice_signed := (notice->>'notification_signed_at')::timestamptz;
    notice_transaction_signed := (notice->>'transaction_signed_at')::timestamptz;
    notice_revoked := (notice->>'revoked_at')::timestamptz;
    IF notice_type NOT IN ('REFUND','REFUND_REVERSED') OR notice_type IS NULL OR
        notice_id IS NULL OR notice_signed IS NULL OR notice_transaction_signed IS NULL OR
        notice_signed > clock_timestamp() + interval '5 minutes' OR
        notice_transaction_signed > clock_timestamp() + interval '5 minutes' OR
        notice_id IS DISTINCT FROM p_snapshot->'transactions'->1->>'transaction_id' OR
        notice_transaction_signed IS DISTINCT FROM (p_snapshot->'transactions'->1->>'signed_at')::timestamptz OR
        notice_revoked IS DISTINCT FROM (p_snapshot->'transactions'->1->>'revoked_at')::timestamptz OR
        (notice_type = 'REFUND' AND (notice_revoked IS NULL OR notice_revoked > notice_signed)) OR
        (notice_type = 'REFUND_REVERSED' AND notice_revoked IS NOT NULL) THEN RAISE EXCEPTION 'JL_APPLE_SNAPSHOT'; END IF;
  END IF;

  FOR incoming, incoming_order IN
    SELECT value, ordinality FROM jsonb_array_elements(p_snapshot->'transactions') WITH ORDINALITY ORDER BY ordinality
  LOOP
    IF incoming->>'environment' IS DISTINCT FROM provider_environment OR
      incoming->>'original_transaction_id' IS DISTINCT FROM original_id OR
      (incoming->>'app_account_token')::uuid IS DISTINCT FROM token THEN RAISE EXCEPTION 'JL_APPLE_ACCOUNT'; END IF;
    incoming_signed := (incoming->>'signed_at')::timestamptz;
    incoming_revoked := (incoming->>'revoked_at')::timestamptz;
    IF incoming_signed IS NULL OR incoming_signed > clock_timestamp() + interval '5 minutes' OR
        incoming_revoked > clock_timestamp() + interval '5 minutes' THEN RAISE EXCEPTION 'JL_APPLE_SNAPSHOT'; END IF;
    SELECT * INTO existing_transaction FROM public.apple_subscription_transactions
      WHERE environment = provider_environment AND transaction_id = incoming->>'transaction_id' FOR UPDATE;
    IF FOUND THEN
      IF existing_transaction.original_transaction_id <> original_id OR existing_transaction.app_account_token <> token OR
        existing_transaction.product_id <> incoming->>'product_id' OR
        existing_transaction.purchased_at <> (incoming->>'purchased_at')::timestamptz THEN RAISE EXCEPTION 'JL_APPLE_ACCOUNT'; END IF;
      accept_revocation := incoming_revoked IS NOT NULL;
      IF accept_revocation THEN
        IF incoming_order = 2 AND notice_type = 'REFUND' THEN
          -- Only the original notification time orders notification evidence.
          -- Its transaction JWS or the API may have been signed at another time.
          IF notice_signed <= existing_transaction.revocation_notification_signed_at THEN accept_revocation := false; END IF;
        ELSIF existing_transaction.revoked_at IS NULL THEN
          -- A re-signed API/device copy of a refund already reversed cannot
          -- create a new refund event. The actual revocation date must be later.
          IF incoming_revoked <= existing_transaction.revocation_notification_signed_at THEN accept_revocation := false; END IF;
        END IF;
      END IF;
      UPDATE public.apple_subscription_transactions SET
        revoked_at = CASE WHEN accept_revocation THEN greatest(revoked_at, incoming_revoked) ELSE revoked_at END,
        revocation_event_at = greatest(revocation_event_at, incoming_revoked),
        is_upgraded = is_upgraded OR (incoming->>'is_upgraded')::boolean,
        expires_at = CASE WHEN incoming_signed > signed_at THEN (incoming->>'expires_at')::timestamptz ELSE expires_at END,
        signed_at = greatest(signed_at, incoming_signed)
        WHERE environment = provider_environment AND transaction_id = existing_transaction.transaction_id;
    ELSE
      INSERT INTO public.apple_subscription_transactions(environment, transaction_id, original_transaction_id, app_account_token,
          product_id, purchased_at, expires_at, signed_at, revoked_at, revocation_event_at, is_upgraded, is_trial)
        VALUES(provider_environment, incoming->>'transaction_id', original_id, token, incoming->>'product_id',
          (incoming->>'purchased_at')::timestamptz, (incoming->>'expires_at')::timestamptz, incoming_signed, incoming_revoked,
          incoming_revoked, (incoming->>'is_upgraded')::boolean, (incoming->>'is_trial')::boolean);
    END IF;
  END LOOP;

  IF notice IS NOT NULL THEN
    SELECT * INTO STRICT notice_transaction FROM public.apple_subscription_transactions
      WHERE environment = provider_environment AND transaction_id = notice_id FOR UPDATE;
    notice_is_new := notice_transaction.revocation_notification_signed_at IS NULL OR
      notice_signed > notice_transaction.revocation_notification_signed_at;
    -- The legacy reversal field is preserved as history only. Without an
    -- original notification time, negative evidence must fail closed rather
    -- than be suppressed by the old API signing time. A new verified reversal
    -- supplies the missing, actual notification proof.
    IF notice_is_new THEN
      IF notice_type = 'REFUND_REVERSED' AND
          (p_snapshot->>'status')::integer IN (1,2,3,4) AND selected_latest = notice_id AND
          (p_snapshot->'transactions'->0->>'revoked_at')::timestamptz IS NULL AND
          (notice_transaction.revocation_event_at IS NULL OR notice_signed > notice_transaction.revocation_event_at) THEN
        -- The original, verified REFUND_REVERSED notification is the proof.
        -- A boolean from an older deployment or an API record alone cannot
        -- clear a refund. Expired/billing-retry records can clear the marker
        -- without gaining access; only status 1/4 and a real deadline grant it.
        -- API JWS signing times never order refunds.
        UPDATE public.apple_subscription_transactions SET revoked_at = NULL,
          revocation_reversed_at = greatest(revocation_reversed_at, notice_signed)
          WHERE environment = provider_environment AND transaction_id = notice_id;
      END IF;
      UPDATE public.apple_subscription_transactions SET revocation_notification_signed_at = notice_signed
        WHERE environment = provider_environment AND transaction_id = notice_id;
    END IF;
  END IF;

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
  SELECT * INTO STRICT existing_subscription FROM public.apple_subscriptions
    WHERE environment = provider_environment AND original_transaction_id = original_id;
  RETURN to_jsonb(existing_subscription);
END $$;

REVOKE ALL ON FUNCTION public.apply_apple_subscription_snapshot(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_apple_subscription_snapshot(jsonb) TO service_role;
COMMIT;
