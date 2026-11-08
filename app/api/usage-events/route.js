import { usageAccount, confirmUsageAccount, requireUsageOrigin, readUsageBody, validatedUsageBatch, usageJson, usageError, usageMethod, usageRpcFailure, UsageAnalyticsError } from "../../../lib/usage-analytics-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req) {
  try {
    requireUsageOrigin(req);
    const { database, session } = await usageAccount(req);
    const batch = validatedUsageBatch(await readUsageBody(req));
    if (req.headers.get("sec-gpc") === "1" || req.headers.get("dnt") === "1") return usageJson({ recorded: false });
    const { data, error } = await database.rpc("record_usage_events", { p_email: session.email, p_account_generation: session.accountGeneration, p_batch_id: batch.batchId, p_events: batch.events });
    if (error) throw usageRpcFailure(error);
    if (!data || typeof data.recorded !== "boolean") throw new UsageAnalyticsError("USAGE_UNAVAILABLE", 503);
    await confirmUsageAccount(database, session);
    return usageJson({ recorded: data.recorded });
  } catch (error) { return usageError(error); }
}
export const GET = usageMethod;
export const PUT = usageMethod;
export const DELETE = usageMethod;
export const PATCH = usageMethod;
export const OPTIONS = usageMethod;
