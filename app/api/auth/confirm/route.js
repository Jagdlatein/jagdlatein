import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// The former link flow did not validate its token. All logins use a one-time email code.
export function GET(req) {
  const destination = new URL("/login", req.url);
  const next = new URL(req.url).searchParams.get("next");
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//") &&
    !/[\\\u0000-\u001f\u007f]/.test(next)) destination.searchParams.set("next", next);
  return NextResponse.redirect(destination, { status: 303 });
}
