import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic"; // kein Cache
export const revalidate = 0;

// GET → alle Beiträge
export async function GET() {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Datum reparieren
  const fixed = data.map((post) => {
    let iso = null;

    if (post.date) {
      const d = new Date(post.date);
      iso = isNaN(d) ? null : d.toISOString();
    }

    return {
      ...post,
      date: iso,
    };
  });

  return new Response(JSON.stringify(fixed), { status: 200 });
}

// POST → neuen Beitrag speichern
export async function POST(req) {
  const body = await req.json();

  const { title, slug, excerpt, content, date } = body;

  const { data, error } = await supabase
    .from("posts")
    .insert([
      {
        title,
        slug,
        excerpt,
        content,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        likes: 0,
      },
    ])
    .select();

  if (error) {
    console.error("Supabase INSERT ERROR:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data[0]), { status: 201 });
}
