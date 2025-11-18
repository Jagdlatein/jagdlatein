// /pages/api/paypal/webhook.js

import { prisma } from "@/lib/prisma";
import { verifyPaypalWebhook } from "./_base";

const ACCESS_DAYS = 30;

export default async function handler(req, res) {
  const event = await verifyPaypalWebhook(req, res);
  if (!event) return;

  if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
    return res.status(200).send("IGNORED");
  }

  const buyerEmail = event?.resource?.payer?.email_address;
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

  // Prüfen ob bereits AccessPass vorhanden ist
  const existing = await prisma.accessPass.findUnique({
    where: { userId: user.id },
  });

  const now = new Date();
  const base = existing?.expiresAt && existing.expiresAt > now
    ? existing.expiresAt
    : now;

  const newExpiresAt = new Date(base.getTime() + ACCESS_DAYS * 24 * 60 * 60 * 1000);

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

  // Loggen
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
