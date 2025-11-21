import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPaypalWebhook } from "./_base";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export async function POST(req) {
  const text = await req.text();

  const event = await verifyPaypalWebhook(req, text);
  if (!event) return NextResponse.json({ error: "invalid signature" });

  const type = event.event_type;

  const email =
    event?.resource?.subscriber?.email_address ||
    event?.resource?.payer?.email_address ||
    null;

  if (!email) return NextResponse.json({ error: "no email" });

  // Normalisieren
  const normalized = email.toLowerCase();

  // 1️⃣ paymentlog speichern
  await supabase.from("paymentlog").insert({
    provider: "paypal",
    email: normalized,
    status: type,
    raw: event,
  });

  // 2️⃣ subscription speichern
  await supabase.from("subscription").upsert({
    user_id: normalized, // wir speichern Email als user_id
    paypal_subscription_id: event.resource.id,
    status: event.resource.status,
    next_billing_time:
      event.resource?.billing_info?.next_billing_time || null,
  });

  // 3️⃣ userprofile aktualisieren
  const isActive = event.resource.status === "ACTIVE";

  await supabase.from("userprofile").upsert({
    user_id: normalized,
    email: normalized,
    is_premium: isActive,
  });

  return NextResponse.json({ ok: true });
}
