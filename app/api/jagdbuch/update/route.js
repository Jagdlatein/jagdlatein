import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function PUT(req) {
  const { slug, title, content } = await req.json();

  const { data, error } = await supabase
    .from("posts")
    .update({ title, content })
    .eq("slug", slug)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data, { status: 200 });
}
