export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { userId, username, country = "DE", points } = await req.json();

  // 1️⃣ bestehenden Eintrag holen
  const { data: existing } = await supabase
    .from("quiz_scores")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // 2️⃣ neue Werte berechnen
  const newTotal = existing ? (existing.total_points || 0) + points : points;

  const newRounds = existing ? (existing.rounds || 0) + 1 : 1;

  // 3️⃣ upsert speichern
  const { error } = await supabase
    .from("quiz_scores")
    .upsert(
      {
        user_id: userId,
        username: username,
        country,
        total_points: newTotal,
        rounds: newRounds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) return Response.json({ error }, { status: 500 });

  return Response.json({ success: true, total_points: newTotal });
}
