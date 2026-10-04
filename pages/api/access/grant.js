// Access can only be granted by the verified payment and account login flows.
export default function handler(req, res) {
  res.setHeader("Allow", "POST");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  return res.status(410).json({ error: "Bitte über die Preisseite bezahlen und mit einem E-Mail-Code anmelden." });
}
