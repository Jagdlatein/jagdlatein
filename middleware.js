import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Nur Quiz & Glossar schützen
  const protectedPaths = ["/quiz", "/glossar"];
  const needGuard = protectedPaths.some(p => pathname === p || pathname.startsWith(p + "/"));
  if (!needGuard) return NextResponse.next();

  // Cookies: normale zahlende User oder Admin-Preview
  const hasSession = !!req.cookies.get("jl_session")?.value;
  const isPaid    = req.cookies.get("jl_paid")?.value === "1";
  const isAdmin   = req.cookies.get("jl_admin")?.value === "1";

  if ((hasSession && isPaid) || isAdmin) return NextResponse.next();

  // Redirect zu /preise, wenn kein Zugriff
  const url = req.nextUrl.clone();
  url.pathname = "/preise";
  url.searchParams.set("lock", "1");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/quiz/:path*", "/glossar/:path*"],
};
