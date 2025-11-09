import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 40, // 40 Tage
};

async function checkUserHasAccess(email, req) {
  const url = new URL("/api/auth/check", req.url);
  url.searchParams.set("email", email);
  const r = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!r.ok) return null;
  const data = await r.json();
  return data && data.hasAccess ? data : null;
}

export async function POST(req) {
  const { email, adminToken } = await req.json();

  // Admin
  if (adminToken && process.env.ADMIN_PASS && adminToken === process.env.ADMIN_PASS) {
    if (email) cookies().set({ name: "jl_email", value: encodeURIComponent(email), ...COOKIE_OPTS });
    cookies().set({ name: "jl_admin", value: "1", ...COOKIE_OPTS });
    cookies().set({ name: "jl_session", value: "1", ...COOKIE_OPTS });
    return NextResponse.json({ ok: true, mode: "admin" });
  }

  // User
  if (!email) return NextResponse.json({ error: "E-Mail fehlt" }, { status: 400 });

  const ok = await checkUserHasAccess(email, req);
  if (!ok) return NextResponse.json({ error: "Kein aktives Abo" }, { status: 403 });

  cookies().set({ name: "jl_email", value: encodeURIComponent(email), ...COOKIE_OPTS });
  cookies().set({ name: "jl_paid", value: "1", ...COOKIE_OPTS });
  cookies().set({ name: "jl_session", value: "1", ...COOKIE_OPTS });

  return NextResponse.json({ ok: true, mode: "user" });
}

export async function DELETE() {
  ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach((n) =>
    cookies().set({ name: n, value: "", path: "/", maxAge: 0 })
  );
  return NextResponse.json({ ok: true });
}
