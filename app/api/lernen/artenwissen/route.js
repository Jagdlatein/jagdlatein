import { requirePaidAccount } from "../../../../lib/account-access";
import { getWildlifeStudyContent } from "../../../../lib/wildlife-study-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (body, status = 200) => Response.json(body, { status,
  headers: { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" } });

export async function GET(req) {
  try {
    await requirePaidAccount(req);
    const params = new URL(req.url).searchParams;
    const slug = params.get("art"), moduleId = params.get("kurs");
    if (params.getAll("art").length !== 1 || params.getAll("kurs").length !== 1 || !slug || !moduleId ||
        slug.length > 80 || moduleId.length > 140) return json({ message: "Bitte wähle eine Wildart und ein zugehöriges Thema." }, 400);
    const content = getWildlifeStudyContent(slug, moduleId);
    return content ? json(content) : json({ message: "Dieses Thema gehört nicht zu dieser Wildart." }, 404);
  } catch (error) {
    const status = [401, 403].includes(error?.status) ? error.status : 503;
    return json({ message: status === 401 ? "Bitte melde dich erneut an." : status === 403 ? "Für dieses Wissen brauchst du einen aktiven Zugang." : "Das Wissen konnte gerade nicht geladen werden. Bitte versuche es erneut." }, status);
  }
}
