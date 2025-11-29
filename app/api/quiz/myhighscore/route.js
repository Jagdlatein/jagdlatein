export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    const username = req.nextUrl.searchParams.get("username");

    if (!username) {
      return Response.json({ error: "Username fehlt" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("quiz_scores")
      .select("total_points, rounds, updated_at")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return Response.json({
        username,
        points: 0,
        rounds: 0,
        updated_at: null
      });
    }

    return Response.json({
      username,
      points: data.total_points,
      rounds: data.rounds,
      updated_at: data.updated_at
    });

  } catch (err) {
    console.error("myhighscore error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
