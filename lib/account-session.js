import { createHmac, timingSafeEqual } from "crypto";

export const JL_ACCOUNT_COOKIE = "jl_account_session";
export const ACCOUNT_SESSION_MAX_AGE = 60 * 60 * 24 * 40;
export const ACCOUNT_ACCESS_MAX_AGE = 60 * 15;

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
  const payload = Buffer.from(JSON.stringify({
    version: access ? 2 : 1,
    email: normalizedEmail,
    issuedAt,
    expiresAt: issuedAt + ACCOUNT_SESSION_MAX_AGE,
    ...(access ? {
      paid: access.paid === true,
      admin: access.admin === true,
      accessExpiresAt: issuedAt + ACCOUNT_ACCESS_MAX_AGE,
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
      ![1, 2].includes(session?.version) || !email || email !== session.email ||
      !Number.isInteger(session.issuedAt) || !Number.isInteger(session.expiresAt) ||
      session.issuedAt > now + 60 || session.expiresAt <= now ||
      session.expiresAt <= session.issuedAt ||
      session.expiresAt - session.issuedAt > ACCOUNT_SESSION_MAX_AGE
    ) return null;

    if (session.version === 2 && (
      typeof session.paid !== "boolean" || typeof session.admin !== "boolean" ||
      !Number.isInteger(session.accessExpiresAt) || session.accessExpiresAt <= session.issuedAt ||
      session.accessExpiresAt > session.issuedAt + ACCOUNT_ACCESS_MAX_AGE ||
      session.accessExpiresAt > session.expiresAt
    )) return null;

    return { email, issuedAt: session.issuedAt, expiresAt: session.expiresAt,
      ...(session.version === 2 ? { paid: session.paid, admin: session.admin,
        accessExpiresAt: session.accessExpiresAt } : {}),
    };
  } catch {
    return null;
  }
}
