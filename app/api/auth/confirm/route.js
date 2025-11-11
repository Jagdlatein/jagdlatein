// app/api/auth/confirm/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import  prisma  from "../../../../lib/prisma";
export const dynamic = "force-dynamic";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 40,
};

function hasModel(client, name) {
  return !!client && Object.prototype.hasOwnProperty.call(client, name);
}

async function internalCheck(req, { email, token }) {
  const url = new URL("/api/auth/check", req.url);
  url.searchParams.set("email", email);
  if (token) url.searchParams.set("token", token);
  const r = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  const raw = await r.text();
  let data = null;
  try { data = JSON.parse(raw); } catch {}
  if (!r.ok) throw new Error((data && (data.error || data.message)) || raw || "Check failed");
  return data;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const emailRaw = searchParams.get("email");
  const next = searchParams.get("next") || "/quiz";
  const html = searchParams.get("html") === "1";

  if (!token || !emailRaw) {
    return NextResponse.json({ error: "Missing token/email" }, { status: 400 });
  }
  const email = emailRaw.trim().toLowerCase();

  // 1) Check (Allowlist/AccessGrant/AccessPass)
  const data = await internalCheck(req, { email, token });
  if (!data?.hasAccess) {
    const fail = new URL("/login", req.url);
    fail.searchParams.set("msg", "Kein aktives Abo");
    return NextResponse.redirect(fail, { status: 303 });
  }

  // 2) Persistenz: User + AccessPass aktivieren/verlängern
  try {
    // User sicherstellen
    await prisma.user.upsert({
      where: { id: email },
      update: {},
      create: { id: email },
    });

    // AccessPass aktiv/upsert
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    // Wenn du immer eine Laufzeit setzen willst (z. B. 365 Tage), ersetze expiresAt:
    // const expiresAt = new Date(Date.now() + 365*24*60*60*1000);

    await prisma.accessPass.upsert({
      where: { userId: email },
      update: {
        plan: data.plan || "CONFIRMED",
        status: "active",
        expiresAt: expiresAt || undefined,
      },
      create: {
        userId: email,
        plan: data.plan || "CONFIRMED",
        status: "active",
        // falls dein Modell expiresAt required ist, setze hier ein Datum
        expiresAt: expiresAt ?? new Date(Date.now() + 365*24*60*60*1000),
      },
    });

    // Optional: Wenn AccessGrant-Model existiert, parallel pflegen (zukunftssicher)
    if (hasModel(prisma, "accessGrant")) {
      await prisma.accessGrant.upsert({
        where: { email },
        update: {
          plan: data.plan || "CONFIRMED",
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        },
        create: {
          email,
          plan: data.plan || "CONFIRMED",
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        },
      });
    }
  } catch (e) {
    console.error("CONFIRM UPSERT ERROR", e);
    // kein Hard-Fail – Cookies/Redirect trotzdem fortsetzen
  }

  // 3) Cookies setzen
  cookies().set({ name: "jl_email", value: encodeURIComponent(email), ...COOKIE_OPTS });
  cookies().set({ name: "jl_paid", value: "1", ...COOKIE_OPTS });
  cookies().set({ name: "jl_session", value: "1", ...COOKIE_OPTS });

  // 4) Redirect (+ Fallback)
  const dest = new URL(next, req.url);
  const res = NextResponse.redirect(dest, { status: 303 });
  res.headers.set("Refresh", `0; url=${dest.toString()}`);
  if (!html) return res;

  return new NextResponse(
    `<!doctype html>
     <meta http-equiv="refresh" content="0;url='${dest.toString()}'">
     <script>location.replace(${JSON.stringify(dest.toString())});</script>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

