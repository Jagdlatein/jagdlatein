export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { timingSafeEqual } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { isPayPalSandboxTestEnvironment } from "../../../../lib/test-environment";
import { requireCurrentTrialAdmin } from "../../../../lib/admin-trial-overview";
import { requireSameOriginJson } from "../../../../lib/course-progress-server";
import { isPushSchemaError, parsePushMessage, pushDeliveryGroups, pushMulticastPayload, pushJson, pushErrorResponse, readPushJson } from "../../../../lib/push-registration";

const COLUMNS = "token,platform,registration_kind,account_email,updated_at";
const PAGE_SIZE = 500, MAX_RECIPIENTS = 10000;
function isAuthorized(req) {
  const value = req.headers.get("authorization") || "", expected = process.env.ADMIN_PASS || "";
  if (!expected || !value.startsWith("Bearer ")) return false;
  const actualBytes = Buffer.from(value.slice(7)), expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}
function getFirebaseApp() {
  const existing = getApps()[0];
  if (existing) return existing;
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!encoded) throw new Error("Push service unavailable");
  const serviceAccount = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  return initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
}
async function readRecipients(database, platform) {
  const result = [];
  for (let offset = 0; offset <= MAX_RECIPIENTS; offset += PAGE_SIZE) {
    let query = database.from("push_tokens").select(COLUMNS).eq("enabled", true);
    // Preserve previous eligibility for nullable legacy platform records
    // without accepting raw APNs token rows.
    if (platform === "android") query = query.or("platform.eq.android,platform.is.null");
    else if (platform !== "all") query = query.eq("platform", platform);
    const response = await query.order("token", { ascending: true }).range(offset, offset + PAGE_SIZE - 1);
    if (response.error) throw Object.assign(new Error(isPushSchemaError(response.error) ? "Die Push-Plattformen werden noch eingerichtet." : "Push-Empfänger konnten nicht geladen werden."), { status: isPushSchemaError(response.error) ? 503 : 500 });
    if (!Array.isArray(response.data) || response.data.length > PAGE_SIZE || result.length + response.data.length > MAX_RECIPIENTS) throw Object.assign(new Error("Die Empfängerauswahl ist zu groß. Bitte nach Plattform eingrenzen."), { status: 503 });
    result.push(...response.data);
    if (response.data.length < PAGE_SIZE) return result;
  }
  throw Object.assign(new Error("Die Empfängerauswahl ist zu groß."), { status: 503 });
}
function sameSnapshot(left, right) { return left.token === right.token && left.registration_kind === right.registration_kind && left.platform === right.platform && left.account_email === right.account_email && left.updated_at === right.updated_at; }
async function liveBatch(database, group, batch) {
  const result = await database.from("push_tokens").select(COLUMNS).in("token", batch.map(row => row.token)).eq("enabled", true).eq("registration_kind", group.kind);
  if (result.error || !Array.isArray(result.data)) throw new Error("Push recipients unavailable");
  return batch.filter(row => result.data.some(current => sameSnapshot(row, current)));
}
async function disableInvalid(database, group, row) {
  let query = database.from("push_tokens").update({ enabled: false, updated_at: new Date().toISOString() }).eq("token", row.token).eq("registration_kind", group.kind);
  query = row.platform === null ? query.is("platform", null) : query.eq("platform", row.platform);
  query = row.account_email === null ? query.is("account_email", null) : query.eq("account_email", row.account_email);
  query = row.updated_at === null ? query.is("updated_at", null) : query.eq("updated_at", row.updated_at);
  const result = await query.select("token");
  return result.error ? { failed: true, disabled: 0 } : { failed: false, disabled: Array.isArray(result.data) ? result.data.length : 0 };
}

export async function POST(req) {
  let sent = 0, failed = 0, total = 0;
  try {
    if (isPayPalSandboxTestEnvironment()) return Response.json({ success: false, error: "Push ist in der Testumgebung deaktiviert." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    if (!isAuthorized(req)) return pushJson({ success: false, error: "Unauthorized" }, 401);
    requireSameOriginJson(req);
    const { database } = await requireCurrentTrialAdmin(req);
    const message = parsePushMessage(await readPushJson(req));
    const recipients = await readRecipients(database, message.platform);
    await requireCurrentTrialAdmin(req, { database });
    const groups = pushDeliveryGroups(recipients, message.platform);
    if (!groups.length) return pushJson({ success: true, sent: 0, failed: 0, total: 0, disabled: 0 });
    const messaging = getMessaging(getFirebaseApp());
    let disabled = 0, cleanupWarning = false;
    for (const group of groups) {
      for (let offset = 0; offset < group.rows.length; offset += PAGE_SIZE) {
        const batch = await liveBatch(database, group, group.rows.slice(offset, offset + PAGE_SIZE));
        // Current administrator status and each recipient's opt-in snapshot must
        // still be valid just before crossing the provider boundary.
        await requireCurrentTrialAdmin(req, { database });
        if (!batch.length) continue;
        const result = await messaging.sendEachForMulticast(pushMulticastPayload(message, group, batch.map(row => row.token)));
        if (!Array.isArray(result.responses) || result.responses.length !== batch.length || !Number.isInteger(result.successCount) || !Number.isInteger(result.failureCount) || result.successCount + result.failureCount !== batch.length) throw new Error("Invalid messaging response");
        sent += result.successCount; failed += result.failureCount; total += batch.length;
        const invalid = batch.filter((row, index) => !result.responses[index].success && ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"].includes(result.responses[index].error?.code));
        for (const row of invalid) {
          const cleanup = await disableInvalid(database, group, row);
          disabled += cleanup.disabled; cleanupWarning ||= cleanup.failed;
        }
      }
    }
    return pushJson({ success: true, sent, failed, total, disabled, ...(cleanupWarning ? { warning: "Ungültige Empfänger konnten noch nicht deaktiviert werden." } : {}) });
  } catch (error) {
    if (![400, 401, 403, 413, 415, 503].includes(error?.status)) console.error("Push Versand fehlgeschlagen.");
    if (total > 0) return pushJson({ success: false, error: "Die Nachricht wurde nur teilweise versendet. Bitte vor erneutem Versand prüfen.", sent, failed, total }, [401, 403, 503].includes(error?.status) ? error.status : 500);
    return pushErrorResponse(error, "Die Nachricht konnte nicht vollständig versendet werden.");
  }
}
