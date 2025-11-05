// pages/api/access/revoke.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Set-Cookie", `access=; Path=/; Max-Age=0; SameSite=Lax; Secure`);
  res.status(200).json({ ok: true });
}
