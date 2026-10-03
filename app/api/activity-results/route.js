import {
  requireAccountSession, getAccountDatabase, requireSameOriginJson,
  accountJson, accountErrorResponse, accountUnavailable,
} from "../../../lib/course-progress-server";
import { ActivityResultError, RESULT_COLUMNS, validateActivityResult, sameActivityResult } from "../../../lib/activity-results-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(error) {
  if (error instanceof ActivityResultError) {
    return accountJson({ code: error.code, message: error.message }, error.status);
  }
  return accountErrorResponse(error, "STATISTICS_UNAVAILABLE");
}

export async function GET(req) {
  try {
    const session = requireAccountSession(req, "STATISTICS_UNAVAILABLE");
    const database = getAccountDatabase("STATISTICS_UNAVAILABLE");
    const { data, error } = await database.rpc("get_activity_statistics", { p_account_email: session.email });
    if (error || !data) throw accountUnavailable("STATISTICS_UNAVAILABLE");
    return accountJson({ statistics: data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req) {
  try {
    requireSameOriginJson(req);
    const session = requireAccountSession(req, "STATISTICS_UNAVAILABLE");
    let body;
    try { body = await req.json(); } catch { body = null; }
    const result = validateActivityResult(body);
    const database = getAccountDatabase("STATISTICS_UNAVAILABLE");
    const { data, error } = await database.from("activity_results")
      .insert({ account_email: session.email, ...result })
      .select(RESULT_COLUMNS).single();
    if (!error && data) return accountJson({ result: data });
    if (error?.code !== "23505") throw accountUnavailable("STATISTICS_UNAVAILABLE");

    const { data: existing, error: readError } = await database.from("activity_results")
      .select(RESULT_COLUMNS).eq("account_email", session.email).eq("event_id", result.event_id).maybeSingle();
    if (readError || !existing) throw accountUnavailable("STATISTICS_UNAVAILABLE");
    if (!sameActivityResult(existing, result)) {
      throw new ActivityResultError("Diese Runde wurde bereits mit einem anderen Ergebnis gespeichert.", 409, "INVALID_RESULT_CONFLICT");
    }
    return accountJson({ result: existing });
  } catch (error) {
    return errorResponse(error);
  }
}
