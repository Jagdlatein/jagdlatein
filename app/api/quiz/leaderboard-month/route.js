export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data, error } = await supabase
    .from("quiz_leaderboard_monthly")
    .select("*")
    .gte("month", monthStart)
    .order("total_points", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ data });
}
