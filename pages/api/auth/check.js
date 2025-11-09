// pages/api/auth/check.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const emailRaw = req.body?.email || req.query?.email || "";
    const email = emailRaw.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ ok: false, error: "missing-email" });
    }

    const pass = await prisma.accessPass.findFirst({
      where: {
        userId: email,
        status: "active",
        startsAt: { lte: new Date() },
        expiresAt: { gt: new Date() },
      },
      select: { id: true, expiresAt: true },
    });

    return res.json({
      ok: true,
      hasAccess: !!pass,
      expiresAt: pass?.expiresAt ?? null,
    });

  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
