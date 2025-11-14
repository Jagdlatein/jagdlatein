// pages/api/auth/check.js

function ok(res, data) {
  return res.status(200).json(data);
}
function bad(res, msg) {
  return res.status(400).json({ error: msg });
}

export default async function handler(req, res) {
  if (req.method !== "GET") return bad(res, "GET required");

  const { email } = req.query || {};
  if (!email || typeof email !== "string") {
    return bad(res, "E-Mail ungültig");
  }

  // 👉 HIER jetzt erstmal: immer Zugriff erlauben
  // Später kannst du das mit Prisma & echter Abo-Prüfung ersetzen.
  const hasAccess = true;

  return ok(res, { hasAccess });
}
