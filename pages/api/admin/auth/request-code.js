import { sendLoginCode } from "../../../../lib/email";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ ok: false, error: "Missing email or code" });
  }

  try {
    await sendLoginCode(email, code);
    return res.json({ ok: true });
  } catch (err) {
    console.error("MAIL ERROR:", err);
    return res.status(500).json({ ok: false, error: "Failed to send email" });
  }
}
