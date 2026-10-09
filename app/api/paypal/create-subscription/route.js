import { requireSameOriginJson, accountJson, accountErrorResponse } from "../../../../lib/course-progress-server";
import { requirePayPalAccount, createAccountPayPalSubscription } from "../../../../lib/paypal-checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    requireSameOriginJson(req);
    const account = await requirePayPalAccount(req);
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 0)
      return accountJson({ error: "Bitte den Kauf erneut aus deinem Konto beginnen." }, 400);
    return accountJson({ subscriptionId: await createAccountPayPalSubscription(account) });
  } catch (error) { return accountErrorResponse(error); }
}
