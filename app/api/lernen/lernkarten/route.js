import { getSignedAccountAccess } from "../../../../lib/account-access";
import { getFlashcardExport } from "../../../../lib/learning-flashcards";
import { packFlashcards } from "../../../../lib/flashcard-payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const response = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" } });
export async function GET(req) {
  try {
    const account = await getSignedAccountAccess(req);
    if (!account) return response({ message: "Bitte anmelden, um alle Lernkarten zu laden." }, 401);
    if (!account.paid && !account.admin) return response({ message: "Für die Lernkarten ist ein aktiver Zugang erforderlich." }, 403);
    return response(packFlashcards(getFlashcardExport()));
  } catch { return response({ message: "Die Lernkarten sind vorübergehend nicht verfügbar." }, 503); }
}
