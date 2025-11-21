import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPaypalWebhook } from "./_base";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export async function POST(req) {
  const body = await req.text();

  // 1. Webhook Signatur prüfen
  const event = await verifyPaypalWebhook(req, body);
  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Relevante Events
  const valid = [
    "BILLING.SUBSCRIPTION.ACTIVATED",
    "BILLING.SUBSCRIPTION.PAYMENT.SUCCEEDED",
    "BILLING.SUBSCRIPTION.CANCELLED"
  ];

  if (!valid.includes(event.event_type)) {
    return NextResponse.json({ ok: true });
  }

  // 2. Email extrahieren
  const email =
    event?.resource?.subscriber?.email_address ||
    event?.resource?.payer?.email_address;

  if (!email) {
    return NextResponse.json({ error: "No email found" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase();

  // 3. Userprofile finden
  const { data: profile } = await supabase
    .from("userprofile")
    .select("user_id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  let userId = profile?.user_id;

  // Falls User noch nie eingeloggt → Profil anlegen
  if (!userId) {
    const { data: newProfile } = await supabase
      .from("userprofile")
      .insert({ email: normalizedEmail, is_premium: false })
      .select()
      .single();

    userId = newProfile.user_id;
  }

  // 4. Subscription speichern
  await supabase.from("subscription").upsert({
    user_id: userId,
    paypal_subscription_id: event.resource.id,
    status: event.resource.status,
    next_billing_time:
      event.resource.billing_info?.next_billing_time || null,
  });

  // 5. Premium setzen oder entfernen
  const isActive = event.resource.status === "ACTIVE";

  await supabase
    .from("userprofile")
    .update({ is_premium: isActive })
    .eq("user_id", userId);

  // 6. Loggen
  await supabase.from("paymentlog").insert({
    provider: "paypal",
    email: normalizedEmail,
    status: event.event_type,
    raw: event,
  });

  return NextResponse.json({ ok: true });
}
