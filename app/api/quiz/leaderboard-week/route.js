export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  // 🟩 Start der Woche (Montag 00:00)
  const now = new Date();
  const day = now.getDay(); // So=0, Mo=1...
  
  // Montag berechnen
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - ((day + 6) % 7)); // Mo=0 Korrektur

  const weekStart = monday.toISOString();

  // 🟩 quiz_results filtern
  const { data, error } = await supabase
    .from("quiz_results")
    .select("username, points, created_at")
    .gte("created_at", weekStart);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // 🟩 Punkte pro Spieler summieren
  const map = {};
  data.forEach((r) => {
    if (!map[r.username]) map[r.username] = 0;
    map[r.username] += r.points;
  });

  // 🟩 Ranking erzeugen
  const ranking = Object.entries(map)
    .map(([username, total]) => ({ username, total_points: total }))
    .sort((a, b) => b.total_points - a.total_points);

  return Response.json({ weekStart, data: ranking });
}
