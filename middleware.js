import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/preise",
  "/debug-cookies",
  "/paytest",
  "/jagdbuch/erstellen",
];

// Ziel: direkt zum "Jetzt freischalten" Abschnitt springen
// Optional per Env: NEXT_PUBLIC_PAYMENT_URL="/preise#paypal-subscribe-preise"
const PAYMENT_URL =
  process.env.NEXT_PUBLIC_PAYMENT_URL || "/preise#paypal-subscribe-preise";

function redirectToPayment(req, nextPathWithQuery) {
  // PAYMENT_URL kann relativ (mit #hash) oder absolut sein
  const target =
    PAYMENT_URL.startsWith("http://") || PAYMENT_URL.startsWith("https://")
      ? new URL(PAYMENT_URL)
      : new URL(PAYMENT_URL, req.url);

  // Rücksprungziel merken
  target.searchParams.set("next", nextPathWithQuery);

  return NextResponse.redirect(target);
}

export function middleware(req) {
  const pathname = req.nextUrl.pathname;

  // PayPal immer erlauben
  if (pathname.startsWith("/api/paypal")) return NextResponse.next();

  // API NIE blockieren
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // Static Files erlauben
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Session prüfen
  const hasSession = req.cookies.get("jl_session")?.value === "1";
  const hasPaid = req.cookies.get("jl_paid")?.value === "1";
  const isAdmin = req.cookies.get("jl_admin")?.value === "1";

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // gewünschte Zielseite merken (inkl. Query)
  const nextPathWithQuery = `${req.nextUrl.pathname}${req.nextUrl.search}`;

  // 1) NICHT eingeloggt + protected → direkt "Jetzt freischalten" auf /preise
  if (!hasSession && !isPublic) {
    return redirectToPayment(req, nextPathWithQuery);
  }

  // 2) Eingeloggt aber NICHT bezahlt (und kein Admin) + protected → ebenfalls /preise#...
  if (hasSession && !hasPaid && !isAdmin && !isPublic) {
    return redirectToPayment(req, nextPathWithQuery);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|api/).*)"],
};
