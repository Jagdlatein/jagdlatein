// middleware.js
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/preise"];

export function middleware(req) {
  const url = req.nextUrl.clone();
  const { hostname, pathname } = url;

  // 1) Domain-Redirects
  const mainDomain = "www.jagdlatein.de";
  if (
    hostname !== mainDomain &&
    (hostname.endsWith("jagdlatein.de") ||
      hostname.endsWith("jagdlatein.ch") ||
      hostname.endsWith("jagdlatein.at"))
  ) {
    url.hostname = mainDomain;
    return NextResponse.redirect(url);
  }

  // 2) API & statische Dateien nicht schützen
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // 3) PAYWALL-CHECK (nur mit Zahlung Zugriff)
  const hasSession = req.cookies.get("jl_session")?.value === "1";
  const hasPaid = req.cookies.get("jl_paid")?.value === "1";
  const isAdmin = req.cookies.get("jl_admin")?.value === "1";

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // Wenn NICHT eingeloggt → Login
  if (!hasSession && !isPublic) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Eingeloggt, aber NICHT bezahlt → Preise
  if (hasSession && !hasPaid && !isAdmin && !isPublic) {
    url.pathname = "/preise";
    return NextResponse.redirect(url);
  }

  // Zugriff erlaubt (bezahlt oder Admin oder öffentlich)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
