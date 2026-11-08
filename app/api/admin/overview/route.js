import { requireCurrentTrialAdmin, trialOverviewJson } from "../../../../lib/admin-trial-overview";
import { readAdminOverviewOptions, getAdminOverview, adminOverviewErrorResponse } from "../../../../lib/admin-overview-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req) {
  try {
    const { database, session } = await requireCurrentTrialAdmin(req);
    const options = readAdminOverviewOptions(req.url);
    const overview = await getAdminOverview(database, session, options);
    await requireCurrentTrialAdmin(req, { database });
    return trialOverviewJson(overview);
  } catch (error) { return adminOverviewErrorResponse(error); }
}
