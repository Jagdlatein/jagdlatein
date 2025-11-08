// pages/api/admin/db-push.js
import prisma from "../../../lib/prisma";

// Optional: Vercel Serverless tunen
export const config = { api: { bodyParser: false } };

function unauthorized(res, msg = "Unauthorized") {
  return res.status(401).json({ ok: false, error: msg });
}

/**
 * Diese Route legt die wichtigsten Tabellen per SQL an (idempotent).
 * Aufruf (nur Admin):  GET /api/admin/db-push?key=<ADMIN_PASS>
 * oder Header: Authorization: Bearer <ADMIN_PASS>
 */
export default async function handler(req, res) {
  try {
    const adminPass = process.env.ADMIN_PASS;
    if (!adminPass) return unauthorized(res, "ADMIN_PASS fehlt in Env");

    // Auth: Query ?key=... ODER "Authorization: Bearer ..."
    const qKey = req.query.key;
    const hAuth = req.headers.authorization || "";
    const token = hAuth.startsWith("Bearer ") ? hAuth.slice(7) : null;

    if (qKey !== adminPass && token !== adminPass) {
      return unauthorized(res, "Falscher Admin-Key");
    }

    // --- SQL: Tabellen anlegen (idempotent) ---
    // QuizQuestion
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "QuizQuestion" (
        id SERIAL PRIMARY KEY,
        country TEXT NOT NULL,
        category TEXT NOT NULL,
        topic TEXT NOT NULL,
        question TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct CHAR(1) NOT NULL CHECK (correct IN ('A','B','C','D')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // sinnvolle Indizes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_QuizQuestion_country"  ON "QuizQuestion"(country);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_QuizQuestion_category" ON "QuizQuestion"(category);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_QuizQuestion_topic"    ON "QuizQuestion"(topic);
    `);

    // Glossar (optional, falls du das Modul nutzt)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GlossaryEntry" (
        id SERIAL PRIMARY KEY,
        term TEXT NOT NULL UNIQUE,
        definition TEXT NOT NULL,
        country TEXT,
        category TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Minimal-Check: zähle Tabellenzeilen (kann 0 sein)
    const [{ count }] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM "QuizQuestion";`
    );

    return res.status(200).json({
      ok: true,
      message: "Schema angelegt/aktualisiert",
      tables: ["QuizQuestion", "GlossaryEntry"],
      quizCount: count
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e),
      hint:
        'Prüfe: DATABASE_URL korrekt, Pooler/IPv6 ok, ADMIN_PASS gesetzt. ' +
        'Route: /api/admin/db-push?key=<ADMIN_PASS>'
    });
  }
}
