import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function PUT(req) {
  try {
    const body = await req.json();
    const { slug, title, content, excerpt } = body;

    if (!slug) {
      return new Response(JSON.stringify({ error: "Slug fehlt" }), {
        status: 400,
      });
    }

    const updates = {};
    if (typeof title === "string") updates.title = title;
    if (typeof content === "string") updates.content = content;
    if (typeof excerpt === "string") updates.excerpt = excerpt;
    updates.date = new Date().toISOString();

    const { data, error } = await supabase
      .from("posts")
      .update(updates)
      .eq("slug", slug)
      .select()
      .single();

    if (error) {
      console.error("UPDATE ERROR:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    console.error("UPDATE EXCEPTION:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}
