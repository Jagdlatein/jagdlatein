// pages/api/admin/quiz-import-run.js
import * as XLSX from "xlsx";
import prisma from "../../../lib/prisma";

const REQUIRED_COLS = [
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

function authOk(req) {
  const qKey = req.query.key;
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  const pass = process.env.ADMIN_PASS || "Jagdlatein2025";
  return qKey === pass || token === pass;
}

async function fetchExcel(owner, repo, branch, path) {
  const raw = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  const res = await fetch(raw);
  if (!res.ok) throw new Error(`Excel nicht gefunden (${res.status}) -> ${raw}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

function parseWorkbook(buf) {
  const wb = XLSX.read(buf, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  return rows;
}

function normalize(r) {
  return {
    id: Number(r.id),
    country: String(r.country || "").trim(),
    category: String(r.category || "").trim(),
    topic: String(r.topic || "").trim(),
    question: String(r.question || "").trim(),
    option_a: String(r.option_a || "").trim(),
    option_b: String(r.option_b || "").trim(),
    option_c: String(r.option_c || "").trim(),
    option_d: String(r.option_d || "").trim(),
    correct: String(r.correct || "").trim().toUpperCase(),
  };
}

export default async function handler(req, res) {
  try {
    if (!authOk(req)) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const owner = process.env.GITHUB_OWNER || "Jagdlatein";
    const repo = process.env.GITHUB_REPO || "jagdlatein";
    const branch = process.env.GITHUB_BRANCH || "main";

    let buf;
    try {
      buf = await fetchExcel(owner, repo, branch, "data/quiz/quiz_import.xlsx");
    } catch {
      buf = await fetchExcel(owner, repo, branch, "data/quiz/Mappe1.xlsx");
    }

    const rows = parseWorkbook(buf);
    if (!rows.length) return res.json({ ok: true, imported: 0, hint: "Keine Zeilen gefunden" });

    // Header prüfen
    const cols = Object.keys(rows[0] || {});
    const missing = REQUIRED_COLS.filter((c) => !cols.includes(c));
    if (missing.length) {
      return res.status(400).json({ ok: false, error: "Fehlende Spalten", missing });
    }

    let imported = 0;
    for (const raw of rows) {
      const r = normalize(raw);
      if (!r.id || !r.question || !"ABCD".includes(r.correct)) continue;

      await prisma.quizQuestion.upsert({
        where: { id: r.id },
        create: r,
        update: r,
      });
      imported++;
    }

    res.json({ ok: true, imported });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}
