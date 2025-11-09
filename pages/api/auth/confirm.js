// app/api/auth/confirm/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 40, // 40 Tage
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const next = searchParams.get("next") || "/quiz";

  if (!token || !email) {
    return NextResponse.json({ error: "Missing token/email" }, { status: 400 });
  }

  // 🔎 1. Deinen internen Auth-Check aufrufen
  // (z. B. prüft dein bestehender /api/auth/check, ob das Abo aktiv ist)
  const checkUrl = new URL("/api/auth/check", req.url);
  checkUrl.searchParams.set("email", email);
  checkUrl.searchParams.set("token", token);

  const res = await fetch(checkUrl, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const fail = new URL("/login", req.url);
    fail.searchParams.set("msg", "Bestätigung fehlgeschlagen");
    return NextResponse.redirect(fail);
  }

  const data = await res.json();
  if (!data?.hasAccess) {
    const fail = new URL("/login", req.url);
    fail.searchParams.set("msg", "Kein aktives Abo gefunden");
    return NextResponse.redirect(fail);
  }

  // ✅ 2. Session-Cookies setzen
  cookies().set({ name: "jl_email", value: encodeURIComponent(email), ...COOKIE_OPTS });
  cookies().set({ name: "jl_paid", value: "1", ...COOKIE_OPTS });
  cookies().set({ name: "jl_session", value: "1", ...COOKIE_OPTS });

  // ✅ 3. Direkt weiterleiten ins Ziel (Quiz oder Glossar)
  const dest = new URL(next, req.url);
  return NextResponse.redirect(dest);
}
