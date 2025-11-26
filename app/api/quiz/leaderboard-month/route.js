export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  const firstDay = new Date();
  firstDay.setDate(1);

  const { data, error } = await supabase
    .from("quiz_scores")
    .select("username, total_points, created_at")
    .gte("created_at", firstDay.toISOString())
    .order("total_points", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data });
}
