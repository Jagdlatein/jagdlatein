export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Teilnahme ab 800 Punkten
const MIN_POINTS = 800;

export async function POST(req) {
  const { userId, username, points } = await req.json();

  const month = new Date().toISOString().substring(0, 7);

  if (points < MIN_POINTS) {
    return NextResponse.json({ eligible: false });
  }

  const { error } = await supabase
    .from("quiz_raffle")
    .insert({ user_id: userId, username, points, month });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ eligible: true });
}
