import { accessFromSubscriptions, refreshVerifiedSubscription } from "../../../../lib/subscription-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  let sameOrigin = false;
  try { sameOrigin = new URL(req.headers.get("origin")).origin === new URL(req.url).origin; } catch {}
  if (!sameOrigin) return Response.json({ error: "Anfrage nicht erlaubt." }, { status: 403 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Ungültige Anfrage." }, { status: 400 }); }
  const id = body?.subscriptionId;
  if (typeof id !== "string" || !/^I-[A-Z0-9]{6,64}$/i.test(id))
    return Response.json({ error: "Ungültiges Abo." }, { status: 400 });
  try {
    const subscription = await refreshVerifiedSubscription(id);
    const activated = Boolean(subscription && accessFromSubscriptions([subscription]).paid);
    return Response.json({ activated }, { status: activated ? 200 : 202, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Die Zahlungsbestätigung wird noch verarbeitet. Bitte später erneut anmelden." }, { status: 503 });
  }
}
