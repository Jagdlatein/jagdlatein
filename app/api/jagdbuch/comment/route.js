import { supabase } from "../../../../lib/supabase";

export async function POST(req) {
  const { post_id, text } = await req.json();

  const { error } = await supabase.from("comments").insert({
    post_id,
    text,
    user_name: "Jäger"
  });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
