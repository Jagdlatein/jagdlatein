import { requireAccountSession, requireCurrentAccount, getAccountDatabase, accountJson, accountErrorResponse,
  accountUnavailable, sessionRenewalRequired } from "../../../../lib/course-progress-server";
import { AppleSubscriptionError, appleSubscriptionConfig, createAppleApiClient, ensureAppleAccountToken,
  appleErrorResponse } from "../../../../lib/apple-subscriptions";
import { appleReviewPolicy } from "../../../../lib/apple-review-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const config = appleSubscriptionConfig();
    if (!config) return accountJson({ enabled: false });
    const reviewPolicy = appleReviewPolicy();
    // Missing In-App Purchase credentials disable checkout before Apple charges.
    createAppleApiClient(config);
    const session = requireAccountSession(request);
    const database = getAccountDatabase("ACCOUNT_UNAVAILABLE", session);
    await requireCurrentAccount(database, session);
    const { data: profile, error } = await database.from("userprofile")
      .select("email,is_premium,is_admin,account_generation")
      .ilike("email", session.email.replace(/[\\%_]/g, "\\$&")).maybeSingle();
    if (error) throw accountUnavailable();
    if (!profile || profile.email.toLowerCase().trim() !== session.email ||
        !session.accountGeneration || profile.account_generation !== session.accountGeneration) throw sessionRenewalRequired();
    const appAccountToken = await ensureAppleAccountToken(database, session.email, session.accountGeneration);
    // Lazy import avoids a cycle with the combined PayPal/Apple access resolver.
    const { resolveSubscriptionAccess } = await import("../../../../lib/subscription-access");
    const access = await resolveSubscriptionAccess(database, session.email, {
      legacyPaid: profile.is_premium === true && profile.is_admin !== true,
      reviewPolicy,
    });
    const paid = access.paid === true || profile.is_admin === true;
    // Website/native destination stays Production even when the privately bound
    // review account verifies an Apple Sandbox purchase on this backend.
    return accountJson({ enabled: true, environment: config.environment, productIds: config.productIds,
      appAccountToken, email: session.email, paid, accessType: access.accessType,
      accessProvider: profile.is_admin ? "admin" : access.source, purchaseAllowed: !paid });
  } catch (error) {
    return error instanceof AppleSubscriptionError ? appleErrorResponse(error) : accountErrorResponse(error);
  }
}
