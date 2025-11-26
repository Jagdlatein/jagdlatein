import { createClient } from "@supabase/supabase-js";

export async function GET(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("u");

  if (!username) {
    return Response.json({ error: "missing user" }, { status: 400 });
  }

  // Hole Score-Daten
  const { data, error } = await supabase
    .from("quiz_scores")
    .select("*")
    .eq("username", username)
    .single();

  if (!data || error) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  // Statistiken berechnen
  const stats = {
    total_points: data.total_points || 0,
    rounds: data.rounds || 0,
    avgScore:
      data.rounds && data.rounds > 0
        ? Math.round(data.total_points / data.rounds)
        : 0,
    hitRate: data.hit_rate ? Math.round(data.hit_rate) : 0,
    bestTopic: data.best_topic || "Allgemein",
  };

  return Response.json(stats);
}
