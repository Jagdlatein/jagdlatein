// middleware.js
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login"];

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Statische Dateien immer durchlassen
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // öffentlich erlaubte Seiten
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Session-Cookie prüfen
  const hasSession = req.cookies.get("jl_session");

  // Wenn kein Login → immer auf /login umleiten (egal ob mobile oder Desktop)
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // eingeloggt → Seite ganz normal laden
  return NextResponse.next();
}

// Auf alle Seiten anwenden (außer _next & favicon)
export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
