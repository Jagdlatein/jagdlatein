import { createClient } from "@supabase/supabase-js";
import { normalizeAccountEmail } from "./account-session";

export const PHOTO_RECOGNITION_DAILY_LIMIT = 5;
export const PHOTO_RECOGNITION_GLOBAL_DAILY_LIMIT = 50;
export const PHOTO_RECOGNITION_GLOBAL_MONTHLY_LIMIT = 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REQUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class PhotoRecognitionQuotaError extends Error {
  constructor(code, status, message, retryAfter = null, resetsAt = null) {
    super(message);
    this.name = "PhotoRecognitionQuotaError";
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
    this.resetsAt = resetsAt;
  }
}

function dailyResetAt(retryAfter) {
  if (retryAfter === null) return null;
  const now = Date.now();
  const reset = new Date(now);
  reset.setUTCHours(24, 0, 0, 0);
  // The database supplies seconds to the UTC boundary. Only attach an absolute
  // time when it agrees with the server clock; clock skew or a delayed response
  // must fall back to the general daily-limit explanation instead of a guess.
  if (Math.abs(reset.getTime() - now - retryAfter * 1000) > 60000) return null;
  return reset.toISOString();
}

function unavailable() {
  return new PhotoRecognitionQuotaError("photo_recognition_unavailable", 503,
    "Die Foto-Erkennung ist gerade nicht verfügbar. Bitte versuche es später erneut.");
}

export function isPhotoRecognitionConfigured(env = process.env) {
  return env.PHOTO_RECOGNITION_ENABLED === "true" && typeof env.OPENAI_API_KEY === "string" && Boolean(env.OPENAI_API_KEY.trim()) &&
    Boolean(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
}

// Optional operator QA gate. Absence keeps the existing deployment behaviour;
// an empty, malformed or non-canonical setting must never open public access.
// This grants no login, subscription, role or generation permission by itself.
export function isPhotoRecognitionAccountAllowed(account, env = process.env) {
  const value = env.PHOTO_RECOGNITION_TEST_ACCOUNT;
  if (value === undefined) return true;
  if (typeof value !== "string" || /[,;<>]/u.test(value)) return false;
  const email = normalizeAccountEmail(value);
  return Boolean(email) && email === value && account?.email === email;
}

function database(env) {
  if (!isPhotoRecognitionConfigured(env)) throw unavailable();
  try {
    return createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  } catch { throw unavailable(); }
}

async function rpc(name, args, env) {
  try {
    const { data, error } = await database(env).rpc(name, args);
    if (error || !data || typeof data !== "object" || Array.isArray(data) || data.schemaVersion !== 1) throw unavailable();
    return data;
  } catch { throw unavailable(); }
}

export async function getPhotoRecognitionQuotaStatus(env = process.env) {
  const data = await rpc("photo_recognition_quota_status", {}, env);
  if (data.available !== true || data.dailyLimit !== PHOTO_RECOGNITION_DAILY_LIMIT ||
    data.globalDailyLimit !== PHOTO_RECOGNITION_GLOBAL_DAILY_LIMIT || data.globalMonthlyLimit !== PHOTO_RECOGNITION_GLOBAL_MONTHLY_LIMIT) throw unavailable();
  return { available: true, dailyLimit: PHOTO_RECOGNITION_DAILY_LIMIT };
}

export function photoRecognitionRequestId(value) {
  if (typeof value !== "string" || !REQUEST_ID.test(value)) {
    throw new PhotoRecognitionQuotaError("invalid_photo_request", 400, "Bitte die Foto-Erkennung erneut starten.");
  }
  return value.toLowerCase();
}

export async function reservePhotoRecognition(account, requestId, env = process.env) {
  if (typeof account?.accountGeneration !== "string" || !UUID.test(account.accountGeneration)) {
    throw new PhotoRecognitionQuotaError("photo_session_required", 401, "Bitte melde dich erneut an, bevor du ein Foto erkennen lässt.");
  }
  const data = await rpc("reserve_photo_recognition", {
    p_account_generation: account.accountGeneration.toLowerCase(), p_request_id: photoRecognitionRequestId(requestId),
    p_account_limit: PHOTO_RECOGNITION_DAILY_LIMIT, p_global_daily_limit: PHOTO_RECOGNITION_GLOBAL_DAILY_LIMIT,
    p_global_monthly_limit: PHOTO_RECOGNITION_GLOBAL_MONTHLY_LIMIT,
  }, env);
  if (data.allowed === true && data.reason === "reserved") return;
  const retryAfter = Number.isInteger(data.retryAfter) && data.retryAfter >= 1 && data.retryAfter <= 86400 ? data.retryAfter : null;
  if (data.allowed === false && data.reason === "duplicate") {
    throw new PhotoRecognitionQuotaError("photo_request_already_used", 409,
      "Diese Foto-Anfrage wurde bereits gestartet. Bitte warte auf das Ergebnis oder starte eine neue Anfrage.");
  }
  if (data.allowed === false && data.reason === "account_limit") {
    throw new PhotoRecognitionQuotaError("photo_daily_limit", 429,
      "Dein Tageslimit von 5 Foto-Anfragen ist erreicht. Neue Anfragen sind nach dem nächsten Tageswechsel (UTC) möglich.", retryAfter, dailyResetAt(retryAfter));
  }
  if (data.allowed === false && data.reason === "global_limit") {
    throw new PhotoRecognitionQuotaError("photo_capacity_limit", 429,
      "Die Foto-Erkennung hat ihr Tages-Gesamtlimit erreicht. Bitte versuche es nach dem nächsten Tageswechsel (UTC) erneut.", retryAfter, dailyResetAt(retryAfter));
  }
  if (data.allowed === false && data.reason === "monthly_limit") {
    throw new PhotoRecognitionQuotaError("photo_monthly_capacity_limit", 429,
      "Die Foto-Erkennung hat ihr monatliches Gesamtlimit erreicht. Bitte nutze vorerst den Merkmalsvergleich.");
  }
  if (data.allowed === false && data.reason === "identity_missing") {
    throw new PhotoRecognitionQuotaError("photo_session_required", 401, "Bitte melde dich erneut an, bevor du ein Foto erkennen lässt.");
  }
  throw unavailable();
}
