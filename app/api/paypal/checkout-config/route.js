import { configuredTrialPlanId, regularAccessPolicy, subscriptionDatabase } from "../../../../lib/subscription-access";
import { paypalRequest } from "../webhook/_base";
import { paypalCheckoutSettings } from "../../../../lib/paypal-checkout-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Before advertising a free trial, verify the actual merchant plan. A mistaken
// public environment variable must never present a regular paid plan as free.
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const settings = paypalCheckoutSettings();
    const planId = configuredTrialPlanId();
    if (!planId && !settings.sandbox) {
      if (process.env.NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID?.trim()) throw new Error("Invalid trial plan");
      return Response.json({ planId: settings.planId, clientId: settings.clientId,
        trialDays: 0, amount: "5.00", currency: "EUR" }, { headers });
    }
    if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_ID !== process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID)
      throw new Error("Client configuration mismatch");
    const allowed = process.env.PAYPAL_PLAN_IDS?.split(",").map(value => value.trim());
    const offeredPlanId = settings.planId;
    if (allowed && !allowed.includes(offeredPlanId)) throw new Error("Plan not allowed");
    if (planId) {
      const { data, error } = await subscriptionDatabase().from("paypal_subscriptions")
        .select("trial_started_at,trial_until").limit(0);
      if (error || !Array.isArray(data) || data.length !== 0) throw new Error("Trial ledger unavailable");
    }
    const plan = await paypalRequest(`/v1/billing/plans/${encodeURIComponent(offeredPlanId)}`);
    const policy = regularAccessPolicy({ plan_id: offeredPlanId }, plan);
    if (plan.id !== offeredPlanId || plan.status !== "ACTIVE" || policy.reviewReason || Boolean(policy.trial) !== settings.trial)
      throw new Error("Trial plan unavailable");
    if (settings.sandbox && (policy.amount !== "5.000" || policy.currency !== "EUR" ||
        policy.frequency?.interval_unit !== "MONTH" || policy.frequency?.interval_count !== 1 ||
        plan.quantity_supported === true || (!settings.trial &&
          (plan.billing_cycles[0].sequence !== 1 || plan.billing_cycles[0].total_cycles !== 0))))
      throw new Error("Sandbox monthly price unavailable");
    return Response.json({ planId: offeredPlanId, clientId: settings.clientId,
      trialDays: settings.trial ? 3 : 0, amount: "5.00", currency: "EUR" }, { headers });
  } catch {
    return Response.json({ error: "Das Testabo ist derzeit nicht verfügbar. Bitte später erneut versuchen." }, { status: 503, headers });
  }
}
