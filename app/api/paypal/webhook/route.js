export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { verifyPaypalWebhook } from "./_base";
import { accessFromSubscriptions, applyVerifiedPaypalEvent } from "../../../../lib/subscription-access";
import { assertPayPalWebhookRequestActive, PayPalWebhookBodyError, readPayPalWebhookBody } from "../../../../lib/paypal-webhook-body";

const subscriptionEvents = new Set([
  "BILLING.SUBSCRIPTION.ACTIVATED", "BILLING.SUBSCRIPTION.UPDATED",
  "BILLING.SUBSCRIPTION.CANCELLED", "BILLING.SUBSCRIPTION.SUSPENDED", "BILLING.SUBSCRIPTION.EXPIRED",
  "BILLING.SUBSCRIPTION.PAYMENT.FAILED", "PAYMENT.SALE.COMPLETED", "PAYMENT.SALE.REFUNDED", "PAYMENT.SALE.REVERSED",
]);

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req) {
  let rawBody;
  try { rawBody = await readPayPalWebhookBody(req); }
  catch (error) { return json({ error: error instanceof PayPalWebhookBodyError ? error.message : "invalid body" }, error instanceof PayPalWebhookBodyError ? error.status : 400); }
  let parsed;
  try { parsed = JSON.parse(rawBody); }
  catch { return json({ error: "invalid json" }, 400); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json({ error: "invalid event" }, 400);
  try { assertPayPalWebhookRequestActive(req); }
  catch (error) { return json({ error: error instanceof PayPalWebhookBodyError ? error.message : "invalid body" }, error instanceof PayPalWebhookBodyError ? error.status : 400); }
  try {
    const event = await verifyPaypalWebhook(req, rawBody);
    if (!event) return json({ error: "invalid signature" }, 401);
    // Approval and creation do not prove an active subscription or a paid order.
    if (!subscriptionEvents.has(event.event_type)) return json({ ignored: true });
    // Current provider reads and atomic payment records make retries idempotent.
    // A cancelled subscription can retain only its already confirmed paid period.
    const subscription = await applyVerifiedPaypalEvent(event);
    if (!subscription) return json({ ignored: true });
    return json({ ok: true, premium: accessFromSubscriptions([subscription]).paid });
  } catch {
    return json({ error: "payment verification unavailable" }, 503);
  }
}

export function GET() { return json({ ok: true }); }
