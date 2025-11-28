export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const now = new Date();

    // Montag 00:00 UTC berechnen
    const monday = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - ((now.getUTCDay() + 6) % 7)
      )
    );
    monday.setUTCHours(0, 0, 0, 0);

    const weekStart = monday.toISOString();

    // DEBUG: Welchen Wert liest Next.js?
    console.log("DEBUG weekStart:", weekStart);

    const { data, error } = await supabase
      .from("quiz_scores")
      .select("username, country, total_points, rounds, updated_at")
      .gte("updated_at", weekStart)
      .order("total_points", { ascending: false });

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      weekStart,
      data
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
