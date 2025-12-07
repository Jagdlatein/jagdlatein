import { supabase } from "../../../../../lib/supabase";

export async function POST(req) {
  console.log("POST /api/posts/create HIT");

  let body;
  try {
    body = await req.json();
  } catch (err) {
    console.error("❌ INVALID JSON", err);
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400 });
  }

  const { slug, title, content, excerpt, date, images } = body;
  console.log("📥 BODY RECEIVED:", body);

  // Validation
  if (!slug || !title || !content) {
    console.error("❌ MISSING FIELDS");
    return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400 });
  }

  // Insert post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      slug,
      title,
      content,
      excerpt: excerpt ?? "",
      date: date ?? new Date().toISOString(),
      user_name: "Jäger"
    })
    .select()
    .single();

  console.log("📝 POST INSERT RESULT:", post, postError);

  if (postError) {
    console.error("❌ POST ERROR", postError);
    return new Response(JSON.stringify({ error: postError.message }), { status: 500 });
  }

  // Save images
  if (Array.isArray(images) && images.length > 0) {
    const { error: imgError } = await supabase
      .from("images")
      .insert(images.map((url) => ({ post_id: post.id, url })));

    if (imgError) {
      console.error("❌ IMAGE ERROR", imgError);
      return new Response(JSON.stringify({ error: imgError.message }), { status: 500 });
    }
  }

  console.log("✅ POST SAVED SUCCESSFULLY:", post.id);

  return new Response(
    JSON.stringify({ ok: true, id: post.id }),
    { status: 200 }
  );
}
