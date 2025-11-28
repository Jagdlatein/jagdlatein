export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Wochenstart berechnen (Montag 00:00)
    const now = new Date();
    const day = now.getDay(); // So=0, Mo=1...
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    const weekStart = monday.toISOString();

    // ALLE quiz_results dieser Woche holen (nicht quiz_scores!)
    const { data: results, error } = await supabase
      .from("quiz_results")
      .select("username, points, created_at")
      .gte("created_at", weekStart);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Punkte pro User summieren
    const totals = {};
    results.forEach((r) => {
      if (!totals[r.username]) totals[r.username] = 0;
      totals[r.username] += r.points;
    });

    // User-Daten aus quiz_scores anhängen (country etc.)
    const usernames = Object.keys(totals);

    let userInfo = [];
    if (usernames.length > 0) {
      const { data: info } = await supabase
        .from("quiz_scores")
        .select("username, country")
        .in("username", usernames);

      userInfo = info || [];
    }

    // Liste zusammenbauen
    const finalList = usernames
      .map((u) => {
        const info = userInfo.find((x) => x.username === u);
        return {
          username: u,
          total_points: totals[u],
          country: info?.country || "DE",
        };
      })
      .sort((a, b) => b.total_points - a.total_points);

    return Response.json({ weekStart, data: finalList });
  } catch (err) {
    return Response.json({ error: err.toString() }, { status: 500 });
  }
}
