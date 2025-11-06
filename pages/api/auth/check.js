// pages/api/auth/check.js
export default async function handler(req, res) {
  // Platzhalter: hier könntest du künftig DB-basiert prüfen, ob ein Nutzer Zugang hat.
  return res.status(200).json({ ok: true, provider: "paypal", access: "granted" });
}
