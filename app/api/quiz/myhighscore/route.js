export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  const username = req.nextUrl.searchParams.get("u");

  const { data } = await supabase
    .from("quiz_scores")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  return Response.json(data || {});
}
