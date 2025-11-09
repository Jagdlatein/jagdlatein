// pages/api/admin/auth/request-code.js
import { sendLoginCode } from "../../../lib/email";

/**
 * Erwartet POST { email: string }
 * Sendet einen 6-stelligen Code per E-Mail.
 * Hinweis: Hier wird KEIN Code in der DB gespeichert – das ist bewusst minimal,
 * damit der Build wieder läuft. Die Verifizierung machst du in einem zweiten
 * Schritt (z.B. /api/admin/auth/verify-code) mit DB oder temporärem Store.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const { email } = req.body || {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ ok: false, error: "E-Mail fehlt oder ist ungültig" });
    }

    // 6-stelligen Code generieren
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // E-Mail senden
    await sendLoginCode(email, code);

    // Für lokale Tests kann man den Code zurückgeben (unsicher!):
    // Setze in Vercel ENV z.B. MAIL_RETURN_CODE=true wenn du das brauchst.
    const returnCode = process.env.MAIL_RETURN_CODE === "true";

    return res.status(200).json({
      ok: true,
      message: "Login-Code gesendet",
      ...(returnCode ? { debug_code: code } : {}),
    });
  } catch (err) {
    console.error("request-code error:", err);
    return res.status(500).json({ ok: false, error: "Mail-Versand fehlgeschlagen" });
  }
}
