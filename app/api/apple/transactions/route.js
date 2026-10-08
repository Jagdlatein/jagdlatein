import { requireAccountSession, requireCurrentAccount, requireSameOriginJson, getAccountDatabase,
  accountJson, accountErrorResponse } from "../../../../lib/course-progress-server";
import { AppleSubscriptionError, appleSubscriptionConfig, applyVerifiedAppleTransaction, readAppleJson,
  appleErrorResponse } from "../../../../lib/apple-subscriptions";
import { appleReviewPolicy } from "../../../../lib/apple-review-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const config = appleSubscriptionConfig();
    if (!config) return accountJson({ code: "APPLE_DISABLED", message: "Apple-Abos sind noch nicht freigeschaltet." }, 503);
    const session = requireAccountSession(request);
    requireSameOriginJson(request);
    const database = getAccountDatabase("ACCOUNT_UNAVAILABLE", session);
    await requireCurrentAccount(database, session);
    const signedTransactionInfo = await readAppleJson(request, "signedTransactionInfo");
    const access = await applyVerifiedAppleTransaction(signedTransactionInfo, session.email, session.accountGeneration,
      { database, config, reviewPolicy: appleReviewPolicy() });
    return accountJson({ ok: true, paid: access.paid, paidUntil: access.paidUntil,
      accessType: access.accessType, accessProvider: access.source });
  } catch (error) {
    return error instanceof AppleSubscriptionError ? appleErrorResponse(error) : accountErrorResponse(error);
  }
}
