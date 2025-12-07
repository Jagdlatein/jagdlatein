import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function PUT(req) {
  const body = await req.json();
  const { slug, title, content } = body;

  const { data, error } = await supabase
    .from("posts")
    .update({
      title,
      content,
      date: new Date().toISOString(),
    })
    .eq("slug", slug)
    .select()
    .single();

  if (error) {
    console.error("UPDATE ERROR:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), { status: 200 });
}
