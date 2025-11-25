export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Highscore pro Username
  const { data, error } = await supabase
    .from("quiz_scores")
    .select(`
      username,
      max(points)
    `)
    .group("username")
    .order("max", { ascending: false }); // sortiere nach Highscore

  if (error) {
    console.error("Leaderboard Fehler:", error);
    return NextResponse.json({ error }, { status: 400 });
  }

  return new NextResponse(JSON.stringify({ data }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
    }
  });
}
