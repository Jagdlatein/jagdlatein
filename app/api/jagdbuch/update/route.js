import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function PUT(req) {
  const body = await req.json();

  const { slug, title, content } = body;

  if (!slug) {
    return new Response(JSON.stringify({ error: "Slug fehlt" }), {
      status: 400,
    });
  }

  const { data, error } = await supabase
    .from("posts")
    .update({
      title,
      content,
    })
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
}
