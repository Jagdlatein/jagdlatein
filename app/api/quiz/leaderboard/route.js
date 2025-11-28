export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("quiz_scores")
      .select("username, country, total_points, rounds, updated_at")
      .order("total_points", { ascending: false });

    if (error) {
      console.error("❌ SUPABASE ERROR:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data });
  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return Response.json({ error: err.toString() }, { status: 500 });
  }
}
