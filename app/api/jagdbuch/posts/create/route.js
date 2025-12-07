import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req) {
  try {
    const body = await req.json();

    const { title, slug, excerpt, content, date } = body;

    if (!title || !slug) {
      return new Response(
        JSON.stringify({ error: "Title und Slug sind Pflichtfelder" }),
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
          date: date
            ? new Date(date).toISOString()
            : new Date().toISOString(), // immer gültiges Datum
          likes: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase INSERT ERROR:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify(data), { status: 201 });
  } catch (err) {
    console.error("Route ERROR:", err);
    return new Response(
      JSON.stringify({ error: "Ungültige Anfrage" }),
      { status: 400 }
    );
  }
}
