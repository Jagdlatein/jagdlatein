export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { ACCOUNT_SESSION_MAX_AGE, JL_ACCOUNT_COOKIE, createAccountSession, normalizeAccountEmail } from "../../../../lib/account-session";

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 40,
};

export async function POST(req) {
  try {
    const supabase = getSupabase();
    const body = await req.json();

    const email =
      typeof body?.email === "string"
        ? body.email.toLowerCase().trim()
        : "";

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

    if (new Date(loginCode.expires_at).getTime() < Date.now()) {
      await supabase
        .from("login_codes")
        .delete()
        .eq("email", email);

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
        .eq("email", email);

      return NextResponse.json(
        {
          success: false,
          message: "Zu viele Versuche. Bitte neuen Code anfordern.",
        },
        { status: 429 }
      );
    }

    const validCode = await bcrypt.compare(
      code,
      loginCode.code_hash
    );

    if (!validCode) {
      await supabase
        .from("login_codes")
        .update({
          attempts: (loginCode.attempts || 0) + 1,
        })
        .eq("email", email);

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

    await supabase
      .from("login_codes")
      .delete()
      .eq("email", email);

    cookies().set({
      name: "jl_session",
      value: "1",
      ...COOKIE_OPTS,
    });

    cookies().set({
      name: "jl_email",
      value: email,
      ...COOKIE_OPTS,
    });

    const accountToken = createAccountSession(email);
    cookies().set({
      name: JL_ACCOUNT_COOKIE,
      value: accountToken || "",
      ...COOKIE_OPTS,
      maxAge: accountToken ? ACCOUNT_SESSION_MAX_AGE : 0,
    });

    if (profile.is_premium === true) {
      cookies().set({
        name: "jl_paid",
        value: "1",
        ...COOKIE_OPTS,
      });
    } else {
      cookies().set({
        name: "jl_paid",
        value: "",
        ...COOKIE_OPTS,
        maxAge: 0,
      });
    }

    if (profile.is_admin === true) {
      cookies().set({
        name: "jl_admin",
        value: "1",
        ...COOKIE_OPTS,
      });
    } else {
      cookies().set({
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
