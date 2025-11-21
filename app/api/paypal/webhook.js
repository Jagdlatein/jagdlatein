// /pages/api/paypal/webhook.js

import { createClient } from "@supabase/supabase-js";
import { verifyPaypalWebhook } from "./_base";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

const ACCESS_DAYS = 30;

export default async function handler(req, res) {
  // Verify PayPal Signature
  const event = await verifyPaypalWebhook(req, res);
  if (!event) return;

  // Relevante PayPal Events
  const validEvents = [
    "PAYMENT.CAPTURE.COMPLETED",
    "BILLING.SUBSCRIPTION.ACTIVATED",
    "BILLING.SUBSCRIPTION.PAYMENT.SUCCEEDED"
  ];

  if (!validEvents.includes(event.event_type)) {
    return res.status(200).send("IGNORED");
  }

  // E-Mail von PayPal holen
  const buyerEmail =
    event?.resource?.payer?.email_address ||
    event?.resource?.subscriber?.email_address ||
    null;

  if (!buyerEmail) {
    return res.status(400).send("Webhook error: No email found");
  }

  const email = buyerEmail.toLowerCase();

  // 🔥 Supabase User suchen
  let { data: user } = await supabase
    .from("User")
    .select("*")
    .eq("email", email)
    .single();

  // Wenn User nicht existiert → anlegen
  if (!user) {
    const { data: newUser } = await supabase
      .from("User")
      .insert({ email, is_premium: true })
      .select()
      .single();
    user = newUser;
  }

  // Access verlängern wie vorher
  const now = new Date();

  // Abos speichern
  await supabase
    .from("Subscription")
    .upsert({
      user_id: user.id,
      paypal_subscription_id: event.resource.id,
      status: "active",
      next_billing_time:
        event.resource.billing_info?.next_billing_time || null,
      updated_at: now.toISOString()
    });

  // Premium aktivieren
  await supabase
    .from("User")
    .update({ is_premium: true })
    .eq("id", user.id);

  // Log speichern
  await supabase.from("PaymentLog").insert({
    provider: "paypal",
    email,
    status: "completed",
    raw: event
  });

  return res.status(200).send("ACCESS_UPDATED");
}
