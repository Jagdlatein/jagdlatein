import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

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
          excerpt,
          content,
          date: new Date().toISOString(),
          likes: 0,
        },
      ])
      .select(); // KEIN single()

    if (error) {
      console.error("CREATE ERROR:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify(data[0]), { status: 201 });
  } catch (err) {
    console.error("CREATE EXCEPTION:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}
