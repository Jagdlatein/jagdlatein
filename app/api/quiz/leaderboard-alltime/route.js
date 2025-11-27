export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  const { data } = await supabase
    .from("quiz_scores")
    .select("username, total_points, rounds")
    .order("total_points", { ascending: false });

  return Response.json(data || []);
}
