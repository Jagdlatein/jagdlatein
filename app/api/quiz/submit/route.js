export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { username, points } = await req.json();

  // Bestehenden Score laden
  const { data: existing } = await supabase
    .from("quiz_scores")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  const newTotal = existing ? (existing.total_points || 0) + points : points;
  const newRounds = existing ? (existing.rounds || 0) + 1 : 1;

  // Score upserten – updated_at MUSS gesetzt werden
  await supabase
    .from("quiz_scores")
    .upsert(
      {
        username,
        country: existing?.country || "DE",
        total_points: newTotal,
        rounds: newRounds,
        updated_at: new Date().toISOString()  // ⭐ WICHTIG
      },
      { onConflict: "username" }
    );

  // Jede Runde einzeln speichern
  await supabase.from("quiz_results").insert({
    username,
    points,
    created_at: new Date().toISOString()
  });

  return Response.json({
    success: true,
    total_points: newTotal,
    rounds: newRounds
  });
}
