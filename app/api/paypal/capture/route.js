import { paypalBase, paypalAccessToken } from "../webhook/_base";

export async function POST(req) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return Response.json(
        { error: "Missing orderId" },
        { status: 400 }
      );
    }

    const { base } = paypalBase();
    const access_token = await paypalAccessToken();

    const capRes = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const capJson = await capRes.json();

    if (!capRes.ok) {
      return Response.json(capJson, { status: 500 });
    }

    // Capture ist erfolgreich
    return Response.json(
      { ok: true, capture: capJson },
      { status: 200 }
    );
  } catch (e) {
    return Response.json(
      { error: e.message || "paypal_capture_error" },
      { status: 500 }
    );
  }
}

}
