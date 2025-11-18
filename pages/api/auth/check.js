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

    // User suchen
    const user = await prisma.user.findUnique({
      where: { id: email },
      include: { access: true },
    });

    if (!user || !user.access) {
      return res.status(200).json({ hasAccess: false });
    }

    const now = new Date();
    const active = user.access.expiresAt > now;

    return res.status(200).json({
      hasAccess: active,
    });
  } catch (err) {
    console.error("AUTH CHECK ERROR:", err);
    return res.status(500).json({ error: "Serverfehler" });
  }
}
