export async function verifyPaypalWebhook(req, rawBody) {
  const transmissionId = req.headers.get("paypal-transmission-id");
  const transmissionTime = req.headers.get("paypal-transmission-time");
  const certUrl = req.headers.get("paypal-cert-url");
  const transmissionSig = req.headers.get("paypal-transmission-sig");
  const authAlgo = req.headers.get("paypal-auth-algo");

  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;

  const base64 = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const response = await fetch(
    `${process.env.PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${base64}`,
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
    }
  );

  const data = await response.json();
  return data.verification_status === "SUCCESS" ? JSON.parse(rawBody) : null;
}

export async function paypalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;

  const base64 = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const response = await fetch(
    `${process.env.PAYPAL_API_BASE}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${base64}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    }
  );

  const json = await response.json();
  return json?.access_token || null;
}

export async function paypalBase(path, method = "POST", body = null) {
  const token = await paypalAccessToken();

  const response = await fetch(`${process.env.PAYPAL_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : null,
  });

  return response.json();
}
