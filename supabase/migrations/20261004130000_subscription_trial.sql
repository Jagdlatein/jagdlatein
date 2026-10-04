BEGIN;
SET LOCAL search_path = pg_catalog, public;

-- Add verified provider trial evidence without changing existing subscriptions,
-- payment rows, manual premium flags or administrator flags.
ALTER TABLE public.paypal_subscriptions
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_until timestamptz;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_attribute WHERE attrelid = 'public.paypal_subscriptions'::regclass
      AND attname IN ('trial_started_at','trial_until') AND NOT attisdropped
      AND (atttypid <> 'timestamptz'::regtype OR attidentity <> '' OR attgenerated <> '')
  ) THEN RAISE EXCEPTION 'Subscription trial columns have an unexpected type; no changes applied.'; END IF;
END;
$$;
ALTER TABLE public.paypal_subscriptions DROP CONSTRAINT IF EXISTS paypal_subscriptions_trial_window;
ALTER TABLE public.paypal_subscriptions ADD CONSTRAINT paypal_subscriptions_trial_window CHECK (
  (trial_started_at IS NULL AND trial_until IS NULL) OR
  (trial_started_at IS NOT NULL AND trial_until IS NOT NULL
    AND isfinite(trial_started_at) AND isfinite(trial_until)
    AND trial_until > trial_started_at
    AND trial_until <= trial_started_at + interval '72 hours')
);

ALTER TABLE public.paypal_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paypal_subscription_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.paypal_subscriptions, public.paypal_subscription_payments FROM PUBLIC, anon, authenticated;
DO $$
DECLARE item record; columns text;
BEGIN
  FOR item IN SELECT * FROM (VALUES ('paypal_subscriptions'),('paypal_subscription_payments')) AS ledger(table_name) LOOP
    SELECT string_agg(format('%I', attname), ', ' ORDER BY attnum) INTO columns FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I',item.table_name)) AND attnum > 0 AND NOT attisdropped;
    EXECUTE format('REVOKE ALL PRIVILEGES (%s) ON TABLE public.%I FROM PUBLIC, anon, authenticated', columns, item.table_name);
  END LOOP;
END;
$$;
GRANT SELECT, INSERT, UPDATE ON TABLE public.paypal_subscriptions, public.paypal_subscription_payments TO service_role;

-- Service-role backend supplies these fields only after reading the exact allowed
-- PayPal trial plan and its current subscription. Trial times are optional for
-- older/regular snapshots. The first fresh evidence is pinned forever for this
-- subscription ID; a new PayPal subscription is a separate provider contract.
CREATE OR REPLACE FUNCTION public.apply_paypal_subscription_snapshot(p_snapshot jsonb)
RETURNS jsonb
LANGUAGE plpgsql
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

  INSERT INTO public.paypal_subscriptions(subscription_id, account_email, plan_id, status, provider_updated_at, verified_at, review_reason)
  VALUES (p_snapshot->>'subscription_id', p_snapshot->>'account_email', p_snapshot->>'plan_id', p_snapshot->>'status', provider_updated, observed, p_snapshot->>'review_reason')
  ON CONFLICT (subscription_id) DO NOTHING;

  SELECT * INTO STRICT current_subscription FROM public.paypal_subscriptions
  WHERE subscription_id = p_snapshot->>'subscription_id' FOR UPDATE;
  -- Provider email changes require an explicit account migration. They do not
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

REVOKE ALL ON FUNCTION public.apply_paypal_subscription_snapshot(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_paypal_subscription_snapshot(jsonb) TO service_role;

COMMIT;
