import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const { title, slug, excerpt, content } = await req.json();

  const { data, error } = await supabase
    .from("posts")
    .insert([
      {
        title,
        slug,
        excerpt,
        content,
        date: new Date().toISOString(),
        likes: 0,
      }
    ])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data, { status: 201 });
}
