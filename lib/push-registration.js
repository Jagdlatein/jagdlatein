import { createClient } from "@supabase/supabase-js";
import { accountDatabaseOptions } from "./account-session";

export class PushRegistrationError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function invalid(message = "Die Push-Registrierung ist ungültig.") { throw new PushRegistrationError(400, message); }
export function parsePushRegistration(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
  if (Object.hasOwn(value, "token")) {
    if (Object.keys(value).some(key => key !== "token") || typeof value.token !== "string" || !value.token.trim() || value.token.length > 4096 || /[\s\u0000-\u001f\u007f]/.test(value.token.trim())) invalid("Token fehlt");
    return { registration: value.token.trim(), kind: "token", platform: "android", legacy: true };
  }
  if (Object.keys(value).some(key => !["registration", "kind", "platform"].includes(key)) || value.kind !== "fid" || !["web", "ios"].includes(value.platform) || typeof value.registration !== "string" || !/^[A-Za-z0-9_-]{22}$/.test(value.registration)) invalid();
  return { registration: value.registration, kind: "fid", platform: value.platform, legacy: false };
}

export const PUSH_REQUEST_DEFAULT_MAX_BYTES = 8192;
export const PUSH_REQUEST_READ_TIMEOUT_MS = 8000;
// Only genuine locally-created interruption errors gain the new408 mapping.
const pushReadInterruptionErrors = new WeakSet();
function pushReadInterrupted(message) {
  const error = new PushRegistrationError(408, message);
  pushReadInterruptionErrors.add(error);
  return error;
}
function pushReadCancelled() {
  return pushReadInterrupted("Die Anfrage wurde abgebrochen. Bitte versuche es erneut.");
}
export function assertPushRequestActive(req) {
  if (req.signal?.aborted) throw pushReadCancelled();
}

export async function readPushJson(req, maxBytes = PUSH_REQUEST_DEFAULT_MAX_BYTES) {
  let reader, timer, abort, didCancel = false;
  const ownErrors = new WeakSet();
  const own = error => { ownErrors.add(error); return error; };
  const tooLarge = () => own(new PushRegistrationError(413, "Die Push-Anfrage ist zu umfangreich."));
  const cancel = () => {
    if (!reader || didCancel) return;
    didCancel = true;
    // Cleanup may stall or reject; do not delay or replace this response.
    try { Promise.resolve(reader.cancel()).catch(() => {}); } catch {}
  };
  try {
    assertPushRequestActive(req);
    const declared = req.headers.get("content-length");
    if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) throw tooLarge();
    if (req.body?.getReader) reader = req.body.getReader();
    assertPushRequestActive(req);
    const interruption = new Promise((_, reject) => {
      timer = setTimeout(() => reject(own(pushReadInterrupted("Die Übertragung hat zu lange gedauert. Bitte versuche es erneut."))), PUSH_REQUEST_READ_TIMEOUT_MS);
      abort = () => reject(own(pushReadCancelled()));
      req.signal?.addEventListener("abort", abort, { once: true });
    });
    void interruption.catch(() => {});
    if (req.signal?.aborted) abort();
    let raw = "";
    if (reader) {
      // Preserve the original nonfatal UTF8/BOM decoder and wire-byte limit.
      const decoder = new TextDecoder(); let bytes = 0;
      for (;;) {
        assertPushRequestActive(req);
        const part = await Promise.race([reader.read(), interruption]);
        assertPushRequestActive(req);
        if (part.done) break;
        bytes += part.value.byteLength;
        if (bytes > maxBytes) throw tooLarge();
        raw += decoder.decode(part.value, { stream: true });
      }
      raw += decoder.decode();
    } else {
      assertPushRequestActive(req);
      raw = await Promise.race([req.text(), interruption]);
      assertPushRequestActive(req);
      // This existing fallback counts the returned string reencoded as UTF8.
      if (Buffer.byteLength(raw, "utf8") > maxBytes) throw tooLarge();
    }
    assertPushRequestActive(req);
    let body;
    try { body = JSON.parse(raw); } catch { throw own(new PushRegistrationError(400, "Die Push-Anfrage ist ungültig.")); }
    assertPushRequestActive(req);
    return body;
  } catch (error) {
    assertPushRequestActive(req);
    if (ownErrors.has(error)) throw error;
    // An arbitrary transport error cannot choose a public status or message.
    throw new Error("Die Push-Anfrage konnte nicht gelesen werden.");
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (abort) req.signal?.removeEventListener("abort", abort);
    cancel();
    if (reader) try { reader.releaseLock(); } catch { /* A raced read may still settle. */ }
  }
}
export function pushJson(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store", Vary: "Cookie", "X-Content-Type-Options": "nosniff" } });
}
export function getPushDatabase(session) {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, accountDatabaseOptions(session));
}
export function isPushActorError(error) { return error?.code === "P0001" && /JL_ACCOUNT_GENERATION_MISMATCH/.test(error.message || ""); }
export function isPushSchemaError(error) { return ["42P01", "42703", "PGRST204", "PGRST205"].includes(error?.code); }
export function pushErrorResponse(error, fallback = "Serverfehler") {
  const status = error?.status === 408 && pushReadInterruptionErrors.has(error) ? 408
    : [400, 401, 403, 409, 413, 415, 503].includes(error?.status) ? error.status : 500;
  return pushJson({ success: false, error: status === 500 ? fallback : error.message }, status);
}

export function parsePushMessage(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some(key => !["title", "body", "platform", "href"].includes(key))) invalid("Titel und Nachricht sind erforderlich");
  const { title, body, platform = "all", href = "/lernen" } = value;
  if (typeof title !== "string" || typeof body !== "string" || !title.trim() || !body.trim() || title.length > 200 || body.length > 2000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(title + body)) invalid("Titel und Nachricht sind erforderlich");
  if (!["all", "android", "ios", "web"].includes(platform)) invalid("Bitte eine gültige Geräteauswahl wählen.");
  if (typeof href !== "string" || href.length > 500 || !href.startsWith("/") || href.startsWith("//") || /[\\\s\u0000-\u001f\u007f]/.test(href)) invalid("Bitte einen internen Jagdlatein-Link verwenden.");
  let target;
  try { target = new URL(href, "https://jagdlatein.de"); } catch { invalid(); }
  let decodedPath;
  try { decodedPath = decodeURIComponent(target.pathname); } catch { invalid("Bitte einen internen Jagdlatein-Link verwenden."); }
  if (target.origin !== "https://jagdlatein.de" || /[\\\u0000-\u001f\u007f]/.test(decodedPath)) invalid("Bitte einen internen Jagdlatein-Link verwenden.");
  return { title: title.trim(), body: body.trim(), platform, href: target.pathname + target.search + target.hash, link: target.href };
}

export function pushDeliveryGroups(rows, selectedPlatform = "all") {
  const groups = new Map(), seen = new Set();
  for (const row of rows) {
    const kind = row.registration_kind || "token";
    const platform = row.platform || (kind === "token" ? "android" : "");
    if (!["android", "ios", "web"].includes(platform) || selectedPlatform !== "all" && selectedPlatform !== platform || !["token", "fid"].includes(kind) || kind === "fid" && !["ios", "web"].includes(platform) || kind === "token" && platform !== "android") continue;
    if (typeof row.token !== "string" || !row.token.length || row.token.length > 4096 || /[\s\u0000-\u001f\u007f]/.test(row.token) || kind === "fid" && !/^[A-Za-z0-9_-]{22}$/.test(row.token)) continue;
    const id = `${kind}:${row.token}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const key = `${kind}:${platform}`;
    if (!groups.has(key)) groups.set(key, { kind, platform, rows: [] });
    groups.get(key).rows.push(row);
  }
  return [...groups.values()];
}
export function pushMulticastPayload(message, group, recipients) {
  const payload = { [group.kind === "fid" ? "fids" : "tokens"]: recipients, notification: { title: message.title, body: message.body }, data: { url: message.href } };
  if (group.platform === "android") payload.android = { priority: "high", notification: { sound: "default" } };
  if (group.platform === "ios") payload.apns = { headers: { "apns-push-type": "alert", "apns-priority": "10" }, payload: { aps: { sound: "default" } } };
  if (group.platform === "web") payload.webpush = { fcmOptions: { link: message.link }, notification: { icon: "https://jagdlatein.de/android_192.png" } };
  return payload;
}
