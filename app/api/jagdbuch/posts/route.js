import { supabase } from "@/lib/supabase";


export async function POST(req) {
  console.log("POST /api/posts -> START");

  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      console.log("INVALID JSON BODY");
      return new Response(JSON.stringify({ error: "Ungültiger JSON Body" }), { status: 400 });
    }

    const { slug, title, content, excerpt, date, images } = body;

    // Validation
    if (!slug || !title || !content) {
      console.log("VALIDATION FAILED");
      return new Response(JSON.stringify({ error: "Pflichtfelder fehlen" }), { status: 400 });
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

    console.log("POST INSERT RESULT:", post, postError);

    if (postError) {
      return new Response(JSON.stringify({ error: postError.message }), { status: 500 });
    }

    // Bilder speichern
    if (images?.length) {
      const { error: imgError } = await supabase
        .from("images")
        .insert(images.map((url) => ({
          post_id: post.id,
          url,
        })));

      console.log("IMAGE INSERT ERROR:", imgError);

      if (imgError) {
        return new Response(
          JSON.stringify({ error: "Bild-Fehler: " + imgError.message }),
          { status: 500 }
        );
      }
    }

    console.log("POST /api/posts -> SUCCESS");

    return new Response(JSON.stringify({ ok: true, id: post.id }), { status: 200 });

  } catch (err) {
    console.log("SERVER ERROR:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
