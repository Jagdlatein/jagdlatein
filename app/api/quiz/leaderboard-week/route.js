export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Wochenstart berechnen
    const now = new Date();
    const monday = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - ((now.getUTCDay() + 6) % 7)
      )
    );
    monday.setUTCHours(0, 0, 0, 0);

    const weekStart = monday.toISOString();

    // WICHTIG: zuerst ALLE Einträge holen
    const { data, error } = await supabase
      .from("quiz_scores")
      .select("*")
      .gte("updated_at", weekStart);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // PRO USER nur den HÖCHSTEN Score
    const map = {};

    for (const row of data) {
      if (!map[row.username] || row.total_points > map[row.username].total_points) {
        map[row.username] = row;
      }
    }

    const result = Object.values(map)
      .sort((a, b) => b.total_points - a.total_points);

    return Response.json({
      weekStart,
      data: result
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
