// pages/api/admin/quiz-import-github.js
export const config = { api: { bodyParser: true }, runtime: "nodejs" };

import * as XLSX from "xlsx";
import prisma from "../../../lib/prisma";

function bad(res, c, m) { return res.status(c).json({ error: m }); }

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return bad(res, 405, "Method not allowed");

    // Admin-Auth
    const auth = req.headers.authorization || "";
    const tokenHeader = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!process.env.ADMIN_PASS || tokenHeader !== process.env.ADMIN_PASS) {
      return bad(res, 401, "Unauthorized");
    }

    const GH_PAT = process.env.GITHUB_TOKEN;
    const OWNER  = process.env.GITHUB_OWNER;
    const REPO   = process.env.GITHUB_REPO;
    const BRANCH = process.env.GITHUB_BRANCH || "main";
    const { path = "data/quiz/latest.xlsx" } = req.body || {};
    if (!GH_PAT || !OWNER || !REPO) return bad(res, 400, "Missing GITHUB_* env vars");

    // GitHub API: Datei-Content laden (base64)
    const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`;
    const r = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${GH_PAT}`, "User-Agent":"jagdlatein-app" }
    });
    if (!r.ok) return bad(res, r.status, `GitHub getContent failed: ${await r.text()}`);
    const j = await r.json();
    const contentB64 = j.content?.replace(/\n/g, "") || "";
    const buf = Buffer.from(contentB64, "base64");

    // Excel parsen & in DB importieren
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    const required = ["id","country","category","topic","question","option_a","option_b","option_c","option_d","correct"];
    const headerOk = rows.length && required.every(k => Object.prototype.hasOwnProperty.call(rows[0], k));
    if (!headerOk) return bad(res, 400, `Fehlende Spalten: ${required.join(", ")}`);

    const cleaned = rows.map(r => ({
      id: Number(r.id),
      country: String(r.country||"").trim(),
      category: String(r.category||"").trim(),
      topic: String(r.topic||"").trim(),
      question: String(r.question||"").trim(),
      option_a: String(r.option_a||"").trim(),
      option_b: String(r.option_b||"").trim(),
      option_c: String(r.option_c||"").trim(),
      option_d: String(r.option_d||"").trim(),
      correct: String(r.correct||"").trim().toUpperCase(),
    }));

    await prisma.$transaction(
      cleaned.map(q =>
        prisma.quizQuestion.upsert({
          where: { id: q.id },
          update: {
            country: q.country, category: q.category, topic: q.topic,
            question: q.question, option_a: q.option_a, option_b: q.option_b,
            option_c: q.option_c, option_d: q.option_d, correct: q.correct,
          },
          create: q,
        })
      ),
      { timeout: 60000 }
    );

    return res.status(200).json({ ok: true, imported: cleaned.length, path });
  } catch (e) {
    return bad(res, 500, String(e?.message || e));
  }
}
