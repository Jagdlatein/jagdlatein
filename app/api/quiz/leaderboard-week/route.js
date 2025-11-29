import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("quiz_scores")
      .select("*")
      .order("total_points", { ascending: false });

    if (error) {
      console.error("Leaderboard fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Leaderboard exception:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
