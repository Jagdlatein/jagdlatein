// /pages/api/paypal/webhook.js

import { prisma } from "@/lib/prisma";
import { verifyPaypalWebhook } from "./_base";

const ACCESS_DAYS = 30;

export default async function handler(req, res) {
  const event = await verifyPaypalWebhook(req, res);
  if (!event) return;

  // Alle Events, die vom Hosted Button (Subscription) kommen UND
  // die eine Freischaltung bedeuten
  const validEvents = [
    "PAYMENT.CAPTURE.COMPLETED",            // einmalige Zahlungen
    "BILLING.SUBSCRIPTION.ACTIVATED",       // neues Abo
    "BILLING.SUBSCRIPTION.PAYMENT.SUCCEEDED" // Abo-Verlängerung
  ];

  if (!validEvents.includes(event.event_type)) {
    return res.status(200).send("IGNORED");
  }

  // Email extrahieren je nach Event-Typ
  const buyerEmail =
    event?.resource?.payer?.email_address ||           // PAYMENT.CAPTURE.COMPLETED
    event?.resource?.subscriber?.email_address ||       // SUBSCRIPTIONS
    null;

  if (!buyerEmail) {
    return res.status(400).send("Webhook error: No email found");
  }

  const email = buyerEmail.toLowerCase();

  // Nutzer laden oder erstellen
  let user = await prisma.user.findUnique({
    where: { id: email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { id: email },
    });
  }

  // AccessPass laden
  const existing = await prisma.accessPass.findUnique({
    where: { userId: user.id },
  });

  const now = new Date();
  const base =
    existing?.expiresAt && existing.expiresAt > now
      ? existing.expiresAt
      : now;

  const newExpiresAt = new Date(
    base.getTime() + ACCESS_DAYS * 24 * 60 * 60 * 1000
  );

  // Access erstellen/verlängern
  if (!existing) {
    await prisma.accessPass.create({
      data: {
        userId: user.id,
        plan: "monthly",
        status: "active",
        expiresAt: newExpiresAt,
      },
    });
  } else {
    await prisma.accessPass.update({
      where: { userId: user.id },
      data: {
        status: "active",
        expiresAt: newExpiresAt,
      },
    });
  }

  // Event loggen
  await prisma.paymentEvent.create({
    data: {
      provider: "paypal",
      email: user.id,
      status: "completed",
      raw: event,
    },
  });

  return res.status(200).send("ACCESS_UPDATED");
}
