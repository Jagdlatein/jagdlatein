import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { slug } = params;

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle(); // kein single()-Fehler mehr

  if (error || !data) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  }

  return new Response(JSON.stringify(data), { status: 200 });
}
