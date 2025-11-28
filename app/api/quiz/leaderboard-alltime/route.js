export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("quiz_scores")
      .select("username, total_points, rounds, updated_at")
      .order("total_points", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // total_points → points (für Frontend)
    const formatted = data.map((row) => ({
      username: row.username,
      points: row.total_points,
      rounds: row.rounds,
      updated_at: row.updated_at
    }));

    return Response.json(formatted);

  } catch (err) {
    console.error("Leaderboard error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
