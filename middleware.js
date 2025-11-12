// middleware.js
import { NextResponse } from "next/server";

// Seiten/Endpoints, die NUR mit Login erreichbar sein sollen:
const PROTECTED = [
  /^\/quiz(?:\/|$)/,
  /^\/glossar(?:\/|$)/,
  // Falls deine Frontends per API laden und du auch die APIs schützen willst:
  /^\/api\/quiz(?:\/|$)/,
  // (Glossar-GET kannst du optional offen lassen. Wenn schützen, dann einkommentieren:)
  // /^\/api\/glossar(?:\/|$)/,
];

// Nur der Admin-Bereich bleibt zusätzlich speziell geschützt:
const ADMIN_ONLY = [
  /^\/admin(?:\/|$)/,
  /^\/api\/glossar\/import(?:\/|$)/,
  /^\/api\/admin(?:\/|$)/,
];

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Admin-Schutz
  for (const re of ADMIN_ONLY) {
    if (re.test(pathname)) {
      const isAdmin = req.cookies.get("jl_admin")?.value === "1";
      if (!isAdmin) {
        const to = req.nextUrl.clone();
        to.pathname = "/login";
        to.searchParams.set("next", pathname);
        return NextResponse.redirect(to);
      }
      return NextResponse.next();
    }
  }

  // Login-Pflicht für Quiz/Glossar
  for (const re of PROTECTED) {
    if (re.test(pathname)) {
      const hasSession = req.cookies.get("jl_session")?.value === "1";
      const hasPaid    = req.cookies.get("jl_paid")?.value === "1";
      const isAdmin    = req.cookies.get("jl_admin")?.value === "1";
      if (!(hasSession && (hasPaid || isAdmin))) {
        const to = req.nextUrl.clone();
        to.pathname = "/login";
        to.searchParams.set("next", pathname);
        return NextResponse.redirect(to);
      }
      return NextResponse.next();
    }
  }

  // alles andere frei
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images/|assets/).*)",
  ],
};
