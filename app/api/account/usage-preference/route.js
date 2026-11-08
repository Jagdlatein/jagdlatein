import { usageAccount, readUsagePreference, confirmUsageAccount, requireUsageOrigin, readUsageBody, validateUsagePreference, usageJson, usageError, usageMethod, usageRpcFailure, UsageAnalyticsError } from "../../../../lib/usage-analytics-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
  try { const { database, session } = await usageAccount(req); const preference = await readUsagePreference(database, session); await confirmUsageAccount(database, session); return usageJson(preference); }
  catch (error) { return usageError(error); }
}
export async function PUT(req) {
  try {
    requireUsageOrigin(req);
    const { database, session } = await usageAccount(req);
    const body = await readUsageBody(req, 512), enabled = validateUsagePreference(body, session);
    const { data, error } = await database.rpc("set_usage_analytics_preference", { p_email: session.email, p_account_generation: session.accountGeneration, p_enabled: enabled, p_expected_changed_at: body.expectedRevision });
    if (error) throw usageRpcFailure(error);
    if (data?.conflict === true) throw new UsageAnalyticsError("USAGE_PREFERENCE_CHANGED", 409);
    if (!data || data.enabled !== enabled) throw new UsageAnalyticsError("USAGE_UNAVAILABLE", 503);
    const preference = await readUsagePreference(database, session);
    await confirmUsageAccount(database, session);
    return usageJson(preference);
  } catch (error) { return usageError(error); }
}
export const POST = () => usageMethod("GET, PUT");
export const DELETE = POST;
export const PATCH = POST;
export const OPTIONS = POST;
