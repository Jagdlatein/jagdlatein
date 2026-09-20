export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return Response.json(
        { success: false, error: "Token fehlt" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("push_tokens")
      .upsert(
        {
          token: token.trim(),
          platform: "android",
          enabled: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "token",
        }
      );

    if (error) {
      console.error("Push-Token Fehler:", error);

      return Response.json(
        { success: false, error: "Datenbankfehler" },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Push API Fehler:", error);

    return Response.json(
      { success: false, error: "Serverfehler" },
      { status: 500 }
    );
  }
}
