export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { tier } = req.body || {}; // "monthly" | "yearly"
  if (!tier || !["monthly", "yearly"].includes(tier)) {
    return res.status(400).json({ error: "Missing or invalid tier" });
  }

  const amount = tier === "monthly" ? "10.00" : "80.00";
  const currency = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "EUR";

  // Access Token holen
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

  // Order anlegen
  const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
    method: "POST",
    headers: { "Authorization": `Bearer ${access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: currency, value: amount },
          description: tier === "monthly" ? "Jagdlatein – Monatszugang" : "Jagdlatein – Jahreszugang",
        },
      ],
      application_context: {
        brand_name: "Jagdlatein",
        landing_page: "LOGIN",
        user_action: "PAY_NOW",
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/success?provider=paypal`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/preise?canceled=1`,
      },
    }),
  });

  const orderJson = await orderRes.json();
  if (!orderRes.ok) return res.status(500).json(orderJson);
  res.status(200).json(orderJson); // enthält id (orderId)
}
