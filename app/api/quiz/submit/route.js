import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  const body = await req.json();
  const { userId, username, points } = body;

  const { error } = await supabase.from("quiz_scores").insert({
    user_id: userId,
    username,
    points,
  });

  if (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error });
  }

  return NextResponse.json({ ok: true });
}
