// pages/api/quiz/submit.js

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { userId, username, points } = req.body;

  const { error } = await supabase.from("quiz_scores").insert({
    user_id: userId,
    username,
    points,
  });

  if (error) {
    console.error(error);
    return res.status(400).json({ error });
  }

  res.status(200).json({ ok: true });
}
