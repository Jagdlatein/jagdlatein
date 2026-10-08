export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendLoginCode, TestLoginMailError } from "../../../../lib/email";
import { isAccountSessionConfigured, normalizeAccountEmail } from "../../../../lib/account-session";
import { isLoginMailRecipientAllowed } from "../../../../lib/test-environment";


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

    if (!isLoginMailRecipientAllowed(email)) {
      return NextResponse.json({ success: true,
        message: "Falls diese E-Mail registriert ist, wurde ein Login-Code versendet." },
      { headers: { "Cache-Control": "no-store" } });
    }

    // Prüfen, ob die E-Mail bei Jagdlatein registriert ist
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json(
      { success: false, message: "Die Anmeldung ist derzeit nicht verfügbar. Bitte später erneut versuchen." }, { status: 503 });
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data: profile, error: profileError } = await supabase
      .from("userprofile")
      .select("email")
      .ilike("email", email.replace(/[\\%_]/g, "\\$&"))
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

    // Dieser Zeitstempel dient auch als atomare Reservierung gegen parallele Anfragen.
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

    const reservation = {
      email,
      code_hash: codeHash,
      expires_at: expiresAt,
      attempts: 0,
      requested_at: new Date().toISOString(),
    };
    let save;
    if (existing) {
      let query = supabase.from("login_codes").update(reservation).eq("email", email);
      query = existing.requested_at == null
        ? query.is("requested_at", null)
        : query.eq("requested_at", existing.requested_at);
      save = await query.select("email").maybeSingle();
    } else {
      save = await supabase.from("login_codes").insert(reservation).select("email").maybeSingle();
    }
    // Nur der Gewinner darf seinen gespeicherten Code senden; Verlierer bleiben neutral.
    if ((!existing && save.error?.code === "23505") || (!save.error && !save.data)) {
      return NextResponse.json({
        success: true,
        message: "Falls diese E-Mail registriert ist, wurde ein Login-Code versendet.",
      });
    }
    const saveError = save.error;

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
    if (error instanceof TestLoginMailError) {
      return NextResponse.json({ success: false, message: error.message },
        { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    console.error("Request-Code Fehler:", error);

    return NextResponse.json(
      { success: false, message: "Serverfehler." },
      { status: 500 }
    );
  }
}
