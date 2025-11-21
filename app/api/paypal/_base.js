// /app/api/paypal/webhook/_base.js

export function paypalBase() {
  const env = (process.env.PAYPAL_ENV || "live").toLowerCase();
  return {
    env,
    base:
      env === "sandbox"
        ? "https://api-m.sandbox.paypal.com"
        : "https://api-m.paypal.com",
  };
}

// Access Token holen
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
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`paypal_token_error: ${txt}`);
  }

  const { access_token } = await res.json();
  return access_token;
}

// Webhook verifizieren – App Router Version
export async function verifyPaypalWebhook(req, rawBody) {
  const { base } = paypalBase();
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!webhookId) {
    console.error("❌ PAYPAL_WEBHOOK_ID fehlt!");
    return null;
  }

  const authAlgo = req.headers.get("paypal-auth-algo");
  const certUrl = req.headers.get("paypal-cert-url");
  const transmissionId = req.headers.get("paypal-transmission-id");
  const transmissionSig = req.headers.get("paypal-transmission-sig");
  const transmissionTime = req.headers.get("paypal-transmission-time");

  const token = await paypalAccessToken();

  // Prüfanfrage an PayPal senden
  const verifyRes = await fetch(
    `${base}/v1/notifications/verify-webhook-signature`,
    {
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
        webhook_event: JSON.parse(rawBody),
      }),
      cache: "no-store",
    }
  );

  const verifyJson = await verifyRes.json();

  if (verifyJson.verification_status !== "SUCCESS") {
    console.error("❌ Webhook Verification failed:", verifyJson);
    return null;
  }

  return JSON.parse(rawBody);
}
