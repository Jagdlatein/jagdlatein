import { accessFromSubscriptions, configuredTrialPlanId, refreshVerifiedSubscription } from "../../../../lib/subscription-access";
import { requireSameOriginJson, accountJson, accountErrorResponse } from "../../../../lib/course-progress-server";
import { requirePayPalAccount } from "../../../../lib/paypal-checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    requireSameOriginJson(req);
    const { session, database } = await requirePayPalAccount(req);
    const body = await req.json();
    const id = body?.subscriptionId;
    if (!body || Array.isArray(body) || Object.keys(body).some(key => key !== "subscriptionId") ||
        typeof id !== "string" || !/^I-[A-Z0-9]{6,64}$/i.test(id)) return accountJson({ error: "Ungültiges Abo." }, 400);
    const subscription = await refreshVerifiedSubscription(id, { database, expectedAccount: session });
    if (!subscription) return accountJson({ error: "Dieses Abo ist deinem aktuellen Konto nicht zugeordnet." }, 409);
    const access = subscription ? accessFromSubscriptions([subscription]) : null;
    const activated = Boolean(access?.paid);
    return Response.json({ activated, ...(configuredTrialPlanId() ? {
      accessType: access?.accessType || "none", trialUntil: access?.trialUntil || null, paidUntil: access?.paidUntil || null,
    } : {}) }, { status: activated ? 200 : 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return accountErrorResponse(error); }
}
