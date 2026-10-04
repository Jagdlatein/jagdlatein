import { getSignedAccountAccess } from "../../../../lib/account-access";
import { searchLearning } from "../../../../lib/learning-search";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const response = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" } });
export async function GET(req) {
  try {
    const account = await getSignedAccountAccess(req);
    if (!account) return response({ message: "Bitte anmelden, um alle Lerninhalte zu durchsuchen." }, 401);
    if (!account.paid && !account.admin) return response({ message: "Für die Lernsuche ist ein aktiver Zugang erforderlich." }, 403);
    const params = new URL(req.url).searchParams;
    if ((params.get("q") || "").length > 160) return response({ message: "Bitte einen kürzeren Suchbegriff verwenden." }, 400);
    try { return response(searchLearning({ query: params.get("q") || "", category: params.get("category") || "all", type: params.get("type") || "all", country: params.get("country") || "all", page: Number(params.get("page") || 1) })); }
    catch { return response({ message: "Diese Suchauswahl ist ungültig." }, 400); }
  } catch { return response({ message: "Die Suche ist vorübergehend nicht verfügbar. Bitte erneut versuchen." }, 503); }
}
