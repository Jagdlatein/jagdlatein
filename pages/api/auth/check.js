// pages/api/auth/check.js

export default function handler(req, res) {
  const { email } = req.query;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "E-Mail ungültig" });
  }

  // ❗ VORÜBERGEHEND: Jeder hat Zugang (für Test)
  return res.status(200).json({
    hasAccess: true,
  });
}
