import { requirePaidAccount } from "../../../../lib/account-access";
import { createOfflinePack, offlineAccountKey } from "../../../../lib/offline-learning-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const response = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" } });
export async function GET(req) {
  try { const access = await requirePaidAccount(req); return response({ accountKey: offlineAccountKey(access) }); }
  catch (error) { return response({ message: [401, 403].includes(error.status) ? error.message : "Kontozugriff vorübergehend nicht verfügbar." }, [401, 403].includes(error.status) ? error.status : 503); }
}
export async function POST(req) {
  try {
    let origin;
    try { origin = new URL(req.headers.get("origin")).origin; } catch {}
    if (origin !== new URL(req.url).origin) return response({ message: "Diese Anfrage ist nicht erlaubt." }, 403);
    if (!(req.headers.get("content-type") || "").startsWith("application/json")) return response({ message: "Ungültiger Downloadauftrag." }, 415);
    const access = await requirePaidAccount(req);
    const raw = await req.text();
    if (raw.length > 3000) return response({ message: "Zu viele Downloadangaben." }, 413);
    let body; try { body = JSON.parse(raw); } catch { return response({ message: "Ungültiger Downloadauftrag." }, 400); }
    return response({ pack: createOfflinePack(body, access) });
  } catch (error) { return response({ message: [400, 401, 403].includes(error.status) ? error.message : "Der Download ist derzeit nicht verfügbar. Bitte erneut versuchen." }, [400, 401, 403].includes(error.status) ? error.status : 503); }
}
