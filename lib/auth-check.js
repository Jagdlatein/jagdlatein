// /lib/auth-check.js
// Prüft Premium-Zugang anhand der Cookies, die login.js wirklich setzt

export function hasPaidAccessFromCookies(req) {
  const cookie = req.headers.cookie || "";

  // Login setzt jl_paid=1 → das prüfen wir
  return cookie.includes("jl_paid=1");
}
