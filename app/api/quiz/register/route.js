export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { username, country = "DE" } = await req.json();

  if (!username) {
    return Response.json({ success: false, message: "Username fehlt" });
  }

  // User in quiz_users anlegen
  await supabase.from("quiz_users").upsert({
    username,
    country,
    created_at: new Date().toISOString()
  });

  // Score anlegen falls noch nicht existiert
  await supabase.from("quiz_scores").upsert({
    username,
    total_points: 0,
    rounds: 0,
    updated_at: new Date().toISOString()
  });

  return Response.json({ success: true });
}
