// pages/api/quiz/upload.js
export const config = { api: { bodyParser: false }, runtime: "nodejs" };

import formidable from "formidable";
import * as XLSX from "xlsx";
import prisma from "../../../lib/prisma"; // WICHTIG: 3 Ebenen hoch (quiz → api → pages → lib)

function send(res, code, obj){ res.status(code).json(obj); }

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return send(res, 200, {
        ok: true,
        env: { has_DATABASE_URL: !!process.env.DATABASE_URL, has_ADMIN_PASS: !!process.env.ADMIN_PASS },
        expect: "POST multipart/form-data mit Feldname 'file' + Header Authorization: Bearer <ADMIN_PASS>",
      });
    }
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

    // Admin-Auth
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!process.env.ADMIN_PASS || token !== process.env.ADMIN_PASS) {
      return send(res, 401, { error: "Unauthorized" });
    }

    // Upload lesen
    const form = formidable({ multiples: false, maxFileSize: 10 * 1024 * 1024 });
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
    });
    const f = files?.file;
    const filepath = Array.isArray(f) ? f[0]?.filepath : f?.filepath;
    if (!filepath) return send(res, 400, { error: "Missing file (expected field 'file')" });

    // Excel -> JSON
    let rows;
    try {
      const wb = XLSX.readFile(filepath);
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
    } catch (e) {
      return send(res, 400, { error: "Excel read error", detail: String(e?.message || e) });
    }

    // Pflichtspalten prüfen
    const required = ["id","country","category","topic","question","option_a","option_b","option_c","option_d","correct"];
    const headerOk = rows.length && required.every(k => Object.prototype.hasOwnProperty.call(rows[0], k));
    if (!headerOk) return send(res, 400, { error: `Fehlende Spalten: ${required.join(", ")}` });

    // Validierung & Normalisierung
    const problems = [];
    const cleaned = rows.map((r, i) => {
      const z = i + 2;
      const id = Number(r.id);
      const correct = String(r.correct || "").trim().toUpperCase();
      if (!id) problems.push(`Zeile ${z}: id fehlt/ist keine Zahl`);
      if (!String(r.question || "").trim()) problems.push(`Zeile ${z}: question fehlt`);
      if (!["A","B","C","D"].includes(correct)) problems.push(`Zeile ${z}: correct muss A/B/C/D sein`);
      return {
        id,
        country: String(r.country || "").trim(),
        category: String(r.category || "").trim(),
        topic: String(r.topic || "").trim(),
        question: String(r.question || "").trim(),
        option_a: String(r.option_a || "").trim(),
        option_b: String(r.option_b || "").trim(),
        option_c: String(r.option_c || "").trim(),
        option_d: String(r.option_d || "").trim(),
        correct,
      };
    });
    if (problems.length) return send(res, 400, { error: problems.slice(0, 25).join("; ") });

    // DB Upsert
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

    return send(res, 200, { ok: true, imported: cleaned.length });
  } catch (e) {
    return send(res, 500, { error: "Internal Server Error", detail: String(e?.message || e) });
  }
}
