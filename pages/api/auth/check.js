// pages/api/auth/check.js
import prisma from "../../../lib/prisma";
import { hasActiveAccess } from "../../../lib/access";

export default async function handler(req, res) {
  try {
    const rawEmail =
      (req.query.email ||
        (req.body && req.body.email) ||
        "").toString().trim();

    if (!rawEmail || typeof rawEmail !== "string") {
      return res.status(400).json({ error: "E-Mail ungültig" });
    }

    const email = rawEmail.toLowerCase();

    // User anhand der E-Mail holen oder anlegen
    const user = await prisma.user.upsert({
      where: { id: email },
      create: { id: email },
      update: {},
    });

    const active = await hasActiveAccess(user.id);

    return res.status(200).json({
      hasAccess: active,
    });
  } catch (err) {
    console.error("AUTH CHECK ERROR:", err);
    return res.status(500).json({ error: "Serverfehler" });
  }
}
