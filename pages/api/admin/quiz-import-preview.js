// pages/api/admin/quiz-import-preview.js
import fs from "fs";
import path from "path";
import xlsx from "xlsx";

export default async function handler(req, res) {
  try {
    const { key } = req.query;
    if (key !== process.env.ADMIN_PASS) {
      return res.status(401).json({ ok: false, error: "Unauthorized", hint: "key=? fehlt/ falsch" });
    }

    // Datei, die dein Upload-Endpunkt anlegt:
    const filePath = path.join(process.cwd(), "data", "quiz", "quiz_import.xlsx");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ ok: false, error: "Keine Datei gefunden", path: filePath });
    }

    const wb = xlsx.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    const required = ["id", "country", "category", "topic", "question", "option_a", "option_b", "option_c", "option_d", "correct"];
    const errors = [];
    const preview = [];

    rows.forEach((r, idx) => {
      const rowNum = idx + 2; // 1 = Header
      // Header-Check an Zeile 1
      if (idx === 0) {
        const cols = Object.keys(r).map(s => s.trim());
        // Nichts erzwingen – wir validieren pro Row Namen
      }

      // Fehlende Spalten sammeln
      const missing = required.filter(k => !(k in r));
      if (missing.length) {
        errors.push({ row: rowNum, error: `Fehlende Spalten: ${missing.join(", ")}` });
        return;
      }

      // Werte normalisieren
      const record = {
        id: String(r.id).trim(),
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

      // Feld-Validierung
      if (!record.id || isNaN(Number(record.id))) {
        errors.push({ row: rowNum, error: "id fehlt oder ist keine Zahl" });
      }
      if (!record.question) errors.push({ row: rowNum, error: "question fehlt" });
      if (!["A","B","C","D"].includes(record.correct)) {
        errors.push({ row: rowNum, error: "correct muss A/B/C/D sein" });
      }
      if (!["DE","AT","CH"].includes(record.country)) {
        errors.push({ row: rowNum, error: "country muss DE/AT/CH sein" });
      }

      preview.push(record);
    });

    return res.json({
      ok: true,
      file: "data/quiz/quiz_import.xlsx",
      rows_total: rows.length,
      rows_valid_previewed: preview.length,
      errors: errors.slice(0, 50), // begrenzen fürs UI
      note: "Wenn errors leer ist, kannst du /api/admin/quiz-import-run?key=... ausführen."
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
