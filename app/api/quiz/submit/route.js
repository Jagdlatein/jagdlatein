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

  // Country aus quiz_users holen
  const { data: userRow } = await supabase
    .from("quiz_users")
    .select("country")
    .eq("username", username)
    .single();

  const country = userRow?.country || "DE";

  // Existierenden Score holen
  const { data: existing } = await supabase
    .from("quiz_scores")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  const now = new Date().toISOString();

  // Noch kein Score → neu anlegen
  if (!existing) {
    await supabase.from("quiz_scores").insert({
      username,
      country,
      total_points: points,
      rounds: 1,
      updated_at: now
    });

    return Response.json({
      success: true,
      highscore: true,
      oldScore: 0,
      newScore: points
    });
  }

  const oldScore = existing.total_points || 0;

  // Kein neuer Highscore → NICHT überschreiben
  if (points <= oldScore) {
    return Response.json({
      success: true,
      highscore: false,
      oldScore,
      newScore: points
    });
  }

  // Highscore verbessern → speichern
  await supabase
    .from("quiz_scores")
    .update({
      total_points: points,
      rounds: existing.rounds + 1,
      country,          // 🔥 WICHTIG
      updated_at: now
    })
    .eq("username", username);

  return Response.json({
    success: true,
    highscore: true,
    oldScore,
    newScore: points
  });
}
