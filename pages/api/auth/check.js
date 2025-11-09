// pages/api/auth/check.js
import { PrismaClient } from "@prisma/client";

let prisma;
function getPrisma() {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

export default async function handler(req, res) {
  try {
    const prisma = getPrisma();

    const emailRaw = (req.body && req.body.email) || req.query.email || "";
    const email = String(emailRaw).trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, error: "missing-email" });

    const pass = await prisma.accessPass.findFirst({
      where: {
        userId: email,
        status: "active",
        startsAt: { lte: new Date() },
        expiresAt: { gt: new Date() },
      },
      select: { id: true, plan: true, expiresAt: true, status: true },
    });

    return res.json({
      ok: true,
      hasAccess: !!pass,
      status: pass?.status ?? null,
      plan: pass?.plan ?? null,
      expiresAt: pass?.expiresAt ?? null,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
