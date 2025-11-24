// middleware.js
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/preise", "/debug-cookies"];

export function middleware(req) {
  const url = req.nextUrl.clone();
  const { pathname } = url;

  // 🔥 WICHTIG: PayPal Webhooks immer ausschließen
  if (pathname.startsWith("/api/paypal")) {
    return NextResponse.next();
  }

  // Vercel Build Schutz
  if (req.headers.get("x-vercel-deployment")) {
    return NextResponse.next();
  }

  // API komplett ausschließen
  if (pathname.startsWith("/api")) return NextResponse.next();

  // Static Files ausschließen
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

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

// 💯 Perfekte Matcher-Regel:
// Middleware DARF NICHT für API-Routen laufen
export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico).*)"
  ],
};
