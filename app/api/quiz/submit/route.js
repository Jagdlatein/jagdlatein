export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: cors(),
  });
}

export async function POST(req) {
  try {
    const { username, points } = await req.json();

    if (!username || points === undefined) {
      return new Response(
        JSON.stringify({ success: false, message: "Username oder Punkte fehlen" }),
        { status: 400, headers: cors() }
      );
    }

    const { data: userRow } = await supabase
      .from("quiz_users")
      .select("country")
      .eq("username", username)
      .maybeSingle();

    const country = userRow?.country || "DE";

    const { data: existing } = await supabase
      .from("quiz_scores")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (!existing) {
      await supabase.from("quiz_scores").insert({
        username,
        country,
        total_points: points,
        rounds: 1,
      });

      return new Response(
        JSON.stringify({
          success: true,
          highscore: true,
          newScore: points,
          oldScore: 0,
        }),
        { status: 200, headers: cors() }
      );
    }

    const oldScore = existing.total_points;

    if (points <= oldScore) {
      return new Response(
        JSON.stringify({
          success: true,
          highscore: false,
          newScore: points,
          oldScore,
        }),
        { status: 200, headers: cors() }
      );
    }

    await supabase
      .from("quiz_scores")
      .update({
        total_points: points,
        rounds: existing.rounds + 1,
        country,
      })
      .eq("username", username);

    return new Response(
      JSON.stringify({
        success: true,
        highscore: true,
        newScore: points,
        oldScore,
      }),
      { status: 200, headers: cors() }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: cors() }
    );
  }
}
