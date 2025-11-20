// app/api/auth/session/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "none",   // ← WICHTIG!!!
  secure: true,        // ← WICHTIG!!!
  path: "/",
  maxAge: 60 * 60 * 24 * 40, // 40 Tage
};

// -----------------------------
// Überprüfung, ob Nutzer existiert
// -----------------------------
async function authCheck(req, email) {
  const url = new URL("/api/auth/check", req.url);
  url.searchParams.set("email", email);

  const r = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!r.ok) {
    throw new Error("API /auth/check antwortet nicht korrekt");
  }

  return r.json();
}

// -----------------------------
// LOGIN (POST)
// -----------------------------
export async function POST(req) {
  try {
    const body = await req.json();
    const email = body?.email?.toLowerCase()?.trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Bitte gültige E-Mail eingeben." },
        { status: 400 }
      );
    }

    const verify = await authCheck(req, email);

    // SESSION COOKIES (jetzt korrekt!)
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

    if (verify?.paid) {
      cookies().set({
        name: "jl_paid",
        value: "1",
        ...COOKIE_OPTS,
      });
    }

    if (verify?.admin) {
      cookies().set({
        name: "jl_admin",
        value: "1",
        ...COOKIE_OPTS,
      });
    }

    return NextResponse.json({
      success: true,
      paid: verify?.paid || false,
      admin: verify?.admin || false,
      message: "Login erfolgreich",
    });
  } catch (err) {
    console.error("SESSION LOGIN ERROR:", err);
    return NextResponse.json(
      { success: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

// -----------------------------
// LOGOUT (DELETE)
// -----------------------------
export async function DELETE() {
  try {
    ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach((n) =>
      cookies().set({
        name: n,
        value: "",
        path: "/",
        maxAge: 0,
      })
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("SESSION DELETE ERROR:", err);
    return NextResponse.json(
      { error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
