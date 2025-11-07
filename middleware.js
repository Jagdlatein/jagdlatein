// middleware.js
import { NextResponse } from "next/server";

// WebCrypto-basierte Prüfung (Edge-kompatibel)
async function verify(token, secret) {
  if (!token || !secret) return false;
  const [data, sig] = token.split(".");
  if (!data || !sig) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sigBuf = Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  const ok = await crypto.subtle.verify("HMAC", key, sigBuf, enc.encode(data));
  if (!ok) return false;

  // exp prüfen
  const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  if (!payload?.exp || Date.now() / 1000 > payload.exp) return false;
  return true;
}

export async function middleware(req) {
  const url = new URL(req.url);
  // Login-Seite selbst nicht schützen
  if (url.pathname.startsWith("/admin/login")) return NextResponse.next();

  // Nur /admin/* schützen
  if (url.pathname.startsWith("/admin")) {
    const cookie = req.cookies.get("admin_session")?.value;
    const secret = process.env.APP_SECRET || "";
    const ok = await verify(cookie, secret);
    if (!ok) {
      const login = new URL("/admin/login", req.url);
      return NextResponse.redirect(login);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
