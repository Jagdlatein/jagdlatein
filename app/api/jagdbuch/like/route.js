import { supabase } from "../../../../lib/supabase";

export async function POST(req) {
  const { id } = await req.json();

  const { error } = await supabase.rpc("increment_likes", { post_id: id });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
