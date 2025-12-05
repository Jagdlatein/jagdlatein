// middleware.js
import { NextResponse } from "next/server";

// Alle öffentlich zugänglichen Seiten
const PUBLIC_PATHS = [
  "/", 
  "/login", 
  "/preise", 
  "/debug-cookies",
  "/paytest"
];

export function middleware(req) {
  const url = req.nextUrl.clone();
  const { pathname } = url;

  // 🔥 PayPal Webhooks IMMER erlauben
  if (pathname.startsWith("/api/paypal")) {
    return NextResponse.next();
  }

  // 🔥 ALLE API-Endpunkte erlauben
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Static Files niemals blockieren
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Cookies prüfen
  const hasSession = req.cookies.get("jl_session")?.value === "1";
  const hasPaid = req.cookies.get("jl_paid")?.value === "1";
  const isAdmin = req.cookies.get("jl_admin")?.value === "1";

  // ist Route öffentlich?
  const isPublic = PUBLIC_PATHS.includes(pathname);

  // ❌ Nicht eingeloggt → nur Public zugelassen
  if (!hasSession && !isPublic) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ❌ Eingeloggt, aber kein Premium
  if (hasSession && !hasPaid && !isAdmin && !isPublic) {
    url.pathname = "/preise";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // 🔥 WICHTIG: API komplett ausschließen
  matcher: [
    "/((?!api|_next|favicon.ico).*)"
  ]
};
