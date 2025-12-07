import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function DELETE(req) {
  try {
    const { slug } = await req.json();

    if (!slug) {
      return new Response(JSON.stringify({ error: "Slug fehlt" }), {
        status: 400,
      });
    }

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("slug", slug);

    if (error) {
      console.error("DELETE ERROR:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("DELETE EXCEPTION:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}
