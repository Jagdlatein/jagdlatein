import { createClient } from "@supabase/supabase-js";
import { readRequestAccountSession } from "./account-access";
import { accountDatabaseOptions, isAccountSessionConfigured, isAccountGenerationEnabled, matchesAccountGeneration } from "./account-session";
import { communityCategories, communityRulesVersion } from "./community-catalog";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const maxBodyBytes = 18000;
class CommunityError extends Error {
  constructor(code, status, message) { super(message); this.code = code; this.status = status; }
}
function fail(code, status, message) { throw new CommunityError(code, status, message); }
function setupRequired() { return new CommunityError("COMMUNITY_SETUP_REQUIRED", 503, "Die Community wird gerade vorbereitet. Bitte später erneut versuchen."); }
export function communityJson(body, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store", Vary: "Cookie", "X-Content-Type-Options": "nosniff" } });
}
export function communityErrorResponse(error) {
  const safe = error instanceof CommunityError ? error : new CommunityError("COMMUNITY_UNAVAILABLE", 503, "Die Community ist gerade nicht erreichbar. Bitte später erneut versuchen.");
  return communityJson({ code: safe.code, message: safe.message, ...(safe.code === "COMMUNITY_SETUP_REQUIRED" ? { setupRequired: true } : {}) }, safe.status);
}
export function requireCommunityOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin || origin !== new URL(req.url).origin) fail("INVALID_ORIGIN", 403, "Diese Anfrage ist nicht erlaubt.");
  if ((req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() !== "application/json") fail("INVALID_CONTENT_TYPE", 415, "Bitte die Anfrage als JSON senden.");
}
export async function readCommunityBody(req) {
  const claimed = req.headers.get("content-length");
  if (claimed && (!/^\d+$/.test(claimed) || Number(claimed) > maxBodyBytes)) fail("BODY_TOO_LARGE", 413, "Die Anfrage ist zu groß.");
  if (!req.body) fail("INVALID_REQUEST", 400, "Die Anfrage enthält keine Daten.");
  const reader = req.body.getReader(); const chunks = []; let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBodyBytes) { await reader.cancel(); fail("BODY_TOO_LARGE", 413, "Die Anfrage ist zu groß."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks.map(value => Buffer.from(value))).toString("utf8")); }
  catch { fail("INVALID_REQUEST", 400, "Die Anfrage enthält ungültige Daten."); }
}
function onlyKeys(body, keys) {
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some(key => !keys.includes(key))) fail("INVALID_REQUEST", 400, "Die Anfrage enthält ungültige Angaben.");
}
function id(value) { if (typeof value !== "string" || !UUID.test(value)) fail("INVALID_REQUEST", 400, "Die Beitragskennung ist ungültig."); return value.toLowerCase(); }
function text(value, min, max, field) {
  if (typeof value !== "string") fail("INVALID_REQUEST", 400, `${field} fehlt.`);
  const normalized = value.trim().normalize("NFC");
  if (normalized.length < min || normalized.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(normalized)) fail("INVALID_REQUEST", 400, `${field}: bitte ${min} bis ${max} Zeichen verwenden.`);
  return normalized;
}
export function validateCommunityWrite(method, body) {
  if (method === "DELETE") { onlyKeys(body, ["postId"]); return { action: "delete", postId: id(body.postId) }; }
  if (method === "POST" && body?.action === "profile") {
    onlyKeys(body, ["action", "displayName", "acceptedRules"]);
    const displayName = text(body.displayName, 3, 30, "Lernname").replace(/\s+/g, " ");
    if (!/^[\p{L}\p{N}][\p{L}\p{N} ._-]{2,29}$/u.test(displayName) || /^(admin|moderator|jagdlatein|support)(?:\b|[_-])/i.test(displayName)) fail("INVALID_NAME", 400, "Bitte einen Lernnamen aus Buchstaben, Ziffern, Leerzeichen, Punkt, Unterstrich oder Bindestrich wählen.");
    if (body.acceptedRules !== true) fail("RULES_REQUIRED", 400, "Bitte die Community-Regeln akzeptieren.");
    return { action: "profile", displayName, acceptedRules: true, rulesVersion: communityRulesVersion };
  }
  if (method === "POST" && body?.action === "post") {
    onlyKeys(body, ["action", "category", "type", "title", "body", "acceptedRules"]);
    if (!communityCategories.some(category => category.slug === body.category) || !["question", "discussion"].includes(body.type)) fail("INVALID_REQUEST", 400, "Bitte Kategorie und Beitragsart wählen.");
    if (body.acceptedRules !== true) fail("RULES_REQUIRED", 400, "Bitte die Community-Regeln beachten und bestätigen.");
    return { action: "post", category: body.category, type: body.type, title: text(body.title, 8, 140, "Titel"), body: text(body.body, 10, 6000, "Beitrag"), acceptedRules: true };
  }
  if (method === "POST" && body?.action === "reply") {
    onlyKeys(body, ["action", "threadId", "body", "acceptedRules"]);
    if (body.acceptedRules !== true) fail("RULES_REQUIRED", 400, "Bitte die Community-Regeln beachten und bestätigen.");
    return { action: "reply", threadId: id(body.threadId), body: text(body.body, 2, 4000, "Antwort"), acceptedRules: true };
  }
  if (method === "POST" && body?.action === "report") {
    onlyKeys(body, ["action", "postId", "reason"]);
    return { action: "report", postId: id(body.postId), reason: text(body.reason, 3, 1000, "Meldungsgrund") };
  }
  if (method === "PATCH" && body?.action === "moderate") {
    onlyKeys(body, ["action", "postId", "status"]);
    if (!["hidden", "visible"].includes(body.status)) fail("INVALID_REQUEST", 400, "Der Moderationsstatus ist ungültig.");
    return { action: "moderate", postId: id(body.postId), status: body.status };
  }
  if (method === "PATCH" && body?.action === "resolve-report") {
    onlyKeys(body, ["action", "reportId"]); return { action: "resolve-report", reportId: id(body.reportId) };
  }
  if (method === "PATCH" && body?.action === "mark-solved") {
    onlyKeys(body, ["action", "postId", "solved"]);
    if (typeof body.solved !== "boolean") fail("INVALID_REQUEST", 400, "Bitte angeben, ob die Frage geklärt ist.");
    return { action: "mark-solved", postId: id(body.postId), solved: body.solved };
  }
  fail("INVALID_REQUEST", 400, "Diese Community-Aktion ist ungültig.");
}
export function validateCommunityRead(req) {
  const params = new URL(req.url).searchParams;
  const category = params.get("category") || "all"; const query = (params.get("query") || "").trim();
  const type = params.get("type") || "all"; const pageText = params.get("page") || "1";
  if (!/^\d{1,4}$/.test(pageText) || Number(pageText) < 1 || query.length > 160 || /[\u0000-\u001f\u007f]/.test(query)
    || (category !== "all" && !communityCategories.some(value => value.slug === category)) || !["all", "question", "discussion"].includes(type)
    || (params.has("unanswered") && !["0", "1"].includes(params.get("unanswered")))) fail("INVALID_REQUEST", 400, "Die Suchauswahl ist ungültig.");
  const mode = params.get("thread") ? "thread" : params.get("view") === "reports" ? "reports" : "posts";
  return { mode, options: { category, query, type, page: Number(pageText), unanswered: params.get("unanswered") === "1", ...(mode === "thread" ? { threadId: id(params.get("thread")) } : {}) } };
}
function databaseError(error) {
  if (["42P01", "42703", "42883", "PGRST202", "PGRST204", "PGRST205"].includes(error?.code)) throw setupRequired();
  const messages = {
    JL_COMMUNITY_PROFILE: ["PROFILE_REQUIRED", 409, "Bitte zuerst einen Lernnamen wählen und die Community-Regeln akzeptieren."],
    JL_COMMUNITY_NAME: ["NAME_TAKEN", 409, "Dieser Lernname ist bereits vergeben. Bitte einen anderen wählen."],
    JL_COMMUNITY_IMMUTABLE: ["PROFILE_EXISTS", 409, "Dein Lernname ist bereits eingerichtet und kann hier nicht geändert werden."],
    JL_COMMUNITY_AUTH: ["SESSION_RENEWAL_REQUIRED", 401, "Bitte melde dich erneut an."],
    JL_COMMUNITY_FORBIDDEN: ["FORBIDDEN", 403, "Für diese Aktion fehlen dir die Rechte."],
    JL_COMMUNITY_MISSING: ["POST_NOT_FOUND", 404, "Dieser Beitrag ist nicht verfügbar."],
    JL_COMMUNITY_LIMIT: ["RATE_LIMITED", 429, "Bitte warte etwas, bevor du weitere Community-Aktionen ausführst."],
    JL_COMMUNITY_REPORT: ["REPORT_EXISTS", 409, "Du hast diesen Beitrag bereits gemeldet."],
    JL_COMMUNITY_INVALID: ["INVALID_REQUEST", 400, "Die Community-Angaben sind ungültig."],
  };
  const code = Object.keys(messages).find(value => error?.message?.includes(value));
  if (code) { const [safeCode, status, message] = messages[code]; fail(safeCode, status, message); }
  fail("COMMUNITY_UNAVAILABLE", 503, "Die Community ist gerade nicht erreichbar. Bitte später erneut versuchen.");
}
async function identity(req) {
  if (!isAccountSessionConfigured()) fail("COMMUNITY_UNAVAILABLE", 503, "Die Anmeldung ist gerade nicht verfügbar.");
  const session = readRequestAccountSession(req);
  if (!session) fail("SESSION_RENEWAL_REQUIRED", 401, "Bitte melde dich an, um die Community zu öffnen.");
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) fail("COMMUNITY_UNAVAILABLE", 503, "Die Community ist gerade nicht erreichbar.");
  const database = createClient(url, key, accountDatabaseOptions(session));
  const profile = await database.from("userprofile").select("email,is_admin" + (isAccountGenerationEnabled() ? ",account_generation" : "")).ilike("email", session.email.replace(/[\\%_]/g, "\\$&")).maybeSingle();
  if (profile.error) databaseError(profile.error);
  if (!profile.data || profile.data.email.trim().toLowerCase() !== session.email || !matchesAccountGeneration(profile.data, session)) fail("SESSION_RENEWAL_REQUIRED", 401, "Bitte melde dich erneut an.");
  const communityProfile = await database.from("community_profiles").select("display_name,rules_accepted_at").eq("account_email", session.email).maybeSingle();
  if (communityProfile.error) databaseError(communityProfile.error);
  return { database, email: session.email, viewer: { displayName: communityProfile.data?.display_name || null, admin: profile.data.is_admin === true, profileRequired: !communityProfile.data } };
}
function publicPost(post) {
  if (!post || typeof post.id !== "string" || !UUID.test(post.id)) fail("COMMUNITY_UNAVAILABLE", 503, "Die Community ist gerade nicht erreichbar.");
  return { id: post.id, threadId: post.threadId || null, category: post.category, type: post.type, title: post.title || null,
    body: post.body, displayName: post.displayName, createdAt: post.createdAt, updatedAt: post.updatedAt,
    owned: post.owned === true, status: post.status, solved: post.solved === true, replyCount: Number.isInteger(post.replyCount) ? post.replyCount : 0 };
}
function pageNumber(value, fallback) { return Number.isInteger(value) && value >= 0 ? value : fallback; }
function publicRead(data, mode) {
  const paging = { total: pageNumber(data.total, 0), page: pageNumber(data.page, 1), pageSize: mode === "posts" ? 12 : 20 };
  if (mode === "posts") return { posts: (data.posts || []).map(publicPost), ...paging };
  if (mode === "thread") return { thread: publicPost(data.thread), replies: (data.replies || []).map(publicPost), replyTotal: pageNumber(data.replyTotal, 0), page: paging.page, pageSize: 20 };
  return { reports: (data.reports || []).map(report => ({ id: report.id, postId: report.postId, reason: report.reason, createdAt: report.createdAt,
    status: report.status, reporterName: report.reporterName, post: publicPost(report.post) })), ...paging };
}
export async function getCommunity(req) {
  const selection = validateCommunityRead(req); const access = await identity(req);
  if (selection.mode === "reports" && !access.viewer.admin) fail("FORBIDDEN", 403, "Nur Moderatoren können Meldungen einsehen.");
  const result = await access.database.rpc("community_read", { p_actor_email: access.email, p_mode: selection.mode, p_options: selection.options });
  if (result.error) databaseError(result.error);
  if (!result.data || typeof result.data !== "object") fail("COMMUNITY_UNAVAILABLE", 503, "Die Community ist gerade nicht erreichbar.");
  return { ...publicRead(result.data, selection.mode), viewer: access.viewer, setupRequired: false };
}
export async function writeCommunity(req) {
  requireCommunityOrigin(req);
  const access = await identity(req);
  const payload = validateCommunityWrite(req.method, await readCommunityBody(req));
  if (["moderate", "resolve-report"].includes(payload.action) && !access.viewer.admin) fail("FORBIDDEN", 403, "Nur Moderatoren können diese Aktion ausführen.");
  if (payload.action !== "profile" && access.viewer.profileRequired) fail("PROFILE_REQUIRED", 409, "Bitte zuerst einen Lernnamen wählen und die Community-Regeln akzeptieren.");
  const { action, ...safePayload } = payload;
  const result = await access.database.rpc("community_write", { p_actor_email: access.email, p_action: action, p_payload: safePayload });
  if (result.error) databaseError(result.error);
  if (!result.data || typeof result.data !== "object") fail("COMMUNITY_UNAVAILABLE", 503, "Die Community ist gerade nicht erreichbar.");
  return { success: result.data.success === true, ...(typeof result.data.postId === "string" && UUID.test(result.data.postId) ? { postId: result.data.postId } : {}) };
}
