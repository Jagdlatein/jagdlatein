// middleware.js
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/preise"];

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // API & statische Dateien NIE schützen
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Cookies auslesen
  const hasSession =
    req.cookies.get("jl_session")?.value === "1" &&
    (req.cookies.get("jl_paid")?.value === "1" ||
      req.cookies.get("jl_admin")?.value === "1");

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // Wenn nicht eingeloggt & keine öffentliche Seite → auf /login leiten
  if (!hasSession && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // sonst normal weiter
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
