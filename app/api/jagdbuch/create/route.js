import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req) {
  try {
    const body = await req.json();

    const { title, slug, excerpt, content } = body;

    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          title,
          slug,
          excerpt: excerpt || "",
          content: content || "",
          date: new Date().toISOString(),   // ⭐ WICHTIG: schreibt Datum
          likes: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
