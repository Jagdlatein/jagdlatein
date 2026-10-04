export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { ACCOUNT_SESSION_MAX_AGE, JL_ACCOUNT_COOKIE, createAccountSession, isAccountSessionConfigured, normalizeAccountEmail } from "../../../../lib/account-session";

function getSupabase() {
  return createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 40,
};

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    if ((req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() !== "application/json")
      return NextResponse.json({ success: false, message: "Bitte JSON senden." }, { status: 415 });
    if (!isAccountSessionConfigured()) return NextResponse.json(
      { success: false, message: "Die Anmeldung ist derzeit nicht verfügbar. Bitte später erneut versuchen." }, { status: 503 });
    let body;
    try { body = await req.json(); } catch {
      return NextResponse.json({ success: false, message: "Ungültige Anfrage." }, { status: 400 });
    }
    const supabase = getSupabase();

    const email = normalizeAccountEmail(body?.email);

    const code =
      typeof body?.code === "string"
        ? body.code.trim()
        : "";

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^\d{6}$/.test(code)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "E-Mail oder Login-Code ungültig.",
        },
        { status: 400 }
      );
    }

    const { data: loginCode, error: codeError } = await supabase
      .from("login_codes")
      .select("code_hash, expires_at, attempts")
      .eq("email", email)
      .maybeSingle();

    if (codeError) {
      console.error("Login-Code Fehler:", codeError);

      return NextResponse.json(
        { success: false, message: "Serverfehler." },
        { status: 500 }
      );
    }

    if (!loginCode) {
      return NextResponse.json(
        {
          success: false,
          message: "Login-Code ungültig oder abgelaufen.",
        },
        { status: 400 }
      );
    }

    const expiresAt = new Date(loginCode.expires_at).getTime();
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      await supabase
        .from("login_codes")
        .delete()
        .eq("email", email).eq("code_hash", loginCode.code_hash);

      return NextResponse.json(
        {
          success: false,
          message: "Login-Code ist abgelaufen.",
        },
        { status: 400 }
      );
    }

    if ((loginCode.attempts || 0) >= 5) {
      await supabase
        .from("login_codes")
        .delete()
        .eq("email", email).eq("code_hash", loginCode.code_hash);

      return NextResponse.json(
        {
          success: false,
          message: "Zu viele Versuche. Bitte neuen Code anfordern.",
        },
        { status: 429 }
      );
    }

    const attempts = loginCode.attempts || 0;
    const { data: attempt, error: attemptError } = await supabase.from("login_codes")
      .update({ attempts: attempts + 1 }).eq("email", email).eq("code_hash", loginCode.code_hash)
      .eq("attempts", attempts).select("email").maybeSingle();
    if (attemptError) return NextResponse.json({ success: false, message: "Serverfehler." }, { status: 500 });
    if (!attempt) return NextResponse.json({ success: false, message: "Code wird bereits geprüft. Bitte erneut versuchen." }, { status: 429 });

    const validCode = await bcrypt.compare(
      code,
      loginCode.code_hash
    );

    if (!validCode) {
      return NextResponse.json(
        {
          success: false,
          message: "Login-Code ist nicht korrekt.",
        },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("userprofile")
      .select("email, is_premium, is_admin")
      .ilike("email", email)
      .maybeSingle();

    if (profileError || !profile || normalizeAccountEmail(profile.email) !== email) {
      return NextResponse.json(
        {
          success: false,
          message: "Benutzerkonto nicht gefunden.",
        },
        { status: 400 }
      );
    }

    if (expiresAt <= Date.now()) return NextResponse.json(
      { success: false, message: "Login-Code ist abgelaufen." }, { status: 400 });

    const accountToken = createAccountSession(email, Date.now(), {
      paid: profile.is_premium === true, admin: profile.is_admin === true,
    });
    if (!accountToken) return NextResponse.json({ success: false, message: "Die Anmeldung ist derzeit nicht verfügbar." }, { status: 503 });
    const { data: consumed, error: consumeError } = await supabase
      .from("login_codes")
      .delete()
      .eq("email", email).eq("code_hash", loginCode.code_hash).select("email").maybeSingle();
    if (consumeError) return NextResponse.json({ success: false, message: "Serverfehler." }, { status: 500 });
    if (!consumed) return NextResponse.json({ success: false, message: "Login-Code bereits verwendet. Bitte neuen Code anfordern." }, { status: 400 });

    cookieStore.set({
      name: "jl_session",
      value: "1",
      ...COOKIE_OPTS,
    });

    cookieStore.set({
      name: "jl_email",
      value: email,
      ...COOKIE_OPTS,
    });

    cookieStore.set({
      name: JL_ACCOUNT_COOKIE,
      value: accountToken || "",
      ...COOKIE_OPTS,
      maxAge: accountToken ? ACCOUNT_SESSION_MAX_AGE : 0,
    });

    if (profile.is_premium === true) {
      cookieStore.set({
        name: "jl_paid",
        value: "1",
        ...COOKIE_OPTS,
      });
    } else {
      cookieStore.set({
        name: "jl_paid",
        value: "",
        ...COOKIE_OPTS,
        maxAge: 0,
      });
    }

    if (profile.is_admin === true) {
      cookieStore.set({
        name: "jl_admin",
        value: "1",
        ...COOKIE_OPTS,
      });
    } else {
      cookieStore.set({
        name: "jl_admin",
        value: "",
        ...COOKIE_OPTS,
        maxAge: 0,
      });
    }

    return NextResponse.json({
      success: true,
      paid: profile.is_premium === true,
      admin: profile.is_admin === true,
      message: "Login erfolgreich.",
    });
  } catch (error) {
    console.error("Verify-Code Fehler:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Serverfehler.",
      },
      { status: 500 }
    );
  }
}
