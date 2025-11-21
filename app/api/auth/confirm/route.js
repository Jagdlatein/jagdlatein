// app/api/auth/confirm/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 40, // 40 Tage
};

// Interne Prüfung – ruft /auth/check auf
async function internalCheck(req, { email, token }) {
  const url = new URL("/api/auth/check", req.url);
  url.searchParams.set("email", email);
  if (token) url.searchParams.set("token", token);

  const r = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const raw = await r.text();
  let data = null;

  try {
    data = JSON.parse(raw);
  } catch {}

  if (!r.ok) {
    throw new Error(
      (data && (data.error || data.message)) || raw || "Check failed"
    );
  }

  return data;
}

// GET /api/auth/confirm
export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const token = searchParams.get("token");
  const emailRaw = searchParams.get("email");
  const next = searchParams.get("next") || "/quiz";
  const html = searchParams.get("html") === "1";

  if (!token || !emailRaw) {
    return NextResponse.json(
      { error: "Missing token/email" },
      { status: 400 }
    );
  }

  const email = emailRaw.trim().toLowerCase();

  // 1) Check (früher Allowlist/AccessPass)
  const data = await internalCheck(req, { email, token });

  if (!data?.hasAccess) {
    const fail = new URL("/login", req.url);
    fail.searchParams.set("msg", "Kein aktives Abo");
    return NextResponse.redirect(fail, { status: 303 });
  }

  // 2) KEIN PRISMA MEHR – wir speichern nichts!
  //    Nur Cookies setzen (dein Login-/Premium-System)

  // 3) Cookies setzen
  cookies().set({
    name: "jl_email",
    value: encodeURIComponent(email),
    ...COOKIE_OPTS,
  });

  cookies().set({
    name: "jl_paid",
    value: "1",
    ...COOKIE_OPTS,
  });

  cookies().set({
    name: "jl_session",
    value: "1",
    ...COOKIE_OPTS,
  });

  // 4) Redirect
  const dest = new URL(next, req.url);
  const res = NextResponse.redirect(dest, { status: 303 });

  // Fallback
  res.headers.set("Refresh", `0; url=${dest.toString()}`);

  if (!html) return res;

  return new NextResponse(
    `<!doctype html>
     <meta http-equiv="refresh" content="0;url='${dest.toString()}'">
     <script>location.replace(${JSON.stringify(dest.toString())});</script>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
