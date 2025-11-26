import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const body = await req.json();

  const { userId, username, country, points } = body;

  // Score in DB schreiben
  const { error } = await supabase.from("quiz_scores").insert({
    user_id: userId,
    username,
    country: country || "DE",
    total_points: points,   // ← WICHTIG! total_points statt points
    points: points,         // optional, wenn du altes Feld behalten willst
  });

  if (error) {
    console.error("Fehler beim Speichern:", error);
    return Response.json({ success: false, error });
  }

  return Response.json({ success: true });
}
