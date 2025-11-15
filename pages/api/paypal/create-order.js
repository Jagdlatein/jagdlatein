// /pages/api/paypal/create-order.js
import { paypalBase, paypalAccessToken } from "./_base";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { tier } = req.body || {};

    if (!tier || !["monthly", "yearly"].includes(tier)) {
      return res.status(400).json({ error: "Missing or invalid tier" });
    }

    // Beträge passend zur Preise-Seite
    const amount = tier === "monthly" ? "10.00" : "100.00";
    const currency = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "EUR";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jagdlatein.de";

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
            description:
              tier === "monthly"
                ? "Jagdlatein – Monatszugang"
                : "Jagdlatein – Jahreszugang",
            // wichtig: damit capture-order den Tarif kennt
            custom_id: tier,
          },
        ],
        application_context: {
          brand_name: "Jagdlatein",
          landing_page: "LOGIN",
          user_action: "PAY_NOW",
          return_url: `${siteUrl}/success?provider=paypal`,
          cancel_url: `${siteUrl}/preise?canceled=1`,
        },
      }),
    });

    const orderJson = await orderRes.json();
    if (!orderRes.ok) {
      console.error("PayPal create-order error:", orderJson);
      return res.status(500).json(orderJson);
    }

    // PayPalButtons erwartet { id }
    return res.status(200).json({ id: orderJson.id });
  } catch (e) {
    console.error("paypal_create_error:", e);
    return res
      .status(500)
      .json({ error: e.message || "paypal_create_error" });
  }
}
