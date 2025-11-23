// middleware.js
import { NextResponse } from "next/server";

// Alle öffentlich zugänglichen Seiten
const PUBLIC_PATHS = [
  "/", 
  "/login", 
  "/preise", 
  "/debug-cookies", 
  "/debug-cookies/"
];

export function middleware(req) {
  const url = req.nextUrl.clone();
  const { pathname } = url;

  // Vercel-Build nicht stören
  if (req.headers.get("x-vercel-deployment")) {
    return NextResponse.next();
  }

  // API ausschließen
  if (pathname.startsWith("/api")) return NextResponse.next();

  // Static ausschließen
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

  // Check ob Route öffentlich ist
  const isPublic = PUBLIC_PATHS.includes(pathname);

  // Nicht eingeloggt → Public-Seiten erlauben
  if (!hasSession && !isPublic) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Eingeloggt, aber nicht bezahlt → Nur Public-Seiten + Admin erlaubt
  if (hasSession && !hasPaid && !isAdmin && !isPublic) {
    url.pathname = "/preise";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Matcher → /debug-cookies vollständig ausnehmen
export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico|debug-cookies|debug-cookies/).*)",
  ],
};
