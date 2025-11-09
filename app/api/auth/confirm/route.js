// app/api/auth/confirm/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",           // bei anderer Domain/Subdomain ggf. "none" + secure:true
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 40,
};

async function internalCheck(req, { email, token }) {
  const url = new URL("/api/auth/check", req.url);
  url.searchParams.set("email", email);
  if (token) url.searchParams.set("token", token);
  const r = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!r.ok) return null;
  return r.json();
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const next = searchParams.get("next") || "/quiz";
  const html = searchParams.get("html") === "1"; // optional: HTML-Fallback forcieren

  if (!token || !email) {
    return NextResponse.json({ error: "Missing token/email" }, { status: 400 });
  }

  const data = await internalCheck(req, { email, token });
  if (!data || !data.hasAccess) {
    const fail = new URL("/login", req.url);
    fail.searchParams.set("msg", data ? "Kein aktives Abo" : "Bestätigung fehlgeschlagen");
    return NextResponse.redirect(fail, { status: 303 });
  }

  // Cookies setzen (serverseitig)
  cookies().set({ name: "jl_email", value: encodeURIComponent(email), ...COOKIE_OPTS });
  cookies().set({ name: "jl_paid", value: "1", ...COOKIE_OPTS });
  cookies().set({ name: "jl_session", value: "1", ...COOKIE_OPTS });

  const dest = new URL(next, req.url);

  // 1) Primär: 303 Redirect (sicherer als 302/307 für Folgeseite)
  const res = NextResponse.redirect(dest, { status: 303 });

  // 2) Zusatz: Refresh-Header als Fallback (manche E-Mail-InApp-Browser)
  res.headers.set("Refresh", `0; url=${dest.toString()}`);

  if (!html) return res;

  // 3) Optionales Mini-HTML als dritter Fallback (z. B. Safari/Deep-Link)
  return new NextResponse(
    `<!doctype html>
     <meta http-equiv="refresh" content="0;url='${dest.toString()}'">
     <script>location.replace(${JSON.stringify(dest.toString())});</script>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
