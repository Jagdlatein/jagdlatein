import { getAccountDatabase, accountJson } from "../../../../lib/course-progress-server";
import { appleSubscriptionConfig, applyVerifiedAppleReviewNotification, readAppleJson,
  appleErrorResponse } from "../../../../lib/apple-subscriptions";
import { appleReviewPolicy, isAppleReviewPolicyActive } from "../../../../lib/apple-review-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// This is a separately configured Apple Sandbox destination, never an auth or
// purchase bypass. The server verifies Apple and the private live review binding.
export async function POST(request) {
  try {
    const config = appleSubscriptionConfig();
    if (!config || config.environment !== "Production") return accountJson({ code: "APPLE_DISABLED" }, 503);
    const reviewPolicy = appleReviewPolicy();
    if (!isAppleReviewPolicyActive(reviewPolicy)) return accountJson({ code: "APPLE_DISABLED" }, 503);
    const signedPayload = await readAppleJson(request, "signedPayload");
    return accountJson(await applyVerifiedAppleReviewNotification(signedPayload,
      { database: getAccountDatabase(), config, reviewPolicy }));
  } catch (error) { return appleErrorResponse(error); }
}
