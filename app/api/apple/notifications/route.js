import { getAccountDatabase, accountJson } from "../../../../lib/course-progress-server";
import { appleSubscriptionConfig, applyVerifiedAppleNotification, readAppleJson, appleErrorResponse } from "../../../../lib/apple-subscriptions";
import { appleReviewPolicy } from "../../../../lib/apple-review-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// No browser cookie is trusted here. Apple authenticates the V2 event with a
// verified JWS; inner transaction and current server state are independently checked.
export async function POST(request) {
  try {
    const config = appleSubscriptionConfig();
    if (!config) return accountJson({ code: "APPLE_DISABLED" }, 503);
    const signedPayload = await readAppleJson(request, "signedPayload");
    return accountJson(await applyVerifiedAppleNotification(signedPayload,
      { database: getAccountDatabase(), config, reviewPolicy: appleReviewPolicy() }));
  } catch (error) { return appleErrorResponse(error); }
}
