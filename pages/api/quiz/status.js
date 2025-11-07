// pages/api/quiz/status.js
import prisma from "../../../lib/prisma";

function redactDb(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}:${u.port || ""}${u.pathname}`; // ohne User/Pass
  } catch { return "unknown"; }
}

export default async function handler(req, res) {
  try {
    const cnt = await prisma.quizQuestion.count();
    return res.status(200).json({
      ok: true,
      count: cnt,
      db: redactDb(process.env.DATABASE_URL),
    });
  } catch (e) {
    return res.status(500).json({ ok:false, error: String(e?.message || e) });
  }
}
