export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("quiz_results")
    .select("username, points")
    .gte("created_at", monday.toISOString());

  const map = {};
  data.forEach((row) => {
    if (!map[row.username] || row.points > map[row.username]) {
      map[row.username] = row.points;
    }
  });

  const result = Object.entries(map)
    .map(([username, points]) => ({ username, points }))
    .sort((a, b) => b.points - a.points);

  return Response.json(result);
}
