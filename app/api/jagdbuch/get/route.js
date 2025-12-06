import { supabase } from "../../../../lib/supabase";

export async function POST(req) {
  const { slug } = await req.json();

  const { data: post, error } = await supabase
    .from("posts")
    .select("*, images(url), comments(id, user_name, text, created_at)")
    .eq("slug", slug)
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 404 });
  }

  return new Response(JSON.stringify(post), { status: 200 });
}
