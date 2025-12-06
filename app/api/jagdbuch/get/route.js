import { supabase } from "../../../../lib/supabase";

// GET -> Liste aller Beiträge
export async function GET() {
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, excerpt, date, likes")
    .order("id", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), { status: 200 });
}

// POST -> Einzelnen Beitrag nach Slug abrufen
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
