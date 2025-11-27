export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  // 🟩 Wochenstart berechnen (Montag 00:00)
  const now = new Date();
  const day = now.getDay(); // So=0, Mo=1...
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const weekStart = monday.toISOString();

  // 🟩 Nur Scores, die diese Woche aktualisiert wurden
  const { data, error } = await supabase
    .from("quiz_scores")
    .select("username, country, total_points, updated_at")
    .gte("updated_at", weekStart)
    .order("total_points", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ weekStart, data });
}
