import { createClient } from "@supabase/supabase-js";
import { JL_ACCOUNT_COOKIE, accountDatabaseOptions, isAccountGenerationEnabled, matchesAccountGeneration, normalizeAccountEmail, readAccountSession } from "./account-session";
import { resolveSubscriptionAccess } from "./subscription-access";
import { ReviewLoginError, requireReviewSessionIdentity } from "./apple-review-login";

export function readRequestAccountSession(req) {
  const stored = typeof req?.cookies?.get === "function"
    ? req.cookies.get(JL_ACCOUNT_COOKIE)?.value : req?.cookies?.[JL_ACCOUNT_COOKIE];
  if (stored) return readAccountSession(stored);
  const header = typeof req?.headers?.get === "function" ? req.headers.get("cookie") : req?.headers?.cookie;
  const pair = (header || "").split(";").map(value => value.trim())
    .find(value => value.startsWith(`${JL_ACCOUNT_COOKIE}=`));
  return readAccountSession(pair?.slice(JL_ACCOUNT_COOKIE.length + 1));
}

export function hasSignedPaidAccess(req) {
  if (isAccountGenerationEnabled()) return false;
  const session = readRequestAccountSession(req);
  return Boolean(session && session.accessExpiresAt > Math.floor(Date.now() / 1000) && (session.paid || session.admin));
}

export async function getSignedAccountAccess(req, { refresh = false } = {}) {
  const session = readRequestAccountSession(req);
  if (!session) return null;
  if (!refresh && !isAccountGenerationEnabled() && session.accessExpiresAt > Math.floor(Date.now() / 1000)) return session;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw Object.assign(new Error("Kontozugriff derzeit nicht verfügbar."), { status: 503 });
  const database = createClient(url, key, accountDatabaseOptions(session));
  const { data, error } = await database.from("userprofile").select("email,is_premium,is_admin" + (isAccountGenerationEnabled() ? ",account_generation" : ""))
    .ilike("email", session.email.replace(/[\\%_]/g, "\\$&")).maybeSingle();
  if (error) throw Object.assign(new Error("Kontozugriff derzeit nicht verfügbar."), { status: 503 });
  if (!data || normalizeAccountEmail(data.email) !== session.email || !matchesAccountGeneration(data, session)) return null;
  try { await requireReviewSessionIdentity(database, session); }
  catch (error) {
    if (error instanceof ReviewLoginError && error.status === 401) return null;
    throw Object.assign(new Error("Kontozugriff derzeit nicht verfügbar."), { status: 503 });
  }
  const subscription = data.is_admin === true && data.is_premium !== true ? { paid: false, paidUntil: null }
    : await resolveSubscriptionAccess(database, session.email, { legacyPaid: data.is_premium === true });
  if (isAccountGenerationEnabled()) {
    const current = await database.from("userprofile").select("email,is_premium,is_admin,account_generation")
      .ilike("email", session.email.replace(/[\\%_]/g, "\\$&")).maybeSingle();
    if (current.error) throw Object.assign(new Error("Kontozugriff derzeit nicht verfügbar."), { status: 503 });
    if (!current.data || normalizeAccountEmail(current.data.email) !== session.email ||
      !matchesAccountGeneration(current.data, session) || current.data.is_premium !== data.is_premium ||
      current.data.is_admin !== data.is_admin) return null;
  }
  try { await requireReviewSessionIdentity(database, session); }
  catch (error) {
    if (error instanceof ReviewLoginError && error.status === 401) return null;
    throw Object.assign(new Error("Kontozugriff derzeit nicht verfügbar."), { status: 503 });
  }
  return { ...session, paid: subscription.paid, paidUntil: subscription.paidUntil, accessType: subscription.accessType || "none",
    trialUntil: subscription.trialUntil || null, admin: data.is_admin === true };
}

export async function requirePaidAccount(req) {
  const access = await getSignedAccountAccess(req, { refresh: true });
  if (!access) throw Object.assign(new Error("Bitte erneut anmelden."), { status: 401 });
  if (!access.paid && !access.admin) throw Object.assign(new Error("Premiumzugang erforderlich."), { status: 403 });
  return access;
}

export async function getPaidPageProps({ req, res, resolvedUrl = "/" }, { adminOnly = false } = {}) {
  res?.setHeader("Cache-Control", "private, no-store, max-age=0");
  const next = typeof resolvedUrl === "string" && resolvedUrl.startsWith("/") && !resolvedUrl.startsWith("//") ? resolvedUrl : "/";
  const login = { redirect: { destination: `/login?next=${encodeURIComponent(next)}`, permanent: false } };
  if (!readRequestAccountSession(req)) return login;
  let access;
  try { access = await getSignedAccountAccess(req); }
  catch { return { redirect: { destination: "/konto?access=unavailable", permanent: false } }; }
  if (!access) return login;
  if (adminOnly && !access.admin) return { redirect: { destination: "/konto", permanent: false } };
  if (!access.admin && !access.paid) return { redirect: { destination: `/preise?next=${encodeURIComponent(next)}`, permanent: false } };
  return { props: {} };
}
