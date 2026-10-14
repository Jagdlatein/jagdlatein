import {
  requireAccountSession, getAccountDatabase, requireCurrentAccount,
  accountUnavailable, sessionRenewalRequired,
} from "./course-progress-server";
import { normalizeAccountEmail } from "./account-session";
import { isPayPalSandboxTestEnvironment } from "./test-environment";
import { getOperatorTrialNotificationStatus } from "./operator-trial-notifications";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SOURCE_WINDOW = 100;
const PAYPAL_STATUSES = new Set(["APPROVAL_PENDING", "APPROVED", "ACTIVE", "SUSPENDED", "CANCELLED", "EXPIRED"]);
const TRIAL_MS = 72 * 60 * 60 * 1000;
const PAYMENT_EVIDENCE_LIMIT = 21;

export class TrialOverviewError extends Error {
  constructor(code, status, message) { super(message); this.code = code; this.status = status; }
}

function unavailable() {
  return new TrialOverviewError("TRIAL_OVERVIEW_UNAVAILABLE", 503, "Die Aboübersicht ist gerade nicht erreichbar. Bitte erneut versuchen.");
}

function queryError(error) {
  if (["42P01", "PGRST205", "PGRST200", "42703", "PGRST204"].includes(error?.code)) {
    return new TrialOverviewError("TRIAL_OVERVIEW_NOT_CONFIGURED", 503, "Die Tabellen für die Aboübersicht sind noch nicht vollständig eingerichtet.");
  }
  return unavailable();
}

export function trialOverviewJson(data, status = 200) {
  return Response.json(data, { status, headers: {
    "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie",
    "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff",
  } });
}

export function trialOverviewErrorResponse(error) {
  if (error instanceof TrialOverviewError) return trialOverviewJson({ code: error.code, message: error.message }, error.status);
  if (error?.status === 401) return trialOverviewJson({ code: "SESSION_RENEWAL_REQUIRED", message: "Bitte melde dich erneut an." }, 401);
  return trialOverviewJson({ code: "TRIAL_OVERVIEW_UNAVAILABLE", message: "Die Aboübersicht ist gerade nicht erreichbar. Bitte erneut versuchen." }, 503);
}

// No short-lived entitlement cookie and no moderator permission is sufficient.
// This guard only reads the current account; it never resolves provider access.
export async function requireCurrentTrialAdmin(req, { database: suppliedDatabase = null } = {}) {
  const session = requireAccountSession(req);
  if (!UUID.test(session.accountGeneration || "")) throw sessionRenewalRequired();
  const database = suppliedDatabase || getAccountDatabase("ACCOUNT_UNAVAILABLE", session);
  await requireCurrentAccount(database, session);
  const result = await database.from("userprofile").select("email,account_generation,is_admin")
    .ilike("email", session.email.replace(/[\\%_]/g, "\\$&")).maybeSingle();
  if (result.error) throw accountUnavailable();
  if (!result.data || normalizeAccountEmail(result.data.email) !== session.email ||
      result.data.account_generation !== session.accountGeneration) throw sessionRenewalRequired();
  if (result.data.is_admin !== true) throw new TrialOverviewError("TRIAL_OVERVIEW_FORBIDDEN", 403, "Diese Übersicht ist nur für den Betreiber zugänglich.");
  return { session, database };
}

function integerParam(value, fallback, min, max) {
  if (value === null) return fallback;
  if (!/^\d{1,5}$/.test(value)) throw new TrialOverviewError("INVALID_TRIAL_QUERY", 400, "Die Seitenauswahl ist ungültig.");
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max)
    throw new TrialOverviewError("INVALID_TRIAL_QUERY", 400, "Die Seitenauswahl ist ungültig.");
  return number;
}

export function readTrialOverviewOptions(url, env = process.env) {
  const params = new URL(url).searchParams;
  const sandbox = isPayPalSandboxTestEnvironment(env);
  const requested = params.get("environment") || (sandbox ? "sandbox" : "live");
  if (!["live", "sandbox"].includes(requested) || (sandbox && requested === "live"))
    throw new TrialOverviewError("INVALID_TRIAL_ENVIRONMENT", 400, sandbox
      ? "Dieses Projekt enthält ausschließlich Testabos. Bitte Testumgebung auswählen." : "Bitte Live- oder Testabos auswählen.");
  const rawEmail = params.get("q") || "";
  const email = rawEmail ? normalizeAccountEmail(rawEmail) : "";
  if (rawEmail && !email) throw new TrialOverviewError("INVALID_TRIAL_SEARCH", 400, "Bitte eine vollständige E-Mail-Adresse eingeben.");
  const trialPlanIds = [...new Set([env.NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID,
    ...(env.PAYPAL_TRIAL_PLAN_IDS || "").split(",")].map(value => typeof value === "string" ? value.trim() : "")
    .filter(value => /^P-[A-Z0-9]{6,64}$/.test(value)))];
  return { environment: requested === "live" ? "Production" : "Sandbox", sandbox, trialPlanIds,
    email, offset: integerParam(params.get("offset"), 0, 0, 10000), limit: integerParam(params.get("limit"), 25, 1, 50) };
}

function iso(value) {
  if (typeof value !== "string" || value.length > 64) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}
function relation(value) {
  if (Array.isArray(value)) return value.length === 1 ? value[0] : null;
  return value && typeof value === "object" ? value : null;
}
function rows(result, limit) {
  if (result.error) throw queryError(result.error);
  if (!Array.isArray(result.data) || result.data.length > limit) throw unavailable();
  return result.data;
}

async function sourceCandidates(database, options) {
  const paypal = options.environment === (options.sandbox ? "Sandbox" : "Production");
  const queries = [];
  if (paypal) {
    let query = database.from("paypal_subscriptions").select("subscription_id,account_email,account_generation,account_deleted_at,plan_id,status,paid_until,trial_started_at,trial_until,review_reason,verified_at,created_at")
      .is("account_deleted_at", null).not("trial_started_at", "is", null);
    if (options.email) query = query.eq("account_email", options.email);
    queries.push(query.order("created_at", { ascending: false }).order("subscription_id", { ascending: false }).limit(SOURCE_WINDOW + 1)
      .then(result => ({ provider: "paypal", values: rows(result, SOURCE_WINDOW + 1) })));
  }
  let apple = database.from("apple_subscriptions").select("environment,original_transaction_id,app_account_token,latest_transaction_id,status,auto_renew,access_until,is_trial,grace_until,verified_at,created_at,owner:apple_account_tokens!inner(account_email,account_generation,deleted_at),trial:apple_subscription_transactions!inner(environment,original_transaction_id,app_account_token,purchased_at,expires_at,is_trial)")
    .eq("environment", options.environment).is("owner.deleted_at", null).not("owner.account_email", "is", null)
    .eq("trial.is_trial", true);
  if (options.email) apple = apple.eq("owner.account_email", options.email);
  queries.push(apple.order("created_at", { ascending: false }).order("original_transaction_id", { ascending: false })
    .order("purchased_at", { referencedTable: "trial", ascending: true }).limit(1, { referencedTable: "trial" }).limit(SOURCE_WINDOW + 1)
    .then(result => ({ provider: "apple", values: rows(result, SOURCE_WINDOW + 1) })));
  const result = await Promise.all(queries);
  const candidates = result.flatMap(source => source.values.slice(0, SOURCE_WINDOW).map(row => ({ provider: source.provider, row })));
  return { candidates, olderRecordsAvailable: result.some(source => source.values.length > SOURCE_WINDOW) };
}

async function currentProfiles(database, candidates) {
  const generations = [...new Set(candidates.map(({ provider, row }) => provider === "paypal"
    ? row.account_generation : relation(row.owner)?.account_generation).filter(value => UUID.test(value || "")))];
  const profiles = new Map();
  // Twenty-five UUIDs keep each PostgREST URL short and below default row limits.
  for (let i = 0; i < generations.length; i += 25) {
    const selected = generations.slice(i, i + 25);
    const result = await database.from("userprofile").select("email,account_generation").in("account_generation", selected).limit(25);
    for (const profile of rows(result, 25)) {
      if (!selected.includes(profile.account_generation) || !normalizeAccountEmail(profile.email) || profiles.has(profile.account_generation)) throw unavailable();
      profiles.set(profile.account_generation, normalizeAccountEmail(profile.email));
    }
  }
  return profiles;
}

function validOwner(candidate, profiles) {
  const { provider, row } = candidate;
  const owner = provider === "paypal" ? row : relation(row.owner);
  const email = normalizeAccountEmail(owner?.account_email);
  return Boolean(email && owner.account_email === email && owner.deleted_at == null && row.account_deleted_at == null &&
    UUID.test(owner.account_generation || "") && profiles.get(owner.account_generation) === email);
}

async function pageEvidence(database, page) {
  const paypalIds = page.filter(item => item.provider === "paypal").map(item => item.row.subscription_id);
  const appleIds = page.filter(item => item.provider === "apple").map(item => item.row.original_transaction_id);
  const paypalRegular = new Map(), appleRegular = new Map(), appleLatest = new Map();
  if (paypalIds.length) {
    const result = await database.from("paypal_subscriptions").select("subscription_id,regular:paypal_subscription_payments(payment_id,status,paid_at,period_until,amount,currency)")
      .in("subscription_id", paypalIds).in("regular.status", ["COMPLETED", "PARTIALLY_REFUNDED"])
      .not("regular.period_until", "is", null).order("paid_at", { referencedTable: "regular", ascending: true })
      .limit(PAYMENT_EVIDENCE_LIMIT, { referencedTable: "regular" }).limit(paypalIds.length);
    for (const row of rows(result, paypalIds.length)) {
      if (!paypalIds.includes(row.subscription_id) || paypalRegular.has(row.subscription_id)) throw unavailable();
      if (!Array.isArray(row.regular) || row.regular.length > PAYMENT_EVIDENCE_LIMIT) throw unavailable();
      paypalRegular.set(row.subscription_id, row.regular);
    }
  }
  if (appleIds.length) {
    const environment = page.find(item => item.provider === "apple").row.environment;
    const result = await database.from("apple_subscriptions").select("environment,original_transaction_id,regular:apple_subscription_transactions(environment,original_transaction_id,app_account_token,purchased_at,expires_at,is_trial,revoked_at,is_upgraded)")
      .eq("environment", environment).in("original_transaction_id", appleIds).eq("regular.is_trial", false)
      .is("regular.revoked_at", null).eq("regular.is_upgraded", false)
      .order("purchased_at", { referencedTable: "regular", ascending: true }).limit(1, { referencedTable: "regular" }).limit(appleIds.length);
    for (const row of rows(result, appleIds.length)) {
      if (row.environment !== environment || !appleIds.includes(row.original_transaction_id) || appleRegular.has(row.original_transaction_id)) throw unavailable();
      appleRegular.set(row.original_transaction_id, relation(row.regular));
    }
    const transactionIds = page.filter(item => item.provider === "apple").map(item => item.row.latest_transaction_id);
    const latest = await database.from("apple_subscription_transactions").select("environment,transaction_id,original_transaction_id,app_account_token,purchased_at,expires_at,is_trial,revoked_at,is_upgraded")
      .eq("environment", environment).in("transaction_id", transactionIds).limit(transactionIds.length);
    for (const row of rows(latest, transactionIds.length)) {
      if (row.environment !== environment || !transactionIds.includes(row.transaction_id) || appleLatest.has(row.transaction_id)) throw unavailable();
      appleLatest.set(row.transaction_id, row);
    }
  }
  return { paypalRegular, appleRegular, appleLatest };
}

function paypalItem(row, evidence, options, nowMs) {
  if (!/^I-[A-Z0-9]{6,64}$/i.test(row.subscription_id || "")) throw unavailable();
  const started = iso(row.trial_started_at), until = iso(row.trial_until), paidUntil = iso(row.paid_until);
  const validTrial = started && until && Date.parse(started) <= nowMs && Date.parse(until) > Date.parse(started) &&
    Date.parse(until) - Date.parse(started) <= TRIAL_MS;
  const firstRegularAt = (evidence.paypalRegular.get(row.subscription_id) || []).map(payment => {
    const paidAt = iso(payment.paid_at), periodUntil = iso(payment.period_until);
    return paidAt && Date.parse(paidAt) <= nowMs && (!started || Date.parse(paidAt) >= Date.parse(started)) &&
      periodUntil && Date.parse(periodUntil) > Date.parse(paidAt) && ["COMPLETED", "PARTIALLY_REFUNDED"].includes(payment.status) &&
      typeof payment.amount === "string" && /^\d+(?:\.\d{1,3})?$/.test(payment.amount) && Number(payment.amount) > 0 ? paidAt : null;
  }).filter(Boolean).sort()[0] || null;
  const funded = paidUntil && Date.parse(paidUntil) > nowMs;
  let stage = "ended";
  if (!validTrial || !options.trialPlanIds.includes(row.plan_id) || !PAYPAL_STATUSES.has(row.status) || row.review_reason ||
      !iso(row.verified_at) || Date.parse(row.verified_at) > nowMs + 300000) stage = "review";
  else if (funded) stage = firstRegularAt ? "regular" : "review";
  else if (row.status === "CANCELLED") stage = "cancelled";
  else if (row.status === "SUSPENDED") stage = "paused";
  else if (row.status === "ACTIVE" && Date.parse(until) > nowMs) stage = "trial";
  else if (["APPROVAL_PENDING", "APPROVED"].includes(row.status)) stage = "review";
  return { id: `paypal:${options.environment}:${row.subscription_id}`, email: row.account_email, provider: "paypal", environment: options.environment,
    trialStartedAt: started, trialUntil: until, accessUntil: stage === "regular" ? paidUntil : stage === "trial" ? until : null,
    stage, renewal: row.status === "ACTIVE" ? true : ["CANCELLED", "EXPIRED"].includes(row.status) ? false : null,
    firstRegularAt, verifiedAt: iso(row.verified_at), createdAt: iso(row.created_at) };
}

function appleItem(row, evidence, nowMs) {
  if (!/^[0-9]{1,30}$/.test(row.original_transaction_id || "")) throw unavailable();
  const owner = relation(row.owner), trial = relation(row.trial), latest = evidence.appleLatest.get(row.latest_transaction_id);
  const regular = evidence.appleRegular.get(row.original_transaction_id);
  const matches = value => value && value.environment === row.environment && value.original_transaction_id === row.original_transaction_id && value.app_account_token === row.app_account_token;
  const started = iso(trial?.purchased_at), until = iso(trial?.expires_at), accessUntil = iso(row.access_until);
  const validTrial = matches(trial) && trial.is_trial === true && started && until && Date.parse(started) <= nowMs && Date.parse(until) > Date.parse(started);
  const latestStart = iso(latest?.purchased_at), latestEnd = iso(latest?.expires_at);
  const validLatest = matches(latest) && latestStart && latestEnd && Date.parse(latestStart) <= nowMs && Date.parse(latestEnd) > Date.parse(latestStart) &&
    latest.revoked_at === null && latest.is_upgraded === false && typeof latest.is_trial === "boolean" && row.is_trial === latest.is_trial;
  const regularStart = iso(regular?.purchased_at), regularEnd = iso(regular?.expires_at);
  const firstRegularAt = matches(regular) && regular.is_trial === false && regular.revoked_at === null && regular.is_upgraded === false &&
    regularStart && regularEnd && Date.parse(regularStart) <= nowMs && (!started || Date.parse(regularStart) >= Date.parse(started)) && Date.parse(regularEnd) > Date.parse(regularStart) ? regularStart : null;
  let stage = "ended";
  if (!validTrial || ![1, 2, 3, 4, 5].includes(row.status) || typeof row.auto_renew !== "boolean" ||
      !iso(row.verified_at) || Date.parse(row.verified_at) > nowMs + 300000) stage = "review";
  else if (row.status === 4 && validLatest && accessUntil && Date.parse(accessUntil) > nowMs && iso(row.grace_until) && Date.parse(row.grace_until) >= Date.parse(accessUntil)) stage = "grace";
  else if (row.status === 1 && validLatest && accessUntil && Date.parse(accessUntil) > nowMs && Date.parse(accessUntil) <= Date.parse(latestEnd)) stage = row.is_trial ? "trial" : "regular";
  else if ([1, 4].includes(row.status) && accessUntil && Date.parse(accessUntil) > nowMs) stage = "review";
  else if (row.status === 3) stage = "paused";
  else if (row.status === 5 || row.auto_renew === false) stage = "cancelled";
  return { id: `apple:${row.environment}:${row.original_transaction_id}`, email: owner.account_email, provider: "apple", environment: row.environment,
    trialStartedAt: started, trialUntil: until, accessUntil: ["trial", "regular", "grace"].includes(stage) ? accessUntil : null,
    stage, renewal: row.auto_renew === true ? true : row.auto_renew === false ? false : null,
    firstRegularAt, verifiedAt: iso(row.verified_at), createdAt: iso(row.created_at) };
}

async function notificationStatus(database) {
  // Missing notification setup must not hide a working read-only ledger.
  try { return await getOperatorTrialNotificationStatus(database); }
  catch { return { configured: false, recipient: "info@jagdlatein.de", enabledSince: null, pendingCount: null, sentCount: null }; }
}

export async function getAdminTrialOverview(database, options, { nowMs = Date.now() } = {}) {
  const { candidates, olderRecordsAvailable } = await sourceCandidates(database, options);
  const profiles = await currentProfiles(database, candidates);
  const unique = new Map();
  for (const candidate of candidates) {
    if (!validOwner(candidate, profiles)) continue;
    const { provider, row } = candidate;
    const id = provider === "paypal" ? row.subscription_id : row.original_transaction_id;
    const key = `${provider}:${options.environment}:${id}`;
    if (unique.has(key)) throw unavailable();
    unique.set(key, candidate);
  }
  const available = [...unique.values()].sort((left, right) =>
    (Date.parse(right.row.created_at) || 0) - (Date.parse(left.row.created_at) || 0) ||
    `${right.provider}:${right.row.subscription_id || right.row.original_transaction_id}`.localeCompare(`${left.provider}:${left.row.subscription_id || left.row.original_transaction_id}`));
  const page = available.slice(options.offset, options.offset + options.limit);
  const evidence = await pageEvidence(database, page);
  const items = page.map(({ provider, row }) => provider === "paypal" ? paypalItem(row, evidence, options, nowMs) : appleItem(row, evidence, nowMs));
  // Recheck current owner generations after the detail reads. Deletion or a
  // recreated email can never expose its predecessor's rows.
  const current = await currentProfiles(database, page);
  const currentItems = items.filter((item, index) => validOwner(page[index], current));
  return { items: currentItems, hasMore: available.length > options.offset + options.limit, offset: options.offset, limit: options.limit,
    asOf: new Date(nowMs).toISOString(), environment: options.environment,
    windowLimit: SOURCE_WINDOW * 2, windowLimited: olderRecordsAvailable, olderRecordsAvailable,
    notifications: await notificationStatus(database) };
}
