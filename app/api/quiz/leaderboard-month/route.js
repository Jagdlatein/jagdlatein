import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  const month = new Date().toISOString().substring(0, 7); // yyyy-mm
  const first = `${month}-01`;

  const { data, error } = await supabase
    .from("quiz_scores")
    .select("user_id, username, points, created_at");

  if (error) return NextResponse.json({ data: [] });

  const filtered = data.filter((r) =>
    r.created_at.startsWith(month)
  );

  const map = new Map();

  for (const row of filtered) {
    const key = row.user_id;
    const prev = map.get(key) || {
      username: row.username,
      user_id: row.user_id,
      total_points: 0,
    };
    prev.total_points += row.points;
    map.set(key, prev);
  }

  const sorted = Array.from(map.values()).sort(
    (a, b) => b.total_points - a.total_points
  );

  return NextResponse.json({ data: sorted });
}
