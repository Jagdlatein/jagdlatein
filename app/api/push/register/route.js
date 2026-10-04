export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { readRequestAccountSession } from "../../../../lib/account-access";
import { isPayPalSandboxTestEnvironment } from "../../../../lib/test-environment";


export async function POST(req) {
  try {
    if (isPayPalSandboxTestEnvironment()) return Response.json(
      { success: false, error: "Push ist in der Testumgebung deaktiviert." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
    if (!readRequestAccountSession(req)) {
      return Response.json({ success: false, error: "Bitte anmelden." }, { status: 401 });
    }
    const { token } = await req.json();

    if (typeof token !== "string" || !token.trim() || token.length > 4096 || /[\s\u0000-\u001f\u007f]/.test(token.trim())) {
      return Response.json(
        { success: false, error: "Token fehlt" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

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
