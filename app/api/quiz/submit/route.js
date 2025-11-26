import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const body = await req.json();

  const { userId, username, country, points } = body;

  // 🟢 WICHTIG: Nur total_points speichern
  const { error } = await supabase.from("quiz_scores").insert({
    user_id: userId,
    username: username,
    country: country || "DE",
    total_points: points,   // ← einzig richtige Spalte
  });

  if (error) {
    console.error("Fehler beim Speichern:", error);
    return Response.json({ success: false, error });
  }

  return Response.json({ success: true });
}
