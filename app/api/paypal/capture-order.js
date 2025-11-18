import { paypalBase, paypalAccessToken } from "./_base";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { orderId, email } = req.body || {};
    if (!orderId) return res.status(400).json({ error: "Missing orderId" });

    const { base } = paypalBase();
    const access_token = await paypalAccessToken();

    const capRes = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    });
    const capJson = await capRes.json();
    if (!capRes.ok) return res.status(500).json(capJson);

    // TODO: Hier Zugang in DB setzen, falls vorhanden
    return res.status(200).json({ ok: true, capture: capJson });
  } catch (e) {
    return res.status(500).json({ error: e.message || "paypal_capture_error" });
  }
}
