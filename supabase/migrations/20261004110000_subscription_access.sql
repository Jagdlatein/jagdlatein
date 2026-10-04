BEGIN;

-- Existing userprofile.is_premium flags are intentionally unchanged: their
-- original manual/legacy source cannot safely be inferred from a boolean.
CREATE TABLE IF NOT EXISTS public.paypal_subscriptions (
  subscription_id text PRIMARY KEY CHECK (subscription_id ~* '^I-[A-Z0-9]{6,64}$'),
  account_email text NOT NULL CHECK (account_email = lower(btrim(account_email)) AND length(account_email) BETWEEN 3 AND 320),
  plan_id text NOT NULL CHECK (length(plan_id) BETWEEN 3 AND 64),
  status text NOT NULL CHECK (status IN ('APPROVAL_PENDING','APPROVED','ACTIVE','SUSPENDED','CANCELLED','EXPIRED')),
  paid_until timestamptz,
  provider_updated_at timestamptz,
  verified_at timestamptz NOT NULL,
  review_reason text CHECK (length(review_reason) <= 120),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS paypal_subscriptions_account ON public.paypal_subscriptions(account_email);

CREATE TABLE IF NOT EXISTS public.paypal_subscription_payments (
  subscription_id text NOT NULL REFERENCES public.paypal_subscriptions(subscription_id),
  payment_id text NOT NULL CHECK (payment_id ~* '^[A-Z0-9-]{6,64}$'),
  status text NOT NULL CHECK (status IN ('COMPLETED','PENDING','DECLINED','FAILED','REFUNDED','PARTIALLY_REFUNDED','REVERSED')),
  paid_at timestamptz,
  period_until timestamptz,
  amount text CHECK (length(amount) <= 32),
  currency text CHECK (currency ~ '^[A-Z]{3}$'),
  observed_at timestamptz NOT NULL,
  PRIMARY KEY (subscription_id, payment_id),
  CHECK (period_until IS NULL OR (paid_at IS NOT NULL AND period_until > paid_at))
);
CREATE UNIQUE INDEX IF NOT EXISTS paypal_subscription_unique_payment ON public.paypal_subscription_payments(payment_id);

ALTER TABLE public.paypal_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paypal_subscription_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.paypal_subscriptions, public.paypal_subscription_payments FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.paypal_subscriptions, public.paypal_subscription_payments TO service_role;

-- Called only by the service-role backend after PayPal verification. Row locking
-- serializes concurrent checkout/webhook/refresh attempts; settled refunds and
-- reversals never turn back into a completed payment through an older replay.
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
  result_paid_until timestamptz;
BEGIN
  IF observed IS NULL OR observed > clock_timestamp() + interval '5 minutes'
    OR jsonb_typeof(p_snapshot->'payments') <> 'array'
    OR jsonb_array_length(p_snapshot->'payments') > 1001 THEN
    RAISE EXCEPTION 'Invalid subscription snapshot';
  END IF;
  INSERT INTO public.paypal_subscriptions(subscription_id, account_email, plan_id, status, provider_updated_at, verified_at, review_reason)
  VALUES (p_snapshot->>'subscription_id', p_snapshot->>'account_email', p_snapshot->>'plan_id', p_snapshot->>'status', provider_updated, observed, p_snapshot->>'review_reason')
  ON CONFLICT (subscription_id) DO NOTHING;

  SELECT * INTO STRICT current_subscription FROM public.paypal_subscriptions
  WHERE subscription_id = p_snapshot->>'subscription_id' FOR UPDATE;
  -- Provider-email changes need an explicit account migration, not access transfer.
  IF current_subscription.account_email <> p_snapshot->>'account_email' THEN
    RAISE EXCEPTION 'Subscription account needs review';
  END IF;
  IF observed >= current_subscription.verified_at AND
    (provider_updated IS NULL OR current_subscription.provider_updated_at IS NULL OR provider_updated >= current_subscription.provider_updated_at) THEN
    UPDATE public.paypal_subscriptions SET plan_id = p_snapshot->>'plan_id', status = p_snapshot->>'status',
      provider_updated_at = coalesce(provider_updated, provider_updated_at), verified_at = observed,
      review_reason = p_snapshot->>'review_reason'
    WHERE subscription_id = current_subscription.subscription_id;
  END IF;

  FOR incoming_payment IN SELECT value FROM jsonb_array_elements(p_snapshot->'payments') LOOP
    SELECT * INTO current_payment FROM public.paypal_subscription_payments
    WHERE subscription_id = current_subscription.subscription_id AND payment_id = incoming_payment->>'payment_id';
    IF FOUND THEN
      -- Keep the original interval/price policy; a later plan change must not
      -- recompute historical service periods. Unknown old amounts stay ungranted.
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
  -- Product policy: partial refunds retain the originally bought interval;
  -- full refunds/reversals remove that payment's coverage only.
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
