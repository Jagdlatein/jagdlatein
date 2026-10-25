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

export async function readPushJson(req, maxBytes = 8192) {
  const declared = req.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) throw new PushRegistrationError(413, "Die Push-Anfrage ist zu umfangreich.");
  let raw = "";
  if (req.body?.getReader) {
    const reader = req.body.getReader(), decoder = new TextDecoder(); let bytes = 0;
    try {
      for (;;) {
        const part = await reader.read(); if (part.done) break;
        bytes += part.value.byteLength;
        if (bytes > maxBytes) { await reader.cancel(); throw new PushRegistrationError(413, "Die Push-Anfrage ist zu umfangreich."); }
        raw += decoder.decode(part.value, { stream: true });
      }
      raw += decoder.decode();
    } finally { reader.releaseLock(); }
  } else {
    raw = await req.text();
    if (Buffer.byteLength(raw, "utf8") > maxBytes) throw new PushRegistrationError(413, "Die Push-Anfrage ist zu umfangreich.");
  }
  try { return JSON.parse(raw); } catch { throw new PushRegistrationError(400, "Die Push-Anfrage ist ungültig."); }
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
  const status = [400, 401, 403, 409, 413, 415, 503].includes(error?.status) ? error.status : 500;
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
