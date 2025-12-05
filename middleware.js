console.log("🔥 Middleware test 12345");

import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/preise",
  "/debug-cookies",
  "/paytest",
  "/jagdbuch/erstellen"
];

export function middleware(req) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // PayPal immer erlauben
  if (pathname.startsWith("/api/paypal")) {
    return NextResponse.next();
  }

  // ░░░ API NIE blockieren ░░░
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Static Files erlauben
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Session prüfen
  const hasSession = req.cookies.get("jl_session")?.value === "1";
  const hasPaid = req.cookies.get("jl_paid")?.value === "1";
  const isAdmin = req.cookies.get("jl_admin")?.value === "1";

  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!hasSession && !isPublic) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSession && !hasPaid && !isAdmin && !isPublic) {
    url.pathname = "/preise";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|api/).*)"
  ],
};
