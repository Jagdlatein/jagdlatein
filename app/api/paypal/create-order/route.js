import { paypalBase, paypalAccessToken } from "@/app/api/paypal/_base";

export async function POST(req) {
  try {
    const body = await req.json();
    const { tier } = body;

    if (!tier || !["monthly", "yearly"].includes(tier)) {
      return Response.json({ error: "Missing or invalid tier" }, { status: 400 });
    }

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
      return Response.json(orderJson, { status: 500 });
    }

    return Response.json({ id: orderJson.id }, { status: 200 });
  } catch (e) {
    return Response.json(
      { error: e.message || "paypal_create_error" },
      { status: 500 }
    );
  }
}
