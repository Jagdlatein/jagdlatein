import { paypalBase, paypalAccessToken } from "./_base";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { tier } = req.body || {};
    if (!tier || !["monthly", "yearly"].includes(tier)) {
      return res.status(400).json({ error: "Missing or invalid tier" });
    }

    const amount = tier === "monthly" ? "10.00" : "80.00";
    const currency = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "EUR";
    const { base } = paypalBase();
    const access_token = await paypalAccessToken();

    const orderRes = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
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
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?provider=paypal`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/preise?canceled=1`,
        },
      }),
    });

    const orderJson = await orderRes.json();
    if (!orderRes.ok) return res.status(500).json(orderJson);

    // Wichtig: Buttons erwarten order.id
    return res.status(200).json({ id: orderJson.id });
  } catch (e) {
    return res.status(500).json({ error: e.message || "paypal_create_error" });
  }
}
