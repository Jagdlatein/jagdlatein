import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPaypalWebhook } from "./_base";

// Build-safe Supabase Init
let supabase = null;

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE) {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
  );
}

export async function POST(req) {
  // Prevent Build-time crash
  if (!supabase) {
    return NextResponse.json({ ok: true, build: true });
  }

  const text = await req.text();

  const event = await verifyPaypalWebhook(req, text);
  if (!event) return NextResponse.json({ error: "invalid signature" });

  const email =
    event?.resource?.subscriber?.email_address ||
    event?.resource?.payer?.email_address ||
    null;

  if (!email)
    return NextResponse.json({ error: "no email" }, { status: 400 });

  const normalized = email.toLowerCase();

  // 1. userprofile suchen
  let { data: profile } = await supabase
    .from("userprofile")
    .select("user_id")
    .eq("email", normalized)
    .maybeSingle();

  let userId = profile?.user_id;

  // 2. ggf. userprofile erzeugen
  if (!userId) {
    const { data: newProfile } = await supabase
      .from("userprofile")
      .insert({
        email: normalized,
        is_premium: false,
      })
      .select("user_id")
      .single();

    userId = newProfile.user_id;
  }

  // 3. paymentlog
  await supabase.from("paymentlog").insert({
    provider: "paypal",
    email: normalized,
    status: event.event_type,
    raw: event,
  });

  // 4. subscription
  await supabase.from("subscription").upsert({
    user_id: userId,
    paypal_subscription_id: event.resource.id,
    status: event.resource.status,
    next_billing_time:
      event.resource?.billing_info?.next_billing_time || null,
  });

  // 5. premium aktualisieren
  const isActive = event.resource.status === "ACTIVE";

  await supabase
    .from("userprofile")
    .update({ is_premium: isActive })
    .eq("user_id", userId);

  return NextResponse.json({ ok: true });
}
