export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { username, points } = await req.json();

  // 1️⃣ Bestehenden Score laden
  const { data: existing } = await supabase
    .from("quiz_scores")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  const newTotal = existing ? (existing.total_points || 0) + points : points;
  const newRounds = existing ? (existing.rounds || 0) + 1 : 1;

  // 2️⃣ Score upserten – WICHTIG mit onConflict!
  await supabase
    .from("quiz_scores")
    .upsert(
      {
        username,
        total_points: newTotal,
        rounds: newRounds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "username" }
    );

  // 3️⃣ Jede Runde einzeln speichern
  await supabase.from("quiz_results").insert({
    username,
    points
  });

  return Response.json({
    success: true,
    total_points: newTotal,
    rounds: newRounds
  });
}
