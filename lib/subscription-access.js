import { createClient } from "@supabase/supabase-js";
import { normalizeAccountEmail } from "./account-session";
import { paypalBase, paypalRequest } from "../app/api/paypal/webhook/_base";

const STATUSES = new Set(["APPROVAL_PENDING", "APPROVED", "ACTIVE", "SUSPENDED", "CANCELLED", "EXPIRED"]);
const PAYMENT_STATUSES = new Set(["COMPLETED", "PENDING", "DECLINED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED", "REVERSED"]);
const REFRESH_MS = 5 * 60 * 1000;
const LOOKBACK_MS = 370 * 86400000;

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
  if (!Array.isArray(cycles) || cycles.length !== 1 || cycles[0]?.tenure_type !== "REGULAR")
    return { reviewReason: "trial_or_complex_plan" };
  const cycle = cycles[0];
  const price = cycle.pricing_scheme?.fixed_price;
  if (!price || !/^[A-Z]{3}$/.test(price.currency_code || "") || !money(price.value) || Number(price.value) <= 0 ||
      cycle.pricing_scheme?.tiers?.length || cycle.pricing_scheme?.pricing_model ||
      !addPlanInterval("2026-01-01T00:00:00Z", cycle.frequency)) return { reviewReason: "unsupported_regular_price" };
  if ((subscription.quantity != null && Number(subscription.quantity) !== 1) ||
      Number(subscription.shipping_amount?.value || 0) !== 0 ||
      Number(plan.payment_preferences?.setup_fee?.value || 0) !== 0 || Number(plan.taxes?.percentage || 0) !== 0)
    return { reviewReason: "setup_shipping_quantity_or_tax" };
  return { frequency: cycle.frequency, amount: money(price.value), currency: price.currency_code, reviewReason: null };
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
      if (!Array.isArray(result?.transactions)) throw unavailable();
      received += result.transactions.length;
      for (const transaction of result.transactions) transactions.set(transaction.id, transaction);
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
  const inserted = await database.from("userprofile").insert({ email, is_premium: false, updated_at: new Date().toISOString() });
  if (inserted.error && inserted.error.code !== "23505") throw unavailable();
}

export async function refreshVerifiedSubscription(subscriptionId, { database = subscriptionDatabase(), nowMs = Date.now(), paymentChange = null } = {}) {
  if (!validSubscriptionId(subscriptionId)) return null;
  // Timestamp before remote reads so slower concurrent reads cannot replace a newer snapshot.
  const observedAt = new Date(nowMs).toISOString();
  const subscription = await paypalRequest(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}?fields=plan`);
  const allowed = (process.env.PAYPAL_PLAN_IDS || process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID || "P-9XU38461YG7706134NESJQWA").split(",").map(value => value.trim());
  if (subscription.id !== subscriptionId || !allowed.includes(subscription.plan_id) || !STATUSES.has(subscription.status)) return null;
  const email = normalizeAccountEmail(subscription.subscriber?.email_address);
  if (!email) return null;
  const plan = subscription.plan || await paypalRequest(`/v1/billing/plans/${encodeURIComponent(subscription.plan_id)}`);
  const policy = regularAccessPolicy(subscription, plan);
  const intervalEnd = policy.reviewReason ? null : addPlanInterval(observedAt, policy.frequency);
  const transactions = policy.reviewReason ? [] : await transactionsFor(subscriptionId, nowMs, Date.parse(intervalEnd) - nowMs + 2 * 86400000);
  const payments = transactions.map(transaction => paymentRecord(transaction, policy, nowMs));
  if (paymentChange) {
    const existing = payments.find(payment => payment.payment_id === paymentChange.payment_id);
    if (existing) existing.status = paymentChange.status;
    else payments.push({ payment_id: paymentChange.payment_id, status: paymentChange.status, paid_at: null, period_until: null, amount: null, currency: null });
  }
  await ensureProfile(database, email);
  const { data, error } = await database.rpc("apply_paypal_subscription_snapshot", { p_snapshot: {
    subscription_id: subscriptionId, account_email: email, plan_id: subscription.plan_id, status: subscription.status,
    provider_updated_at: iso(subscription.status_update_time), observed_at: observedAt,
    review_reason: policy.reviewReason || (payments.some(payment => !payment.period_until && ["COMPLETED", "PARTIALLY_REFUNDED"].includes(payment.status)) ? "payment_amount_requires_review" : null), payments,
  } });
  if (error || !data || data.subscription_id !== subscriptionId) throw unavailable();
  return data;
}

export function accessFromSubscriptions(rows, nowMs = Date.now()) {
  if (!Array.isArray(rows)) throw unavailable();
  const funded = rows.filter(row => iso(row.paid_until) && Date.parse(row.paid_until) > nowMs);
  funded.sort((a, b) => Date.parse(b.paid_until) - Date.parse(a.paid_until));
  const chosen = funded[0];
  return { paid: Boolean(chosen), paidUntil: chosen ? iso(chosen.paid_until) : null,
    source: chosen ? "paypal" : "none", status: chosen?.status || rows[0]?.status || null };
}

export async function resolveSubscriptionAccess(database, email, { legacyPaid = false, nowMs = Date.now(), refresh = true } = {}) {
  if (legacyPaid) return { paid: true, paidUntil: null, source: "legacy_or_manual", status: null };
  const normalized = normalizeAccountEmail(email);
  if (!normalized) throw unavailable();
  const load = async () => {
    const { data, error } = await database.from("paypal_subscriptions")
      .select("subscription_id,account_email,status,paid_until,verified_at,review_reason").eq("account_email", normalized);
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
      // If refresh fails, never extend or convert unverified access into premium.
      // Existing confirmed coverage stays usable only until its recorded hard expiry.
      let failed = false;
      for (const row of due) {
        try { if (!await refreshVerifiedSubscription(row.subscription_id, { database, nowMs })) failed = true; }
        catch { failed = true; }
      }
      rows = await load();
      const access = accessFromSubscriptions(rows, nowMs);
      if (failed && !access.paid) throw unavailable();
      return access;
    }
  }
  return accessFromSubscriptions(rows, nowMs);
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
