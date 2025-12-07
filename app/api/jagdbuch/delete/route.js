import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function DELETE(req) {
  const { slug } = await req.json();

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("slug", slug);

  if (error) {
    console.error("DELETE ERROR:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
