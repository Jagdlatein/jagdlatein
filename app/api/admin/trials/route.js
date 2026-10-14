import {
  requireCurrentTrialAdmin, readTrialOverviewOptions, getAdminTrialOverview,
  trialOverviewJson, trialOverviewErrorResponse,
  TrialOverviewError,
} from "../../../../lib/admin-trial-overview";
import { drainOperatorTrialNotifications, getOperatorTrialNotificationStatus } from "../../../../lib/operator-trial-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req) {
  try {
    const { database } = await requireCurrentTrialAdmin(req);
    const options = readTrialOverviewOptions(req.url);
    const overview = await getAdminTrialOverview(database, options);
    // A revoked admin role or deleted account must also block a request that
    // was still reading customer rows when the change occurred.
    await requireCurrentTrialAdmin(req, { database });
    return trialOverviewJson(overview);
  } catch (error) { return trialOverviewErrorResponse(error); }
}

export async function POST(req) {
  try {
    const { database } = await requireCurrentTrialAdmin(req);
    let sameOrigin = false;
    try { sameOrigin = new URL(req.headers.get("origin")).origin === new URL(req.url).origin; } catch {}
    if (!sameOrigin) throw new TrialOverviewError("INVALID_ORIGIN", 403, "Diese Anfrage ist nicht erlaubt.");
    if ((req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() !== "application/json")
      throw new TrialOverviewError("INVALID_NOTIFICATION_REQUEST", 415, "Bitte die Benachrichtigungsprüfung erneut öffnen.");
    const raw = await req.text();
    let body;
    try { if (raw.length <= 128) body = JSON.parse(raw); } catch {}
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length)
      throw new TrialOverviewError("INVALID_NOTIFICATION_REQUEST", 400, "Die Anfrage ist ungültig.");
    const initialStatus = await getOperatorTrialNotificationStatus(database);
    if (!initialStatus.configured)
      throw new TrialOverviewError("TRIAL_NOTIFICATIONS_NOT_CONFIGURED", 503, "Der E-Mail-Versand ist noch nicht vollständig eingerichtet.");
    const delivery = await drainOperatorTrialNotifications({ database, limit: 2 });
    await requireCurrentTrialAdmin(req, { database });
    const notifications = await getOperatorTrialNotificationStatus(database);
    return trialOverviewJson({ notifications, delivery });
  } catch (error) { return trialOverviewErrorResponse(error); }
}
