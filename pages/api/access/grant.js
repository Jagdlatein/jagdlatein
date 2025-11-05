// pages/api/access/grant.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Set-Cookie: 180 Tage Zugang
  const maxAge = 60 * 60 * 24 * 180;
  res.setHeader("Set-Cookie", [
    `access=pro; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`,
  ]);
  return res.status(200).json({ ok: true });
}
