import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { sendLoginCode } from "./email";
import { isLoginMailRecipientAllowed } from "./test-environment";
import { ACCOUNT_SESSION_MAX_AGE, JL_ACCOUNT_COOKIE, createAccountSession, isAccountGenerationEnabled,
  isAccountSessionConfigured, normalizeAccountEmail } from "./account-session";
import { resolveSubscriptionAccess } from "./subscription-access";

export class AccountRegistrationError extends Error {
  constructor(code, status, message) { super(message); this.code = code; this.status = status; }
}
export function isAccountRegistrationEnabled() { return process.env.ACCOUNT_REGISTRATION_ENABLED === "true"; }
export const REGISTRATION_CODE_REQUEST_MESSAGE = "Falls die Adresse erreichbar ist, wurde ein Bestätigungscode versendet. Bitte prüfe auch den Spamordner.";
export function registrationUnavailable() {
  return new AccountRegistrationError("REGISTRATION_UNAVAILABLE", 503, "Die Registrierung ist derzeit nicht verfügbar. Bitte später erneut versuchen.");
}
function invalid(message = "E-Mail oder Bestätigungscode ungültig.", status = 400) {
  return new AccountRegistrationError("REGISTRATION_INVALID", status, message);
}
export function getRegistrationDatabase() {
  if (!isAccountRegistrationEnabled() || !isAccountSessionConfigured()) throw registrationUnavailable();
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw registrationUnavailable();
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export async function readRegistrationRequest(req, verifying = false) {
  let origin;
  try {
    const value = req.headers.get("origin");
    if (!value || value === "null") throw new Error();
    origin = new URL(value);
    if (origin.origin !== new URL(req.url).origin || origin.username || origin.password ||
      origin.pathname !== "/" || origin.search || origin.hash) throw new Error();
  } catch { throw new AccountRegistrationError("REGISTRATION_ORIGIN", 403, "Diese Anfrage ist nicht erlaubt."); }
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") throw new AccountRegistrationError("REGISTRATION_ORIGIN", 403, "Diese Anfrage ist nicht erlaubt.");
  if ((req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() !== "application/json") throw invalid("Bitte JSON senden.", 415);
  const length = req.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > 2048)) throw invalid("Die Anfrage ist zu groß.", 413);
  if (!req.body || typeof req.body.getReader !== "function") throw invalid();
  const reader = req.body.getReader();
  let size = 0;
  const parts = [];
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) { await reader.cancel(); throw invalid("Die Anfrage ist zu groß.", 413); }
      parts.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
    let body;
    try { body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); } catch { throw invalid(); }
    const allowed = verifying ? ["email", "code"] : ["email"];
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== allowed.length ||
      Object.keys(body).some(key => !allowed.includes(key))) throw invalid();
    const email = normalizeAccountEmail(body.email);
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (!email || (verifying && !/^\d{6}$/.test(code))) throw invalid();
    return { email, ...(verifying ? { code } : {}) };
  } finally { reader.releaseLock(); }
}

export async function requestAccountRegistration(database, email) {
  if (!isLoginMailRecipientAllowed(email)) return { success: true, message: REGISTRATION_CODE_REQUEST_MESSAGE };
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const codeHash = await bcrypt.hash(code, 10);
  const { data, error } = await database.rpc("reserve_account_registration_code", { p_email: email, p_code_hash: codeHash });
  if (error || typeof data?.reserved !== "boolean") throw registrationUnavailable();
  // Exactly one atomic reservation sends a mail; throttled and parallel requests
  // receive the same response and cannot create an unverified profile.
  if (data.reserved) await sendLoginCode(email, code);
  return { success: true, message: REGISTRATION_CODE_REQUEST_MESSAGE };
}

export async function verifyAccountRegistration(database, email, code, nowMs = Date.now()) {
  const { data: attempt, error: attemptError } = await database.rpc("begin_account_registration_attempt", { p_email: email });
  if (attemptError) throw registrationUnavailable();
  if (!attempt?.valid) throw invalid(attempt?.limited ? "Zu viele Versuche. Bitte fordere einen neuen Code an." : "Bestätigungscode ungültig oder abgelaufen.", attempt?.limited ? 429 : 400);
  if (typeof attempt.codeHash !== "string" || typeof attempt.registrationId !== "string") throw registrationUnavailable();
  if (!await bcrypt.compare(code, attempt.codeHash)) throw invalid("Der Bestätigungscode ist nicht korrekt.");
  const { data: consumed, error: consumeError } = await database.rpc("consume_account_registration_code", {
    p_email: email, p_registration_id: attempt.registrationId, p_code_hash: attempt.codeHash,
  });
  if (consumeError) throw registrationUnavailable();
  const profile = consumed?.profile;
  if (!consumed?.consumed || normalizeAccountEmail(profile?.email) !== email) throw invalid("Der Code wurde bereits verwendet oder ist abgelaufen. Bitte fordere einen neuen Code an.");
  if (isAccountGenerationEnabled() && (typeof profile.account_generation !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.account_generation))) throw registrationUnavailable();
  const subscription = profile.is_admin === true && profile.is_premium !== true ? { paid: false, paidUntil: null }
    : await resolveSubscriptionAccess(database, email, { legacyPaid: profile.is_premium === true });
  const token = createAccountSession(email, nowMs, {
    paid: subscription.paid, paidUntil: subscription.paidUntil, accessType: subscription.accessType,
    admin: profile.is_admin === true, authenticatedAt: Math.floor(nowMs / 1000),
    ...(isAccountGenerationEnabled() ? { accountGeneration: profile.account_generation } : {}),
  });
  if (!token) throw registrationUnavailable();
  const response = NextResponse.json({ success: true, paid: subscription.paid, admin: profile.is_admin === true,
    message: "E-Mail bestätigt. Dein Jagdlatein-Konto ist bereit." }, { headers: { "Cache-Control": "no-store" } });
  const options = { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: ACCOUNT_SESSION_MAX_AGE };
  for (const [name, value] of [[JL_ACCOUNT_COOKIE, token], ["jl_session", "1"], ["jl_email", email],
    ["jl_paid", subscription.paid ? "1" : ""], ["jl_admin", profile.is_admin === true ? "1" : ""]]) {
    response.cookies.set({ name, value, ...options, ...(value ? {} : { maxAge: 0 }) });
  }
  return response;
}

export function registrationErrorResponse(error) {
  const known = error instanceof AccountRegistrationError;
  return NextResponse.json({ success: false, code: known ? error.code : "REGISTRATION_UNAVAILABLE",
    message: known ? error.message : registrationUnavailable().message }, { status: known ? error.status : 503,
    headers: { "Cache-Control": "no-store" } });
}
