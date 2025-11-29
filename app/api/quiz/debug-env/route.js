export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data } = await supabase
      .from("quiz_scores")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(5);

    return Response.json({
      supabase_url: process.env.SUPABASE_URL,
      latest_rows: data,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
