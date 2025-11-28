export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { username, points } = await req.json();

    if (!username || points === undefined) {
      return Response.json(
        { success: false, message: "Username oder Punkte fehlen" },
        { status: 400 }
      );
    }

    // Country des Users laden
    const { data: userRow } = await supabase
      .from("quiz_users")
      .select("country")
      .eq("username", username)
      .maybeSingle();

    const country = userRow?.country || "DE";

    // existierenden Score holen
    const { data: existing } = await supabase
      .from("quiz_scores")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    const now = new Date().toISOString();

    if (!existing) {
      await supabase.from("quiz_scores").insert({
        username,
        country,
        total_points: points,
        rounds: 1,
        updated_at: now,
      });

      return Response.json({
        success: true,
        highscore: true,
        newScore: points,
        oldScore: 0,
      });
    }

    const oldScore = existing.total_points;

    // kein Highscore → nichts tun
    if (points <= oldScore) {
      return Response.json({
        success: true,
        highscore: false,
        newScore: points,
        oldScore,
      });
    }

    // Highscore verbessern
    await supabase
      .from("quiz_scores")
      .update({
        total_points: points,
        rounds: existing.rounds + 1,
        country,
        updated_at: now,
      })
      .eq("username", username);

    return Response.json({
      success: true,
      highscore: true,
      newScore: points,
      oldScore,
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message });
  }
}
