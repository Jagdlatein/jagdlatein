// pages/api/admin/quiz-import-run.js
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
import  prisma  from "../../../lib/prisma";

const ADMIN_PASS = process.env.ADMIN_PASS;

function mapRow(r) {
  // Erwartete Spalten: id,country,category,topic,question,option_a,option_b,option_c,option_d,correct
  const id = String(r.id ?? "").trim();
  const country = String(r.country ?? "").trim();
  const category = String(r.category ?? "").trim();
  const topic = String(r.topic ?? "").trim();
  const question = String(r.question ?? "").trim();
  const option_a = String(r.option_a ?? "").trim();
  const option_b = String(r.option_b ?? "").trim();
  const option_c = String(r.option_c ?? "").trim();
  const option_d = String(r.option_d ?? "").trim();
  const correct = String(r.correct ?? "").trim().toUpperCase();

  if (!id || !question) return null;
  if (!["A","B","C","D"].includes(correct)) return null;

  return {
    id,
    country,
    category,
    topic,
    question,
    optionA: option_a,
    optionB: option_b,
    optionC: option_c,
    optionD: option_d,
    correct, // A/B/C/D
    // timestamps: Prisma füllt default/trigger oder wir setzen hier mit:
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }
    const key = String(req.query.key || "");
    if (!ADMIN_PASS || key !== ADMIN_PASS) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    // Pfad zur zuletzt committeten Datei (gleicher wie im Upload-Endpoint):
    const fileRel = "data/quiz/quiz_import.xlsx";
    const fileAbs = path.join(process.cwd(), fileRel);
    if (!fs.existsSync(fileAbs)) {
      return res.status(404).json({ ok: false, error: `File not found: ${fileRel}` });
    }

    // XLSX einlesen
    const wb = XLSX.read(fs.readFileSync(fileAbs));
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    // Mappen & validieren
    const prepared = [];
    for (const r of rows) {
      const m = mapRow(r);
      if (m) prepared.push(m);
    }

    if (prepared.length === 0) {
      return res.status(400).json({ ok: false, error: "Kein valider Datensatz gefunden." });
    }

    // Optional: Tabelle kurz anlegen/angleichen (nur id/timestamps falls fehlen)
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='QuizQuestion' AND column_name='createdAt'
        ) THEN
          ALTER TABLE public."QuizQuestion"
          ADD COLUMN "createdAt" timestamptz DEFAULT now(),
          ADD COLUMN "updatedAt" timestamptz DEFAULT now();
        END IF;
      END $$;
    `);

    // Batch-Insert (createMany) – drosseln in Chunks
    const chunkSize = 100;
    let inserted = 0;

    for (let i = 0; i < prepared.length; i += chunkSize) {
      const chunk = prepared.slice(i, i + chunkSize);
      // Prisma: TEXT-Spalten in Schema sicherstellen (id TEXT primary key etc.)
      const result = await prisma.quizQuestion.createMany({
        data: chunk,
        skipDuplicates: true, // macht ON CONFLICT DO NOTHING (über PK id)
      });
      inserted += result.count;
    }

    return res.status(200).json({
      ok: true,
      file: fileRel,
      total_rows: rows.length,
      valid_rows: prepared.length,
      inserted, // neu eingefügte (Duplikate werden geskippt)
      note: "Falls 'inserted' kleiner als 'valid_rows' ist, gab es bereits bestehende IDs (skipDuplicates).",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
