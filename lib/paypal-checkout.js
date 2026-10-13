import { isAccountGenerationEnabled } from "./account-session";
import { requireAccountSession, requireCurrentAccount, getAccountDatabase, accountUnavailable } from "./course-progress-server";
import { accessFromSubscriptions, configuredTrialPlanId, refreshVerifiedSubscription, regularAccessPolicy, resolveSubscriptionAccess, validSubscriptionId } from "./subscription-access";
import { paypalCheckoutSettings } from "./paypal-checkout-settings";
import { paypalPlanPricing } from "./paypal-plan-pricing";
import { paypalRequest } from "../app/api/paypal/webhook/_base";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OPEN_CHECKOUT_STATUSES = ["APPROVAL_PENDING", "APPROVED", "ACTIVE", "SUSPENDED"];
const CHECKOUT_STATUSES = new Set([...OPEN_CHECKOUT_STATUSES, "CANCELLED", "EXPIRED"]);

// Recover a checkout after a reload without trusting a browser-stored contract ID
// or starting another agreement. An approval can reach PayPal before the browser
// receives its callback; only the current account's existing ledger is examined.
export async function currentAccountPayPalCheckout({ session, database }) {
  const { data: rows, error } = await database.from("paypal_subscriptions")
    .select("subscription_id,account_email,account_generation,status,account_deleted_at")
    .eq("account_email", session.email).eq("account_generation", session.accountGeneration)
    .in("status", OPEN_CHECKOUT_STATUSES).limit(2);
  if (error || !Array.isArray(rows) || rows.length > 1 || rows.some(row =>
    !validSubscriptionId(row?.subscription_id) || row.account_email !== session.email ||
    row.account_generation !== session.accountGeneration || row.account_deleted_at ||
    !OPEN_CHECKOUT_STATUSES.includes(row.status))) throw accountUnavailable();
  if (!rows.length) return { subscriptionId: null, status: null, activated: false, accessType: "none", trialUntil: null };

  const row = await refreshVerifiedSubscription(rows[0].subscription_id, { database, expectedAccount: session });
  if (!row || row.subscription_id !== rows[0].subscription_id || row.account_email !== session.email ||
      row.account_generation !== session.accountGeneration || row.account_deleted_at ||
      !CHECKOUT_STATUSES.has(row.status)) throw accountUnavailable();
  const access = accessFromSubscriptions([row]);
  return { subscriptionId: row.subscription_id, status: row.status, activated: Boolean(access.paid),
    accessType: access.accessType || "none", trialUntil: access.trialUntil || null };
}

export async function requirePayPalAccount(req) {
  const session = requireAccountSession(req);
  if (!isAccountGenerationEnabled() || !UUID.test(session.accountGeneration || "")) throw accountUnavailable();
  paypalCheckoutSettings();
  const database = getAccountDatabase("ACCOUNT_UNAVAILABLE", session);
  await requireCurrentAccount(database, session);
  return { session, database };
}

export async function verifiedPayPalOffer(database) {
  const settings = paypalCheckoutSettings();
  const planId = configuredTrialPlanId();
  const pricing = paypalPlanPricing(settings.planId);
  if (pricing?.amount !== "10.000" || pricing.currency !== "EUR") throw accountUnavailable();
  if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_ID !== process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) throw accountUnavailable();
  const allowed = process.env.PAYPAL_PLAN_IDS?.split(",").map(value => value.trim());
  if (allowed && !allowed.includes(settings.planId)) throw accountUnavailable();
  if (planId) {
    const { data, error } = await database.from("paypal_subscriptions").select("trial_started_at,trial_until").limit(0);
    if (error || !Array.isArray(data) || data.length !== 0) throw accountUnavailable();
  }
  const plan = await paypalRequest(`/v1/billing/plans/${encodeURIComponent(settings.planId)}`);
  const policy = regularAccessPolicy({ plan_id: settings.planId }, plan);
  if (plan.id !== settings.planId || plan.status !== "ACTIVE" || policy.reviewReason || Boolean(policy.trial) !== settings.trial ||
      policy.amount !== pricing.amount || policy.currency !== pricing.currency ||
      policy.frequency?.interval_unit !== "MONTH" || policy.frequency?.interval_count !== 1 ||
      plan.quantity_supported === true || (!settings.trial &&
        (plan.billing_cycles[0].sequence !== 1 || plan.billing_cycles[0].total_cycles !== 0))) throw accountUnavailable();
  return { planId: settings.planId, clientId: settings.clientId, trialDays: settings.trial ? 3 : 0, amount: "10.00", currency: "EUR" };
}

export async function createAccountPayPalSubscription({ session, database }) {
  const profile = await database.from("userprofile").select("email,account_generation,is_premium,is_admin")
    .eq("account_generation", session.accountGeneration).maybeSingle();
  if (profile.error || !profile.data || profile.data.is_admin === true ||
      (await resolveSubscriptionAccess(database, session.email, { legacyPaid: profile.data.is_premium === true })).paid) throw accountUnavailable();
  const offer = await verifiedPayPalOffer(database);
  const begun = await database.rpc("begin_paypal_checkout", {
    p_email: session.email, p_account_generation: session.accountGeneration, p_plan_id: offer.planId,
  });
  if (begun.error || !UUID.test(begun.data?.request_id || "") || begun.data.account_generation !== session.accountGeneration ||
      begun.data.plan_id !== offer.planId) throw accountUnavailable();
  if (begun.data.subscription_id) {
    const existing = await database.from("paypal_subscriptions").select("subscription_id,status,account_generation")
      .eq("subscription_id", begun.data.subscription_id).maybeSingle();
    if (existing.error || !validSubscriptionId(begun.data.subscription_id) || existing.data?.status !== "APPROVAL_PENDING" ||
        existing.data.account_generation !== session.accountGeneration) throw accountUnavailable();
    return begun.data.subscription_id;
  }
  const origin = paypalCheckoutSettings().sandbox ? "https://jagdlatein-sandbox.vercel.app" : "https://jagdlatein.de";
  // No payer identity, client-selected plan, price override or account ID enters this request.
  const created = await paypalRequest("/v1/billing/subscriptions", {
    method: "POST", requestId: begun.data.request_id,
    body: { plan_id: offer.planId, application_context: { shipping_preference: "NO_SHIPPING", user_action: "SUBSCRIBE_NOW",
      return_url: `${origin}/konto`, cancel_url: `${origin}/preise` } },
  });
  if (!validSubscriptionId(created?.id) || created.plan_id !== offer.planId || created.status !== "APPROVAL_PENDING") throw accountUnavailable();
  const reserved = await database.rpc("reserve_paypal_subscription", {
    p_email: session.email, p_account_generation: session.accountGeneration, p_request_id: begun.data.request_id,
    p_subscription_id: created.id, p_plan_id: offer.planId,
  });
  if (reserved.error || reserved.data?.subscription_id !== created.id || reserved.data.account_generation !== session.accountGeneration ||
      reserved.data.account_email !== session.email) throw accountUnavailable();
  return created.id;
}
