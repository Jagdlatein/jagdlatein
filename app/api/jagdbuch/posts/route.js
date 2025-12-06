import { supabase } from "../../../../lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();

    const { slug, title, content, excerpt, date, images } = body;

    // Basic Validation
    if (!slug || !title || !content) {
      return new Response(
        JSON.stringify({ error: "slug, title und content sind Pflichtfelder." }),
        { status: 400 }
      );
    }

    // Post speichern
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        slug,
        title,
        content,
        excerpt: excerpt ?? "",
        date: date ?? new Date().toISOString(),
        user_name: "Jäger",
      })
      .select()
      .single();

    if (postError) {
      return new Response(
        JSON.stringify({ error: postError.message }),
        { status: 500 }
      );
    }

    // Bilder speichern (falls vorhanden)
    if (Array.isArray(images) && images.length > 0) {
      const { error: imgError } = await supabase
        .from("images")
        .insert(images.map((url) => ({
          post_id: post.id,
          url,
        })));

      if (imgError) {
        return new Response(
          JSON.stringify({
            error: "Post gespeichert, aber Fehler beim Speichern der Bilder: " + imgError.message
          }),
          { status: 500 }
        );
      }
    }

    return new Response(
      JSON.stringify({ ok: true, id: post.id }),
      { status: 200 }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
