export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // 🔥 SERVERZEIT DIREKT AUS SUPABASE LADEN (korrekt!)
    const { data: serverTimeData, error: timeError } = await supabase.rpc("get_server_time");

    if (timeError) {
      return Response.json({ error: "Time fetch error: " + timeError.message }, { status: 500 });
    }

    const serverTime = new Date(serverTimeData);

    // 🔥 MONTAG 00:00 UTC BERECHNEN (besteht IMMER korrekt)
    const monday = new Date(serverTime);
    monday.setUTCDate(serverTime.getUTCDate() - ((serverTime.getUTCDay() + 6) % 7));
    monday.setUTCHours(0, 0, 0, 0);

    const weekStart = monday.toISOString();

    // 🔥 ALLE SCORES DIESER WOCHE LADEN
    const { data, error } = await supabase
      .from("quiz_scores")
      .select("*")
      .gte("updated_at", weekStart);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // 🔥 PRO USER NUR DEN BESTEN SCORE
    const map = {};
    for (const row of data) {
      if (!map[row.username] || row.total_points > map[row.username].total_points) {
        map[row.username] = row;
      }
    }

    const result = Object.values(map).sort(
      (a, b) => b.total_points - a.total_points
    );

    return Response.json({ weekStart, data: result });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
