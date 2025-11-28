export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  // Wochenstart
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const weekStart = monday.toISOString();

  // Scores dieser Woche
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
