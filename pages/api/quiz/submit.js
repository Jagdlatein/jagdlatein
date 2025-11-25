import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const body = req.body;

  const { error } = await supabase.from("quiz_scores").insert({
    user_id: body.userId,
    username: body.username,
    points: body.points,
  });

  if (error) {
    return res.status(400).json({ error });
  }

  return res.status(200).json({ ok: true });
}
