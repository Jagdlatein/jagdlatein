const PAYPAL_API_ORIGINS = new Set([
  "https://api-m.paypal.com", "https://api-m.sandbox.paypal.com",
  "https://api.paypal.com", "https://api.sandbox.paypal.com",
]);

export function paypalBase() {
  const configured = process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";
  const url = new URL(configured);
  if (!PAYPAL_API_ORIGINS.has(url.origin) || url.pathname !== "/" || url.search || url.hash || url.username || url.password)
    throw new Error("PayPal configuration unavailable");
  return { base: url.origin };
}

export async function paypalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET || process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("PayPal configuration unavailable");
  const { base } = paypalBase();
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST", headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    }, body: "grant_type=client_credentials", cache: "no-store", signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  if (!response.ok || typeof data.access_token !== "string" || !data.access_token)
    throw new Error("PayPal authentication unavailable");
  return data.access_token;
}

export async function paypalRequest(path, { method = "GET", body } = {}) {
  if (!/^\/v[12]\//.test(path)) throw new Error("Invalid PayPal path");
  const { base } = paypalBase();
  const token = await paypalAccessToken();
  const response = await fetch(`${base}${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store", signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error("PayPal request unavailable");
  return data;
}

export async function verifyPaypalWebhook(req, rawBody) {
  const headerFields = {
    transmission_id: "paypal-transmission-id", transmission_time: "paypal-transmission-time",
    cert_url: "paypal-cert-url", transmission_sig: "paypal-transmission-sig", auth_algo: "paypal-auth-algo",
  };
  const input = Object.fromEntries(Object.entries(headerFields).map(([key, header]) => [key, req.headers.get(header)]));
  if (Object.values(input).some(value => typeof value !== "string" || !value || value.length > 8192)) return null;
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) throw new Error("PayPal webhook configuration unavailable");
  const event = JSON.parse(rawBody);
  const result = await paypalRequest("/v1/notifications/verify-webhook-signature", {
    method: "POST", body: { ...input, webhook_id: webhookId, webhook_event: event },
  });
  return result.verification_status === "SUCCESS" ? event : null;
}
