// pages/api/paypal/webhook.js
import getRawBody from "raw-body";
import { prisma } from "../../../lib/prisma";

export const config = {
  api: { bodyParser: false }, // Raw body required for PayPal signature verify
};

function apiBase() {
  return process.env.PAYPAL_ENV === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

async function verifySignature(req, rawBody) {
  const headers = req.headers;
  const payload = {
    auth_algo: headers["paypal-auth-algo"],
    cert_url: headers["paypal-cert-url"],
    transmission_id: headers["paypal-transmission-id"],
    transmission_sig: headers["paypal-transmission-sig"],
    transmission_time: headers["paypal-transmission-time"],
    webhook_id: process.env.PAYPAL_WEBHOOK_ID,
    webhook_event: JSON.parse(rawBody.toString("utf8")),
  };

  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString("base64");

  const r = await fetch(`${apiBase()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!r.ok) return false;
  const data = await r.json();
  return data?.verification_status === "SUCCESS";
}

function extractEmail(evt) {
  return (
    evt?.resource?.payer?.email_address ||
    evt?.resource?.payment_source?.paypal?.email_address ||
    evt?.resource?.payer_email ||
    evt?.resource?.payer_email_address ||
    null
  )?.toLowerCase() || null;
}

function detectPlan(evt) {
  // Betrag oder (falls vorhanden) custom_id auswerten
  const amount =
    evt?.resource?.amount?.value ||
    evt?.resource?.purchase_units?.[0]?.amount?.value ||
    null;

  const custom =
    evt?.resource?.custom_id ||
    evt?.resource?.purchase_units?.[0]?.custom_id ||
    null;

  if (custom === "monthly") return "monthly";
  if (custom === "yearly")  return "yearly";

  if (String(amount) === "10" || String(amount) === "10.00") return "monthly";
  if (String(amount) === "100" || String(amount) === "100.00") return "yearly";

  return "yearly"; // Default
}

export default async function handler(req, res) {
  try {
    const raw = await getRawBody(req);
    const evt = JSON.parse(raw.toString("utf8"));

    // 1) Signatur prüfen
    const ok = await verifySignature(req, raw);
    if (!ok) {
      return res.status(400).json({ ok: false, error: "invalid_signature" });
    }

    const type = evt?.event_type || "";
    const email = extractEmail(evt);

    // 2) Event loggen (hilft beim Debuggen)
    try {
      await prisma.paymentEvent.create({
        data: {
          provider: "paypal",
          status: type,
          email: email || undefined,
          raw: evt,
        },
      });
    } catch (_) {}

    // 3) Bei erfolgreicher Zahlung freischalten
    const successTypes = new Set([
      "PAYMENT.CAPTURE.COMPLETED",
      "CHECKOUT.ORDER.APPROVED",
      "PAYMENT.SALE.COMPLETED",
      "BILLING.SUBSCRIPTION.ACTIVATED",
    ]);

    if (successTypes.has(type) && email) {
      const plan = detectPlan(evt);
      const starts = new Date();
      const expires = new Date(
        starts.getTime() + (plan === "monthly" ? 30 : 365) * 24 * 3600 * 1000
      );

      await prisma.user.upsert({
        where: { id: email },
        create: { id: email, email },
        update: {},
      });

      await prisma.accessPass.upsert({
        where: { userId: email },
        create: { userId: email, plan, status: "active", startsAt: starts, expiresAt: expires },
        update: { plan, status: "active", startsAt: starts, expiresAt: expires },
      });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("paypal webhook error", e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
