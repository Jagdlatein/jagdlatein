// pages/api/admin/db-test.js
import prisma from "../../../lib/prisma";

export const config = { api: { bodyParser: false }, runtime: "nodejs" };

export default async function handler(req, res) {
  const url = process.env.DATABASE_URL || null;
  const redacted = url ? url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@") : null;

  try {
    // kurzer Verbindungs-Test (5s Timeout)
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 5000);

    // Ein leichter Query – Prisma öffnet dabei die DB-Verbindung
    const r = await prisma.$queryRaw`SELECT 1`;
    clearTimeout(t);

    return res.status(200).json({
      ok: true,
      message: "DB erreichbar",
      db: redacted,
      result: r
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      message: "DB NICHT erreichbar",
      db: redacted,
      error: String(e?.message || e),
      hint: "Prüfe: Projekt 'Running', Port 5432, sslmode=require, Passwort URL-encoden, Vercel-ENV (Production) & Redeploy"
    });
  }
}
