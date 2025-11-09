// pages/api/admin/quiz-import-preview.js
import * as XLSX from "xlsx";

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
  // Public raw URL – kein Token nötig
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

function validateRows(rows) {
  const issues = [];
  // Header check
  const cols = Object.keys(rows[0] || {});
  const missing = REQUIRED_COLS.filter((c) => !cols.includes(c));
  if (missing.length) {
    issues.push({ type: "missing_columns", missing });
  }

  // Row checks
  rows.forEach((r, i) => {
    const ln = i + 2; // wegen Header
    if (!r.id) issues.push({ line: ln, msg: "id fehlt" });
    if (!r.question) issues.push({ line: ln, msg: "question fehlt" });
    if (!["A", "B", "C", "D"].includes(String(r.correct || "").trim().toUpperCase()))
      issues.push({ line: ln, msg: "correct muss A/B/C/D sein" });
  });

  return { issues };
}

export default async function handler(req, res) {
  try {
    if (!authOk(req)) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const owner = process.env.GITHUB_OWNER || "Jagdlatein";
    const repo = process.env.GITHUB_REPO || "jagdlatein";
    const branch = process.env.GITHUB_BRANCH || "main";

    // bevorzugt quiz_import.xlsx, fallback Mappe1.xlsx
    let buf;
    try {
      buf = await fetchExcel(owner, repo, branch, "data/quiz/quiz_import.xlsx");
    } catch {
      buf = await fetchExcel(owner, repo, branch, "data/quiz/Mappe1.xlsx");
    }

    const rows = parseWorkbook(buf);
    const { issues } = validateRows(rows);

    res.json({
      ok: true,
      rows_total: rows.length,
      sample: rows.slice(0, 5),
      issues,
      hint:
        "Wenn ok: /api/admin/quiz-import-run?key=<ADMIN_PASS> aufrufen um in DB zu importieren.",
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}
