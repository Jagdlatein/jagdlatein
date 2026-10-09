import bcrypt from "bcryptjs";
import { createHmac } from "crypto";
import { normalizeAccountEmail } from "./account-session";
import { reviewLoginConfiguration, isMarkedReviewSession, validatedReviewSessionFields } from "./apple-review-login-policy";
import { matchesAppleReviewBinding } from "./apple-review-policy";
import { resolveSubscriptionAccess } from "./subscription-access";

export class ReviewLoginError extends Error {
  constructor(status) {
    super(status === 429 ? "Bitte warte einige Minuten, bevor du dich erneut anmeldest." :
      status === 401 ? "Die Anmeldung konnte nicht bestätigt werden." : "Die Anmeldung ist derzeit nicht verfügbar.");
    this.status = status;
  }
}

async function currentReviewIdentity(database, config, nowMs) {
  const { data: owner, error } = await database.from("apple_account_tokens")
    .select("app_account_token,account_email,account_generation,deleted_at")
    .eq("app_account_token", config.policy.appAccountToken).maybeSingle();
  if (error) throw new ReviewLoginError(503);
  if (!matchesAppleReviewBinding(config.policy, owner, nowMs) || !normalizeAccountEmail(owner?.account_email))
    throw new ReviewLoginError(401);
  const profile = await database.from("userprofile").select("email,account_generation,is_admin,is_premium,is_community_moderator")
    .ilike("email", owner.account_email.replace(/[\\%_]/g, "\\$&")).maybeSingle();
  if (profile.error) throw new ReviewLoginError(503);
  if (normalizeAccountEmail(profile.data?.email) !== owner.account_email ||
      profile.data?.account_generation !== config.policy.accountGeneration ||
      profile.data?.is_admin !== false || profile.data?.is_premium !== false ||
      profile.data?.is_community_moderator !== false) throw new ReviewLoginError(401);
  return owner;
}

export async function requireReviewSessionIdentity(database, session, { env = process.env, nowMs = Date.now() } = {}) {
  if (!isMarkedReviewSession(session)) return;
  const start = Date.now();
  if (!validatedReviewSessionFields({ ...session, version: 3 }, env, nowMs)) throw new ReviewLoginError(401);
  let config;
  try { config = reviewLoginConfiguration(env, nowMs); }
  catch { throw new ReviewLoginError(503); }
  const owner = await currentReviewIdentity(database, config, nowMs);
  if (owner.account_email !== normalizeAccountEmail(session.email) ||
      !validatedReviewSessionFields({ ...session, version: 3 }, env, nowMs + Math.max(0, Date.now() - start)))
    throw new ReviewLoginError(401);
}

export async function verifyReviewLogin(database, { email, password, ip = "unknown" } = {},
  { env = process.env, nowMs = Date.now(), bcryptCompare = bcrypt.compare,
    resolveAccess = resolveSubscriptionAccess } = {}) {
  let config;
  try { config = reviewLoginConfiguration(env, nowMs); }
  catch { throw new ReviewLoginError(503); }
  if (!config || !database) throw new ReviewLoginError(503);
  const start = Date.now();
  const currentTime = () => nowMs + Math.max(0, Date.now() - start);
  const normalized = normalizeAccountEmail(email);
  // A fixed random 32-byte password avoids bcrypt's 72-byte truncation.
  if (!normalized || typeof password !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(password)) throw new ReviewLoginError(401);
  const ipValue = typeof ip === "string" && ip.length <= 128 && !/[\u0000-\u001f\u007f]/.test(ip) ? ip : "unknown";
  const ipBucket = createHmac("sha256", env.JL_SESSION_SECRET).update(`apple-review-login-ip:${ipValue}`).digest("hex");
  const { data: attempt, error } = await database.rpc("reserve_apple_review_login_attempt", {
    p_account_generation: config.policy.accountGeneration, p_app_account_token: config.policy.appAccountToken,
    p_ip_bucket: ipBucket,
  });
  if (error || !attempt || typeof attempt.allowed !== "boolean") throw new ReviewLoginError(503);
  if (!attempt.allowed) throw new ReviewLoginError(attempt.identityMissing === true ? 401 : 429);
  let validPassword;
  try { validPassword = await bcryptCompare(password, config.passwordHash); }
  catch { throw new ReviewLoginError(503); }
  if (validPassword !== true) throw new ReviewLoginError(401);
  // Provider reads can take time; only the actual password check is a fresh
  // identity proof. They must never move this timestamp forward.
  const authenticatedAt = Math.floor(currentTime() / 1000);
  const owner = await currentReviewIdentity(database, config, currentTime());
  if (owner.account_email !== normalized) throw new ReviewLoginError(401);
  let access;
  try { access = await resolveAccess(database, owner.account_email, { nowMs: currentTime(), reviewPolicy: config.policy }); }
  catch { throw new ReviewLoginError(503); }
  await currentReviewIdentity(database, config, currentTime());
  let currentConfig;
  try { currentConfig = reviewLoginConfiguration(env, currentTime()); }
  catch { throw new ReviewLoginError(503); }
  if (!currentConfig || currentConfig.credentialId !== config.credentialId ||
      currentConfig.passwordHash !== config.passwordHash ||
      currentConfig.policy.accountGeneration !== config.policy.accountGeneration ||
      currentConfig.policy.appAccountToken !== config.policy.appAccountToken ||
      currentConfig.policy.validFrom !== config.policy.validFrom ||
      currentConfig.policy.validUntil !== config.policy.validUntil) throw new ReviewLoginError(401);
  const expiresAt = Math.floor(config.policy.validUntil / 1000);
  if (expiresAt <= authenticatedAt) throw new ReviewLoginError(401);
  return { email: owner.account_email, accountGeneration: config.policy.accountGeneration, authenticatedAt,
    authenticationMethod: "review-password", reviewAuth: {
      credentialId: config.credentialId, appAccountToken: config.policy.appAccountToken, expiresAt,
    }, paid: access?.paid === true, paidUntil: access?.paidUntil || null, accessType: access?.accessType || "none", admin: false };
}

export async function readReviewLoginBody(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new ReviewLoginError(401);
  let size = 0; const chunks = [];
  try {
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 2048) { await reader.cancel(); throw new ReviewLoginError(401); }
      chunks.push(Buffer.from(value));
    }
    let body;
    try { body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))); }
    catch { throw new ReviewLoginError(401); }
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 2 ||
        Object.keys(body).some(key => !["email", "password"].includes(key))) throw new ReviewLoginError(401);
    return body;
  } finally { reader.releaseLock(); }
}
