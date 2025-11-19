// /lib/auth-check.js
// Prüft, ob der Benutzer das Premium-Quiz freigeschaltet hat

export function hasPaidAccessFromCookies(req) {
  // Cookie-String auslesen
  const cookie = req.headers.cookie || "";

  // Premium-Zugang wird über Cookie gesteuert
  // Beispiel: paid_access=true
  return cookie.includes("paid_access=true");
}
