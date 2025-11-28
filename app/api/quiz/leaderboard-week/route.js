export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Lokales Datum auf CH/DE Woche rechnen
    const d = new Date();

    // 0 = Sonntag → wir wollen Montag (1)
    const day = (d.getDay() + 6) % 7;

    // Montag bestimmen
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    monday.setHours(0, 0, 0, 0); // lokales 00:00

    // In UTC umwandeln
    const weekStart = new Date(
      Date.UTC(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate(),
        0, 0, 0, 0
      )
    ).toISOString();

    // Scores ab Wochenbeginn
    const { data, error } = await supabase
      .from("quiz_scores")
      .select("username, country, total_points, rounds, updated_at")
      .gte("updated_at", weekStart)
      .order("total_points", { ascending: false });

    if (error) throw error;

    return Response.json({
      weekStart,
      pointsColumn: "total_points",
      data: data || [],
    });

  } catch (err) {
    console.error("❌ WEEK API ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
