import {
  requireAccountSession, getAccountDatabase, accountJson, accountErrorResponse,
  accountUnavailable, sessionRenewalRequired, requireCurrentAccount,
} from "../../../lib/course-progress-server";
import { resolveSubscriptionAccess } from "../../../lib/subscription-access";
import { isPayPalSandboxTestEnvironment } from "../../../lib/test-environment";
import { isAccountGenerationEnabled, matchesAccountGeneration } from "../../../lib/account-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const paypalManagementUrl = isPayPalSandboxTestEnvironment()
      ? "https://www.sandbox.paypal.com/myaccount/autopay/"
      : "https://www.paypal.com/myaccount/autopay/";
    const session = requireAccountSession(req);
    const database = getAccountDatabase("ACCOUNT_UNAVAILABLE", session);
    const pattern = session.email.replace(/[\\%_]/g, "\\$&");
    const { data: profile, error } = await database
      .from("userprofile")
      .select("email,is_premium,is_admin" + (isAccountGenerationEnabled() ? ",account_generation" : ""))
      .ilike("email", pattern)
      .maybeSingle();
    if (error) throw accountUnavailable();
    if (!profile || typeof profile.email !== "string" || profile.email.trim().toLowerCase() !== session.email || !matchesAccountGeneration(profile, session)) {
      throw sessionRenewalRequired();
    }
    const subscription = profile.is_admin === true && profile.is_premium !== true ? { paid: false, paidUntil: null }
      : await resolveSubscriptionAccess(database, session.email, { legacyPaid: profile.is_premium === true });
    if (isAccountGenerationEnabled()) await requireCurrentAccount(database, session);
    return accountJson({ account: {
      email: session.email,
      paid: subscription.paid,
      paidUntil: subscription.paidUntil,
      accessType: subscription.accessType || "none",
      trialUntil: subscription.trialUntil || null,
      subscriptionStatus: subscription.status || null,
      accessProvider: subscription.source || "none",
      paypalManagementUrl,
      appleManagementUrl: subscription.source === "apple" ? "https://apps.apple.com/account/subscriptions/" : null,
      admin: profile.is_admin === true,
    } });
  } catch (error) {
    return accountErrorResponse(error);
  }
}
