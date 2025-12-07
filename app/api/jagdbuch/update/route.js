import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function PUT(req) {
  try {
    const body = await req.json();
    const { slug, title, content, excerpt } = body;

    const updates = {
      title,
      content,
      excerpt,
      date: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("posts")
      .update(updates)
      .eq("slug", slug)
      .select();

    if (error) {
      console.error("UPDATE ERROR:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify(data?.[0] || {}), { status: 200 });
  } catch (err) {
    console.error("UPDATE ROUTE EXCEPTION:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}
