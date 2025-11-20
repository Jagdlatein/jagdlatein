// middleware.js
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/preise"];

export function middleware(req) {
  const url = req.nextUrl.clone();
  const { hostname, pathname } = url;

  // 1) Domain-Redirect
  if (hostname === "www.jagdlatein.de") {
    url.hostname = "jagdlatein.de";
    return NextResponse.redirect(url);
  }

  // 2) API ausschließen
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // 3) Static ausschließen
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // 4) COOKIES LESEN
  const hasSession = req.cookies.get("jl_session")?.value === "1";
  const hasPaid = req.cookies.get("jl_paid")?.value === "1";
  const isAdmin = req.cookies.get("jl_admin")?.value === "1";

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // ⏳ WICHTIG:
  // Erlaube 1 Durchlauf nach Login, damit Cookies 100% bereit sind
  if (!hasSession && !isPublic) {
    // Wenn User gerade von /login kommt → nicht blockieren
    if (req.headers.get("referer")?.includes("/login")) {
      return NextResponse.next(); // Cookies kommen beim nächsten Request
    }

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
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};

