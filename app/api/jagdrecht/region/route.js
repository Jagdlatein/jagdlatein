import { requirePaidAccount } from "../../../../lib/account-access";
import { getLegalDataset } from "../../../../lib/regional-law-data";
import { buildRegionalLawBundle } from "../../../../lib/regional-law-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (value, status = 200) => Response.json(value, { status,
  headers: { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" } });

export async function GET(req) {
  try {
    await requirePaidAccount(req);
    const params = new URL(req.url).searchParams;
    if (params.getAll("land").length !== 1 || params.getAll("region").length !== 1 || params.getAll("bund").length > 1 ||
      (params.has("bund") && !["0", "1"].includes(params.get("bund")))) return json({ message: "Bitte wähle eine gültige Lernregion." }, 400);
    const country = params.get("land"), code = params.get("region");
    if (country.length > 2 || code.length > 5) return json({ message: "Bitte wähle eine gültige Lernregion." }, 400);
    const dataset = getLegalDataset(country);
    const bundle = dataset && buildRegionalLawBundle(dataset, code, { includeFederal: params.get("bund") !== "0" });
    if (!bundle) return json({ message: "Diese Lernregion ist nicht verfügbar." }, 404);
    return json(bundle);
  } catch (error) {
    const status = [401, 403].includes(error?.status) ? error.status : 503;
    return json({ message: status === 401 ? "Bitte melde dich erneut an." : status === 403
      ? "Für diese Lerninhalte brauchst du einen aktiven Zugang." : "Die Rechtsinhalte sind gerade nicht erreichbar. Bitte erneut laden." }, status);
  }
}
