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

  // KORRIGIERT: richtiger Env-Key!
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
