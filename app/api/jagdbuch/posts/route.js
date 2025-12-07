import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const fixed = data.map((post) => {
    const d = new Date(post.date);
    return {
      ...post,
      date: isNaN(d) ? null : d.toISOString(),
    };
  });

  return new Response(JSON.stringify(fixed), { status: 200 });
}
