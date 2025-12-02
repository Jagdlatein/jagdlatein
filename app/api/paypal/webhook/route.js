export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, paypal-auth-algo, paypal-cert-url, paypal-transmission-id, paypal-transmission-sig, paypal-transmission-time",
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: cors });
}

export async function POST(req) {
  const rawBody = await req.text();
  console.log("🔥 WEBHOOK HIT");
  console.log("📩 RAW BODY:", rawBody);

  let event;

  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    console.error("❌ JSON ungültig", rawBody);
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: cors,
    });
  }

  const email =
    event?.resource?.subscriber?.email_address ||
    event?.resource?.payer?.email_address ||
    null;

  if (!email) {
    console.error("❌ Keine Email im PayPal Event");
    return new Response(JSON.stringify({ error: "email missing" }), {
      status: 400,
      headers: cors,
    });
  }

  console.log("📧 EMAIL:", email);

  const validEvents = [
    "BILLING.SUBSCRIPTION.ACTIVATED",
    "BILLING.SUBSCRIPTION.CREATED",
    "BILLING.SUBSCRIPTION.UPDATED",
    "PAYMENT.CAPTURE.COMPLETED",
    "PAYMENT.SALE.COMPLETED",
    "CHECKOUT.ORDER.APPROVED",
  ];

  if (!validEvents.includes(event.event_type)) {
    console.log("ℹ Event ignoriert:", event.event_type);
    return new Response(JSON.stringify({ ignored: true }), {
      status: 200,
      headers: cors,
    });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // FIXED
  );

  const { error } = await supabase
    .from("userprofile") // sicher?
    .upsert(
      {
        email: email.toLowerCase(),
        is_premium: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

  if (error) {
    console.error("❌ Supabase Fehler:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: cors,
    });
  }

  console.log("✅ PREMIUM gesetzt für:", email);

  return new Response(JSON.stringify({ ok: true, premium: true }), {
    status: 200,
    headers: cors,
  });
}

export function GET() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: cors,
  });
}
