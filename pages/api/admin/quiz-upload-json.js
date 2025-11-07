// pages/api/admin/quiz-upload-json.js
export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } }, // JSON bis 10 MB
  runtime: "nodejs",
};

import prisma from "../../../lib/prisma";

// Hilfsfunktionen
function bad(res, code, msg, extra = {}) {
  return res.status(code).json({ error: msg, ...extra });
}

async function getFileSha({ owner, repo, branch, path, token }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "jagdlatein-app" },
  });
  if (r.status === 404) return undefined;
  if (!r.ok) throw new Error(`getContent ${r.status} ${await r.text()}`);
  const j = await r.json();
  return j.sha;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return bad(res, 405, "Method not allowed", { expect: "POST application/json" });
    }

    // Admin-Auth prüfen
    const auth = req.headers.authorization || "";
    const tokenHeader = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!process.env.ADMIN_PASS || tokenHeader !== process.env.ADMIN_PASS) {
      return bad(res, 401, "Unauthorized", { hint: "Authorization: Bearer <ADMIN_PASS>" });
    }

    // JSON parsen
    // Erwartete Formate:
    // 1) Array von Fragen: [ {...}, {...} ]
    // 2) Objekt: { items: [ {...}, ... ], filename?: "questions.json", commit?: true }
    let body = req.body;
    if (!body || typeof body !== "object") {
      return bad(res, 400, "Invalid JSON body");
    }

    const items = Array.isArray(body) ? body : Array.isArray(body.items) ? body.items : null;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return bad(res, 400, "Missing items array with quiz questions");
    }

    const required = [
      "id",
      "country",
      "category",
      "topic",
      "question",
      "option_a",
      "option_b",
      "option_c",
      "option_d",
      "correct",
    ];

    // Validierung & Cleaning
    const errors = [];
    const cleaned = items.map((r, i) => {
      const miss = required.filter((k) => !(k in r));
      if (miss.length) {
        errors.push(`Row ${i + 1}: missing ${miss.join(", ")}`);
        return null;
      }
      const idNum = Number(r.id);
      const corr = String(r.correct ?? "").trim().toUpperCase();
      if (!Number.isFinite(idNum)) errors.push(`Row ${i + 1}: id must be a number`);
      if (!["A", "B", "C", "D"].includes(corr)) errors.push(`Row ${i + 1}: correct must be A/B/C/D`);
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
        correct: corr,
      };
    });

    if (errors.length) {
      return bad(res, 400, "Validation failed", { details: errors.slice(0, 20) });
    }

    // In DB upserten
    await prisma.$transaction(
      cleaned.map((q) =>
        prisma.quizQuestion.upsert({
          where: { id: q.id },
          update: {
            country: q.country,
            category: q.category,
            topic: q.topic,
            question: q.question,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct: q.correct,
          },
          create: q,
        })
      ),
      { timeout: 60_000 }
    );

    // Optional: ins GitHub-Repo committen
    // Trigger über body.commit === true ODER ?commit=1 in der URL.
    const shouldCommit =
      Boolean((!Array.isArray(body) && body.commit) || req.query.commit === "1");

    let committed = null;
    if (shouldCommit) {
      const GH_PAT = process.env.GITHUB_TOKEN;
      const OWNER = process.env.GITHUB_OWNER;
      const REPO = process.env.GITHUB_REPO;
      const BRANCH = process.env.GITHUB_BRANCH || "main";
      if (!GH_PAT || !OWNER || !REPO) {
        return bad(res, 400, "Missing GITHUB_* env vars for commit");
      }

      const filename =
        (!Array.isArray(body) && body.filename) ||
        `questions-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

      const ghPath = `data/quiz/${filename.replace(/[^A-Za-z0-9._-]/g, "_")}`;
      const json = JSON.stringify(cleaned, null, 2);
      const contentB64 = Buffer.from(json, "utf-8").toString("base64");

      const sha = await getFileSha({
        owner: OWNER,
        repo: REPO,
        branch: BRANCH,
        path: ghPath,
        token: GH_PAT,
      });

      const putUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(
        ghPath
      )}`;
      const bodyPut = {
        message: `upload quiz json (${new Date().toISOString()})`,
        content: contentB64,
        branch: BRANCH,
        ...(sha ? { sha } : {}),
        committer: { name: "Jagdlatein Bot", email: "info@jagdlatein.de" },
        author: { name: "Jagdlatein Bot", email: "info@jagdlatein.de" },
      };

      const ghRes = await fetch(putUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GH_PAT}`,
          "Content-Type": "application/json",
          "User-Agent": "jagdlatein-app",
        },
        body: JSON.stringify(bodyPut),
      });

      const ghText = await ghRes.text();
      if (!ghRes.ok) {
        return bad(res, ghRes.status, "GitHub PUT failed", {
          status: ghRes.status,
          detail: ghText,
        });
      }
      committed = ghPath;
    }

    return res.status(200).json({
      ok: true,
      imported: cleaned.length,
      ...(committed ? { committed } : {}),
    });
  } catch (e) {
    return bad(res, 500, String(e?.message || e));
  }
}
