export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Wichtig: richtige Tabelle + Username auswählen!
  const { data, error } = await supabase
    .from("quiz_scores")
    .select("user_id, username, points, created_at")
    .order("points", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Leaderboard Fehler:", error);
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ data });
}
