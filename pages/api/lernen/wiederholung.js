import { getSignedAccountAccess } from "../../../lib/account-access";
import { getDailyReviewQuestions } from "../../../lib/daily-review-pool";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Vary", "Cookie");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Bitte die Wiederholungsfragen über die Lernrunde laden." });
  }
  try {
    // The same signed paid/admin access check as the central learning search.
    const account = await getSignedAccountAccess(req);
    if (!account) return res.status(401).json({ message: "Bitte anmelden, um deine Lernrunde zu laden." });
    if (!account.paid && !account.admin) return res.status(403).json({ message: "Für die Lernrunde ist ein aktiver Zugang erforderlich." });
    if (Object.keys(req.query || {}).some(key => key !== "ids") || typeof req.query?.ids !== "string" || req.query.ids.length > 1287) {
      return res.status(400).json({ message: "Diese Fragenauswahl ist ungültig." });
    }
    try {
      const questions = getDailyReviewQuestions(req.query.ids.split(","));
      return res.status(200).json({ questions });
    } catch {
      return res.status(400).json({ message: "Diese Fragenauswahl ist ungültig." });
    }
  } catch {
    return res.status(503).json({ message: "Die Lernrunde ist vorübergehend nicht verfügbar. Bitte erneut versuchen." });
  }
}
