// middleware.js
import { NextResponse } from "next/server";

const PROTECTED = ["/quiz", "/glossar"];

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some(p => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const cookie = req.cookies.get("jl_session")?.value;
  if (cookie === "1") return NextResponse.next();

  const url = new URL("/login", req.url);
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/quiz/:path*", "/glossar/:path*"],
};
