// pages/api/admin/logout.js
export const config = { api: { bodyParser: false }, runtime: "nodejs" };

export default function handler(req, res) {
  // Cookie löschen
  res.setHeader("Set-Cookie", [
    "admin_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
  ]);
  return res.status(200).json({ ok: true });
}
