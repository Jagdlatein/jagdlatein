// middleware.js
import { NextResponse } from "next/server";

// Alles, was nur mit Login erlaubt ist:
const PROTECTED_PATHS = [
  /^\/quiz(?:\/|$)/,
  /^\/glossar(?:\/|$)/,
  /^\/api\/quiz(?:\/|$)/,
  /^\/api\/glossar(?:\/|$)/,
];

// Admin-Bereich separat absichern:
const ADMIN_PATHS = [
  /^\/admin(?:\/|$)/,
  /^\/api\/admin(?:\/|$)/,
  /^\/api\/glossar\/import(?:\/|$)/,
];

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Admin-Schutz
  for (const re of ADMIN_PATHS) {
    if (re.test(pathname)) {
      const isAdmin = req.cookies.get("jl_admin")?.value === "1";
      if (!isAdmin) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }
  }

  // Login-Schutz für Quiz & Glossar
  for (const re of PROTECTED_PATHS) {
    if (re.test(pathname)) {
      const hasSession = req.cookies.get("jl_session")?.value === "1";
      const hasPaid = req.cookies.get("jl_paid")?.value === "1";
      const isAdmin = req.cookies.get("jl_admin")?.value === "1";
      if (!(hasSession && (hasPaid || isAdmin))) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images/|assets/).*)",
  ],
};
