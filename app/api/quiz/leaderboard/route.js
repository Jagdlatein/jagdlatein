import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  const { data, error } = await supabase
    .from("quiz_scores")
    .select("user_id, username, points");

  if (error) return NextResponse.json({ data: [] });

  const map = new Map();

  for (const row of data) {
    const key = row.user_id;
    const prev = map.get(key) || {
      username: row.username,
      user_id: row.user_id,
      total_points: 0,
      rounds: 0,
    };

    prev.total_points += row.points;
    prev.rounds += 1;

    map.set(key, prev);
  }

  const sorted = Array.from(map.values()).sort(
    (a, b) => b.total_points - a.total_points
  );

  return NextResponse.json({ data: sorted });
}
