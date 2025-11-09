// pages/api/admin/quiz-import-run.js
import fs from "fs";
import path from "path";
import xlsx from "xlsx";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const { key } = req.query;
    if (key !== process.env.ADMIN_PASS) {
      return res.status(401).json({ ok: false, error: "Unauthorized", hint: "key=? fehlt/ falsch" });
    }

    const filePath = path.join(process.cwd(), "data", "quiz", "quiz_import.xlsx");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ ok: false, error: "Keine Datei gefunden", path: filePath });
    }

    const wb = xlsx.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    const required = ["id", "country", "category", "topic", "question", "option_a", "option_b", "option_c", "option_d", "correct"];
    const valid = [];
    const rejected = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx];
      const rowNum = idx + 2;
      const missing = required.filter(k => !(k in r));
      if (missing.length) {
        rejected.push({ row: rowNum, reason: `Fehlende Spalten: ${missing.join(", ")}` });
        continue;
      }

      const record = {
        id: Number(String(r.id).trim()),
        country: String(r.country).trim(),
        category: String(r.category).trim(),
        topic: String(r.topic).trim(),
        question: String(r.question).trim(),
        option_a: String(r.option_a).trim(),
        option_b: String(r.option_b).trim(),
        option_c: String(r.option_c).trim(),
        option_d: String(r.option_d).trim(),
        correct: String(r.correct).trim().toUpperCase(),
      };

      if (!record.id || Number.isNaN(record.id)) { rejected.push({ row: rowNum, reason:"id ungültig"}); continue; }
      if (!record.question) { rejected.push({ row: rowNum, reason:"question fehlt"}); continue; }
      if (!["A","B","C","D"].includes(record.correct)) { rejected.push({ row: rowNum, reason:"correct nicht A/B/C/D"}); continue; }
      if (!["DE","AT","CH"].includes(record.country)) { rejected.push({ row: rowNum, reason:"country nicht DE/AT/CH"}); continue; }

      valid.push(record);
    }

    let imported = 0;
    for (const q of valid) {
      await prisma.quizQuestion.upsert({
        where: { id: q.id },
        update: {
          country: q.country, category: q.category, topic: q.topic, question: q.question,
          option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d,
          correct: q.correct
        },
        create: {
          id: q.id, country: q.country, category: q.category, topic: q.topic, question: q.question,
          option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d,
          correct: q.correct
        }
      });
      imported++;
    }

    return res.json({
      ok: true,
      file: "data/quiz/quiz_import.xlsx",
      rows_total: rows.length,
      valid: valid.length,
      imported,
      rejected: rejected.slice(0, 50),
      hint: rejected.length ? "Erste 50 Fehler gezeigt – Excel anpassen und erneut hochladen." : "Alles gut."
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
