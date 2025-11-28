export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // 🔥 Woche nach lokaler CH-Zeit berechnen
    const now = new Date();

    // CH/DE Woche beginnt Montag
    const day = now.getDay(); // Sonntag=0
    const diff = (day === 0 ? -6 : 1 - day); // Montag=1

    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const weekStart = monday.toISOString();

    // 🔥 Korrekte Punktespalte automatisch erkennen
    const { data: columns } = await supabase
      .from("quiz_scores")
      .select("*")
      .limit(1);

    const row = columns?.[0] || {};

    const pointsColumn =
      "total_points" in row
        ? "total_points"
        : "points" in row
        ? "points"
        : "score" in row
        ? "score"
        : null;

    if (!pointsColumn) {
      return Response.json(
        { error: "Keine Punkte-Spalte gefunden!" },
        { status: 500 }
      );
    }

    // 🔥 Week-Data laden
    const { data, error } = await supabase
      .from("quiz_scores")
      .select(`username, country, ${pointsColumn}, rounds, updated_at`)
      .gte("updated_at", weekStart)
      .order(pointsColumn, { ascending: false });

    if (error) {
      console.error(error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      weekStart,
      pointsColumn,
      data: data || [],
    });

  } catch (err) {
    console.error(err);
    return Response.json({ error: err.toString() }, { status: 500 });
  }
}
