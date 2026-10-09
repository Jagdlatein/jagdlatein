// Shared by Node and Edge. No password comparison or credential material is
// included in a cookie; this only validates a signed, private review identity.
import { appleReviewPolicy, isAppleReviewPolicyActive } from "./apple-review-policy";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function unavailable() {
  return Object.assign(new Error("Die Anmeldung ist derzeit nicht verfügbar."), { status: 503 });
}

export function reviewLoginConfiguration(env = process.env, nowMs = Date.now()) {
  if (!env.APPLE_REVIEW_LOGIN_ENABLED || env.APPLE_REVIEW_LOGIN_ENABLED === "false") return null;
  if (env.APPLE_REVIEW_LOGIN_ENABLED !== "true" || env.APPLE_STORE_ENVIRONMENT !== "Production" ||
      env.JL_TEST_ENVIRONMENT || !/^\$2[ab]\$12\$[./A-Za-z0-9]{53}$/.test(env.APPLE_REVIEW_LOGIN_PASSWORD_HASH || "") ||
      !UUID.test(env.APPLE_REVIEW_LOGIN_CREDENTIAL_ID || "") ||
      typeof env.JL_SESSION_SECRET !== "string" || env.JL_SESSION_SECRET.trim().length < 32) throw unavailable();
  const policy = appleReviewPolicy(env);
  if (!isAppleReviewPolicyActive(policy, nowMs)) return null;
  return { policy, passwordHash: env.APPLE_REVIEW_LOGIN_PASSWORD_HASH,
    credentialId: env.APPLE_REVIEW_LOGIN_CREDENTIAL_ID.toLowerCase() };
}

export function isMarkedReviewSession(session) {
  return Boolean(session && (Object.hasOwn(session, "authenticationMethod") || Object.hasOwn(session, "reviewAuth")));
}

export function validatedReviewSessionFields(session, env = process.env, nowMs = Date.now()) {
  if (!isMarkedReviewSession(session)) return null;
  try {
    const config = reviewLoginConfiguration(env, nowMs);
    const auth = session.reviewAuth;
    if (!config || session.authenticationMethod !== "review-password" || session.version !== 3 ||
        session.admin !== false || session.accountGeneration !== config.policy.accountGeneration ||
        !Number.isInteger(session.authenticatedAt) || !Number.isInteger(session.issuedAt) ||
        session.authenticatedAt > session.issuedAt ||
        session.authenticatedAt < Math.floor(config.policy.validFrom / 1000) ||
        !auth || typeof auth !== "object" || Array.isArray(auth) || Object.keys(auth).length !== 3 ||
        Object.keys(auth).some(key => !["credentialId", "appAccountToken", "expiresAt"].includes(key)) ||
        auth.credentialId !== config.credentialId || auth.appAccountToken !== config.policy.appAccountToken ||
        !Number.isInteger(auth.expiresAt) || auth.expiresAt <= session.issuedAt ||
        auth.expiresAt > Math.floor(config.policy.validUntil / 1000) ||
        !Number.isInteger(session.expiresAt) || session.expiresAt > auth.expiresAt ||
        session.expiresAt <= Math.floor(nowMs / 1000)) return null;
    return { authenticationMethod: "review-password", reviewAuth: {
      credentialId: auth.credentialId, appAccountToken: auth.appAccountToken, expiresAt: auth.expiresAt,
    } };
  } catch { return null; }
}
