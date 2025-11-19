// middleware.js
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/preise"];

export function middleware(req) {
  const url = req.nextUrl.clone();
  const { hostname, pathname } = url;

  // 1) API & statische Dateien KOMPLETT rauslassen
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // 2) Domain-Redirect nur für normale Seiten
  // (www -> apex; anpassen, falls du lieber www als Hauptdomain willst)
  if (hostname === "www.jagdlatein.de") {
    url.hostname = "jagdlatein.de";
    return NextResponse.redirect(url);
  }

  // 3) PAYWALL-CHECK
  const hasSession = req.cookies.get("jl_session")?.value === "1";
  const hasPaid = req.cookies.get("jl_paid")?.value === "1";
  const isAdmin = req.cookies.get("jl_admin")?.value === "1";

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // nicht eingeloggt -> /login
  if (!hasSession && !isPublic) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // eingeloggt, aber nicht bezahlt -> /preise
  if (hasSession && !hasPaid && !isAdmin && !isPublic) {
    url.pathname = "/preise";
    return NextResponse.redirect(url);
  }

  // alles okay
  return NextResponse.next();
}

// WICHTIG: /api komplett aus dem Matcher rausnehmen
export const config = {
  matcher: ["/((?!api|_next|favicon\\.ico).*)"],
};
