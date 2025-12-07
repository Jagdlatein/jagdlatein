import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("id", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data, { status: 200 });
}
