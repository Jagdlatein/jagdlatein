// /pages/api/paypal/webhook.js

import { prisma } from "@/lib/prisma";
import { verifyPaypalWebhook } from "./_base";

export default async function handler(req, res) {
  // Webhook-Event validieren
  const event = await verifyPaypalWebhook(req, res);

  if (!event) return;

  // Wichtiger Event: Zahlung erfolgreich
  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const buyerEmail = event?.resource?.payer?.email_address;

    if (!buyerEmail) {
      return res.status(400).send("Webhook error: No email found");
    }

    // Prüfen ob Nutzer schon existiert
    let user = await prisma.user.findUnique({
      where: { email: buyerEmail },
    });

    // Falls Nutzer nicht existiert → automatisch anlegen
    if (!user) {
      const password = Math.random().toString(36).slice(2, 10);

      user = await prisma.user.create({
        data: {
          email: buyerEmail,
          password: password, // TODO E-Mail Versand aktivieren
          isPaidUser: true,
        },
      });

      // E-Mail wäre optional:
      // await sendMail(buyerEmail, password);
    } else {
      // Existierender Nutzer → Zugang aktivieren
      await prisma.user.update({
        where: { email: buyerEmail },
        data: { isPaidUser: true },
      });
    }

    return res.status(200).send("User access activated");
  }

  return res.status(200).send("OK");
}
