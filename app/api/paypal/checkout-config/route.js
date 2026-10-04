import { configuredTrialPlanId, regularAccessPolicy, subscriptionDatabase } from "../../../../lib/subscription-access";
import { paypalRequest } from "../webhook/_base";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Before advertising a free trial, verify the actual merchant plan. A mistaken
// public environment variable must never present a regular paid plan as free.
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const planId = configuredTrialPlanId();
    if (!planId) {
      if (process.env.NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID?.trim()) throw new Error("Invalid trial plan");
      return Response.json({ planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID || "P-9XU38461YG7706134NESJQWA",
        trialDays: 0, amount: "5.00", currency: "EUR" }, { headers });
    }
    if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_ID !== process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID)
      throw new Error("Client configuration mismatch");
    const allowed = process.env.PAYPAL_PLAN_IDS?.split(",").map(value => value.trim());
    if (allowed && !allowed.includes(planId)) throw new Error("Trial plan not allowed");
    const { data, error } = await subscriptionDatabase().from("paypal_subscriptions")
      .select("trial_started_at,trial_until").limit(0);
    if (error || !Array.isArray(data) || data.length !== 0) throw new Error("Trial ledger unavailable");
    const plan = await paypalRequest(`/v1/billing/plans/${encodeURIComponent(planId)}`);
    const policy = regularAccessPolicy({ plan_id: planId }, plan);
    if (plan.id !== planId || plan.status !== "ACTIVE" || policy.reviewReason || !policy.trial)
      throw new Error("Trial plan unavailable");
    return Response.json({ planId, trialDays: 3, amount: "5.00", currency: "EUR" }, { headers });
  } catch {
    return Response.json({ error: "Das Testabo ist derzeit nicht verfügbar. Bitte später erneut versuchen." }, { status: 503, headers });
  }
}
