// middleware.js
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/preise"];

export function middleware(req) {
  const url = req.nextUrl.clone();
  const { hostname, pathname } = url;

  // 1) Domain-Redirects
  // Nur wenn die Domain "www." hat → auf "jagdlatein.de" umleiten
  if (hostname === "www.jagdlatein.de") {
    url.hostname = "jagdlatein.de";
    return NextResponse.redirect(url);
  }

  // 2) API komplett ausschließen (KRITISCH!)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // 3) Statische Dateien ausschließen
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // 4) PAYWALL
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

// WICHTIG: API ausschließen!!!
export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
