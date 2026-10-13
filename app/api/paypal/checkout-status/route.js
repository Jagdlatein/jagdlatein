import { requireSameOriginJson, accountJson, accountErrorResponse } from "../../../../lib/course-progress-server";
import { requirePayPalAccount, currentAccountPayPalCheckout } from "../../../../lib/paypal-checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    requireSameOriginJson(req);
    const account = await requirePayPalAccount(req);
    let body;
    try { body = await req.json(); }
    catch { return accountJson({ error: "Bitte den Zahlungsstatus erneut aus deinem Konto prüfen." }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 0)
      return accountJson({ error: "Bitte den Zahlungsstatus erneut aus deinem Konto prüfen." }, 400);
    return accountJson(await currentAccountPayPalCheckout(account));
  } catch (error) { return accountErrorResponse(error); }
}
