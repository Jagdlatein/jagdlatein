import { supabase } from "@/lib/supabaseClient";

export async function PUT(req) {
  const body = await req.json();
  const { slug, title, content } = body;

  const { data, error } = await supabase
    .from("posts")
    .update({ title, content })
    .eq("slug", slug)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}
