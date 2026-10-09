import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { isAccountDeletionEnabled, normalizeAccountEmail } from "./account-session";
import { paypalBase, paypalRequest } from "../app/api/paypal/webhook/_base";

const STATUSES = new Set(["APPROVAL_PENDING", "APPROVED", "ACTIVE", "SUSPENDED", "CANCELLED", "EXPIRED"]);
const PAYMENT_STATUSES = new Set(["COMPLETED", "PENDING", "DECLINED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED", "REVERSED"]);
const REFRESH_MS = 5 * 60 * 1000;
const LOOKBACK_MS = 370 * 86400000;
const TRIAL_MS = 3 * 86400000;

export function configuredTrialPlanId() {
  const id = process.env.NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID?.trim();
  return typeof id === "string" && /^P-[A-Z0-9]{6,64}$/.test(id) ? id : null;
}

function knownTrialPlanIds() {
  // Keep existing trial contracts verifiable when the public offer is removed.
  return [...new Set([configuredTrialPlanId(), ...(process.env.PAYPAL_TRIAL_PLAN_IDS || "").split(",").map(value => value.trim())]
    .filter(value => typeof value === "string" && /^P-[A-Z0-9]{6,64}$/.test(value)))];
}

function unavailable() { return Object.assign(new Error("Kontozugriff derzeit nicht verfügbar."), { status: 503 }); }
export function subscriptionDatabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw unavailable();
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
export function validSubscriptionId(value) { return typeof value === "string" && /^I-[A-Z0-9]{6,64}$/i.test(value); }
function validPaymentId(value) { return typeof value === "string" && /^[A-Z0-9-]{6,64}$/i.test(value); }
function iso(value) {
  if (typeof value !== "string" || value.length > 64) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}
function money(value) {
  if (typeof value !== "string" || !/^\d{1,12}(?:\.\d{1,3})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  return `${whole.replace(/^0+(?=\d)/, "")}.${fraction.padEnd(3, "0")}`;
}

// App policy: a confirmed regular payment buys one verified plan interval from
// its payment time. PayPal next_billing_time is a schedule, never payment proof.
export function addPlanInterval(time, frequency) {
  const date = new Date(time);
  const count = frequency?.interval_count ?? 1;
  const unit = frequency?.interval_unit;
  const limits = { DAY: 365, WEEK: 52, MONTH: 12, YEAR: 1 };
  if (!Number.isFinite(date.getTime()) || !Object.hasOwn(limits, unit) || !Number.isInteger(count) || count < 1 || count > limits[unit]) return null;
  if (unit === "DAY" || unit === "WEEK") date.setUTCDate(date.getUTCDate() + count * (unit === "WEEK" ? 7 : 1));
  else {
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + count * (unit === "YEAR" ? 12 : 1));
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
  }
  return date.toISOString();
}

export function regularAccessPolicy(subscription, plan) {
  const cycles = plan?.billing_cycles;
  const trialPlan = knownTrialPlanIds().includes(subscription.plan_id);
  const trial = trialPlan && Array.isArray(cycles) ? cycles[0] : null;
  const cycle = trialPlan && Array.isArray(cycles) ? cycles[1] : cycles?.[0];
  if (trialPlan && (
    cycles?.length !== 2 || trial?.tenure_type !== "TRIAL" || trial?.sequence !== 1 || trial?.total_cycles !== 1 ||
    trial?.frequency?.interval_unit !== "DAY" || trial?.frequency?.interval_count !== 3 ||
    (trial.pricing_scheme != null && (!trial.pricing_scheme.fixed_price ||
      trial.pricing_scheme.fixed_price.currency_code !== "EUR" || money(trial.pricing_scheme.fixed_price.value) !== "0.000" ||
      trial.pricing_scheme.tiers?.length || trial.pricing_scheme.pricing_model)) ||
    cycle?.tenure_type !== "REGULAR" || cycle?.sequence !== 2 || cycle?.total_cycles !== 0 ||
    cycle?.frequency?.interval_unit !== "MONTH" || cycle?.frequency?.interval_count !== 1 ||
    cycle?.pricing_scheme?.fixed_price?.currency_code !== "EUR" || money(cycle?.pricing_scheme?.fixed_price?.value) !== "5.000" ||
    subscription.plan_overridden === true
  )) return { reviewReason: "unsupported_trial_plan" };
  if (!trialPlan && (!Array.isArray(cycles) || cycles.length !== 1 || cycles[0]?.tenure_type !== "REGULAR"))
    return { reviewReason: "trial_or_complex_plan" };
  const price = cycle.pricing_scheme?.fixed_price;
  if (!price || !/^[A-Z]{3}$/.test(price.currency_code || "") || !money(price.value) || Number(price.value) <= 0 ||
      cycle.pricing_scheme?.tiers?.length || cycle.pricing_scheme?.pricing_model ||
      !addPlanInterval("2026-01-01T00:00:00Z", cycle.frequency)) return { reviewReason: "unsupported_regular_price" };
  if ((subscription.quantity != null && Number(subscription.quantity) !== 1) ||
      Number(subscription.shipping_amount?.value || 0) !== 0 ||
      Number(plan.payment_preferences?.setup_fee?.value || 0) !== 0 || Number(plan.taxes?.percentage || 0) !== 0)
    return { reviewReason: "setup_shipping_quantity_or_tax" };
  return { frequency: cycle.frequency, amount: money(price.value), currency: price.currency_code, reviewReason: null,
    ...(trialPlan ? { trial: true } : {}) };
}

// Pin the first verified provider schedule, capped at 72 hours. PayPal's DAY
// billing can be earlier than start + 72h; retries and later monthly schedules
// must never restart or lengthen the free interval.
export function verifiedTrialPeriod(subscription, policy, nowMs = Date.now(), existingPeriod = null) {
  if (!policy.trial || policy.reviewReason) return null;
  const startedAt = iso(subscription.start_time);
  const billingAt = iso(subscription.billing_info?.next_billing_time);
  if (!startedAt || Date.parse(startedAt) > nowMs || !billingAt || Date.parse(billingAt) <= Date.parse(startedAt)) return null;
  if (existingPeriod?.startedAt === startedAt && Date.parse(billingAt) >= Date.parse(existingPeriod.until))
    return existingPeriod;
  return { startedAt, until: new Date(Math.min(Date.parse(startedAt) + TRIAL_MS, Date.parse(billingAt))).toISOString() };
}

async function pinnedTrialPeriod(database, subscriptionId, email, nowMs) {
  const { data, error } = await database.from("paypal_subscriptions")
    .select("subscription_id,account_email,trial_started_at,trial_until").eq("subscription_id", subscriptionId).maybeSingle();
  if (error) throw unavailable();
  if (data === null) return null;
  if (!data || typeof data !== "object" || Array.isArray(data) || data.subscription_id !== subscriptionId ||
      data.account_email !== email || !Object.hasOwn(data, "trial_started_at") || !Object.hasOwn(data, "trial_until")) throw unavailable();
  if (data.trial_started_at === null && data.trial_until === null) return null;
  const startedAt = iso(data.trial_started_at), until = iso(data.trial_until);
  if (!startedAt || !until || Date.parse(startedAt) > nowMs || Date.parse(until) <= Date.parse(startedAt) ||
      Date.parse(until) - Date.parse(startedAt) > TRIAL_MS) throw unavailable();
  return { startedAt, until };
}

async function transactionsFor(subscriptionId, nowMs, lookbackMs = LOOKBACK_MS) {
  const prefix = `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/transactions`;
  const transactions = new Map();
  // Keep requests bounded to 31-day windows. The current subscription API spec
  // specifies date ranges without a maximum; no large-range support is assumed.
  for (let start = nowMs - Math.min(LOOKBACK_MS, lookbackMs); start < nowMs; start += 31 * 86400000) {
    const end = Math.min(nowMs, start + 31 * 86400000);
    let path = `${prefix}?start_time=${encodeURIComponent(new Date(start).toISOString())}&end_time=${encodeURIComponent(new Date(end).toISOString())}`;
    const visited = new Set(); let received = 0; let finished = false;
    for (let page = 0; page < 10; page++) {
      if (visited.has(path)) throw unavailable();
      visited.add(path);
      const result = await paypalRequest(path);
      // PayPal returns HTTP 200 with exactly {} for a new subscription without
      // transactions. Its transactions_list schema has no required properties.
      // Only this observed first-page shape means no history; other missing or
      // malformed payloads and an empty pagination continuation fail closed.
      const emptyHistory = result !== null && typeof result === "object" &&
        Object.getPrototypeOf(result) === Object.prototype && Object.keys(result).length === 0;
      const entries = emptyHistory && page === 0 ? [] : result?.transactions;
      if (!Array.isArray(entries)) throw unavailable();
      received += entries.length;
      for (const transaction of entries) transactions.set(transaction.id, transaction);
      if (transactions.size > 1000) throw unavailable();
      const next = result.links?.find(link => link.rel === "next");
      if (!next) {
        if ((Number(result.total_pages) > page + 1) || (Number(result.total_items) > received)) throw unavailable();
        finished = true; break;
      }
      const url = new URL(next.href, paypalBase().base);
      if (url.origin !== paypalBase().base || url.pathname !== prefix || url.username || url.password || url.hash || (next.method && next.method !== "GET")) throw unavailable();
      path = url.pathname + url.search;
    }
    if (!finished) throw unavailable();
  }
  return [...transactions.values()];
}

function paymentRecord(transaction, policy, nowMs) {
  const time = iso(transaction.time);
  if (!validPaymentId(transaction.id) || !PAYMENT_STATUSES.has(transaction.status) || !time || Date.parse(time) > nowMs) throw unavailable();
  const gross = transaction.amount_with_breakdown?.gross_amount;
  const supported = !policy.reviewReason && gross?.currency_code === policy.currency && money(gross?.value) === policy.amount;
  return { payment_id: transaction.id, status: transaction.status, paid_at: time,
    amount: typeof gross?.value === "string" ? gross.value.slice(0, 32) : null,
    currency: /^[A-Z]{3}$/.test(gross?.currency_code || "") ? gross.currency_code : null,
    period_until: supported ? addPlanInterval(time, policy.frequency) : null };
}

async function ensureProfile(database, email) {
  const pattern = email.replace(/[\\%_]/g, "\\$&");
  const { data, error } = await database.from("userprofile").select("email").ilike("email", pattern).maybeSingle();
  if (error || (data && normalizeAccountEmail(data.email) !== email)) throw unavailable();
  if (data) return;
  // Never overwrite manual/legacy premium or admin flags on an existing account.
  const inserted = await database.from("userprofile").insert({ user_id: randomUUID(), email, is_premium: false, is_admin: false,
    updated_at: new Date().toISOString() });
  if (inserted.error && inserted.error.code !== "23505") throw unavailable();
}

export async function refreshVerifiedSubscription(subscriptionId, { database = subscriptionDatabase(), nowMs = Date.now(), paymentChange = null } = {}) {
  if (!validSubscriptionId(subscriptionId)) return null;
  if (isAccountDeletionEnabled()) {
    const guard = await database.from("paypal_subscriptions").select("subscription_id,account_deleted_at")
      .eq("subscription_id", subscriptionId).maybeSingle();
    if (guard.error) throw unavailable();
    // A provider renewal must never recreate a deleted learning account.
    if (guard.data?.account_deleted_at) return null;
  }
  // Timestamp before remote reads so slower concurrent reads cannot replace a newer snapshot.
  const observedAt = new Date(nowMs).toISOString();
  const subscription = await paypalRequest(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}?fields=plan`);
  const allowed = (process.env.PAYPAL_PLAN_IDS || [process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID || "P-9XU38461YG7706134NESJQWA", configuredTrialPlanId()].filter(Boolean).join(",")).split(",").map(value => value.trim());
  if (subscription.id !== subscriptionId || !allowed.includes(subscription.plan_id) || !STATUSES.has(subscription.status)) return null;
  const email = normalizeAccountEmail(subscription.subscriber?.email_address);
  if (!email) return null;
  const trialPlan = knownTrialPlanIds().includes(subscription.plan_id);
  const merchantPlan = trialPlan ? await paypalRequest(`/v1/billing/plans/${encodeURIComponent(subscription.plan_id)}`) : null;
  const plan = subscription.plan || merchantPlan || await paypalRequest(`/v1/billing/plans/${encodeURIComponent(subscription.plan_id)}`);
  const policy = regularAccessPolicy(subscription, plan);
  if (trialPlan && (merchantPlan?.id !== subscription.plan_id || regularAccessPolicy(subscription, merchantPlan).reviewReason))
    policy.reviewReason = "unsupported_trial_plan";
  const existingPeriod = policy.trial && !policy.reviewReason ? await pinnedTrialPeriod(database, subscriptionId, email, nowMs) : null;
  const trialPeriod = verifiedTrialPeriod(subscription, policy, nowMs, existingPeriod);
  // A missing trial schedule blocks free access, but must not hide an actual
  // supported payment (cancelled subscriptions can omit their next billing).
  const scheduleReviewReason = policy.trial && !policy.reviewReason && !trialPeriod ? "trial_schedule_requires_review" : null;
  const intervalEnd = policy.reviewReason ? null : addPlanInterval(observedAt, policy.frequency);
  const transactions = policy.reviewReason ? [] : await transactionsFor(subscriptionId, nowMs, Date.parse(intervalEnd) - nowMs + 2 * 86400000);
  const payments = transactions.map(transaction => paymentRecord(transaction, policy, nowMs));
  if (paymentChange) {
    const existing = payments.find(payment => payment.payment_id === paymentChange.payment_id);
    if (existing) existing.status = paymentChange.status;
    else payments.push({ payment_id: paymentChange.payment_id, status: paymentChange.status, paid_at: null, period_until: null, amount: null, currency: null });
  }
  if (isAccountDeletionEnabled()) {
    const ensured = await database.rpc("ensure_paypal_account_profile", { p_subscription_id: subscriptionId, p_email: email });
    if (ensured.error || typeof ensured.data?.deleted !== "boolean") throw unavailable();
    if (ensured.data.deleted) return null;
  } else {
    await ensureProfile(database, email);
  }
  const { data, error } = await database.rpc("apply_paypal_subscription_snapshot", { p_snapshot: {
    subscription_id: subscriptionId, account_email: email, plan_id: subscription.plan_id, status: subscription.status,
    provider_updated_at: iso(subscription.status_update_time), observed_at: observedAt,
    ...(trialPeriod ? { trial_started_at: trialPeriod.startedAt, trial_until: trialPeriod.until } : {}),
    review_reason: policy.reviewReason || scheduleReviewReason || (payments.some(payment => !payment.period_until &&
      ["COMPLETED", "PARTIALLY_REFUNDED"].includes(payment.status) &&
      !(policy.trial && payment.currency === "EUR" && money(payment.amount) === "0.000")) ? "payment_amount_requires_review" : null), payments,
  } });
  if (error || !data || data.subscription_id !== subscriptionId) throw unavailable();
  return data;
}

export function accessFromSubscriptions(rows, nowMs = Date.now()) {
  if (!Array.isArray(rows)) throw unavailable();
  const funded = rows.filter(row => iso(row.paid_until) && Date.parse(row.paid_until) > nowMs);
  funded.sort((a, b) => Date.parse(b.paid_until) - Date.parse(a.paid_until));
  const trialRows = rows.filter(row => knownTrialPlanIds().includes(row.plan_id) &&
    iso(row.trial_started_at) && iso(row.trial_until) && Date.parse(row.trial_started_at) <= nowMs &&
    Date.parse(row.trial_until) > Date.parse(row.trial_started_at) &&
    Date.parse(row.trial_until) - Date.parse(row.trial_started_at) <= TRIAL_MS);
  trialRows.sort((a, b) => Date.parse(b.trial_until) - Date.parse(a.trial_until));
  const trial = trialRows.find(row => row.status === "ACTIVE" && !row.review_reason && Date.parse(row.trial_until) > nowMs);
  const chosen = funded[0] || trial;
  const accessType = funded.length ? "paid" : trial ? "trial" : "none";
  const latest = [...rows].sort((a, b) => (Date.parse(b.verified_at) || 0) - (Date.parse(a.verified_at) || 0))[0];
  return { paid: Boolean(chosen), paidUntil: chosen ? iso(accessType === "trial" ? chosen.trial_until : chosen.paid_until) : null,
    accessType, trialUntil: iso((trial || trialRows[0])?.trial_until),
    source: chosen ? "paypal" : "none", status: chosen?.status || latest?.status || null };
}

async function resolvePayPalSubscriptionAccess(database, email, { legacyPaid = false, nowMs = Date.now(), refresh = true } = {}) {
  if (legacyPaid) return { paid: true, paidUntil: null, accessType: "legacy", trialUntil: null, source: "legacy_or_manual", status: null };
  const normalized = normalizeAccountEmail(email);
  if (!normalized) throw unavailable();
  const load = async () => {
    const { data, error } = await database.from("paypal_subscriptions")
      .select("subscription_id,account_email,status,paid_until,verified_at,review_reason" +
        (knownTrialPlanIds().length ? ",plan_id,trial_started_at,trial_until" : "")).eq("account_email", normalized);
    if (error || !Array.isArray(data) || data.some(row => row.account_email !== normalized)) {
      if (["42P01", "PGRST205"].includes(error?.code)) console.error("Subscription ledger migration 20261004110000_subscription_access.sql is required.");
      throw unavailable();
    }
    return data;
  };
  let rows = await load();
  if (rows.length > 20) throw unavailable();
  if (refresh) {
    const due = rows.filter(row => {
      if (["CANCELLED", "EXPIRED"].includes(row.status) && (!iso(row.paid_until) || Date.parse(row.paid_until) <= nowMs)) return false;
      return !iso(row.verified_at) || nowMs - Date.parse(row.verified_at) >= REFRESH_MS;
    });
    if (due.length) {
      // Funded coverage remains usable until its recorded hard expiry. A free
      // trial needs current status verification; an outage must not hide its cancellation.
      let failed = false;
      for (const row of due) {
        try { if (!await refreshVerifiedSubscription(row.subscription_id, { database, nowMs })) failed = true; }
        catch { failed = true; }
      }
      rows = await load();
      const access = accessFromSubscriptions(rows, nowMs);
      if (failed && (!access.paid || access.accessType === "trial")) throw unavailable();
      return access;
    }
  }
  return accessFromSubscriptions(rows, nowMs);
}

export async function resolveSubscriptionAccess(database, email, options = {}) {
  // Until the separate Apple schema, product and verification key are ready,
  // the existing web checkout and account resolution retain their normal path.
  if (process.env.APPLE_SUBSCRIPTIONS_ENABLED !== "true" || options.legacyPaid) {
    return resolvePayPalSubscriptionAccess(database, email, options);
  }
  const { resolveAppleSubscriptionAccess } = await import("./apple-subscriptions");
  const results = await Promise.allSettled([
    resolvePayPalSubscriptionAccess(database, email, options),
    resolveAppleSubscriptionAccess(database, email, options),
  ]);
  const access = results.filter(result => result.status === "fulfilled").map(result => result.value);
  const usable = access.filter(value => value?.paid);
  usable.sort((a, b) => (Date.parse(b.paidUntil) || 0) - (Date.parse(a.paidUntil) || 0));
  if (usable.length) return usable[0];
  if (results.some(result => result.status === "rejected")) throw unavailable();
  return access.find(value => value?.status && value.source === "apple") || access[0];
}

export async function applyVerifiedPaypalEvent(event, database = subscriptionDatabase()) {
  if (event.event_type.startsWith("BILLING.SUBSCRIPTION."))
    return refreshVerifiedSubscription(event.resource?.id, { database });
  const resource = event.resource;
  // The signed subscription-sale event can carry its agreement directly. Payment
  // proof still comes from the current subscription transaction API, avoiding an
  // unnecessary deprecated sale-lookup dependency for the normal renewal path.
  if (event.event_type === "PAYMENT.SALE.COMPLETED" && validSubscriptionId(resource?.billing_agreement_id))
    return refreshVerifiedSubscription(resource.billing_agreement_id, { database });
  let saleId = event.event_type === "PAYMENT.SALE.REFUNDED" ? resource?.sale_id : resource?.id;
  if (!saleId && event.event_type === "PAYMENT.SALE.REFUNDED" && validPaymentId(resource?.id)) {
    const refund = await paypalRequest(`/v1/payments/refund/${encodeURIComponent(resource.id)}`);
    if (refund.id !== resource.id || refund.state !== "completed") throw unavailable();
    saleId = refund.sale_id;
  }
  if (!validPaymentId(saleId)) return null;
  const sale = await paypalRequest(`/v1/payments/sale/${encodeURIComponent(saleId)}`);
  if (sale.id !== saleId || !validSubscriptionId(sale.billing_agreement_id)) return null;
  let paymentChange = null;
  if (event.event_type === "PAYMENT.SALE.REVERSED") paymentChange = { payment_id: saleId, status: "REVERSED" };
  if (event.event_type === "PAYMENT.SALE.REFUNDED") {
    if (!["refunded", "partially_refunded"].includes(sale.state)) throw unavailable();
    paymentChange = { payment_id: saleId, status: sale.state === "refunded" ? "REFUNDED" : "PARTIALLY_REFUNDED" };
  }
  return refreshVerifiedSubscription(sale.billing_agreement_id, { database, paymentChange });
}
