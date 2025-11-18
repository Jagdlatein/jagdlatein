// middleware.js
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/preise"];

export function middleware(req) {
  const url = req.nextUrl.clone();
  const { hostname, pathname } = url;

  // 1) Alle Domains auf www.jagdlatein.de zusammenführen
  const mainDomain = "www.jagdlatein.de";

  if (
    hostname !== mainDomain &&
    (hostname.endsWith("jagdlatein.de") ||
      hostname.endsWith("jagdlatein.ch") ||
      hostname.endsWith("jagdlatein.at"))
  ) {
    url.hostname = mainDomain;
    return NextResponse.redirect(url);
  }

  // 2) API & statische Dateien nicht schützen
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // 3) Access check (Session + Paid oder Admin)
  const hasSession =
    req.cookies.get("jl_session")?.value === "1" &&
    (req.cookies.get("jl_paid")?.value === "1" ||
      req.cookies.get("jl_admin")?.value === "1");

  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!hasSession && !isPublic) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
