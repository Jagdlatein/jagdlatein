import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";
// alternativ: export const revalidate = 0;

// GET -> Liste aller Beiträge
export async function GET() {
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, excerpt, date, likes")
    .order("id", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const fixed = data.map((post) => {
    let iso = null;
    if (post.date) {
      const d = new Date(post.date);
      iso = isNaN(d) ? null : d.toISOString();
    }
    return { ...post, date: iso };
  });

  return new Response(JSON.stringify(fixed), { status: 200 });
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

  let iso = null;
  if (post.date) {
    const d = new Date(post.date);
    iso = isNaN(d) ? null : d.toISOString();
  }

  return new Response(JSON.stringify({ ...post, date: iso }), { status: 200 });
}
