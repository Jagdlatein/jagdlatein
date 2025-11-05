// middleware.js (Projekt-Root)
import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const path = url.pathname;
  const isProtected = path.startsWith("/quiz") || path.startsWith("/glossar");

  if (!isProtected) return NextResponse.next();

  const access = req.cookies.get("access")?.value;
  if (access === "pro") return NextResponse.next();

  // Kein Zugang -> Preise mit Hinweis
  url.pathname = "/preise";
  url.search = "?needAccess=1";
  return NextResponse.redirect(url);
}

// optional: nur bestimmte Pfade prüfen
export const config = {
  matcher: ["/quiz/:path*", "/glossar/:path*"],
};
