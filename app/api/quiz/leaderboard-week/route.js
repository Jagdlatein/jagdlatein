export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // -------------------------------
    // Wochenstart (Montag 00:00 UTC)
    // -------------------------------
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

    // -------------------------------
    // Highscores der Woche (pro User)
    // -------------------------------
    const { data, error } = await supabase
      .from("quiz_scores")
      .select("username, country, total_points, rounds, updated_at")
      .gte("updated_at", weekStart);

    if (error) {
      console.error("❌ SUPABASE WEEK ERROR:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return Response.json({ weekStart, data: [] });
    }

    // -------------------------------
    // PRO USER NUR DEN BESTEN SCORE
    // -------------------------------
    const bestPerUser = Object.values(
      data.reduce((acc, row) => {
        if (!acc[row.username] || row.total_points > acc[row.username].total_points) {
          acc[row.username] = row;
        }
        return acc;
      }, {})
    );

    // nach Highscore sortieren
    bestPerUser.sort((a, b) => b.total_points - a.total_points);

    return Response.json({
      weekStart,
      data: bestPerUser
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return Response.json({ error: err.toString() }, { status: 500 });
  }
}
