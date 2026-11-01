import { normalizeExamProfile } from "./exam-profile";
import { normalizeAccountEmail } from "./account-session";
import {
  accountUnavailable, requireCurrentAccount, sessionRenewalRequired, getAccountDatabase,
} from "./course-progress-server";

const UNAVAILABLE = "EXAM_PROFILE_UNAVAILABLE";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 1024;

function invalidProfile(status = 400) {
  const error = new Error("Bitte ein gültiges Land und einen zugehörigen Kanton oder ein Bundesland wählen.");
  error.code = "INVALID_EXAM_PROFILE";
  error.status = status;
  return error;
}

function requireGeneration(session) {
  if (!session || normalizeAccountEmail(session.email) !== session.email ||
      !UUID.test(session.accountGeneration || "")) throw sessionRenewalRequired();
}

export function validateAccountExamProfile(value) {
  const profile = normalizeExamProfile(value);
  if (!profile || Object.keys(value).length !== 2 ||
      Object.keys(value).some(key => !["country", "region"].includes(key))) throw invalidProfile();
  return profile;
}

export function requireExamProfileAccount(request, session) {
  requireGeneration(session);
  if (request.headers.get("x-jagdlatein-exam-account") !== session.accountGeneration) {
    const error = new Error("Deine Anmeldung hat sich geändert. Bitte lade die Seite neu.");
    error.code = "EXAM_ACCOUNT_CHANGED";
    error.status = 409;
    throw error;
  }
}

function profileFromColumns(value) {
  if (!value || !Object.hasOwn(value, "exam_country") || !Object.hasOwn(value, "exam_region")) {
    throw accountUnavailable(UNAVAILABLE);
  }
  if (value.exam_country === null && value.exam_region === null) return null;
  const profile = normalizeExamProfile({ country: value.exam_country, region: value.exam_region });
  if (!profile) throw accountUnavailable(UNAVAILABLE);
  return profile;
}

// The caller must pass an already verified signed session. This server-only
// adapter also works from Pages Router SSR without trusting a client identity.
export async function readAccountExamProfile(session, database = null) {
  requireGeneration(session);
  const db = database || getAccountDatabase(UNAVAILABLE, session);
  await requireCurrentAccount(db, session, UNAVAILABLE);
  const { data, error } = await db.from("userprofile")
    .select("email,account_generation,exam_country,exam_region")
    .ilike("email", session.email.replace(/[\\%_]/g, "\\$&"))
    .eq("account_generation", session.accountGeneration)
    .maybeSingle();
  if (error) throw accountUnavailable(UNAVAILABLE);
  if (!data || normalizeAccountEmail(data.email) !== session.email ||
      data.account_generation !== session.accountGeneration) throw sessionRenewalRequired();
  const profile = profileFromColumns(data);
  // Review credentials and account generation may be revoked while the read
  // is pending. Preserve the same live-identity checks used by account APIs.
  await requireCurrentAccount(db, session, UNAVAILABLE);
  return profile;
}

export async function writeAccountExamProfile(session, value, database = null) {
  requireGeneration(session);
  const profile = validateAccountExamProfile(value);
  const db = database || getAccountDatabase(UNAVAILABLE, session);
  await requireCurrentAccount(db, session, UNAVAILABLE);
  const { data, error } = await db.rpc("set_account_exam_profile", {
    p_email: session.email,
    p_account_generation: session.accountGeneration,
    p_country: profile.country,
    p_region: profile.region,
  });
  if (error?.message?.includes("JL_EXAM_PROFILE_IDENTITY") ||
      error?.message?.includes("JL_ACCOUNT_GENERATION_MISMATCH")) throw sessionRenewalRequired();
  if (error) throw accountUnavailable(UNAVAILABLE);
  const saved = normalizeExamProfile(data);
  if (!saved || saved.country !== profile.country || saved.region !== profile.region) {
    throw accountUnavailable(UNAVAILABLE);
  }
  await requireCurrentAccount(db, session, UNAVAILABLE);
  return saved;
}

export async function readAccountExamProfileBody(request) {
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) throw invalidProfile(413);
  const reader = request.body?.getReader();
  if (!reader) throw invalidProfile();
  let size = 0;
  const chunks = [];
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); throw invalidProfile(413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let value;
    try { value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
    catch { throw invalidProfile(); }
    return validateAccountExamProfile(value);
  } finally { reader.releaseLock(); }
}

export function examProfileErrorResponse(error) {
  const safe = ["INVALID_EXAM_PROFILE", "EXAM_ACCOUNT_CHANGED"].includes(error?.code) ? error :
    error?.status === 401 ? sessionRenewalRequired() :
    error?.status === 403 || error?.status === 415 ? error : accountUnavailable(UNAVAILABLE);
  return Response.json({ code: safe.code, message: safe.message }, {
    status: safe.status,
    headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" },
  });
}
