-- Read-only report. Run only in the separate Supabase TEST project after
-- setup-paypal-sandbox.ps1 -Step Check -Online has passed. This checks the
-- application ledger, not the authenticity of a PayPal simulator event.
-- Replace BOTH placeholders using identifiers from the actual sandbox app.
WITH input AS (
  SELECT
    'I-ABOIDHIERERSETZEN'::text AS subscription_id,
    'P-TRIALPLANIDHIERERSETZEN'::text AS trial_plan_id
), subscription AS (
  SELECT s.* FROM public.paypal_subscriptions s, input i
  WHERE s.subscription_id = i.subscription_id AND s.plan_id = i.trial_plan_id
), payments AS (
  SELECT p.* FROM public.paypal_subscription_payments p, input i
  WHERE p.subscription_id = i.subscription_id
)
SELECT jsonb_build_object(
  'report_type', 'sandbox-application-ledger-only',
  'subscription_found', EXISTS (SELECT 1 FROM subscription),
  'status', (SELECT status FROM subscription),
  'trial_started_at', (SELECT trial_started_at FROM subscription),
  'trial_until', (SELECT trial_until FROM subscription),
  'exact_72_hour_window', (SELECT trial_until = trial_started_at + interval '72 hours' FROM subscription),
  'paid_until', (SELECT paid_until FROM subscription),
  'verified_at', (SELECT verified_at FROM subscription),
  'review_reason', (SELECT review_reason FROM subscription),
  'payments_total', (SELECT count(*) FROM payments),
  'payments_completed', (SELECT count(*) FROM payments WHERE status = 'COMPLETED'),
  'payments_failed', (SELECT count(*) FROM payments WHERE status IN ('FAILED', 'DECLINED')),
  'payments_pending', (SELECT count(*) FROM payments WHERE status = 'PENDING'),
  'completed_payments_match_5_eur', NOT EXISTS (
    SELECT 1 FROM payments WHERE status = 'COMPLETED'
      AND (currency IS DISTINCT FROM 'EUR' OR amount IS NULL OR amount !~ '^5([.]0{1,3})?$')
  ),
  'provider_payment_proof', 'Compare exact transaction ID/status/amount/time in the PayPal Sandbox merchant account; this SQL is not provider proof.'
) AS sandbox_ledger_report;
