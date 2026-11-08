import { requireAccountSession, getAccountDatabase, requireCurrentAccount } from "./course-progress-server";
import { USAGE_UUID, validateUsageBatch, validUsageConsentVersion } from "./usage-analytics";

export class UsageAnalyticsError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}
export function usageJson(body, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store, max-age=0", "CDN-Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "no-store", Vary: "Cookie, Origin", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff" } });
}
export function usageError(error) {
  const status = error instanceof UsageAnalyticsError ? error.status : error?.status === 401 ? 401 : 503;
  return usageJson({ code: error instanceof UsageAnalyticsError ? error.code : status === 401 ? "SESSION_RENEWAL_REQUIRED" : "USAGE_UNAVAILABLE", message: status === 401 ? "Bitte melde dich erneut an." : "Die Website-Statistik ist gerade nicht verfügbar. Bitte erneut versuchen." }, status);
}
export function usageRpcFailure(error) {
  if (/JL_USAGE_IDENTITY|JL_ACCOUNT_GENERATION_MISMATCH/.test(error?.message || "")) return new UsageAnalyticsError("SESSION_RENEWAL_REQUIRED", 401);
  return new UsageAnalyticsError("USAGE_UNAVAILABLE", 503);
}
export function requireUsageOrigin(req) {
  try {
    const origin = new URL(req.headers.get("origin"));
    if (origin.origin !== new URL(req.url).origin || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) throw new Error();
    const site = req.headers.get("sec-fetch-site");
    if (site && site !== "same-origin") throw new Error();
  } catch { throw new UsageAnalyticsError("INVALID_ORIGIN", 403); }
  if ((req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() !== "application/json") throw new UsageAnalyticsError("INVALID_CONTENT_TYPE", 415);
}
export async function readUsageBody(req, maxBytes = 4096) {
  const claimed = req.headers.get("content-length");
  if (claimed !== null && (!/^\d+$/.test(claimed) || Number(claimed) > maxBytes)) throw new UsageAnalyticsError("BODY_TOO_LARGE", 413);
  if (!req.body?.getReader) throw new UsageAnalyticsError("INVALID_BODY");
  const reader = req.body.getReader(); let size = 0, timer; const chunks = [];
  const cancel = () => { try { Promise.resolve(reader.cancel()).catch(() => {}); } catch {} };
  const deadline = new Promise((_, reject) => { timer = setTimeout(() => { reject(new UsageAnalyticsError("BODY_TIMEOUT", 408)); cancel(); }, 8000); });
  try {
    for (;;) {
      const { value, done } = await Promise.race([reader.read(), deadline]); if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { cancel(); throw new UsageAnalyticsError("BODY_TOO_LARGE", 413); }
      chunks.push(value);
    }
  } finally { clearTimeout(timer); try { reader.releaseLock(); } catch {} }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new UsageAnalyticsError("INVALID_BODY"); }
}
export async function usageAccount(req) {
  const session = requireAccountSession(req);
  if (!USAGE_UUID.test(session.accountGeneration || "")) throw new UsageAnalyticsError("SESSION_RENEWAL_REQUIRED", 401);
  const database = getAccountDatabase("ACCOUNT_UNAVAILABLE", session);
  await requireCurrentAccount(database, session);
  return { session, database };
}
export async function readUsagePreference(database, session) {
  const { data, error } = await database.from("userprofile").select("email,account_generation,usage_analytics_opt_in,usage_analytics_changed_at")
    .ilike("email", session.email.replace(/[\\%_]/g, "\\$&")).maybeSingle();
  if (error) throw new UsageAnalyticsError("USAGE_NOT_CONFIGURED", 503);
  if (!data || data.email.toLowerCase().trim() !== session.email || data.account_generation !== session.accountGeneration) throw new UsageAnalyticsError("SESSION_RENEWAL_REQUIRED", 401);
  if (typeof data.usage_analytics_opt_in !== "boolean") throw new UsageAnalyticsError("USAGE_NOT_CONFIGURED", 503);
  if (!validUsageConsentVersion(data.usage_analytics_changed_at)) throw new UsageAnalyticsError("USAGE_NOT_CONFIGURED", 503);
  return { enabled: data.usage_analytics_opt_in, accountKey: session.accountGeneration.toLowerCase(), consentVersion: data.usage_analytics_changed_at };
}
export function validateUsagePreference(body, session) {
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 3 || Object.keys(body).some(key => !["enabled", "accountKey", "expectedRevision"].includes(key)) || typeof body.enabled !== "boolean" || body.accountKey !== session.accountGeneration.toLowerCase() || !validUsageConsentVersion(body.expectedRevision)) throw new UsageAnalyticsError("INVALID_USAGE_PREFERENCE");
  return body.enabled;
}
export function validatedUsageBatch(body) {
  try { return validateUsageBatch(body); } catch { throw new UsageAnalyticsError("INVALID_USAGE_BATCH"); }
}
export async function confirmUsageAccount(database, session) {
  await requireCurrentAccount(database, session);
  await readUsagePreference(database, session); // Always verify generation, even if an older account feature flag is disabled.
}
export function usageMethod(allow = "POST") { const response = usageJson({ code: "METHOD_NOT_ALLOWED" }, 405); response.headers.set("Allow", typeof allow === "string" ? allow : "POST"); return response; }
