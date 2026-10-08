// Middleware in Next 14 uses Web Crypto instead of Node's crypto module.
import { isMarkedReviewSession, validatedReviewSessionFields } from "./apple-review-login-policy";
export const JL_ACCOUNT_COOKIE = "jl_account_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 40;
const ACCESS_MAX_AGE = 60 * 15;

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(decoded, character => character.charCodeAt(0));
}

export async function readAccountSessionEdge(token, nowMs = Date.now()) {
  const secret = process.env.JL_SESSION_SECRET;
  const encoder = new TextEncoder();
  if (typeof secret !== "string" || encoder.encode(secret.trim()).length < 32 ||
    typeof token !== "string" || token.length > 2048) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts.every(part => /^[A-Za-z0-9_-]+$/.test(part))) return null;
  try {
    const [payload, signature] = parts;
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    if (!await crypto.subtle.verify("HMAC", key, decodeBase64Url(signature), encoder.encode(payload))) return null;
    const session = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(decodeBase64Url(payload)));
    const now = Math.floor(nowMs / 1000);
    const email = typeof session?.email === "string" ? session.email : "";
    if (![1, 2, 3].includes(session?.version) || email !== email.trim().toLowerCase() || email.length > 320 ||
      !/^[^\s@\u0000-\u001f\u007f]+@[^\s@\u0000-\u001f\u007f]+\.[^\s@\u0000-\u001f\u007f]+$/.test(email) ||
      !Number.isInteger(session.issuedAt) || !Number.isInteger(session.expiresAt) ||
      session.issuedAt > now + 60 || session.expiresAt <= now || session.expiresAt <= session.issuedAt ||
      session.expiresAt - session.issuedAt > SESSION_MAX_AGE) return null;
    if (session.version >= 2 && (typeof session.paid !== "boolean" || typeof session.admin !== "boolean" ||
      !Number.isInteger(session.accessExpiresAt) || session.accessExpiresAt <= session.issuedAt ||
      session.accessExpiresAt > session.issuedAt + ACCESS_MAX_AGE || session.accessExpiresAt > session.expiresAt)) return null;
    if (session.version === 3 && (!Number.isInteger(session.authenticatedAt) ||
      session.authenticatedAt > session.issuedAt || session.expiresAt > session.authenticatedAt + SESSION_MAX_AGE ||
      (session.accountGeneration != null && (typeof session.accountGeneration !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.accountGeneration))))) return null;
    const reviewFields = isMarkedReviewSession(session) ? validatedReviewSessionFields(session, process.env, nowMs) : null;
    if (isMarkedReviewSession(session) && !reviewFields) return null;
    return reviewFields ? { ...session, ...reviewFields } : session;
  } catch { return null; }
}
