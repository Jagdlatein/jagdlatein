// Private server configuration only. This never creates an entitlement: Apple
// signatures, the current provider state and the live account must still agree.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_REVIEW_WINDOW_MS = 14 * 86400000;
export const APPLE_REVIEW_NOTIFICATION_URL = "https://jagdlatein.de/api/apple/review-notifications";

function unavailable() {
  return Object.assign(new Error("Apple-Abos sind derzeit nicht verfügbar. Bitte später erneut versuchen."),
    { code: "APPLE_UNAVAILABLE", status: 503 });
}
function canonicalUtc(value) {
  if (typeof value !== "string") return null;
  const time = Date.parse(value);
  return Number.isSafeInteger(time) && time > 0 && new Date(time).toISOString() === value ? time : null;
}

export function appleReviewPolicy(env = process.env) {
  if (!env.APPLE_REVIEW_SANDBOX_ENABLED || env.APPLE_REVIEW_SANDBOX_ENABLED === "false") return null;
  if (env.APPLE_REVIEW_SANDBOX_ENABLED !== "true" || env.ACCOUNT_GENERATION_ENABLED !== "true" ||
      env.APPLE_SUBSCRIPTIONS_ENABLED !== "true" ||
      !((env.APPLE_STORE_ENVIRONMENT === "Production" && !env.JL_TEST_ENVIRONMENT) ||
        (env.APPLE_STORE_ENVIRONMENT === "Sandbox" && env.JL_TEST_ENVIRONMENT === "paypal-sandbox"))) throw unavailable();
  const accountGeneration = env.APPLE_REVIEW_ACCOUNT_GENERATION;
  const appAccountToken = env.APPLE_REVIEW_APP_ACCOUNT_TOKEN;
  const validFrom = canonicalUtc(env.APPLE_REVIEW_VALID_FROM);
  const validUntil = canonicalUtc(env.APPLE_REVIEW_VALID_UNTIL);
  if (!UUID.test(accountGeneration || "") || !UUID.test(appAccountToken || "") ||
      validFrom === null || validUntil === null || validUntil <= validFrom ||
      validUntil - validFrom > MAX_REVIEW_WINDOW_MS) throw unavailable();
  return Object.freeze({ accountGeneration: accountGeneration.toLowerCase(),
    appAccountToken: appAccountToken.toLowerCase(), validFrom, validUntil });
}

export function isAppleReviewPolicyActive(policy, nowMs = Date.now()) {
  return Boolean(policy && UUID.test(policy.accountGeneration || "") && UUID.test(policy.appAccountToken || "") &&
    Number.isSafeInteger(policy.validFrom) && Number.isSafeInteger(policy.validUntil) &&
    policy.validFrom > 0 && policy.validUntil > policy.validFrom &&
    policy.validUntil - policy.validFrom <= MAX_REVIEW_WINDOW_MS &&
    Number.isSafeInteger(nowMs) && nowMs >= policy.validFrom && nowMs < policy.validUntil);
}

export function matchesAppleReviewBinding(policy, owner, nowMs = Date.now()) {
  return isAppleReviewPolicyActive(policy, nowMs) && owner?.deleted_at === null &&
    owner.account_generation === policy.accountGeneration && owner.app_account_token === policy.appAccountToken;
}
