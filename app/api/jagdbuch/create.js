import { supabase } from "../../../../lib/supabase";

export async function POST(req) {
  const body = await req.json();

  const { error } = await supabase.from("posts").insert({
    title: body.title,
    slug: body.slug,
    content: body.content,
    excerpt: body.excerpt,
  });

  if (error) return Response.json({ error }, { status: 500 });
  return Response.json({ ok: true });
}
