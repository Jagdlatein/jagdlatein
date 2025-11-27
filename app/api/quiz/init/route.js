export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { email } = await req.json();
  const mail = email.toLowerCase().trim();

  // Hole Userprofil (E-Mail eindeutig)
  const { data: profile } = await supabase
    .from("userprofile")
    .select("id, username, country")
    .ilike("email", mail)
    .maybeSingle();

  if (!profile) {
    return Response.json({ success: false, message: "Kein Profil gefunden." });
  }

  // Spieler in quiz_scores anlegen oder nicht löschen
  await supabase
    .from("quiz_scores")
    .upsert(
      {
        user_id: profile.id,
        username: profile.username,
        country: profile.country || "DE",
        total_points: 0,
        rounds: 0,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id" }
    );

  return Response.json({ success: true });
}
