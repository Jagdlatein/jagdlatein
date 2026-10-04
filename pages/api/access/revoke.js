export default function handler(req, res) {
  res.setHeader("Allow", "POST");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Set-Cookie", "access=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure");
  return res.status(200).json({ ok: true });
}
