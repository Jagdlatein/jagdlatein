import { getAccountDatabase } from "../../../../lib/course-progress-server";
import { isOperatorTrialWorkerAuthorized } from "../../../../lib/operator-trial-worker";
import { drainOperatorTrialNotifications, getOperatorTrialNotificationStatus } from "../../../../lib/operator-trial-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function json(data, status = 200) {
  return Response.json(data, { status, headers: {
    "Cache-Control": "private, no-store, max-age=0", Vary: "Authorization",
    "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff",
  } });
}

export async function GET(req) {
  if (!isOperatorTrialWorkerAuthorized(req)) return json({ code: "UNAUTHORIZED" }, 401);
  try {
    const database = getAccountDatabase();
    const status = await getOperatorTrialNotificationStatus(database);
    if (!status.configured) return json({ code: "TRIAL_NOTIFICATIONS_NOT_CONFIGURED" }, 503);
    const delivery = await drainOperatorTrialNotifications({ database, limit: 10 });
    // No addresses, contract IDs or authentication data belong in cron logs.
    return json({ delivery });
  } catch {
    return json({ code: "TRIAL_NOTIFICATIONS_UNAVAILABLE" }, 503);
  }
}
