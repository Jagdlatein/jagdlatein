// /pages/api/paypal/webhook.js

import { createClient } from "@supabase/supabase-js";
import { verifyPaypalWebhook } from "./_base";

// Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {
  // 1. PayPal Signature prüfen
  const event = await verifyPaypalWebhook(req, res);
  if (!event) return;

  // 2. Relevante PayPal Events
  const validEvents = [
    "BILLING.SUBSCRIPTION.ACTIVATED",
    "BILLING.SUBSCRIPTION.PAYMENT.SUCCEEDED",
    "BILLING.SUBSCRIPTION.CANCELLED",
  ];

  if (!validEvents.includes(event.event_type)) {
    return res.status(200).send("IGNORED");
  }

  // 3. Kunde Email extrahieren
  const email =
    event?.resource?.subscriber?.email_address ||
    event?.resource?.payer?.email_address ||
    null;

  if (!email) return res.status(400).send("No email in PayPal event");

  const normalized = email.toLowerCase();

  // 4. Supabase-USER suchen (über email — Magic Link)
  const { data: sbUser } = await supabase
    .from("UserProfile")
    .select("user_id")
    .eq("email", normalized)
    .single();

  let userId = sbUser?.user_id;

  // Falls User noch nie eingeloggt war → neuen Supabase-Eintrag erzeugen
  if (!userId) {
    const { data: created } = await supabase
      .from("UserProfile")
      .insert({
        email: normalized,
        is_premium: false,
      })
      .select()
      .single();

    userId = created.user_id;
  }

  // 5. Subscription Infos aus PayPal
  const subscriptionId = event.resource.id;
  const status = event.resource.status;

  const nextBilling =
    event.resource?.billing_info?.next_billing_time || null;

  // 6. Subscription upsert
  await supabase.from("subscription").upsert({
    user_id: userId,
    paypal_subscription_id: subscriptionId,
    status: status,
    next_billing_time: nextBilling,
  });

  // 7. Premium setzen / entfernen
  if (status === "ACTIVE") {
    await supabase
      .from("userprofile")
      .update({ is_premium: true })
      .eq("user_id", userId);
  } else if (status === "CANCELLED") {
    await supabase
      .from("userprofile")
      .update({ is_premium: false })
      .eq("user_id", userId);
  }

  // 8. Logging
  await supabase.from("paymentlog").insert({
    provider: "paypal",
    email: normalized,
    status,
    raw: event,
  });

  return res.status(200).send("OK");
}
