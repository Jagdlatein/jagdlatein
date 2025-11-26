import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const body = await req.json();
  const { username, country } = body;

  const { error } = await supabase.from("quiz_scores").upsert(
    {
      user_id: username,
      username,
      country,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return Response.json({ error }, { status: 500 });

  return Response.json({ success: true });
}
