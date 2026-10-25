import { randomUUID } from "node:crypto";
import { requirePaidAccount } from "./account-access";
import { getAccountDatabase } from "./course-progress-server";
import { requireCurrentTrialAdmin } from "./admin-trial-overview";
import { getMyCourseCatalog } from "./my-course-catalog";
import { learningCategoryDetails } from "./learning-categories";
import { ACADEMY_UUID, AcademyError, getSessionPhase, validateAcademyRecord } from "./online-academy";

const TABLES = { school: "online_academy_schools", offer: "online_academy_offers", session: "online_academy_sessions" };
const COLUMNS = {
  school: "id,name,description,website,status,updated_at",
  offer: "id,school_id,title,description,category_slug,module_ids,status,updated_at",
  session: "id,offer_id,title,starts_at,ends_at,status,updated_at",
};
const MAX_ROWS = 1000;
const BODY_LIMIT = 16000;
function fail(code, status, message) { throw new AcademyError(code, status, message); }
function unavailable() { return new AcademyError("ACADEMY_UNAVAILABLE", 503, "Die Onlinekurse sind gerade nicht erreichbar. Bitte erneut versuchen."); }
function dbError(error) {
  if (["42P01", "PGRST205", "PGRST200", "42703", "PGRST204"].includes(error?.code)) return new AcademyError("ACADEMY_NOT_CONFIGURED", 503, "Die Onlinekurs-Plattform wird noch eingerichtet. Die vorhandenen Lernkurse bleiben über den Lernbereich erreichbar.");
  return unavailable();
}
function assertResult(result) { if (result.error) throw dbError(result.error); return result.data; }
function safeRecord(action, row) {
  const keys = COLUMNS[action].split(",");
  return Object.fromEntries(keys.filter(key => Object.hasOwn(row, key)).map(key => [key, row[key]]));
}
async function readRows(database, action) {
  const result = await database.from(TABLES[action]).select(COLUMNS[action], { count: "exact" }).limit(MAX_ROWS);
  const data = assertResult(result);
  if (!Array.isArray(data) || !Number.isSafeInteger(result.count) || result.count < 0 || result.count > MAX_ROWS || data.length !== result.count) throw unavailable();
  return data.map(row => safeRecord(action, row));
}
async function one(database, action, id, { room = false } = {}) {
  const result = await database.from(TABLES[action]).select(COLUMNS[action] + (room ? ",room_name" : "")).eq("id", id).maybeSingle();
  return assertResult(result);
}
function readScope(req) {
  const params = new URL(req.url).searchParams;
  if ([...params.keys()].some(key => key !== "scope") || params.getAll("scope").length > 1 || params.has("scope") && params.get("scope") !== "manage") fail("INVALID_ACADEMY_QUERY", 400, "Bitte die Onlinekurs-Auswahl erneut öffnen.");
  return params.get("scope") === "manage";
}
async function verifySameAccess(req, first) {
  const current = await requirePaidAccount(req);
  if (current.email !== first.email || current.accountGeneration !== first.accountGeneration) fail("SESSION_RENEWAL_REQUIRED", 401, "Bitte melde dich erneut an.");
  return current;
}
export async function getAcademyOverview(req) {
  const manage = readScope(req);
  const initialAdmin = manage ? await requireCurrentTrialAdmin(req) : null;
  const access = initialAdmin?.session || await requirePaidAccount(req);
  const database = initialAdmin?.database || getAccountDatabase("ACCOUNT_UNAVAILABLE", access);
  const [allSchools, allOffers, allSessions] = await Promise.all([readRows(database, "school"), readRows(database, "offer"), readRows(database, "session")]);
  // An API request must not retain a role or entitlement revoked during reads.
  const current = manage ? await requireCurrentTrialAdmin(req, { database }) : await verifySameAccess(req, access);
  const schools = manage ? allSchools : allSchools.filter(item => item.status === "approved");
  const schoolIds = new Set(schools.map(item => item.id));
  const offers = manage ? allOffers : allOffers.filter(item => item.status === "published" && schoolIds.has(item.school_id));
  const offerIds = new Set(offers.map(item => item.id));
  const sessions = (manage ? allSessions : allSessions.filter(item => item.status === "scheduled" && offerIds.has(item.offer_id)))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at) || a.id.localeCompare(b.id));
  return { schools, offers, sessions, canManage: manage || current.admin === true };
}

async function bodyJson(req) {
  let sameOrigin = false;
  try { sameOrigin = new URL(req.headers.get("origin")).origin === new URL(req.url).origin; } catch {}
  if (!sameOrigin) fail("INVALID_ORIGIN", 403, "Diese Anfrage ist nicht erlaubt.");
  if ((req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() !== "application/json") fail("INVALID_ACADEMY_BODY", 415, "Bitte die Kursangaben als JSON senden.");
  const declared = req.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > BODY_LIMIT)) fail("ACADEMY_BODY_TOO_LARGE", 413, "Die Kursangaben sind zu umfangreich.");
  let raw = "";
  if (req.body?.getReader) {
    const reader = req.body.getReader();
    const decoder = new TextDecoder();
    let bytes = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > BODY_LIMIT) { await reader.cancel(); fail("ACADEMY_BODY_TOO_LARGE", 413, "Die Kursangaben sind zu umfangreich."); }
        raw += decoder.decode(value, { stream: true });
      }
      raw += decoder.decode();
    } finally { reader.releaseLock(); }
  } else {
    raw = await req.text();
    if (Buffer.byteLength(raw, "utf8") > BODY_LIMIT) fail("ACADEMY_BODY_TOO_LARGE", 413, "Die Kursangaben sind zu umfangreich.");
  }
  let data;
  try { data = JSON.parse(raw); } catch { fail("INVALID_ACADEMY_BODY", 400, "Die Kursangaben sind ungültig."); }
  if (!data || typeof data !== "object" || Array.isArray(data) || Object.keys(data).some(key => !["action", "record"].includes(key))) fail("INVALID_ACADEMY_BODY", 400, "Die Kursangaben sind ungültig.");
  return data;
}

export async function saveAcademyRecord(req) {
  const { database } = await requireCurrentTrialAdmin(req);
  const body = await bodyJson(req);
  const record = validateAcademyRecord(body.action, body.record, {
    moduleIds: getMyCourseCatalog().map(item => item.id), categorySlugs: learningCategoryDetails.map(item => item.slug),
  });
  const action = body.action;
  if (record.id && !await one(database, action, record.id)) fail("ACADEMY_NOT_FOUND", 404, "Dieser Eintrag ist nicht mehr vorhanden.");
  if (action === "offer") {
    const school = await one(database, "school", record.school_id);
    if (!school) fail("ACADEMY_SCHOOL_REQUIRED", 400, "Bitte zuerst eine vorhandene Jagdschule wählen.");
    if (record.status === "published" && school.status !== "approved") fail("ACADEMY_SCHOOL_NOT_APPROVED", 409, "Die Jagdschule muss vor der Veröffentlichung freigegeben sein.");
  }
  if (action === "session" && !await one(database, "offer", record.offer_id)) fail("ACADEMY_OFFER_REQUIRED", 400, "Bitte zuerst ein vorhandenes Kursangebot wählen.");
  // No mutation is made until the current administrator role is checked again.
  await requireCurrentTrialAdmin(req, { database });
  const { id, ...fields } = record;
  const write = { ...fields, updated_at: new Date().toISOString() };
  if (action === "session" && !id) write.room_name = `jagdlatein-${randomUUID()}`;
  const query = id ? database.from(TABLES[action]).update(write).eq("id", id) : database.from(TABLES[action]).insert(write);
  const saved = assertResult(await query.select(COLUMNS[action]).maybeSingle());
  if (!saved) fail("ACADEMY_NOT_FOUND", 404, "Dieser Eintrag ist nicht mehr vorhanden.");
  return { action, record: safeRecord(action, saved) };
}

export async function getAcademyRoom(req, { now } = {}) {
  const readNow = () => now === undefined ? Date.now() : now;
  const params = new URL(req.url).searchParams;
  const id = params.get("id");
  if ([...params.keys()].some(key => key !== "id") || params.getAll("id").length !== 1 || typeof id !== "string" || !ACADEMY_UUID.test(id)) fail("INVALID_ACADEMY_ROOM", 400, "Bitte einen gültigen Unterrichtstermin wählen.");
  const access = await requirePaidAccount(req);
  const database = getAccountDatabase("ACCOUNT_UNAVAILABLE", access);
  const session = await one(database, "session", id.toLowerCase(), { room: true });
  const offer = session ? await one(database, "offer", session.offer_id) : null;
  const school = offer ? await one(database, "school", offer.school_id) : null;
  if (!session || !offer || !school || session.status !== "scheduled" || offer.status !== "published" || school.status !== "approved") fail("ACADEMY_ROOM_UNAVAILABLE", 404, "Dieser Unterrichtsraum ist nicht verfügbar.");
  const phase = getSessionPhase(session, readNow());
  if (!["opening", "live"].includes(phase)) fail("ACADEMY_ROOM_CLOSED", 409, phase === "ended" ? "Dieser Unterrichtstermin ist beendet." : "Der Raum öffnet 15 Minuten vor Unterrichtsbeginn.");
  await verifySameAccess(req, access);
  // A late cancellation or unpublication also closes a pending room request.
  const [currentSession, currentOffer, currentSchool] = await Promise.all([
    one(database, "session", session.id, { room: true }), one(database, "offer", offer.id), one(database, "school", school.id),
  ]);
  if (!currentSession || !currentOffer || !currentSchool || currentSession.offer_id !== offer.id || currentOffer.school_id !== school.id || currentSession.status !== "scheduled" || currentOffer.status !== "published" || currentSchool.status !== "approved" || currentSession.room_name !== session.room_name || !["opening", "live"].includes(getSessionPhase(currentSession, readNow())) || !/^jagdlatein-[0-9a-f-]{36}$/.test(currentSession.room_name || "")) fail("ACADEMY_ROOM_UNAVAILABLE", 404, "Dieser Unterrichtsraum ist nicht mehr verfügbar.");
  return { host: "meet.jit.si", roomName: currentSession.room_name, sessionId: currentSession.id, endsAt: currentSession.ends_at };
}

export function academyJson(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff" } });
}
export function academyErrorResponse(error) {
  if (error instanceof AcademyError) return academyJson({ code: error.code, message: error.message }, error.status);
  if (error?.status === 401) return academyJson({ code: "SESSION_RENEWAL_REQUIRED", message: "Bitte melde dich erneut an." }, 401);
  if (error?.status === 403) return academyJson({ code: "ACADEMY_FORBIDDEN", message: "Für diesen Bereich fehlt dir der erforderliche Zugang." }, 403);
  const safe = unavailable();
  return academyJson({ code: safe.code, message: safe.message }, safe.status);
}
