// middleware.js
import { NextResponse } from "next/server";

const PROTECTED = [/^\/quiz(?:\/|$)/, /^\/glossar(?:\/|$)/];
const ADMIN_ONLY = [/^\/admin(?:\/|$)/, /^\/api\/admin(?:\/|$)/, /^\/api\/glossar\/import(?:\/|$)/];

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const hasSession = req.cookies.get("jl_session")?.value === "1";
  const hasPaid    = req.cookies.get("jl_paid")?.value === "1";
  const isAdmin    = req.cookies.get("jl_admin")?.value === "1";
  const authed     = hasSession && (hasPaid || isAdmin);

  // Admin
  for (const re of ADMIN_ONLY) {
    if (re.test(pathname)) {
      if (!isAdmin) {
        if (isApi) {
          return new NextResponse(JSON.stringify({ ok:false, error:"Unauthorized" }), {
            status: 401, headers: { "content-type": "application/json" }
          });
        }
        const url = req.nextUrl.clone();
        url.pathname = "/login"; url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }
  }

  // Quiz/Glossar
  for (const re of PROTECTED) {
    if (re.test(pathname)) {
      if (!authed) {
        if (isApi) {
          return new NextResponse(JSON.stringify({ ok:false, error:"Unauthorized" }), {
            status: 401, headers: { "content-type": "application/json" }
          });
        }
        const url = req.nextUrl.clone();
        url.pathname = "/login"; url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images/|assets/).*)"],
};
