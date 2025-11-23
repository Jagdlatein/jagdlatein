// pages/api/quiz/leaderboard.js

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase
    .from("quiz_leaderboard")
    .select("*")
    .order("total_points", { ascending: false })
    .limit(50);

  if (error) return res.status(400).json({ error });

  res.status(200).json({ data });
}
