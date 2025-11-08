// pages/api/admin/db-push.js
import prisma from "../../../lib/prisma";
export const config = { api: { bodyParser: false } };

function unauthorized(res, m="Unauthorized") {
  return res.status(401).json({ ok:false, error:m });
}

/**
 * Aufruf:
 *   GET /api/admin/db-push?key=<ADMIN_PASS>
 *   oder Header: Authorization: Bearer <ADMIN_PASS>
 */
export default async function handler(req, res) {
  try {
    const adminPass = process.env.ADMIN_PASS;
    if (!adminPass) return unauthorized(res, "ADMIN_PASS fehlt");

    const qKey  = req.query.key;
    const auth  = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (qKey !== adminPass && token !== adminPass) {
      return unauthorized(res, "Falscher Admin-Key");
    }

    // Idempotent, vermeidet prepared-statement-Konflikte
    const sql = `
    do $$
    begin
      if not exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'QuizQuestion'
      ) then
        execute $ct$
          create table public."QuizQuestion" (
            id serial primary key,
            country   text not null,
            category  text not null,
            topic     text not null,
            question  text not null,
            option_a  text not null,
            option_b  text not null,
            option_c  text not null,
            option_d  text not null,
            correct   char(1) not null check (correct in ('A','B','C','D')),
            created_at timestamptz not null default now()
          );
        $ct$;
        execute 'create index "idx_QuizQuestion_country"  on public."QuizQuestion"(country)';
        execute 'create index "idx_QuizQuestion_category" on public."QuizQuestion"(category)';
        execute 'create index "idx_QuizQuestion_topic"    on public."QuizQuestion"(topic)';
      end if;
    end$$;
    `;

    await prisma.$executeRawUnsafe(sql);
    const [{ count }] = await prisma.$queryRawUnsafe(
      `select count(*)::int as count from public."QuizQuestion";`
    );

    return res.status(200).json({
      ok: true,
      message: 'Schema vorhanden',
      quizCount: count
    });
  } catch (e) {
    return res.status(500).json({
      ok:false,
      error: String(e?.message||e),
      hint: 'Prüfe DATABASE_URL & ADMIN_PASS. Dann /api/admin/db-push?key=<ADMIN_PASS> aufrufen.'
    });
  }
}
