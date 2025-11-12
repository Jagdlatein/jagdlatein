// middleware.js
import { NextResponse } from "next/server";

// Nur Admin-Bereich (und Admin-APIs) schützen
const ADMIN_ONLY = [
  /^\/admin(?:\/|$)/,
  /^\/api\/glossar\/import(?:\/|$)/,
  /^\/api\/admin(?:\/|$)/,
];

export function middleware(req) {
  const { pathname } = req.nextUrl;

  for (const re of ADMIN_ONLY) {
    if (re.test(pathname)) {
      const isAdmin = req.cookies.get("jl_admin")?.value === "1";
      if (!isAdmin) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  // ALLES ANDERE FREI (inkl. /quiz, /glossar, /api/quiz, /api/glossar)
  return NextResponse.next();
}

// Matcher: alles abfangen außer Next-Assets & Standarddateien
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images/|assets/).*)",
  ],
};
