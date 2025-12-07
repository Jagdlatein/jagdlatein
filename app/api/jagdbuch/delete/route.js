import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function DELETE(req) {
  const { slug } = await req.json();

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("slug", slug);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true }, { status: 200 });
}
