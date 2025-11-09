// pages/api/admin/preview.js
export default async function handler(req, res) {
  // Token aus Header oder Query
  const auth = req.headers.authorization || "";
  const headerKey = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const queryKey  = req.query.key || "";

  const key = headerKey || queryKey;
  if (!key || key !== process.env.ADMIN_PASS) {
    return res.status(401).json({ ok:false, error:"Unauthorized" });
  }

  // Ziel nach Login (Standard: /quiz)
  const to = typeof req.query.to === "string" ? req.query.to : "/quiz";

  // Admin-Preview-Cookie (12h)
  const maxAge = 60 * 60 * 12;
  res.setHeader("Set-Cookie", [
    // Preview-Schalter, Middleware liest diesen Cookie
    `jl_admin=1; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`,
    // Optional: auch „bezahlt“-Cookie für UI (kein HttpOnly, damit Client es lesen kann)
    `jl_paid=1; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`
  ]);

  // Zur Zielseite weiterleiten
  res.writeHead(302, { Location: to });
  res.end();
}
