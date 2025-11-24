// middleware.js
import { NextResponse } from "next/server";

// Alle öffentlich zugänglichen Seiten
const PUBLIC_PATHS = [
  "/", 
  "/login", 
  "/preise", 
  "/debug-cookies",
  "/paytest"   // 🟢 Testseite öffentlich machen
];

export function middleware(req) {
  const url = req.nextUrl.clone();
  const { pathname } = url;

  // 🔥 PayPal Webhook IMMER erlauben
  if (pathname.startsWith("/api/paypal")) {
    return NextResponse.next();
  }

  // Alle API-Routen erlauben
  if (pathname.startsWith("/api")) return NextResponse.next();

  // Static Files niemals blockieren
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

  // ist Route öffentlich?
  const isPublic = PUBLIC_PATHS.includes(pathname);

  // ❌ Nicht eingeloggt → nur Public
  if (!hasSession && !isPublic) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ❌ Eingeloggt, aber nicht Premium → einschränken
  if (hasSession && !hasPaid && !isAdmin && !isPublic) {
    url.pathname = "/preise";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// 💯 Matcher: blockiert ALLES außer _next, api, favicon, paytest
export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|paytest).*)"
  ],
};
