import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

// Edge functions require explicit runtime:
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(req) {
  const res = NextResponse.next();

  const supabase = createMiddlewareClient({ req, res });

  // Session holen
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  const PUBLIC = ["/", "/login", "/preise"];
  const path = req.nextUrl.pathname;
  const isPublic = PUBLIC.includes(path);

  // 1. Nicht eingeloggt
  if (!session && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2. Premium prüfen
  if (session) {
    const userId = session.user.id;

    const { data: profile, error: profileError } = await supabase
      .from("userprofile")
      .select("is_premium")
      .eq("user_id", userId)
      .maybeSingle();

    const isPremium = profile?.is_premium === true;

    if (!isPremium && !isPublic && path !== "/preise") {
      const url = req.nextUrl.clone();
      url.pathname = "/preise";
      return NextResponse.redirect(url);
    }
  }

  return res;
}
