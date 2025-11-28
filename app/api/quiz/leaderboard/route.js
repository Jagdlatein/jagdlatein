export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Supabase ENV fehlt!");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Daten aus Supabase holen
    const { data, error } = await supabase
      .from("quiz_scores")
      .select("username, country, total_points, rounds, updated_at")
      .order("total_points", { ascending: false });

    if (error) {
      console.error("❌ Supabase-Fehler:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data });
  } catch (err) {
    console.error("❌ API Fehler:", err);
    return Response.json({ error: err.toString() }, { status: 500 });
  }
}
