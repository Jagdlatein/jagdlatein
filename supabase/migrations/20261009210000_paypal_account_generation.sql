BEGIN;
SET LOCAL search_path = pg_catalog, public;

-- Apply with account deletion disabled, together with the complete-purge migration.
ALTER TABLE public.paypal_subscriptions ADD COLUMN IF NOT EXISTS account_generation uuid;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.paypal_subscriptions'::regclass
      AND attname = 'account_generation' AND (atttypid <> 'uuid'::regtype OR attgenerated <> '' OR attidentity <> '')) THEN
    RAISE EXCEPTION 'JL_PAYPAL_SETUP: unexpected generation column';
  END IF;
  IF EXISTS (SELECT 1 FROM public.paypal_subscriptions s WHERE s.account_deleted_at IS NULL AND
      (s.account_email <> lower(btrim(s.account_email)) OR
       (SELECT count(*) FROM public.userprofile p WHERE lower(btrim(p.email)) = s.account_email) <> 1 OR
       NOT EXISTS (SELECT 1 FROM public.userprofile p WHERE lower(btrim(p.email)) = s.account_email
         AND (s.account_generation IS NULL OR s.account_generation = p.account_generation)))) THEN
    RAISE EXCEPTION 'JL_PAYPAL_SETUP: missing, ambiguous or changed account binding';
  END IF;
END $$;
UPDATE public.paypal_subscriptions s SET account_generation = p.account_generation
FROM public.userprofile p WHERE s.account_deleted_at IS NULL AND s.account_generation IS NULL
  AND lower(btrim(p.email)) = s.account_email;
ALTER TABLE public.paypal_subscriptions DROP CONSTRAINT IF EXISTS paypal_subscriptions_live_generation;
ALTER TABLE public.paypal_subscriptions ADD CONSTRAINT paypal_subscriptions_live_generation
  CHECK (account_deleted_at IS NOT NULL OR account_generation IS NOT NULL);
ALTER TABLE public.paypal_subscriptions DROP CONSTRAINT IF EXISTS paypal_subscriptions_generation_owner;
ALTER TABLE public.paypal_subscriptions ADD CONSTRAINT paypal_subscriptions_generation_owner
  FOREIGN KEY (account_generation) REFERENCES public.userprofile(account_generation) ON DELETE RESTRICT;

-- One current-account checkout request shares the provider's idempotency key.
-- It contains no payer email and is deleted with its owning profile.
CREATE TABLE IF NOT EXISTS public.paypal_checkout_requests (
  account_generation uuid PRIMARY KEY REFERENCES public.userprofile(account_generation) ON DELETE RESTRICT,
  request_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  plan_id text NOT NULL CHECK (plan_id ~ '^P-[A-Z0-9]{6,64}$'),
  subscription_id text CHECK (subscription_id ~* '^I-[A-Z0-9]{6,64}$'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE public.paypal_checkout_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.paypal_checkout_requests FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.guard_paypal_account_binding()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.subscription_id IS DISTINCT FROM NEW.subscription_id OR
      OLD.account_email IS DISTINCT FROM NEW.account_email OR OLD.account_generation IS DISTINCT FROM NEW.account_generation) THEN
    RAISE EXCEPTION 'JL_PAYPAL_BINDING_IMMUTABLE';
  END IF;
  -- Old explicit deletion markers are purged by the following migration, never backfilled.
  IF NEW.account_deleted_at IS NOT NULL AND NEW.account_generation IS NULL THEN RETURN NEW; END IF;
  PERFORM 1 FROM public.userprofile WHERE lower(btrim(email)) = NEW.account_email
    AND account_generation = NEW.account_generation FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JL_PAYPAL_BINDING_MISSING'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS paypal_deleted_contract_guard ON public.paypal_subscriptions;
DROP TRIGGER IF EXISTS paypal_current_account_binding ON public.paypal_subscriptions;
CREATE TRIGGER paypal_current_account_binding BEFORE INSERT OR UPDATE ON public.paypal_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.guard_paypal_account_binding();

CREATE OR REPLACE FUNCTION public.begin_paypal_checkout(p_email text,p_account_generation uuid,p_plan_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE request_row public.paypal_checkout_requests; existing_status text;
BEGIN
  IF p_email IS NULL OR p_email <> lower(btrim(p_email)) OR p_account_generation IS NULL OR
      p_plan_id IS NULL OR p_plan_id !~ '^P-[A-Z0-9]{6,64}$' THEN RAISE EXCEPTION 'JL_PAYPAL_BINDING_MISSING'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_email,0));
  PERFORM public.require_current_request_actor();
  PERFORM 1 FROM public.userprofile WHERE lower(btrim(email)) = p_email AND account_generation = p_account_generation FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JL_PAYPAL_BINDING_MISSING'; END IF;
  SELECT * INTO request_row FROM public.paypal_checkout_requests WHERE account_generation = p_account_generation FOR UPDATE;
  IF FOUND THEN
    IF request_row.subscription_id IS NOT NULL THEN
      SELECT status INTO existing_status FROM public.paypal_subscriptions WHERE subscription_id = request_row.subscription_id
        AND account_generation = p_account_generation AND account_email = p_email;
      IF existing_status IN ('APPROVAL_PENDING','APPROVED','ACTIVE','SUSPENDED') THEN
        IF request_row.plan_id <> p_plan_id THEN RAISE EXCEPTION 'JL_PAYPAL_CHECKOUT_PENDING'; END IF;
        RETURN to_jsonb(request_row);
      END IF;
    ELSIF request_row.created_at > clock_timestamp() - interval '24 hours' THEN
      IF request_row.plan_id <> p_plan_id THEN RAISE EXCEPTION 'JL_PAYPAL_CHECKOUT_PENDING'; END IF;
      RETURN to_jsonb(request_row);
    END IF;
    DELETE FROM public.paypal_checkout_requests WHERE account_generation = p_account_generation;
  END IF;
  INSERT INTO public.paypal_checkout_requests(account_generation,plan_id) VALUES(p_account_generation,p_plan_id) RETURNING * INTO request_row;
  RETURN to_jsonb(request_row);
END $$;

CREATE OR REPLACE FUNCTION public.reserve_paypal_subscription(p_email text,p_account_generation uuid,p_request_id uuid,p_subscription_id text,p_plan_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE request_row public.paypal_checkout_requests; subscription_row public.paypal_subscriptions;
BEGIN
  IF p_email IS NULL OR p_email <> lower(btrim(p_email)) OR p_account_generation IS NULL OR p_request_id IS NULL OR
      p_subscription_id IS NULL OR p_subscription_id !~* '^I-[A-Z0-9]{6,64}$' THEN RAISE EXCEPTION 'JL_PAYPAL_BINDING_MISSING'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_email,0));
  PERFORM public.require_current_request_actor();
  PERFORM 1 FROM public.userprofile WHERE lower(btrim(email)) = p_email AND account_generation = p_account_generation FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JL_PAYPAL_BINDING_MISSING'; END IF;
  SELECT * INTO request_row FROM public.paypal_checkout_requests WHERE account_generation = p_account_generation FOR UPDATE;
  IF NOT FOUND OR request_row.request_id <> p_request_id OR request_row.plan_id IS DISTINCT FROM p_plan_id OR
      (request_row.subscription_id IS NOT NULL AND request_row.subscription_id <> p_subscription_id) THEN
    RAISE EXCEPTION 'JL_PAYPAL_BINDING_MISSING';
  END IF;
  INSERT INTO public.paypal_subscriptions(subscription_id,account_email,account_generation,plan_id,status,verified_at)
    VALUES(p_subscription_id,p_email,p_account_generation,p_plan_id,'APPROVAL_PENDING',clock_timestamp()) ON CONFLICT(subscription_id) DO NOTHING;
  SELECT * INTO STRICT subscription_row FROM public.paypal_subscriptions WHERE subscription_id = p_subscription_id FOR UPDATE;
  IF subscription_row.account_generation IS DISTINCT FROM p_account_generation OR subscription_row.account_email <> p_email OR
      subscription_row.plan_id <> p_plan_id OR subscription_row.account_deleted_at IS NOT NULL THEN RAISE EXCEPTION 'JL_PAYPAL_BINDING_MISSING'; END IF;
  UPDATE public.paypal_checkout_requests SET subscription_id = p_subscription_id WHERE account_generation = p_account_generation;
  RETURN to_jsonb(subscription_row);
END $$;

-- The old provider-email account-creation entry point must no longer be callable.
REVOKE ALL ON FUNCTION public.ensure_paypal_account_profile(text,text) FROM PUBLIC,anon,authenticated,service_role;
-- A stale pre-upgrade PayPal instance also used a direct profile INSERT.
-- Only verified registration may create profiles through its private definer RPC.
-- Revoke both grant kinds; inherited/owner rights must fail closed for review.
REVOKE INSERT ON TABLE public.userprofile FROM service_role;
DO $$
DECLARE column_name text;
BEGIN
  FOR column_name IN SELECT attname FROM pg_attribute
    WHERE attrelid = 'public.userprofile'::regclass AND attnum > 0 AND NOT attisdropped LOOP
    EXECUTE format('REVOKE INSERT (%I) ON TABLE public.userprofile FROM service_role',column_name);
  END LOOP;
  IF has_table_privilege('service_role','public.userprofile','INSERT') OR
      has_any_column_privilege('service_role','public.userprofile','INSERT') THEN
    RAISE EXCEPTION 'JL_PAYPAL_SETUP: inherited profile creation privilege';
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.guard_paypal_account_binding(),public.begin_paypal_checkout(text,uuid,text),
  public.reserve_paypal_subscription(text,uuid,uuid,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.begin_paypal_checkout(text,uuid,text),public.reserve_paypal_subscription(text,uuid,uuid,text,text) TO service_role;

-- The generation-checked snapshot implementation follows; pricing, pinned trials
-- and refund ordering remain the existing implementation.

CREATE OR REPLACE FUNCTION public.apply_paypal_subscription_snapshot(p_snapshot jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  current_subscription public.paypal_subscriptions%ROWTYPE;
  current_payment public.paypal_subscription_payments%ROWTYPE;
  incoming_payment jsonb;
  observed timestamptz := (p_snapshot->>'observed_at')::timestamptz;
  provider_updated timestamptz := (p_snapshot->>'provider_updated_at')::timestamptz;
  incoming_trial_started timestamptz := (p_snapshot->>'trial_started_at')::timestamptz;
  incoming_trial_until timestamptz := (p_snapshot->>'trial_until')::timestamptz;
  next_review_reason text;
  result_paid_until timestamptz;
BEGIN
  IF observed IS NULL OR NOT isfinite(observed) OR observed > clock_timestamp() + interval '5 minutes'
    OR (provider_updated IS NOT NULL AND NOT isfinite(provider_updated))
    OR jsonb_typeof(p_snapshot->'payments') IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_snapshot->'payments') > 1001 THEN
    RAISE EXCEPTION 'Invalid subscription snapshot';
  END IF;
  IF (incoming_trial_started IS NULL) <> (incoming_trial_until IS NULL) OR
    (incoming_trial_started IS NOT NULL AND (
      NOT isfinite(incoming_trial_started) OR NOT isfinite(incoming_trial_until)
      OR incoming_trial_started > observed
      OR incoming_trial_until <= incoming_trial_started
      OR incoming_trial_until > incoming_trial_started + interval '72 hours'
    )) THEN
    RAISE EXCEPTION 'Invalid subscription trial window';
  END IF;

  IF p_snapshot->>'account_email' IS NULL OR p_snapshot->>'account_generation' IS NULL THEN
    RAISE EXCEPTION 'JL_PAYPAL_BINDING_MISSING';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_snapshot->>'account_email',0));
  PERFORM public.require_current_request_actor();
  PERFORM 1 FROM public.userprofile WHERE lower(btrim(email)) = p_snapshot->>'account_email'
    AND account_generation = (p_snapshot->>'account_generation')::uuid FOR KEY SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JL_PAYPAL_BINDING_MISSING'; END IF;
  SELECT * INTO current_subscription FROM public.paypal_subscriptions
    WHERE subscription_id = p_snapshot->>'subscription_id' FOR UPDATE;
  IF NOT FOUND OR current_subscription.account_generation IS DISTINCT FROM (p_snapshot->>'account_generation')::uuid
      OR current_subscription.account_deleted_at IS NOT NULL THEN RAISE EXCEPTION 'JL_PAYPAL_BINDING_MISSING'; END IF;
  -- Account binding changes require an explicit migration. They do not
  -- transfer the trial or paid history to a different account.
  IF current_subscription.account_email <> p_snapshot->>'account_email' THEN
    RAISE EXCEPTION 'Subscription account needs review';
  END IF;
  IF observed >= current_subscription.verified_at AND
    (provider_updated IS NULL OR current_subscription.provider_updated_at IS NULL OR provider_updated >= current_subscription.provider_updated_at) THEN
    next_review_reason := p_snapshot->>'review_reason';
    IF incoming_trial_started IS NOT NULL THEN
      IF current_subscription.trial_started_at IS NULL THEN
        UPDATE public.paypal_subscriptions
          SET trial_started_at = incoming_trial_started, trial_until = incoming_trial_until
          WHERE subscription_id = current_subscription.subscription_id;
      ELSIF current_subscription.trial_started_at IS DISTINCT FROM incoming_trial_started
        OR current_subscription.trial_until IS DISTINCT FROM incoming_trial_until THEN
        next_review_reason := 'trial_schedule_changed';
      END IF;
    ELSIF current_subscription.review_reason = 'trial_schedule_changed' THEN
      -- An older backend without trial evidence must not clear a detected change.
      -- Fresh evidence matching the original pinned times can resolve the review.
      next_review_reason := 'trial_schedule_changed';
    END IF;
    UPDATE public.paypal_subscriptions SET plan_id = p_snapshot->>'plan_id', status = p_snapshot->>'status',
      provider_updated_at = coalesce(provider_updated, provider_updated_at), verified_at = observed,
      review_reason = next_review_reason
    WHERE subscription_id = current_subscription.subscription_id;
  END IF;

  -- Preserve the original funded-coverage and replay protection rules. Trial
  -- evidence never creates a payment row or turns a schedule into payment proof.
  FOR incoming_payment IN SELECT value FROM jsonb_array_elements(p_snapshot->'payments') LOOP
    SELECT * INTO current_payment FROM public.paypal_subscription_payments
    WHERE subscription_id = current_subscription.subscription_id AND payment_id = incoming_payment->>'payment_id';
    IF FOUND THEN
      IF current_payment.status NOT IN ('REFUNDED','REVERSED') AND
        (observed >= current_payment.observed_at OR incoming_payment->>'status' IN ('REFUNDED','REVERSED')) THEN
        UPDATE public.paypal_subscription_payments
        SET status = CASE WHEN current_payment.status = 'PARTIALLY_REFUNDED' AND incoming_payment->>'status' = 'COMPLETED'
            THEN 'PARTIALLY_REFUNDED' ELSE incoming_payment->>'status' END,
          observed_at = greatest(observed_at, observed)
        WHERE subscription_id = current_subscription.subscription_id AND payment_id = current_payment.payment_id;
      END IF;
    ELSE
      INSERT INTO public.paypal_subscription_payments(subscription_id, payment_id, status, paid_at, period_until, amount, currency, observed_at)
      VALUES (current_subscription.subscription_id, incoming_payment->>'payment_id', incoming_payment->>'status',
        (incoming_payment->>'paid_at')::timestamptz, (incoming_payment->>'period_until')::timestamptz,
        incoming_payment->>'amount', incoming_payment->>'currency', observed);
    END IF;
  END LOOP;
  SELECT max(period_until) INTO result_paid_until FROM public.paypal_subscription_payments
  WHERE subscription_id = current_subscription.subscription_id AND status IN ('COMPLETED','PARTIALLY_REFUNDED');
  UPDATE public.paypal_subscriptions SET paid_until = result_paid_until
  WHERE subscription_id = current_subscription.subscription_id;
  SELECT * INTO current_subscription FROM public.paypal_subscriptions WHERE subscription_id = current_subscription.subscription_id;
  RETURN to_jsonb(current_subscription);
END;
$$;

REVOKE ALL ON FUNCTION public.apply_paypal_subscription_snapshot(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_paypal_subscription_snapshot(jsonb) TO service_role;
COMMIT;
