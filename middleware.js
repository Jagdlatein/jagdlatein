// middleware.js (Root des Repos)
import { NextResponse } from "next/server";

const PROTECTED = ["/quiz", "/glossar"];

export function middleware(req) {
  const token = req.cookies.get("jl_session")?.value;
  const { pathname } = req.nextUrl;

  const needsAuth = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (needsAuth && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = ""; // optional: Query resetten
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Nur diese Pfade abfangen (performant)
export const config = {
  matcher: ["/quiz/:path*", "/glossar/:path*"],
};
