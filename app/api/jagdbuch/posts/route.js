import { supabase } from "../../../../lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();

    const { slug, title, content, excerpt, date } = body;

    const { error } = await supabase
      .from("posts")
      .insert({
        slug,
        title,
        content,
        excerpt,
        date,
        user_name: "Jäger"
      });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
