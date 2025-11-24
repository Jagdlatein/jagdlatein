import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPaypalWebhook } from "./_base";

export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, paypal-auth-algo, paypal-cert-url, paypal-transmission-id, paypal-transmission-sig, paypal-transmission-time",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors });
}

export function GET() {
  return NextResponse.json({ ok: true }, { headers: cors });
}

export async function POST(req) {
  let rawBody = "";
  try {
    rawBody = await req.text();

    // headers lowercase
    const headers = Object.fromEntries(req.headers.entries());

    const hasSignature =
      headers["paypal-transmission-id"] &&
      headers["paypal-transmission-sig"] &&
      headers["paypal-cert-url"];

    let event;

    // ⭐ SIGNATUR-EVENT
    if (hasSignature) {
      event = await verifyPaypalWebhook(req, rawBody);
      if (!event) {
        console.error("❌ Invalid PayPal signature", headers);
        return NextResponse.json(
          { error: "Invalid PayPal signature" },
          { status: 400, headers: cors }
        );
      }
    }

    // ⭐ TEST-EVENT oder JSON-PARSE
    if (!event) {
      try {
        event = JSON.parse(rawBody);
      } catch (e) {
        console.error("❌ JSON parsing failed:", rawBody);
        return NextResponse.json(
          { error: "Invalid JSON" },
          { status: 400, headers: cors }
        );
      }
    }

    const eventType = event.event_type;

    // ⭐ EMAIL-LOGIK (ALLE PayPal Varianten abgedeckt)
    const email =
      event?.resource?.subscriber?.email_address ||
      event?.resource?.payer?.email_address ||
      event?.resource?.billing_agreement_details?.payer?.payer_info?.email_address ||
      event?.resource?.billing_agreement_details?.payer?.payer_info?.email ||
      null;

    if (!email) {
      console.error("❌ Keine Email im PayPal Event:", JSON.stringify(event, null, 2));
      return NextResponse.json(
        { error: "Keine E-Mail im PayPal Event" },
        { status: 400, headers: cors }
      );
    }

    const validEvents = [
      "CHECKOUT.ORDER.APPROVED",
      "PAYMENT.CAPTURE.COMPLETED",
      "BILLING.SUBSCRIPTION.ACTIVATED",
      "BILLING.SUBSCRIPTION.CREATED",
    ];

    if (!validEvents.includes(eventType)) {
      return NextResponse.json(
        { ok: true, ignored: true, eventType },
        { headers: cors }
      );
    }

    // ⭐ SUPABASE CLIENT
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    );

    // ⭐ PREMIIUM EINTRAG
    await supabase
      .from("userprofile")
      .upsert(
        {
          email: email.toLowerCase(),
          is_premium: true,
        },
        { onConflict: "email" }
      );

    console.log("✅ PREMIUM gesetzt für:", email);

    return NextResponse.json(
      { ok: true, premium: true, email, eventType },
      { headers: cors }
    );
  } catch (err) {
    console.error("❌ Webhook ERROR:", err, rawBody);
    return NextResponse.json(
      { error: err.toString() },
      { status: 500, headers: cors }
    );
  }
}
