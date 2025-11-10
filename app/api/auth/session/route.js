import { NextResponse } from "next/server";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 40,
};

async function authCheck(req, email) {
  const url = new URL("/api/auth/check", req.url);
  url.searchParams.set("email", email);
  const r = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  const raw = await r.text();
  let data = null;
  try { data = JSON.parse(raw); } catch {}
  if (!r.ok) throw new Error((data && (data.error || data.message)) || raw || "Auth-Check failed");
  if (!data?.hasAccess) throw new Error("Kein aktives Abo");
  return data;
}

export async function POST(req) {
  try {
    const { email, adminToken } = (await req.json?.()) || {};

    // Admin
    if (adminToken) {
      if (!process.env.ADMIN_PASS || adminToken !== process.env.ADMIN_PASS) {
        return NextResponse.json({ error: "Admin-Token ungültig" }, { status: 401 });
      }
      if (email) cookies().set({ name: "jl_email", value: encodeURIComponent(email), ...COOKIE_OPTS });
      cookies().set({ name: "jl_admin", value: "1", ...COOKIE_OPTS });
      cookies().set({ name: "jl_session", value: "1", ...COOKIE_OPTS });
      return NextResponse.json({ ok: true, mode: "admin" });
    }

    if (!email) return NextResponse.json({ error: "E-Mail fehlt" }, { status: 400 });

    await authCheck(req, email);

    cookies().set({ name: "jl_email", value: encodeURIComponent(email), ...COOKIE_OPTS });
    cookies().set({ name: "jl_paid", value: "1", ...COOKIE_OPTS });
    cookies().set({ name: "jl_session", value: "1", ...COOKIE_OPTS });

    return NextResponse.json({ ok: true, mode: "user" });
  } catch (err) {
    console.error("SESSION ROUTE ERROR:", err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach((n) =>
      cookies().set({ name: n, value: "", path: "/", maxAge: 0 })
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("SESSION DELETE ERROR:", err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
