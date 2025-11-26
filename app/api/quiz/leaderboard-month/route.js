import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // WICHTIG!

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .gte("created_at", firstDay)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) return Response.json({ error }, { status: 500 });

  return Response.json(data, { status: 200 });
}
