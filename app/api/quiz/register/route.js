export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { username, country = "DE" } = await req.json();

  // 1️⃣ quiz_users upsert
  await supabase
    .from("quiz_users")
    .upsert(
      {
        username,
        country
      },
      { onConflict: "username" }
    );

  // 2️⃣ quiz_scores upsert
  await supabase
    .from("quiz_scores")
    .upsert(
      {
        username,
        total_points: 0,
        rounds: 0
      },
      { onConflict: "username" }
    );

  return Response.json({ success: true });
}
