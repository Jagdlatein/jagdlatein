import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { slug } = params;

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("GET POST ERROR:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 404 });
  }

  return new Response(JSON.stringify(data), { status: 200 });
}
