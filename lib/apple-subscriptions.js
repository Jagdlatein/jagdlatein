import { AppStoreServerAPIClient, Environment, SignedDataVerifier, VerificationStatus } from "@apple/app-store-server-library";
import { createHash, createPrivateKey } from "crypto";
import appleRoots from "./apple-root-certificates.json";
import { normalizeAccountEmail } from "./account-session";
import { appleReviewPolicy, isAppleReviewPolicyActive, matchesAppleReviewBinding,
  APPLE_REVIEW_NOTIFICATION_URL } from "./apple-review-policy";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TRANSACTION = /^[0-9]{1,30}$/;
const MAX_JWS_BYTES = 65536;
const REFRESH_MS = 60 * 1000;
const FUTURE_SKEW_MS = 5 * 60 * 1000;
const NONE = Object.freeze({ paid: false, paidUntil: null, accessType: "none", trialUntil: null, source: "none", status: null });
const cachedVerifiers = new Map();

export class AppleSubscriptionError extends Error {
  constructor(code, status, message) { super(message); this.code = code; this.status = status; }
}
function unavailable() {
  return new AppleSubscriptionError("APPLE_UNAVAILABLE", 503, "Apple-Abos sind derzeit nicht verfügbar. Bitte später erneut versuchen.");
}
function invalid() {
  return new AppleSubscriptionError("INVALID_APPLE_TRANSACTION", 400, "Der Apple-Kauf konnte nicht bestätigt werden.");
}
function wrongAccount() {
  return new AppleSubscriptionError("APPLE_ACCOUNT_MISMATCH", 403, "Dieser Apple-Kauf gehört zu einem anderen oder gelöschten Jagdlatein-Konto.");
}
export function appleErrorResponse(error) {
  const safe = error instanceof AppleSubscriptionError ? error : unavailable();
  return Response.json({ code: safe.code, message: safe.message }, {
    status: safe.status, headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" },
  });
}

// The regular public checkout always uses Production. A separate, disabled-by-
// default review policy can bind Sandbox verification to one private account.
export function appleSubscriptionConfig(env = process.env) {
  if (!env.APPLE_SUBSCRIPTIONS_ENABLED || env.APPLE_SUBSCRIPTIONS_ENABLED === "false") return null;
  if (env.APPLE_SUBSCRIPTIONS_ENABLED !== "true") throw unavailable();
  const environment = env.APPLE_STORE_ENVIRONMENT;
  if (![Environment.PRODUCTION, Environment.SANDBOX].includes(environment) ||
      (environment === Environment.SANDBOX && env.JL_TEST_ENVIRONMENT !== "paypal-sandbox") ||
      (environment === Environment.PRODUCTION && env.JL_TEST_ENVIRONMENT)) throw unavailable();
  const bundleId = env.APPLE_BUNDLE_ID;
  const appAppleId = Number(env.APPLE_APP_ID);
  const productIds = [...new Set((env.APPLE_PRODUCT_IDS || "").split(",").map(value => value.trim()).filter(Boolean))];
  if (bundleId !== "de.jagdlatein.app" || appAppleId !== 6819820561 || !productIds.length || productIds.length > 10 ||
      productIds.some(value => !/^de\.jagdlatein\.[A-Za-z0-9._-]{1,100}$/.test(value))) throw unavailable();
  return { environment, bundleId, appAppleId, productIds };
}

export function createAppleVerifier(config = appleSubscriptionConfig()) {
  if (!config) throw unavailable();
  const cacheKey = `${config.environment}:${config.bundleId}:${config.appAppleId}`;
  if (cachedVerifiers.has(cacheKey)) return cachedVerifiers.get(cacheKey);
  const roots = appleRoots.map(root => {
    const bytes = Buffer.from(root.derBase64, "base64");
    if (createHash("sha256").update(bytes).digest("hex") !== root.sha256) throw unavailable();
    return bytes;
  });
  // Apple validates the complete certificate chain, Apple signing extensions,
  // bundle/environment and online certificate revocation. Never decode to grant.
  const verifier = new SignedDataVerifier(roots, true, config.environment, config.bundleId, config.appAppleId);
  if (cachedVerifiers.size < 2) cachedVerifiers.set(cacheKey, verifier);
  return verifier;
}

export function createAppleApiClient(config = appleSubscriptionConfig(), env = process.env) {
  if (!config || !/^[A-Z0-9]{10}$/.test(env.APPLE_IAP_KEY_ID || "") ||
      !UUID.test(env.APPLE_IAP_ISSUER_ID || "") ||
      !/^-----BEGIN PRIVATE KEY-----\r?\n[\s\S]+\r?\n-----END PRIVATE KEY-----\s*$/.test(env.APPLE_IAP_PRIVATE_KEY || "")) throw unavailable();
  try {
    const key = createPrivateKey(env.APPLE_IAP_PRIVATE_KEY);
    if (key.asymmetricKeyType !== "ec" || key.asymmetricKeyDetails?.namedCurve !== "prime256v1") throw unavailable();
    return new AppStoreServerAPIClient(env.APPLE_IAP_PRIVATE_KEY, env.APPLE_IAP_KEY_ID,
      env.APPLE_IAP_ISSUER_ID, config.bundleId, config.environment);
  } catch { throw unavailable(); }
}

function isJws(value) {
  return typeof value === "string" && Buffer.byteLength(value, "utf8") <= MAX_JWS_BYTES &&
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
}
async function verified(verifier, method, signed) {
  if (!isJws(signed)) throw invalid();
  try { return await verifier[method](signed); }
  catch (error) {
    if (error?.status === VerificationStatus.RETRYABLE_VERIFICATION_FAILURE) throw unavailable();
    throw invalid();
  }
}
function validTime(value) {
  return Number.isSafeInteger(value) && value > 0 && value < 8640000000000000;
}
function iso(value) { return validTime(value) ? new Date(value).toISOString() : null; }

export function verifiedAppleTransactionRecord(transaction, config, nowMs = Date.now()) {
  if (!transaction || transaction.bundleId !== config.bundleId || transaction.environment !== config.environment ||
      !config.productIds.includes(transaction.productId) || transaction.type !== "Auto-Renewable Subscription" ||
      transaction.inAppOwnershipType !== "PURCHASED" || transaction.quantity !== 1 ||
      !TRANSACTION.test(transaction.transactionId || "") || !TRANSACTION.test(transaction.originalTransactionId || "") ||
      !UUID.test(transaction.appAccountToken || "") || !validTime(transaction.purchaseDate) ||
      !validTime(transaction.expiresDate) || !validTime(transaction.signedDate) ||
      transaction.purchaseDate > nowMs + FUTURE_SKEW_MS || transaction.signedDate > nowMs + FUTURE_SKEW_MS ||
      transaction.expiresDate <= transaction.purchaseDate ||
      transaction.expiresDate - transaction.purchaseDate > 400 * 86400000 ||
      (transaction.revocationDate != null && (!validTime(transaction.revocationDate) || transaction.revocationDate > nowMs + FUTURE_SKEW_MS)) ||
      (transaction.isUpgraded != null && typeof transaction.isUpgraded !== "boolean")) throw invalid();
  return {
    transaction_id: transaction.transactionId, original_transaction_id: transaction.originalTransactionId,
    app_account_token: transaction.appAccountToken.toLowerCase(), environment: transaction.environment,
    product_id: transaction.productId, purchased_at: iso(transaction.purchaseDate), expires_at: iso(transaction.expiresDate),
    signed_at: iso(transaction.signedDate), revoked_at: iso(transaction.revocationDate), is_upgraded: transaction.isUpgraded === true,
    // An introductory free offer is proved by Apple; no app-generated 72-hour timer.
    is_trial: transaction.offerType === 1 && transaction.offerDiscountType === "FREE_TRIAL",
  };
}

function renewalRecord(renewal, transaction, config, nowMs) {
  if (!renewal || renewal.environment !== config.environment || renewal.originalTransactionId !== transaction.original_transaction_id ||
      renewal.productId !== transaction.product_id || !validTime(renewal.signedDate) || renewal.signedDate > nowMs + FUTURE_SKEW_MS ||
      (renewal.appAccountToken != null && (typeof renewal.appAccountToken !== "string" || renewal.appAccountToken.toLowerCase() !== transaction.app_account_token)) ||
      ![0, 1].includes(renewal.autoRenewStatus) ||
      (renewal.gracePeriodExpiresDate != null && (!validTime(renewal.gracePeriodExpiresDate) ||
        renewal.gracePeriodExpiresDate > nowMs + 90 * 86400000))) throw invalid();
  return { auto_renew: renewal.autoRenewStatus === 1, grace_until: iso(renewal.gracePeriodExpiresDate), signed_at: iso(renewal.signedDate) };
}

export async function ensureAppleAccountToken(database, email, accountGeneration) {
  const normalized = normalizeAccountEmail(email);
  if (!normalized || !UUID.test(accountGeneration || "")) throw wrongAccount();
  const { data, error } = await database.rpc("ensure_apple_account_token", {
    p_email: normalized, p_account_generation: accountGeneration,
  });
  if (error) {
    if (String(error.message || "").includes("JL_APPLE_ACCOUNT")) throw wrongAccount();
    throw unavailable();
  }
  if (!data || !UUID.test(data.app_account_token || "") || data.account_email !== normalized ||
      data.account_generation !== accountGeneration || data.deleted_at !== null) throw unavailable();
  return data.app_account_token;
}

async function findTokenOwner(database, token) {
  const { data, error } = await database.from("apple_account_tokens")
    .select("app_account_token,account_email,account_generation,deleted_at").eq("app_account_token", token).maybeSingle();
  if (error) throw unavailable();
  if (data && data.app_account_token !== token) throw wrongAccount();
  return data;
}
async function tokenOwner(database, token, expectedEmail = null, expectedGeneration = null) {
  const data = await findTokenOwner(database, token);
  if (!data) throw wrongAccount();
  if (expectedEmail !== null && (data.account_email !== normalizeAccountEmail(expectedEmail) ||
      data.account_generation !== expectedGeneration || data.deleted_at !== null)) throw wrongAccount();
  return data;
}

function operationClock(nowMs) {
  const startedAt = Date.now();
  return () => nowMs + Math.max(0, Date.now() - startedAt);
}
function sandboxReviewConfig(config) {
  if (config?.environment !== Environment.PRODUCTION) throw unavailable();
  return { ...config, environment: Environment.SANDBOX };
}
async function currentReviewOwner(database, owner, policy, nowMs) {
  if (!matchesAppleReviewBinding(policy, owner, nowMs)) return false;
  const { data, error } = await database.from("userprofile").select("email,account_generation")
    .ilike("email", owner.account_email.replace(/[\\%_]/g, "\\$&")).maybeSingle();
  if (error) throw unavailable();
  return Boolean(data && normalizeAccountEmail(data.email) === owner.account_email &&
    data.account_generation === policy.accountGeneration);
}
function reviewEventInWindow(policy, signedDate, nowMs) {
  return isAppleReviewPolicyActive(policy, nowMs) && validTime(signedDate) &&
    signedDate >= policy.validFrom && signedDate < policy.validUntil;
}

// Current server status prevents a previously valid, still-unexpired device JWS
// from restoring access after a refund whose notification was missed.
async function currentSnapshot(originalId, token, { apiClient, verifier, config, nowMs, observedAt }) {
  let result;
  try { result = await apiClient.getAllSubscriptionStatuses(originalId); }
  catch { throw unavailable(); }
  if (!result || result.environment !== config.environment || result.bundleId !== config.bundleId ||
      (config.environment === Environment.PRODUCTION && result.appAppleId !== config.appAppleId) ||
      !Array.isArray(result.data) || result.data.length > 20) throw unavailable();
  const entries = result.data.flatMap(group => Array.isArray(group.lastTransactions) ? group.lastTransactions : []);
  if (entries.length > 40) throw unavailable();
  const matches = entries.filter(item => item.originalTransactionId === originalId);
  if (matches.length !== 1 || ![1, 2, 3, 4, 5].includes(matches[0].status)) throw unavailable();
  const selected = matches[0];
  const transaction = verifiedAppleTransactionRecord(await verified(verifier, "verifyAndDecodeTransaction", selected.signedTransactionInfo), config, nowMs);
  if (transaction.original_transaction_id !== originalId || transaction.app_account_token !== token) throw wrongAccount();
  const renewal = renewalRecord(await verified(verifier, "verifyAndDecodeRenewalInfo", selected.signedRenewalInfo), transaction, config, nowMs);
  const status = transaction.revoked_at ? 5 : selected.status;
  return { original_transaction_id: originalId, app_account_token: token, environment: config.environment,
    status, observed_at: observedAt, auto_renew: renewal.auto_renew, grace_until: status === 4 ? renewal.grace_until : null,
    transactions: [transaction] };
}

async function applySnapshot(database, snapshot, owner, notificationId = null) {
  const { data, error } = await database.rpc("apply_apple_subscription_snapshot", { p_snapshot: {
    ...snapshot, account_email: owner.account_email, account_generation: owner.account_generation,
    notification_id: notificationId,
  } });
  if (error) {
    if (String(error.message || "").includes("JL_APPLE_ACCOUNT")) throw wrongAccount();
    throw unavailable();
  }
  if (!data || data.original_transaction_id !== snapshot.original_transaction_id || data.environment !== snapshot.environment ||
      data.app_account_token !== snapshot.app_account_token) throw unavailable();
  return data;
}

function includeVerifiedEvidence(snapshot, record) {
  // Preserve both signed sources, even for the same transaction ID. Moving an
  // old refund into a freshly signed API record would invent a new event time.
  snapshot.transactions.push(record);
}

export function appleAccessFromSubscriptions(rows, nowMs = Date.now()) {
  if (!Array.isArray(rows)) throw unavailable();
  const funded = rows.filter(row => [1, 4].includes(row.status) && Number.isFinite(Date.parse(row.access_until)) &&
    Date.parse(row.access_until) > nowMs);
  funded.sort((a, b) => Date.parse(b.access_until) - Date.parse(a.access_until));
  const chosen = funded[0];
  const latest = [...rows].sort((a, b) => Date.parse(b.verified_at) - Date.parse(a.verified_at))[0];
  return { paid: Boolean(chosen), paidUntil: chosen?.access_until || null,
    accessType: chosen ? (chosen.is_trial ? "trial" : "paid") : "none",
    trialUntil: chosen?.is_trial ? chosen.access_until : null,
    source: chosen || latest ? "apple" : "none", status: chosen ? (chosen.auto_renew ? "ACTIVE" : "CANCELLED") : latest ?
      ({ 1: "ACTIVE", 2: "EXPIRED", 3: "BILLING_RETRY", 4: "BILLING_GRACE_PERIOD", 5: "REVOKED" }[latest.status] || null) : null };
}

export async function resolveAppleSubscriptionAccess(database, email, { nowMs = Date.now(), refresh = true,
  config = appleSubscriptionConfig(), verifier = null, apiClient = null,
  reviewPolicy = appleReviewPolicy(), reviewDependencies = {} } = {}) {
  if (!config) return { ...NONE };
  const currentTime = operationClock(nowMs);
  const normalized = normalizeAccountEmail(email);
  if (!normalized) throw unavailable();
  const { data: owner, error } = await database.from("apple_account_tokens")
    .select("app_account_token,account_email,account_generation,deleted_at").eq("account_email", normalized).maybeSingle();
  if (error) throw unavailable();
  if (!owner) return { ...NONE };
  if (owner.account_email !== normalized || owner.deleted_at !== null || !UUID.test(owner.app_account_token || "")) throw unavailable();
  const usingReview = config.environment === Environment.PRODUCTION &&
    await currentReviewOwner(database, owner, reviewPolicy, currentTime());
  const selectedConfig = usingReview ? sandboxReviewConfig(config) : config;
  const reviewStillAllowed = async () => !usingReview ||
    (await currentReviewOwner(database, owner, reviewPolicy, currentTime()) &&
      isAppleReviewPolicyActive(reviewPolicy, currentTime()));
  const load = async () => {
    if (!await reviewStillAllowed()) return [];
    const result = await database.from("apple_subscriptions")
      .select("original_transaction_id,app_account_token,environment,status,access_until,is_trial,auto_renew,verified_at")
      .eq("app_account_token", owner.app_account_token).eq("environment", selectedConfig.environment);
    if (result.error || !Array.isArray(result.data) || result.data.length > 20 ||
        result.data.some(row => row.app_account_token !== owner.app_account_token || row.environment !== selectedConfig.environment)) throw unavailable();
    if (!await reviewStillAllowed()) return [];
    return result.data;
  };
  let rows = await load();
  if (refresh) {
    const due = rows.filter(row => !Number.isFinite(Date.parse(row.verified_at)) || nowMs - Date.parse(row.verified_at) >= REFRESH_MS);
    if (due.length) {
      const dependencies = usingReview ? reviewDependencies : { verifier, apiClient };
      const appleVerifier = dependencies.verifier || createAppleVerifier(selectedConfig);
      const client = dependencies.apiClient || createAppleApiClient(selectedConfig);
      for (const row of due) {
        if (!await reviewStillAllowed()) return { ...NONE };
        const snapshot = await currentSnapshot(row.original_transaction_id, owner.app_account_token, {
          apiClient: client, verifier: appleVerifier, config: selectedConfig, nowMs,
          observedAt: new Date(nowMs).toISOString(),
        });
        if (!await reviewStillAllowed()) return { ...NONE };
        await applySnapshot(database, snapshot, owner);
      }
      rows = await load();
    }
  }
  if (!await reviewStillAllowed()) return { ...NONE };
  const effectiveRows = usingReview ? rows.map(row => ({ ...row,
    access_until: Number.isFinite(Date.parse(row.access_until))
      ? new Date(Math.min(Date.parse(row.access_until), reviewPolicy.validUntil)).toISOString() : null,
  })) : rows;
  return appleAccessFromSubscriptions(effectiveRows, currentTime());
}

export async function applyVerifiedAppleTransaction(signedTransactionInfo, email, accountGeneration,
  { database, nowMs = Date.now(), config = appleSubscriptionConfig(), verifier = null, apiClient = null,
    reviewPolicy = appleReviewPolicy(), reviewDependencies = {} } = {}) {
  if (!config || !database) throw unavailable();
  const currentTime = operationClock(nowMs);
  let reviewOwner = null;
  if (config.environment === Environment.PRODUCTION && isAppleReviewPolicyActive(reviewPolicy, currentTime()) &&
      accountGeneration === reviewPolicy.accountGeneration) {
    const candidate = await findTokenOwner(database, reviewPolicy.appAccountToken);
    if (candidate?.account_email === normalizeAccountEmail(email) &&
        await currentReviewOwner(database, candidate, reviewPolicy, currentTime())) reviewOwner = candidate;
  }
  const selectedConfig = reviewOwner ? sandboxReviewConfig(config) : config;
  const dependencies = reviewOwner ? reviewDependencies : { verifier, apiClient };
  const appleVerifier = dependencies.verifier || createAppleVerifier(selectedConfig);
  const record = verifiedAppleTransactionRecord(await verified(appleVerifier, "verifyAndDecodeTransaction", signedTransactionInfo), selectedConfig, nowMs);
  const owner = await tokenOwner(database, record.app_account_token, email, accountGeneration);
  if (reviewOwner && !await currentReviewOwner(database, owner, reviewPolicy, currentTime())) throw wrongAccount();
  const snapshot = await currentSnapshot(record.original_transaction_id, record.app_account_token, {
    apiClient: dependencies.apiClient || createAppleApiClient(selectedConfig), verifier: appleVerifier,
    config: selectedConfig, nowMs,
    observedAt: new Date(nowMs).toISOString(),
  });
  // Historical refunds must also remain revoked if the current subscription has
  // subsequently renewed. The RPC merges both by immutable transaction ID.
  includeVerifiedEvidence(snapshot, record);
  if (reviewOwner && (!await currentReviewOwner(database, owner, reviewPolicy, currentTime()) ||
      !isAppleReviewPolicyActive(reviewPolicy, currentTime()))) throw wrongAccount();
  await applySnapshot(database, snapshot, owner);
  return resolveAppleSubscriptionAccess(database, email, { nowMs: currentTime(), refresh: false, config,
    reviewPolicy, reviewDependencies });
}

async function verifiedNotification(signedPayload, appleVerifier, config, nowMs) {
  const notification = await verified(appleVerifier, "verifyAndDecodeNotification", signedPayload);
  const data = notification?.data;
  const metadata = data || notification?.summary || notification?.appData;
  // Apple omits this ID in Sandbox. A supplied ID must still match, and
  // Production always requires it alongside the verified bundle/environment.
  if (!notification || notification.version !== "2.0" || !UUID.test(notification.notificationUUID || "") ||
      !validTime(notification.signedDate) || notification.signedDate > nowMs + FUTURE_SKEW_MS ||
      !metadata || metadata.bundleId !== config.bundleId || metadata.environment !== config.environment ||
      ((config.environment === Environment.PRODUCTION || metadata.appAppleId !== undefined) &&
        metadata.appAppleId !== config.appAppleId)) throw invalid();
  if (notification.notificationType === "TEST") return { notification, result: { ok: true, test: true } };
  // Summary/consumption/one-time-purchase events never grant this subscription.
  if (!data?.signedTransactionInfo || ["CONSUMPTION_REQUEST", "ONE_TIME_CHARGE"].includes(notification.notificationType))
    return { notification, result: { ok: true, ignored: true } };
  const record = verifiedAppleTransactionRecord(await verified(appleVerifier, "verifyAndDecodeTransaction", data.signedTransactionInfo), config, nowMs);
  return { notification, record };
}

async function applyNotificationSnapshot(notification, record, owner,
  { database, nowMs, config, verifier, apiClient, beforeApply = null }) {
  const snapshot = await currentSnapshot(record.original_transaction_id, record.app_account_token, {
    apiClient: apiClient || createAppleApiClient(config), verifier, config, nowMs,
    observedAt: new Date(nowMs).toISOString(),
  });
  includeVerifiedEvidence(snapshot, record);
  if (["REFUND", "REFUND_REVERSED"].includes(notification.notificationType)) {
    if ((notification.notificationType === "REFUND" && record.revoked_at === null) ||
        (notification.notificationType === "REFUND_REVERSED" && record.revoked_at !== null) ||
        (record.revoked_at !== null && Date.parse(record.revoked_at) > notification.signedDate)) throw invalid();
    snapshot.revocation_notification = {
      notification_type: notification.notificationType,
      notification_signed_at: iso(notification.signedDate),
      transaction_id: record.transaction_id,
      transaction_signed_at: record.signed_at,
      revoked_at: record.revoked_at,
    };
    if (notification.notificationType === "REFUND_REVERSED" &&
        snapshot.transactions[0].transaction_id === record.transaction_id &&
        (snapshot.status === 5 || snapshot.transactions[0].revoked_at !== null)) {
      // Do not consume the notification UUID while Apple's current status still
      // disagrees with its signed reversal. A retry can apply the original proof.
      throw unavailable();
    }
  }
  if (beforeApply) await beforeApply();
  await applySnapshot(database, snapshot, owner, notification.notificationUUID.toLowerCase());
  return { ok: true };
}

async function forwardReviewNotification(signedPayload, fetcher) {
  try {
    const response = await (fetcher || globalThis.fetch)(APPLE_REVIEW_NOTIFICATION_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signedPayload }), credentials: "omit", redirect: "error", cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (response.status !== 200) throw unavailable();
    return { ok: true, forwarded: true };
  } catch { throw unavailable(); }
}

export async function applyVerifiedAppleNotification(signedPayload,
  { database, nowMs = Date.now(), config = appleSubscriptionConfig(), verifier = null, apiClient = null,
    reviewPolicy = appleReviewPolicy(), reviewDependencies = {} } = {}) {
  if (!config || !database) throw unavailable();
  const currentTime = operationClock(nowMs);
  const appleVerifier = verifier || createAppleVerifier(config);
  const { notification, record, result } = await verifiedNotification(signedPayload, appleVerifier, config, nowMs);
  if (result) return result;
  const owner = await findTokenOwner(database, record.app_account_token);
  if (!owner) {
    // The isolated test backend never gains a production database credential.
    // A local token, including a detached/deleted one, is never forwarded.
    if (config.environment === Environment.SANDBOX &&
        record.app_account_token === reviewPolicy?.appAccountToken &&
        reviewEventInWindow(reviewPolicy, notification.signedDate, currentTime())) {
      return forwardReviewNotification(signedPayload, reviewDependencies.fetcher);
    }
    throw wrongAccount();
  }
  return applyNotificationSnapshot(notification, record, owner,
    { database, nowMs, config, verifier: appleVerifier, apiClient });
}

// Explicit Sandbox receiver on the public backend; ordinary production
// notifications do not select this path after a verification error.
export async function applyVerifiedAppleReviewNotification(signedPayload,
  { database, nowMs = Date.now(), config = appleSubscriptionConfig(), verifier = null, apiClient = null,
    reviewPolicy = appleReviewPolicy() } = {}) {
  if (!config || !database || config.environment !== Environment.PRODUCTION ||
      !isAppleReviewPolicyActive(reviewPolicy, nowMs)) throw unavailable();
  const currentTime = operationClock(nowMs);
  const selectedConfig = sandboxReviewConfig(config);
  const appleVerifier = verifier || createAppleVerifier(selectedConfig);
  const { notification, record, result } = await verifiedNotification(signedPayload, appleVerifier, selectedConfig, nowMs);
  if (!reviewEventInWindow(reviewPolicy, notification.signedDate, currentTime())) throw wrongAccount();
  if (result) return result;
  if (record.app_account_token !== reviewPolicy.appAccountToken) throw wrongAccount();
  const owner = await tokenOwner(database, record.app_account_token);
  const requireReviewOwner = async () => {
    if (!await currentReviewOwner(database, owner, reviewPolicy, currentTime()) ||
        !reviewEventInWindow(reviewPolicy, notification.signedDate, currentTime())) throw wrongAccount();
  };
  await requireReviewOwner();
  return applyNotificationSnapshot(notification, record, owner,
    { database, nowMs, config: selectedConfig, verifier: appleVerifier, apiClient, beforeApply: requireReviewOwner });
}

export async function readAppleJson(request, field) {
  const contentType = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") throw invalid();
  const reader = request.body?.getReader();
  if (!reader) throw invalid();
  let bytes = 0; const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_JWS_BYTES + 256) { await reader.cancel(); throw invalid(); }
      chunks.push(Buffer.from(value));
    }
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== 1 || !isJws(value[field])) throw invalid();
    return value[field];
  } catch (error) { if (error instanceof AppleSubscriptionError) throw error; throw invalid(); }
  finally { reader.releaseLock(); }
}
