import { getSignedAccountAccess } from "../../../../lib/account-access";
import { getFlashcardExport } from "../../../../lib/learning-flashcards";
import { packFlashcards } from "../../../../lib/flashcard-payload";
import { readFlashcardSelection } from "../../../../lib/flashcard-selection";
import { readFlashcardPageRequest } from "../../../../lib/flashcard-paging";
import { getFlashcardSnapshot } from "../../../../lib/flashcard-snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const response = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" } });
export async function GET(req) {
  try {
    const account = await getSignedAccountAccess(req);
    if (!account) return response({ message: "Bitte anmelden, um alle Lernkarten zu laden." }, 401);
    if (!account.paid && !account.admin) return response({ message: "Für die Lernkarten ist ein aktiver Zugang erforderlich." }, 403);
    const query = new URL(req.url).searchParams;
    const selection = readFlashcardSelection(query);
    if (selection?.invalid) return response({ message: "Die Lernkartenauswahl ist ungültig." }, 400);
    const page = readFlashcardPageRequest(query);
    if (page?.invalid) return response({ message: "Das Lernkartenpaket ist ungültig." }, 400);
    const data = getFlashcardExport(selection);
    if (page) {
      const snapshot = getFlashcardSnapshot(data);
      if (page.revision !== snapshot.manifest.revision) return response({ message: "Der Lernkartenbestand wurde aktualisiert. Bitte öffne diese Seite neu." }, 409);
      if (!snapshot.parts[page.part]) return response({ message: "Das Lernkartenpaket wurde nicht gefunden." }, 400);
      return response(snapshot.parts[page.part]);
    }
    const packed = packFlashcards(data);
    if (Buffer.byteLength(JSON.stringify(packed), "utf8") > 3 * 1024 * 1024) return response({ message: "Bitte öffne die Lernkartenseite neu, um den gewachsenen Bestand zu laden." }, 409);
    return response(packed);
  } catch { return response({ message: "Die Lernkarten sind vorübergehend nicht verfügbar." }, 503); }
}
