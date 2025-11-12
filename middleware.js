// middleware.js
import { NextResponse } from "next/server";

// Nur Admin-Bereich + Admin-APIs schützen
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
  // ALLES ANDERE FREI (Quiz/Glossar inkl. API)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images/|assets/).*)"],
};
