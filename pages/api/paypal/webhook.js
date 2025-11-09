// pages/api/paypal/webhook.js
// Next.js: rohen Body lesen (für Signaturprüfung)
export const config = { api: { bodyParser: false } };

import getRawBody from "raw-body";
import https from "https";
import { prisma } from "../../../lib/prisma"; // ggf. Pfad anpassen

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
    // Node < 18: agent: new https.Agent({ keepAlive: true })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`PayPal token failed: ${res.status} ${t}`);
  }
  const json = await res.json();
  return json.access_token;
}

async function verifySignature({
  raw,
  headers,
  webhookId,
  accessToken,
}) {
  const payload = {
    auth_algo: headers["paypal-auth-algo"],
    cert_url: headers["paypal-cert-url"],
    transmission_id: headers["paypal-transmission-id"],
    transmission_sig: headers["paypal-transmission-sig"],
    transmission_time: headers["paypal-transmission-time"],
    webhook_id: webhookId,
    webhook_event: JSON.parse(raw.toString("utf8")),
  };

  const res = await fetch(
    `${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`verify failed: ${res.status} ${t}`);
  }
  const json = await res.json();
  return json.verification_status === "SUCCESS";
}

// optional: Bestelldetails laden, um Käufer-E-Mail zu ermitteln
async function fetchOrder(orderId, accessToken) {
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function grantAccessByEmail(email, durationDays = 30) {
  if (!email) throw new Error("no buyer email");
  // User anlegen/finden
  const user = await prisma.user.upsert({
    where: { id: email }, // wir verwenden Email als User.id (einfach)
    update: {},
    create: { id: email },
  });

  // AccessPass anlegen/verlängern (Model: AccessPass(email, active, expiresAt, …))
  const now = new Date();
  const until = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  await prisma.accessPass.upsert({
    where: { email }, // UNIQUE Index auf email
    update: {
      active: true,
      expiresAt: until,
      updatedAt: new Date(),
    },
    create: {
      email,
      userId: user.id,
      active: true,
      expiresAt: until,
    },
  });

  return { email, until };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // 1) Raw Body einlesen
    const raw = await getRawBody(req);

    // 2) PayPal Signatur prüfen
    const accessToken = await getAccessToken();
    const ok = await verifySignature({
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

    if (!ok) {
      return res.status(400).json({ ok: false, error: "Invalid signature" });
    }

    // 3) Event parsen & behandeln
    const event = JSON.parse(raw.toString("utf8"));
    const type = event.event_type;
    const resource = event.resource || {};

    // Käufer-Email versuchen zu bestimmen
    let buyerEmail =
      resource?.payer?.email_address ||
      resource?.payment_source?.paypal?.email_address ||
      resource?.payer_email || null;

    // Bei Capture → Order holen (dort steckt die Email)
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

    let granted = null;

    switch (type) {
      case "CHECKOUT.ORDER.APPROVED":
      case "PAYMENT.CAPTURE.COMPLETED":
      case "PAYMENT.SALE.COMPLETED":
        granted = await grantAccessByEmail(buyerEmail, 30);
        break;

      // Optional weitere Events
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        granted = await grantAccessByEmail(buyerEmail, 30);
        break;

      default:
        // nicht relevant für Zugang – aber bestätigen
        break;
    }

    return res.status(200).json({
      ok: true,
      type,
      buyerEmail: buyerEmail || null,
      granted: granted || null,
    });
  } catch (err) {
    console.error("paypal webhook error", err);
    return res
      .status(500)
      .json({ ok: false, error: String(err?.message || err) });
  }
}
