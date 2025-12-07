import { supabase } from "@/lib/supabaseClient";

export async function GET(req, { params }) {
  const { slug } = params;

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });

  return Response.json(data);
}
