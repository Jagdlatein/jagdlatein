// pages/api/admin/quiz-sync-github.js
export const config = { api: { bodyParser: false }, runtime: "nodejs" };

import { Octokit } from "@octokit/rest";
import prisma from "../../../lib/prisma";

function bad(res, c, m){ return res.status(c).json({ error:m }); }

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return bad(res, 405, "Method not allowed");

    // Admin-Auth
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!process.env.ADMIN_PASS || token !== process.env.ADMIN_PASS) {
      return bad(res, 401, "Unauthorized");
    }

    const GH_PAT = process.env.GITHUB_TOKEN;
    const OWNER  = process.env.GITHUB_OWNER;
    const REPO   = process.env.GITHUB_REPO;
    const BRANCH = process.env.GITHUB_BRANCH || "main";
    if (!GH_PAT || !OWNER || !REPO) return bad(res, 400, "Missing GITHUB_* env vars");

    // 1) Daten aus DB holen (alle Fragen)
    const items = await prisma.quizQuestion.findMany({ orderBy: { id: "asc" } });
    const json = JSON.stringify(items, null, 2);
    const contentB64 = Buffer.from(json, "utf-8").toString("base64");
    const path = `data/quiz/all_questions.json`;

    const octokit = new Octokit({ auth: GH_PAT });

    // 2) Existiert Datei? (sha ermitteln für Update)
    let sha = undefined;
    try {
      const { data: existing } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path, ref: BRANCH });
      if (existing && "sha" in existing) sha = existing.sha;
    } catch (_) { /* 404 ok → create */ }

    // 3) Datei erstellen/aktualisieren
    const r = await octokit.repos.createOrUpdateFileContents({
      owner: OWNER, repo: REPO, path, branch: BRANCH, sha,
      message: `sync quiz from DB (${new Date().toISOString()})`,
      content: contentB64,
      committer: { name: "Jagdlatein Bot", email: "info@jagdlatein.de" },
      author:    { name: "Jagdlatein Bot", email: "info@jagdlatein.de" },
    });

    return res.status(200).json({ ok:true, committed: path, status: r.status });
  } catch (e) {
    return res.status(500).json({ error:"GitHub sync failed", detail: String(e?.message || e) });
  }
}
