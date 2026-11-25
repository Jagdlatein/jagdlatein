import { requirePaidAccount } from "../../../../lib/account-access";
import { createOfflinePack, offlineAccountKey } from "../../../../lib/offline-learning-server";
import { assertOfflineRequestActive, OfflineRequestBodyError, OFFLINE_REQUEST_MAX_BYTES, readOfflineRequestBody } from "../../../../lib/offline-request-body";
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
    assertOfflineRequestActive(req);
    const declared = req.headers.get("content-length");
    if (declared !== null && (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared)) || Number(declared) > OFFLINE_REQUEST_MAX_BYTES)) return response({ message: "Zu viele Downloadangaben." }, 413);
    const raw = await readOfflineRequestBody(req);
    assertOfflineRequestActive(req);
    if (raw.length > 3000) return response({ message: "Zu viele Downloadangaben." }, 413);
    let body; try { body = JSON.parse(raw); } catch { assertOfflineRequestActive(req); return response({ message: "Ungültiger Downloadauftrag." }, 400); }
    assertOfflineRequestActive(req);
    return response({ pack: createOfflinePack(body, access) });
  } catch (error) {
    if (error instanceof OfflineRequestBodyError) return response({ message: error.message }, error.status);
    return response({ message: [400, 401, 403].includes(error?.status) ? error.message : "Der Download ist derzeit nicht verfügbar. Bitte erneut versuchen." }, [400, 401, 403].includes(error?.status) ? error.status : 503);
  }
}
