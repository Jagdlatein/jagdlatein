// pages/api/admin/quiz-upload-github.js
export const config = { api: { bodyParser: false }, runtime: "nodejs" };

import formidable from "formidable";
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

function bad(res, code, msg) { return res.status(code).json({ error: msg }); }

async function getFileSha({ owner, repo, branch, path, token }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "User-Agent": "jagdlatein-app" } });
  if (r.status === 404) return undefined;
  if (!r.ok) throw new Error(`getContent ${r.status} ${await r.text()}`);
  const j = await r.json(); return j.sha;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return bad(res, 405, "Method not allowed");
    if (!isAuthorized(req)) return res.status(401).json({ error: "Unauthorized", hint: "Authorization: Bearer <ADMIN_PASS>" });

    const GH_PAT = process.env.GITHUB_TOKEN;
    const OWNER  = process.env.GITHUB_OWNER;
    const REPO   = process.env.GITHUB_REPO;
    const BRANCH = process.env.GITHUB_BRANCH || "main";
    if (!GH_PAT || !OWNER || !REPO) return bad(res, 400, "Missing GITHUB_* env vars");

    const form = formidable({ multiples: false, maxFileSize: 50 * 1024 * 1024 });
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => err ? reject(err) : resolve({ files }));
    });

    const f = files?.file;
    const filepath = Array.isArray(f) ? f[0]?.filepath : f?.filepath;
    const originalName = Array.isArray(f) ? f[0]?.originalFilename : f?.originalFilename;
    if (!filepath) return bad(res, 400, "Missing file (expected field 'file')");

    const fs = await import("node:fs/promises");
    const buf = await fs.readFile(filepath);

    const contentB64 = Buffer.from(buf).toString("base64");
    const safeName = (originalName || "quiz.xlsx").replace(/[^A-Za-z0-9._-]/g, "_");
    const ghPath = `data/quiz/${safeName}`;

    const sha = await getFileSha({ owner: OWNER, repo: REPO, branch: BRANCH, path: ghPath, token: GH_PAT });

    const putUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(ghPath)}`;
    const body = {
      message: `upload quiz excel (${new Date().toISOString()})`,
      content: contentB64,
      branch: BRANCH,
      ...(sha ? { sha } : {}),
      committer: { name: "Jagdlatein Bot", email: "info@jagdlatein.de" },
      author:    { name: "Jagdlatein Bot", email: "info@jagdlatein.de" }
    };

    const ghRes = await fetch(putUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${GH_PAT}`, "Content-Type": "application/json", "User-Agent": "jagdlatein-app" },
      body: JSON.stringify(body)
    });

    const ghText = await ghRes.text();
    if (!ghRes.ok) {
      return res.status(ghRes.status).json({ error: "GitHub PUT failed", status: ghRes.status, detail: ghText,
        hint: "Token/Repo/Branch/Protection prüfen" });
    }

    // optional: direkt in DB importieren (best effort)
    let imported = 0;
    try {
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const required = ["id","country","category","topic","question","option_a","option_b","option_c","option_d","correct"];
      const headerOk = rows.length && required.every(k => Object.prototype.hasOwnProperty.call(rows[0], k));
      if (!headerOk) throw new Error(`Fehlende Spalten: ${required.join(", ")}`);
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
        where: { id: q.id },
        update: { country:q.country, category:q.category, topic:q.topic, question:q.question, option_a:q.option_a,
          option_b:q.option_b, option_c:q.option_c, option_d:q.option_d, correct:q.correct },
        create: q
      })));
      imported = cleaned.length;
    } catch { imported = 0; }

    return res.status(200).json({ ok: true, committed: ghPath, github_status: ghRes.status, imported });
  } catch (e) {
    return bad(res, 500, String(e?.message || e));
  }
}
