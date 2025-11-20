// pages/api/auth/check.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const rawEmail =
      (req.query.email ||
        (req.body && req.body.email) ||
        "").toString().trim();

    if (!rawEmail) {
      return res.status(400).json({ error: "E-Mail ungültig" });
    }

    const email = rawEmail.toLowerCase();

    // User suchen (E-Mail ist ID)
    const user = await prisma.user.findUnique({
      where: { id: email },
      include: { access: true },
    });

    // ❗ Nutzer existiert NICHT => Login ablehnen
    if (!user) {
      return res.status(200).json({
        exists: false,
        hasAccess: false,
        paid: false,
        admin: false
      });
    }

    // Wenn Nutzer existiert, Abo prüfen
    const now = new Date();
    const active = user.access && user.access.expiresAt > now;

    return res.status(200).json({
      exists: true,
      hasAccess: active,
      paid: active,
      admin: user.admin === true
    });
  } catch (err) {
    console.error("AUTH CHECK ERROR:", err);
    return res.status(500).json({ error: "Serverfehler" });
  }
}
