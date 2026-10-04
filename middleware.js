import { NextResponse } from "next/server";
import { JL_ACCOUNT_COOKIE, readAccountSessionEdge } from "./lib/account-session-edge";
import { learningImagePaths } from "./lib/learning-image-paths";
import { learningAudioPaths } from "./lib/learning-audio-paths";
import { natureAssetPaths } from "./lib/nature-asset-paths";
import { mediaExperienceAssetPaths } from "./lib/media-experience-asset-paths";

const LEARNING_IMAGES = new Set(learningImagePaths);
const LEARNING_AUDIO = new Set(learningAudioPaths);
const EXPERIENCE_ASSETS = new Set([...natureAssetPaths, ...mediaExperienceAssetPaths, "/lernen/offline-sw.js"]);
const APP_ICONS = new Set(["/app-icon.svg", "/android_192.png", "/android_512.png", "/apple_touch_icon.png"]);

const PUBLIC_PATHS = [
  "/",
  "/news",
  "/login",
  "/preise",
  "/debug-cookies",
  "/paytest",
  "/jagdbuch/erstellen",
  // Empty viewer shell; download API separately verifies active account access.
  "/lernen/offline-rucksack",
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

export async function middleware(req) {
  const pathname = req.nextUrl.pathname;

  // PayPal immer erlauben
  if (pathname.startsWith("/api/paypal")) return NextResponse.next();

  // API NIE blockieren
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // Static Files erlauben
  if (
    pathname.startsWith("/_next") ||
    LEARNING_IMAGES.has(pathname) || LEARNING_AUDIO.has(pathname) || EXPERIENCE_ASSETS.has(pathname) || APP_ICONS.has(pathname) ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Session prüfen
  const token = req.cookies.get(JL_ACCOUNT_COOKIE)?.value;
  const session = await readAccountSessionEdge(token);
  const hasSession = Boolean(session);
  let access = session;
  let renewedCookie = null;

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // gewünschte Zielseite merken (inkl. Query)
  const nextPathWithQuery = `${req.nextUrl.pathname}${req.nextUrl.search}`;

  // Existing signed identity sessions are upgraded without losing account data.
  // Refresh permissions regularly so removed subscriptions do not last 40 days.
  if (session && !isPublic && !(session.accessExpiresAt > Math.floor(Date.now() / 1000))) {
    try {
      const check = await fetch(new URL("/api/auth/status", req.url), {
        headers: { Cookie: `${JL_ACCOUNT_COOKIE}=${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      const status = await check.json();
      if (!check.ok) return new NextResponse("Der Kontozugriff ist vorübergehend nicht verfügbar. Bitte erneut versuchen.",
        { status: 503, headers: { "Cache-Control": "private, no-store" } });
      access = status.loggedIn ? { paid: status.paid === true, admin: status.admin === true } : null;
      renewedCookie = check.headers.get("set-cookie");
    } catch {
      return new NextResponse("Der Kontozugriff ist vorübergehend nicht verfügbar. Bitte erneut versuchen.",
        { status: 503, headers: { "Cache-Control": "private, no-store" } });
    }
  }

  function finish(response) {
    if (renewedCookie) response.headers.append("set-cookie", renewedCookie);
    return response;
  }

  // Das eigene Konto bleibt auch ohne aktives Premium erreichbar.
  if (["/konto", "/meine-kurse", "/auswertungen", "/dashboard", "/quiz-app/stats", "/quiz/stats"].includes(pathname)) {
    if (hasSession && access) return finish(NextResponse.next());
    const login = new URL("/login", req.url);
    login.searchParams.set("next", nextPathWithQuery);
    return finish(NextResponse.redirect(login));
  }

  // 1) NICHT eingeloggt + protected → direkt "Jetzt freischalten" auf /preise
  if ((!hasSession || !access) && !isPublic) {
    return finish(redirectToPayment(req, nextPathWithQuery));
  }

  // 2) Eingeloggt aber NICHT bezahlt (und kein Admin) + protected → ebenfalls /preise#...
  if (hasSession && !access?.paid && !access?.admin && !isPublic) {
    return finish(redirectToPayment(req, nextPathWithQuery));
  }

  // Admin pages also require a signed admin entitlement, beyond premium.
  if (pathname.startsWith("/admin") && !access?.admin) {
    return finish(NextResponse.redirect(new URL("/konto", req.url)));
  }
  return finish(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|api/).*)"],
};
