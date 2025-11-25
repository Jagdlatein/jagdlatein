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

  // Immer live laden – kein Cache, kein Delay
  const { data, error } = await supabase
    .from("quiz_scores")
    .select("user_id, username, points, created_at")
    .order("points", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Leaderboard Fehler:", error);
    return NextResponse.json({ error }, { status: 400 });
  }

  return new NextResponse(JSON.stringify({ data }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0, private",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
      "Pragma": "no-cache",
      "Expires": "0",
    }
  });
}
