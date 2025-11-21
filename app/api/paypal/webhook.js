// /pages/api/paypal/webhook.js

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {
  // Webhook Body
  const event = req.body;

  const validEvents = [
    "BILLING.SUBSCRIPTION.ACTIVATED",
    "BILLING.SUBSCRIPTION.PAYMENT.SUCCEEDED",
    "PAYMENT.CAPTURE.COMPLETED"
  ];

  if (!validEvents.includes(event.event_type)) {
    return res.status(200).send("IGNORED");
  }

  // Buyer email aus PayPal
  const email =
    event?.resource?.payer?.email_address ||
    event?.resource?.subscriber?.email_address ||
    null;

  if (!email) {
    return res.status(400).json({ error: "No email found" });
  }

  const normalized = email.toLowerCase();

  // 🔥 Supabase User suchen
  const { data: users } = await supabase
    .from("User")
    .select("id")
    .eq("email", normalized)
    .limit(1);

  const user = users?.[0];

  if (!user) {
    console.log("User existiert nicht in Supabase:", normalized);
    return res.status(200).send("USER_NOT_FOUND");
  }

  // PREMIUM setzen
  await supabase
    .from("User")
    .update({ is_premium: true })
    .eq("id", user.id);

  console.log("Premium aktiviert für:", normalized);

  return res.status(200).send("PREMIUM_GRANTED");
}
