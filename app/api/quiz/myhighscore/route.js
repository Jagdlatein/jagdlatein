import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

const supabase = createClient(
  process.env.SUPABASE_URL,              // FIX 1
  process.env.SUPABASE_SERVICE_ROLE_KEY  // FIX 2
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "username missing" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("quiz_scores")
      .select("*")
      .eq("username", username)
      .single();

    if (error) {
      console.error("myhighscore error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("myhighscore exception:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
