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

    const { data, error } = await supabase
      .from("posts")
      .update({
        title,
        content,
        excerpt,
        date: new Date().toISOString(),
      })
      .eq("slug", slug)
      .select()
      .maybeSingle();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify(data || {}), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}
