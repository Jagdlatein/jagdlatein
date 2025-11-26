import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const firstDay = new Date();
  firstDay.setDate(1);

  const { data } = await supabase
    .from("quiz_scores")
    .select("username, total_points, created_at")
    .gte("created_at", firstDay.toISOString())
    .order("total_points", { ascending: false });

  return Response.json({ data });
}
