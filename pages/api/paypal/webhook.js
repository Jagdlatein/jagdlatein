export const config = { api: { bodyParser: false } };

import getRawBody from "raw-body";
import { prisma } from "../../../lib/prisma";

const PAYPAL_BASE =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken() {
  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal token failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function verifySignature({ raw, headers, webhookId, accessToken }) {
  const payload = {
    auth_algo: headers["paypal-auth-algo"],
    cert_url: headers["paypal-cert-url"],
    transmission_id: headers["paypal-transmission-id"],
    transmission_sig: headers["paypal-transmission-sig"],
    transmission_time: headers["paypal-transmission-time"],
    webhook_id: webhookId,
    webhook_event: JSON.parse(raw.toString("utf8")),
  };

  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`verify failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.verification_status === "SUCCESS";
}

async function fetchOrder(orderId, accessToken) {
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

/** Freischalten: User.id = E-Mail, AccessPass via userId (unique) */
async function grantAccessByEmail(email, plan = "monthly", days = 30) {
  if (!email) throw new Error("buyer email missing");

  // User anlegen/finden (id = Email)
  const user = await prisma.user.upsert({
    where: { id: email },
    update: {},
    create: { id: email },
  });

  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  // AccessPass 1:1 per userId (unique!)
  await prisma.accessPass.upsert({
    where: { userId: user.id }, // funktioniert, weil @unique
    update: {
      plan,
      status: "active",
      startsAt: now,
      expiresAt: until,
      updatedAt: new Date(),
    },
    create: {
      userId: user.id,
      plan,
      status: "active",
      startsAt: now,
      expiresAt: until,
    },
  });

  return { userId: user.id, expiresAt: until };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const raw = await getRawBody(req);
    const accessToken = await getAccessToken();

    // Signatur prüfen
    const verified = await verifySignature({
      raw,
      headers: {
        "paypal-auth-algo": req.headers["paypal-auth-algo"],
        "paypal-cert-url": req.headers["paypal-cert-url"],
        "paypal-transmission-id": req.headers["paypal-transmission-id"],
        "paypal-transmission-sig": req.headers["paypal-transmission-sig"],
        "paypal-transmission-time": req.headers["paypal-transmission-time"],
      },
      webhookId: process.env.PAYPAL_WEBHOOK_ID,
      accessToken,
    });
    if (!verified) return res.status(400).json({ ok: false, error: "Invalid signature" });

    const event = JSON.parse(raw.toString("utf8"));
    const type = event.event_type;
    const resource = event.resource || {};

    // Käufer-E-Mail herausfinden
    let buyerEmail =
      resource?.payer?.email_address ||
      resource?.payment_source?.paypal?.email_address ||
      resource?.payer_email ||
      null;

    if (!buyerEmail) {
      const orderId =
        resource?.supplementary_data?.related_ids?.order_id ||
        resource?.id ||
        resource?.order_id;
      if (orderId) {
        const order = await fetchOrder(orderId, accessToken);
        buyerEmail =
          order?.payer?.email_address ||
          order?.payment_source?.paypal?.email_address ||
          buyerEmail;
      }
    }

    // Logge Roh-Event
    await prisma.paymentEvent.create({
      data: {
        provider: "paypal",
        raw: event,
        email: buyerEmail || undefined,
        status: "received",
      },
    });

    let granted = null;
    // Relevante Events für Einmalzahlung
    if (
      type === "CHECKOUT.ORDER.APPROVED" ||
      type === "PAYMENT.CAPTURE.COMPLETED" ||
      type === "PAYMENT.SALE.COMPLETED"
    ) {
      granted = await grantAccessByEmail(buyerEmail, "monthly", 30);
    }

    return res.status(200).json({ ok: true, type, buyerEmail, granted });
  } catch (err) {
    console.error("paypal webhook error", err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
