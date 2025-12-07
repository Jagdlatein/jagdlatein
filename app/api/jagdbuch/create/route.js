import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("BODY:", body); // Debug

    const { title, slug, excerpt, content } = body;

    if (!title || !slug) {
      return new Response(
        JSON.stringify({ error: "Title und Slug erforderlich" }),
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          title,
          slug,
          excerpt: excerpt || "",
          content: content || "",
          date: new Date().toISOString(),
          likes: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase INSERT ERROR:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 201 });
  } catch (e) {
    console.error("CREATE ROUTE ERROR:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
}
