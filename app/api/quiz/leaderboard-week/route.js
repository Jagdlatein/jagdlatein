export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Wochenstart (Montag 00:00 UTC)
    const now = new Date();
    const day = now.getDay(); // So = 0, Mo = 1
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    const weekStart = monday.toISOString();

    // Nur Spieler, die in dieser Woche einen neuen HIGHscore hatten
    const { data, error } = await supabase
      .from("quiz_scores")
      .select("username, total_points, rounds, updated_at")
      .gte("updated_at", weekStart)
      .order("total_points", { ascending: false });

    if (error) {
      console.error("❌ SUPABASE ERROR:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // total_points -> points (Frontend-Kompatibilität)
    const formatted = (data || []).map(row => ({
      username: row.username,
      points: row.total_points,
      rounds: row.rounds,
      updated_at: row.updated_at,
    }));

    return Response.json({
      weekStart,
      data: formatted
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return Response.json({ error: err.toString() }, { status: 500 });
  }
}
