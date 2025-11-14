// pages/api/admin/auth/check.js

function ok(res, data)  { return res.status(200).json(data); }
function bad(res, msg)  { return res.status(400).json({ ok: false, error: msg }); }

export default async function handler(req, res) {
  if (req.method !== "GET") return bad(res, "GET required");

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  // Admin-Token: entweder fest oder aus ENV
  const VALID = process.env.ADMIN_TOKEN || "DEIN_ADMIN_TOKEN_HIER";

  if (token !== VALID) {
    return res.status(401).json({ ok: false, error: "Admin-Token ungültig" });
  }

  return ok(res, { ok: true });
}
