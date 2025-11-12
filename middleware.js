// middleware.js
import { NextResponse } from "next/server";
export function middleware(req) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const jl = req.cookies.get("jl_admin")?.value;
    if (jl !== "1") {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}
