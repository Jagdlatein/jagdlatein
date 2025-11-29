export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // 🔥 Wochengrenze direkt in SQL berechnen (kein JS!)
    const { data: rows, error } = await supabase.rpc("get_week_scores");

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // 🔥 Scores pro User gruppieren + sortieren
    const map = {};
    for (const row of rows) {
      if (!map[row.username] || row.total_points > map[row.username].total_points) {
        map[row.username] = row;
      }
    }

    const result = Object.values(map).sort(
      (a, b) => b.total_points - a.total_points
    );

    return Response.json({ data: result });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
