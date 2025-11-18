// /pages/api/paypal/_base.js

export function paypalBase() {
  const env = (process.env.PAYPAL_ENV || "live").toLowerCase();
  const base =
    env === "sandbox"
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";
  return { env, base };
}

export async function paypalAccessToken() {
  const { base } = paypalBase();

  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`paypal_token_error: ${txt}`);
  }

  const { access_token } = await res.json();
  return access_token;
}

export async function verifyPaypalWebhook(req, res) {
  const { base } = paypalBase();
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!webhookId) {
    console.error("❌ PAYPAL_WEBHOOK_ID fehlt in den Env Vars!");
    return res.status(500).send("Server config error");
  }

  const authAlgo = req.headers["paypal-auth-algo"];
  const certUrl = req.headers["paypal-cert-url"];
  const transmissionId = req.headers["paypal-transmission-id"];
  const transmissionSig = req.headers["paypal-transmission-sig"];
  const transmissionTime = req.headers["paypal-transmission-time"];

  const body = req.body;

  const token = await paypalAccessToken();

  const verifyRes = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: body,
    }),
  });

  const verifyJson = await verifyRes.json();

  if (verifyJson.verification_status !== "SUCCESS") {
    console.error("❌ PayPal Webhook Verification failed:", verifyJson);
    return res.status(400).send("Invalid webhook signature");
  }

  return body;
}
