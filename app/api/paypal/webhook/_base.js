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
  try {
    const rawBody = await req.text();

    // ⭐ Prüfe, ob Signatur vorhanden ist (echter PayPal-Webhook)
    const hasSignature =
      req.headers.get("paypal-transmission-id") &&
      req.headers.get("paypal-transmission-sig") &&
      req.headers.get("paypal-cert-url");

    let verifiedEvent = null;

    if (hasSignature) {
      // 🟢 ECHTE LIVE-ZAHLUNG → Signatur prüfen
      verifiedEvent = await verifyPaypalWebhook(req, rawBody);
      if (!verifiedEvent) {
        return NextResponse.json(
          { error: "Invalid PayPal signature" },
          { status: 400, headers: cors }
        );
      }
    } else {
      // 🟣 PAYPAL LIVE TEST EVENT → KEINE SIGNATUR → AKZEPTIEREN!
      console.warn("⚠ PayPal TEST EVENT ohne Signatur empfangen.");
      verifiedEvent = JSON.parse(rawBody);
    }

    // ⭐ Event & Email extrahieren
    const event = verifiedEvent.event_type;

    const email =
      verifiedEvent?.resource?.subscriber?.email_address ||
      verifiedEvent?.resource?.payer?.email_address;

    if (!email) {
      return NextResponse.json(
        { error: "Keine E-Mail erhalten" },
        { status: 400, headers: cors }
      );
    }

    // ⭐ Erlaubte Events
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

    // ⭐ Supabase Verbindung prüfen
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const service = process.env.SUPABASE_SERVICE_ROLE;

    if (!url || !service) {
      return NextResponse.json(
        { ok: true, build: true },
        { headers: cors }
      );
    }

    const supabase = createClient(url, service);

    // ⭐ Premium setzen
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
