import { requireSameOriginJson, requireCurrentAccount, accountJson, accountErrorResponse } from "../../../../lib/course-progress-server";
import { requirePayPalAccount, currentAccountPayPalCheckout } from "../../../../lib/paypal-checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    requireSameOriginJson(req);
    const account = await requirePayPalAccount(req);
    const expectedKey = req.headers.get("x-jagdlatein-account-key");
    const bound = expectedKey !== null;
    if (bound && (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(expectedKey) || expectedKey !== account.session.accountGeneration)) {
      return accountJson({ error: "Deine Anmeldung hat sich geändert. Bitte das Konto neu laden.", code: "ACCOUNT_CHANGED" }, 409);
    }
    let body;
    try { body = await req.json(); }
    catch { return accountJson({ error: "Bitte den Zahlungsstatus erneut aus deinem Konto prüfen." }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 0)
      return accountJson({ error: "Bitte den Zahlungsstatus erneut aus deinem Konto prüfen." }, 400);
    const checkout = await currentAccountPayPalCheckout(account);
    if (!bound) return accountJson(checkout);
    await requireCurrentAccount(account.database, account.session);
    return accountJson({ ...checkout, accountKey: account.session.accountGeneration, accountEmail: account.session.email });
  } catch (error) { return accountErrorResponse(error); }
}
