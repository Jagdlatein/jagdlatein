import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const protectedPaths = ["/quiz", "/glossar"];
  const needGuard = protectedPaths.some(p => pathname === p || pathname.startsWith(p + "/"));
  if (!needGuard) return NextResponse.next();

  // Minimal: Cookie-Check (wir setzen später via Login/Login-Code ein Session-Cookie 'jl_session'
  const email = req.cookies.get("jl_session")?.value;
  const paid = req.cookies.get("jl_paid")?.value; // optionales Shortcut-Cookie

  if (paid === "1" && email) return NextResponse.next();

  // Wenn kein Cookie, auf Preise schicken
  const url = req.nextUrl.clone();
  url.pathname = "/preise";
  url.searchParams.set("lock", "1");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/quiz/:path*", "/glossar/:path*"],
};
