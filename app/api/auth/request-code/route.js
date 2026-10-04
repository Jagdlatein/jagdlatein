export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendLoginCode } from "../../../../lib/email";
import { isAccountSessionConfigured, normalizeAccountEmail } from "../../../../lib/account-session";


export async function POST(req) {
  try {
    if ((req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() !== "application/json")
      return NextResponse.json({ success: false, message: "Bitte JSON senden." }, { status: 415 });
    if (!isAccountSessionConfigured()) return NextResponse.json(
      { success: false, message: "Die Anmeldung ist derzeit nicht verfügbar. Bitte später erneut versuchen." }, { status: 503 });
    let body;
    try { body = await req.json(); } catch {
      return NextResponse.json({ success: false, message: "Ungültige Anfrage." }, { status: 400 });
    }

    if (typeof body?.email !== "string") {
      return NextResponse.json(
        { success: false, message: "E-Mail fehlt." },
        { status: 400 }
      );
    }

    const email = normalizeAccountEmail(body.email);

    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!valid) {
      return NextResponse.json(
        { success: false, message: "Bitte gültige E-Mail eingeben." },
        { status: 400 }
      );
    }

    // Prüfen, ob die E-Mail bei Jagdlatein registriert ist
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profile, error: profileError } = await supabase
      .from("userprofile")
      .select("email")
      .ilike("email", email)
      .maybeSingle();

    if (profileError) {
      console.error("Userprofile Fehler:", profileError);

      return NextResponse.json(
        { success: false, message: "Serverfehler." },
        { status: 500 }
      );
    }

    // Absichtlich neutrale Antwort
    if (!profile || normalizeAccountEmail(profile.email) !== email) {
      return NextResponse.json({
        success: true,
        message:
          "Falls diese E-Mail registriert ist, wurde ein Login-Code versendet.",
      });
    }

    // Maximal ungefähr eine neue Mail pro Minute
    const { data: existing, error: existingError } = await supabase
      .from("login_codes")
      .select("requested_at")
      .eq("email", email)
      .maybeSingle();

    if (existingError) return NextResponse.json({ success: false, message: "Serverfehler." }, { status: 500 });

    if (existing?.requested_at) {
      const lastRequest = new Date(existing.requested_at).getTime();
      const now = Date.now();

      if (now - lastRequest < 60 * 1000) {
        return NextResponse.json({
          success: true,
          message:
            "Falls diese E-Mail registriert ist, wurde ein Login-Code versendet.",
        });
      }
    }

    const code = String(
      crypto.randomInt(0, 1000000)
    ).padStart(6, "0");

    const codeHash = await bcrypt.hash(code, 10);

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    ).toISOString();

    const { error: saveError } = await supabase
      .from("login_codes")
      .upsert(
        {
          email,
          code_hash: codeHash,
          expires_at: expiresAt,
          attempts: 0,
          requested_at: new Date().toISOString(),
        },
        {
          onConflict: "email",
        }
      );

    if (saveError) {
      console.error("Login-Code konnte nicht gespeichert werden:", saveError);

      return NextResponse.json(
        { success: false, message: "Serverfehler." },
        { status: 500 }
      );
    }

    await sendLoginCode(email, code);

    return NextResponse.json({
      success: true,
      message:
        "Falls diese E-Mail registriert ist, wurde ein Login-Code versendet.",
    });
  } catch (error) {
    console.error("Request-Code Fehler:", error);

    return NextResponse.json(
      { success: false, message: "Serverfehler." },
      { status: 500 }
    );
  }
}
