export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { username, country } = await req.json();

    if (!username) {
      return Response.json(
        { success: false, error: "Username fehlt" },
        { status: 400 }
      );
    }

    const clean = username.trim().toLowerCase();

    // Prüfen ob User existiert
    const { data: exists } = await supabase
      .from("quiz_users")
      .select("username")
      .eq("username", clean)
      .maybeSingle();

    if (exists) {
      return Response.json({ success: true, exists: true });
    }

    // User anlegen
    const { error } = await supabase.from("quiz_users").insert({
      username: clean,
      country: country || "DE",
      total_points: 0,
      rounds: 0,
    });

    if (error) {
      console.error("INSERT ERROR:", error);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true, created: true });
  } catch (err) {
    return Response.json({ success: false, error: err.message });
  }
}
