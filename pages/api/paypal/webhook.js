// /pages/api/paypal/webhook.js

import { prisma } from "@/lib/prisma";
import { verifyPaypalWebhook } from "./_base";

// Premiumzugang gilt für 30 Tage nach jeder Zahlung
const ACCESS_DAYS = 30;

export default async function handler(req, res) {
  // PayPal Signatur prüfen
  const event = await verifyPaypalWebhook(req, res);
  if (!event) return;

  // Erfolgreiche Zahlung?
  if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
    return res.status(200).send("IGNORED");
  }

  const buyerEmail = event?.resource?.payer?.email_address;
  if (!buyerEmail) {
    return res.status(400).send("Webhook error: No email found");
  }

  const email = buyerEmail.toLowerCase();

  // Nutzer existiert?
  let user = await prisma.user.findUnique({
    where: { id: email },
  });

  // Falls nicht vorhanden → automatisch anlegen
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: email,
      },
    });
  }

  // Ablaufdatum berechnen
  const now = new Date();
  const base =
    user.accessUntil && user.accessUntil > now
      ? user.accessUntil
      : now;
  const newUntil = new Date(base.getTime() + ACCESS_DAYS * 24 * 60 * 60 * 1000);

  // Zugang verlängern / setzen
  await prisma.user.update({
    where: { id: email },
    data: {
      accessUntil: newUntil,
    },
  });

  return res.status(200).send("ACCESS_UPDATED");
}
