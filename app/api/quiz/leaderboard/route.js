import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
    db: { schema: "public" },
  }
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("quiz_scores")
      .select("username, total_points as points, rounds, updated_at")
      .order("points", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Leaderboard API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
