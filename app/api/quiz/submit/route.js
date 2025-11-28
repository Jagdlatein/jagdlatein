export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { username, points } = await req.json();

  if (!username || points === undefined) {
    return Response.json({
      success: false,
      message: "Username oder Punkte fehlen"
    });
  }

  // Aktuellen Score laden
  const { data: existing, error: fetchError } = await supabase
    .from("quiz_scores")
    .select("total_points, rounds")
    .eq("username", username)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("fetch error:", fetchError);
    return Response.json({ success: false, error: fetchError.message });
  }

  // Wenn kein Score existiert → Highscore = Punkte
  if (!existing) {
    await supabase.from("quiz_scores").insert({
      username,
      total_points: points,
      rounds: 1,
      updated_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      highscore: true,
      newScore: points,
      oldScore: 0
    });
  }

  const oldScore = existing.total_points || 0;

  // Highscore nicht geschlagen → NICHT speichern
  if (points <= oldScore) {
    return Response.json({
      success: true,
      highscore: false,
      oldScore,
      newScore: points
    });
  }

  // Highscore verbessert → Speichern
  const { error: updateError } = await supabase
    .from("quiz_scores")
    .update({
      total_points: points,
      rounds: (existing.rounds || 0) + 1,
      updated_at: new Date().toISOString()
    })
    .eq("username", username);

  if (updateError) {
    console.error(updateError);
    return Response.json({ success: false, error: updateError.message });
  }

  return Response.json({
    success: true,
    highscore: true,
    oldScore,
    newScore: points
  });
}
