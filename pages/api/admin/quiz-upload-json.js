// pages/api/admin/quiz-upload-json.js
export const config = { api: { bodyParser: { sizeLimit: "10mb" } }, runtime: "nodejs" };

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

function bad(res, code, msg, extra = {}) { return res.status(code).json({ error: msg, ...extra }); }

async function getFileSha({ owner, repo, branch, path, token }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "User-Agent": "jagdlatein-app" }});
  if (r.status === 404) return undefined;
  if (!r.ok) throw new Error(`getContent ${r.status} ${await r.text()}`);
  const j = await r.json(); return j.sha;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return bad(res, 405, "Method not allowed", { expect:"POST application/json" });
    if (!isAuthorized(req)) return bad(res, 401, "Unauthorized", { hint: "Authorization: Bearer <ADMIN_PASS>" });

    const body = req.body;
    if (!body || typeof body !== "object") return bad(res, 400, "Invalid JSON body");

    const items = Array.isArray(body) ? body : Array.isArray(body.items) ? body.items : null;
    if (!items || !items.length) return bad(res, 400, "Missing items array with quiz questions");

    const required = ["id","country","category","topic","question","option_a","option_b","option_c","option_d","correct"];
    const errors = [];
    const cleaned = items.map((r, i) => {
      const miss = required.filter((k) => !(k in r));
      if (miss.length) { errors.push(`Row ${i+1}: missing ${miss.join(", ")}`); return null; }
      const idNum = Number(r.id);
      const corr = String(r.correct ?? "").trim().toUpperCase();
      if (!Number.isFinite(idNum)) errors.push(`Row ${i+1}: id must be a number`);
      if (!["A","B","C","D"].includes(corr)) errors.push(`Row ${i+1}: correct must be A/B/C/D`);
      return {
        id: idNum,
        country: String(r.country ?? "").trim(),
        category: String(r.category ?? "").trim(),
        topic: String(r.topic ?? "").trim(),
        question: String(r.question ?? "").trim(),
        option_a: String(r.option_a ?? "").trim(),
        option_b: String(r.option_b ?? "").trim(),
        option_c: String(r.option_c ?? "").trim(),
        option_d: String(r.option_d ?? "").trim(),
        correct: corr
      };
    });
    if (errors.length) return bad(res, 400, "Validation failed", { details: errors.slice(0, 30) });

    await prisma.$transaction(cleaned.map(q => prisma.quizQuestion.upsert({
      where:{ id:q.id },
      update:{ country:q.country, category:q.category, topic:q.topic, question:q.question,
        option_a:q.option_a, option_b:q.option_b, option_c:q.option_c, option_d:q.option_d, correct:q.correct },
      create:q
    })), { timeout: 60_000 });

    const shouldCommit = Boolean((!Array.isArray(body) && body.commit) || req.query.commit === "1");
    let committed = null;

    if (shouldCommit) {
      const GH=process.env.GITHUB_TOKEN, OWNER=process.env.GITHUB_OWNER, REPO=process.env.GITHUB_REPO, BR=process.env.GITHUB_BRANCH||"main";
      if (!GH || !OWNER || !REPO) return bad(res, 400, "Missing GITHUB_* env vars for commit");

      const filename = (!Array.isArray(body) && body.filename) || `questions-${new Date().toISOString().replace(/[:.]/g,"-")}.json`;
      const ghPath = `data/quiz/${filename.replace(/[^A-Za-z0-9._-]/g,"_")}`;
      const json = JSON.stringify(cleaned, null, 2);
      const contentB64 = Buffer.from(json, "utf-8").toString("base64");
      const sha = await getFileSha({ owner: OWNER, repo: REPO, branch: BR, path: ghPath, token: GH });

      const putUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(ghPath)}`;
      const bodyPut = {
        message: `upload quiz json (${new Date().toISOString()})`,
        content: contentB64,
        branch: BR,
        ...(sha ? { sha } : {}),
        committer: { name: "Jagdlatein Bot", email: "info@jagdlatein.de" },
        author:    { name: "Jagdlatein Bot", email: "info@jagdlatein.de" }
      };
      const ghRes = await fetch(putUrl, {
        method: "PUT",
        headers: { Authorization: `Bearer ${GH}`, "Content-Type": "application/json", "User-Agent":"jagdlatein-app" },
        body: JSON.stringify(bodyPut)
      });
      const ghText = await ghRes.text();
      if (!ghRes.ok) return bad(res, ghRes.status, "GitHub PUT failed", { status: ghRes.status, detail: ghText });

      committed = ghPath;
    }

    return res.status(200).json({ ok: true, imported: cleaned.length, ...(committed ? { committed } : {}) });
  } catch (e) {
    return bad(res, 500, String(e?.message || e));
  }
}
