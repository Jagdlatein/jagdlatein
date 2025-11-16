// middleware.js
import { NextResponse } from "next/server";

// hier /preise hinzufügen (und ggf. weitere freie Seiten)
const PUBLIC_PATHS = ["/", "/login", "/preise"];

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // 🔓 API & statische Dateien NICHT schützen
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // prüfen, ob User eingeloggt ist
  const hasSession =
    req.cookies.get("jl_session")?.value === "1" &&
    (req.cookies.get("jl_paid")?.value === "1" ||
      req.cookies.get("jl_admin")?.value === "1");

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // Wenn nicht eingeloggt und nicht auf einer freien Seite → auf /login schicken
  if (!hasSession && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Sonst normal weiter
  return NextResponse.next();
}

// Auf alle Seiten anwenden (außer _next & favicon)
export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
