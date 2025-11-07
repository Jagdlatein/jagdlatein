// pages/api/admin/quiz-import-github.js
export const config = { api: { bodyParser: true }, runtime: "nodejs" };

import * as XLSX from "xlsx";
import prisma from "../../../lib/prisma";

// 🔒 helpers
function getBearer(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}
function isAuthorized(req) {
  const sent = getBearer(req).trim();
  const want = (process.env.ADMIN_PASS || "").trim();
  return Boolean(sent && want && sent === want);
}

function bad(res, c, m){ return res.status(c).json({ error:m }); }

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return bad(res, 405, "Method not allowed");
    if (!isAuthorized(req)) return bad(res, 401, "Unauthorized");

    const GH=process.env.GITHUB_TOKEN, OWNER=process.env.GITHUB_OWNER, REPO=process.env.GITHUB_REPO, BR=process.env.GITHUB_BRANCH||"main";
    const { path="data/quiz/latest.xlsx" } = req.body || {};
    if (!GH || !OWNER || !REPO) return bad(res, 400, "Missing GITHUB_* env vars");

    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?ref=${BR}`;
    const r = await fetch(url, { headers: { Authorization:`Bearer ${GH}`, "User-Agent":"jagdlatein-app" }});
    const text = await r.text();
    if (!r.ok) return bad(res, r.status, `GitHub getContent failed: ${text}`);
    const j = JSON.parse(text);
    const b64 = (j.content||"").replace(/\n/g,""); const buf = Buffer.from(b64, "base64");

    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    const required = ["id","country","category","topic","question","option_a","option_b","option_c","option_d","correct"];
    const ok = rows.length && required.every(k => Object.prototype.hasOwnProperty.call(rows[0], k));
    if (!ok) return bad(res, 400, `Fehlende Spalten: ${required.join(", ")}`);

    const cleaned = rows.map(r => ({
      id:Number(r.id),
      country:String(r.country||"").trim(),
      category:String(r.category||"").trim(),
      topic:String(r.topic||"").trim(),
      question:String(r.question||"").trim(),
      option_a:String(r.option_a||"").trim(),
      option_b:String(r.option_b||"").trim(),
      option_c:String(r.option_c||"").trim(),
      option_d:String(r.option_d||"").trim(),
      correct:String(r.correct||"").trim().toUpperCase(),
    }));

    await prisma.$transaction(cleaned.map(q => prisma.quizQuestion.upsert({
      where:{id:q.id},
      update:{ country:q.country, category:q.category, topic:q.topic, question:q.question, option_a:q.option_a,
        option_b:q.option_b, option_c:q.option_c, option_d:q.option_d, correct:q.correct },
      create:q
    })));

    return res.status(200).json({ ok:true, imported: cleaned.length, path });
  } catch (e) {
    return bad(res, 500, String(e?.message||e));
  }
}
