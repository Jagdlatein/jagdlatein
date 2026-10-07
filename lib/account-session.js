import { createHmac, timingSafeEqual } from "crypto";

export const JL_ACCOUNT_COOKIE = "jl_account_session";
export const ACCOUNT_SESSION_MAX_AGE = 60 * 60 * 24 * 40;
export const ACCOUNT_ACCESS_MAX_AGE = 60 * 15;

export function isAccountDeletionEnabled() {
  return process.env.ACCOUNT_DELETION_ENABLED === "true";
}

export function isAccountGenerationEnabled() {
  return process.env.ACCOUNT_GENERATION_ENABLED === "true" ||
    isAccountDeletionEnabled() || process.env.APPLE_SUBSCRIPTIONS_ENABLED === "true";
}

export function matchesAccountGeneration(profile, session) {
  return !isAccountGenerationEnabled() || (
    typeof session?.accountGeneration === "string" &&
    profile?.account_generation === session.accountGeneration
  );
}

export function accountDatabaseOptions(session) {
  return {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    ...(isAccountGenerationEnabled() && session?.accountGeneration ? {
      global: { headers: {
        "x-jagdlatein-account-generation": session.accountGeneration,
        "x-jagdlatein-account-email": session.email,
      } },
    } : {}),
  };
}

function sessionSecret() {
  const secret = process.env.JL_SESSION_SECRET;
  return typeof secret === "string" && Buffer.byteLength(secret.trim(), "utf8") >= 32
    ? secret
    : null;
}

export function isAccountSessionConfigured() {
  return sessionSecret() !== null;
}

export function normalizeAccountEmail(value) {
  if (typeof value !== "string") return "";
  const email = value.trim().toLowerCase();
  return email.length <= 320 && /^[^\s@\u0000-\u001f\u007f]+@[^\s@\u0000-\u001f\u007f]+\.[^\s@\u0000-\u001f\u007f]+$/.test(email)
    ? email
    : "";
}

export function createAccountSession(email, nowMs = Date.now(), access = null) {
  const secret = sessionSecret();
  const normalizedEmail = normalizeAccountEmail(email);
  if (!secret || !normalizedEmail) return null;

  const issuedAt = Math.floor(nowMs / 1000);
  const authenticatedAt = access?.authenticatedAt;
  const accountGeneration = access?.accountGeneration;
  const identified = Number.isInteger(authenticatedAt) && authenticatedAt <= issuedAt &&
    authenticatedAt > issuedAt - ACCOUNT_SESSION_MAX_AGE &&
    (accountGeneration == null || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountGeneration));
  // Status refresh may renew access, but cannot extend the original login or
  // turn a refreshed cookie into evidence of entering a new email code.
  const expiresAt = identified ? authenticatedAt + ACCOUNT_SESSION_MAX_AGE : issuedAt + ACCOUNT_SESSION_MAX_AGE;
  const suppliedDeadline = access?.paidUntil != null;
  const paidUntil = suppliedDeadline ? Math.floor(Date.parse(access.paidUntil) / 1000) : null;
  const paid = access?.paid === true && (access?.accessType !== "trial" || suppliedDeadline) &&
    (!suppliedDeadline || (Number.isFinite(paidUntil) && paidUntil > issuedAt));
  const accessMaxAge = paid && access?.accessType === "trial" ? 60 : ACCOUNT_ACCESS_MAX_AGE;
  const accessExpiresAt = paid && Number.isFinite(paidUntil) && !access?.admin
    ? Math.min(issuedAt + accessMaxAge, paidUntil)
    : issuedAt + accessMaxAge;
  const payload = Buffer.from(JSON.stringify({
    version: identified ? 3 : access ? 2 : 1,
    email: normalizedEmail,
    issuedAt,
    expiresAt,
    ...(identified ? { authenticatedAt, ...(accountGeneration ? { accountGeneration } : {}) } : {}),
    ...(access ? {
      paid,
      admin: access.admin === true,
      accessExpiresAt: Math.min(accessExpiresAt, expiresAt),
    } : {}),
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function readAccountSession(token, nowMs = Date.now()) {
  const secret = sessionSecret();
  if (!secret || typeof token !== "string" || token.length > 2048) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts.every(part => /^[A-Za-z0-9_-]+$/.test(part))) return null;

  try {
    const [payload, signature] = parts;
    const expected = createHmac("sha256", secret).update(payload).digest();
    const supplied = Buffer.from(signature, "base64url");
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const now = Math.floor(nowMs / 1000);
    const email = normalizeAccountEmail(session?.email);
    if (
      ![1, 2, 3].includes(session?.version) || !email || email !== session.email ||
      !Number.isInteger(session.issuedAt) || !Number.isInteger(session.expiresAt) ||
      session.issuedAt > now + 60 || session.expiresAt <= now ||
      session.expiresAt <= session.issuedAt ||
      session.expiresAt - session.issuedAt > ACCOUNT_SESSION_MAX_AGE
    ) return null;

    if (session.version >= 2 && (
      typeof session.paid !== "boolean" || typeof session.admin !== "boolean" ||
      !Number.isInteger(session.accessExpiresAt) || session.accessExpiresAt <= session.issuedAt ||
      session.accessExpiresAt > session.issuedAt + ACCOUNT_ACCESS_MAX_AGE ||
      session.accessExpiresAt > session.expiresAt
    )) return null;

    if (session.version === 3 && (
      !Number.isInteger(session.authenticatedAt) || session.authenticatedAt > session.issuedAt ||
      session.expiresAt > session.authenticatedAt + ACCOUNT_SESSION_MAX_AGE ||
      (session.accountGeneration != null && (typeof session.accountGeneration !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.accountGeneration)))
    )) return null;

    return { email, issuedAt: session.issuedAt, expiresAt: session.expiresAt,
      ...(session.version >= 2 ? { paid: session.paid, admin: session.admin,
        accessExpiresAt: session.accessExpiresAt } : {}),
      ...(session.version === 3 ? { authenticatedAt: session.authenticatedAt,
        ...(session.accountGeneration ? { accountGeneration: session.accountGeneration } : {}) } : {}),
    };
  } catch {
    return null;
  }
}
