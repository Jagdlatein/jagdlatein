// pages/api/admin/logout.js
export const config = { api: { bodyParser: false }, runtime: "nodejs" };

export default function handler(req, res) {
  // 🔥 richtige Logout-Cookies löschen
  res.setHeader("Set-Cookie", [
    "jl_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    "jl_paid=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    "jl_email=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    "jl_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
  ]);

  return res.status(200).json({ ok: true });
}
