// middleware.js
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/preise"];

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

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // Nicht eingeloggt → nur Public-Seiten erlaubt
  if (!hasSession && !isPublic) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Eingeloggt, aber nicht bezahlt → auf Preise umleiten
  if (hasSession && !hasPaid && !isAdmin && !isPublic) {
    url.pathname = "/preise";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
