import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

const PUBLIC_PATHS = ["/", "/login", "/preise"];

export async function middleware(req) {
  const res = NextResponse.next();
  const url = req.nextUrl.clone();
  const { pathname } = url;

  // Supabase Client initialisieren
  const supabase = createMiddlewareClient({ req, res });

  // Supabase-Session abrufen
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // ❌ Nicht eingeloggt → Login erzwingen
  if (!session && !isPublic) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Wenn eingeloggt → Premium prüfen
  if (session) {
    const { data: user } = await supabase
      .from("User")
      .select("is_premium")
      .eq("id", session.user.id)
      .single();

    const isPremium = user?.is_premium === true;

    // ❌ Eingeloggt aber kein Premium → Preise
    if (!isPremium && !isPublic && pathname !== "/preise") {
      url.pathname = "/preise";
      return NextResponse.redirect(url);
    }
  }

  // Alles ok
  return res;
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
