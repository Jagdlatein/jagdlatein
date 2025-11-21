import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(req) {
  const res = NextResponse.next();
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  const PUBLIC = ["/", "/login", "/preise"];
  const isPublic = PUBLIC.includes(pathname);

  // Supabase Client für Edge Middleware
  const supabase = createMiddlewareClient({ req, res });

  // Session laden
  const { data: { session } } = await supabase.auth.getSession();

  // 1. Nicht eingeloggt
  if (!session && !isPublic) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2. Premium prüfen
  if (session) {
    const userId = session.user.id;

    const { data: profile } = await supabase
      .from("userprofile")
      .select("is_premium")
      .eq("user_id", userId)
      .maybeSingle();

    const isPremium = profile?.is_premium === true;

    if (!isPremium && !isPublic && pathname !== "/preise") {
      url.pathname = "/preise";
      return NextResponse.redirect(url);
    }
  }

  return res;
}
