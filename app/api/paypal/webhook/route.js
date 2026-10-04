export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { activateVerifiedSubscription, verifyPaypalWebhook } from "./_base";

const subscriptionEvents = new Set([
  "BILLING.SUBSCRIPTION.ACTIVATED", "BILLING.SUBSCRIPTION.UPDATED",
]);

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req) {
  const rawBody = await req.text();
  if (rawBody.length > 1024 * 1024) return json({ error: "payload too large" }, 413);
  let parsed;
  try { parsed = JSON.parse(rawBody); }
  catch { return json({ error: "invalid json" }, 400); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json({ error: "invalid event" }, 400);
  try {
    const event = await verifyPaypalWebhook(req, rawBody);
    if (!event) return json({ error: "invalid signature" }, 401);
    // Approval and creation do not prove an active subscription or a paid order.
    if (!subscriptionEvents.has(event.event_type)) return json({ ignored: true });
    const subscriptionId = event.resource?.id;
    if (typeof subscriptionId !== "string" || !/^I-[A-Z0-9]{6,64}$/i.test(subscriptionId))
      return json({ error: "invalid subscription" }, 400);
    // Read current status: delayed/replayed activation messages must not restore a cancelled subscription.
    if (!await activateVerifiedSubscription(subscriptionId)) return json({ ignored: true });
    return json({ ok: true, premium: true });
  } catch {
    return json({ error: "payment verification unavailable" }, 503);
  }
}

export function GET() { return json({ ok: true }); }
