import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPaypalWebhook } from "./_base";

export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, paypal-auth-algo, paypal-cert-url, paypal-transmission-id, paypal-transmission-sig, paypal-transmission-time",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors });
}

export function GET() {
  return NextResponse.json({ ok: true }, { headers: cors });
}

export async function POST(req) {
  try {
    // RAW BODY für PayPal Signature
    const rawBody = await req.text();

    // Signatur prüfen
    const verified = await verifyPaypalWebhook(req, rawBody);

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid PayPal signature" },
        { status: 400, headers: cors }
      );
    }

    const event = verified.event_type;

    const email =
      verified?.resource?.subscriber?.email_address ||
      verified?.resource?.payer?.email_address;

    if (!email) {
      return NextResponse.json(
        { error: "Keine E-Mail erhalten" },
        { status: 400, headers: cors }
      );
    }

    const validEvents = [
      "CHECKOUT.ORDER.APPROVED",
      "PAYMENT.CAPTURE.COMPLETED",
      "BILLING.SUBSCRIPTION.ACTIVATED",
    ];

    if (!validEvents.includes(event)) {
      return NextResponse.json(
        { ok: true, ignored: true, event },
        { headers: cors }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const service = process.env.SUPABASE_SERVICE_ROLE;

    if (!url || !service) {
      return NextResponse.json(
        { ok: true, build: true },
        { headers: cors }
      );
    }

    const supabase = createClient(url, service);

    await supabase
      .from("userprofile")
      .upsert(
        {
          email: email.toLowerCase(),
          is_premium: true,
        },
        { onConflict: "email" }
      );

    return NextResponse.json(
      { ok: true, premium: true, email, event },
      { headers: cors }
    );

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500, headers: cors }
    );
  }
}
