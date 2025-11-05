export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { orderId, email } = req.body || {};
  if (!orderId) return res.status(400).json({ error: "Missing orderId" });

  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64");
  const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!tokenRes.ok) {
    const t = await tokenRes.text();
    return res.status(500).json({ error: "paypal_token_error", detail: t });
  }
  const { access_token } = await tokenRes.json();

  const capRes = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${access_token}`, "Content-Type": "application/json" },
  });
  const capJson = await capRes.json();
  if (!capRes.ok) return res.status(500).json(capJson);

  // 🔓 HIER Zugang aktivieren (z. B. DB setzen). Demo: nur OK zurückgeben
  // await activateAccess({ email, provider: "paypal", orderId });

  res.status(200).json({ ok: true, capture: capJson });
}
