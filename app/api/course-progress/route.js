import {
  PROGRESS_COLUMNS, requireAccountSession, getAccountDatabase, requireCurrentAccount,
  requireSameOriginJson, validateCourseProgress,
  accountJson, accountErrorResponse, accountUnavailable,
} from "../../../lib/course-progress-server";
import { isAccountGenerationEnabled } from "../../../lib/account-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const session = requireAccountSession(req, "PROGRESS_UNAVAILABLE");
    const database = getAccountDatabase("PROGRESS_UNAVAILABLE", session);
    await requireCurrentAccount(database, session, "PROGRESS_UNAVAILABLE");
    if (isAccountGenerationEnabled()) {
      const result = await database.rpc("get_current_course_progress", { p_email: session.email });
      if (result.error || !Array.isArray(result.data)) throw accountUnavailable("PROGRESS_UNAVAILABLE");
      return accountJson({ progress: result.data });
    }
    const { data, error } = await database
      .from("course_progress")
      .select(PROGRESS_COLUMNS)
      .eq("account_email", session.email)
      .order("updated_at", { ascending: false });
    if (error) throw accountUnavailable("PROGRESS_UNAVAILABLE");
    return accountJson({ progress: data || [] });
  } catch (error) {
    return accountErrorResponse(error, "PROGRESS_UNAVAILABLE");
  }
}

export async function POST(req) {
  try {
    requireSameOriginJson(req);
    const session = requireAccountSession(req, "PROGRESS_UNAVAILABLE");
    let body;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    const progress = validateCourseProgress(body);
    const database = getAccountDatabase("PROGRESS_UNAVAILABLE", session);
    await requireCurrentAccount(database, session, "PROGRESS_UNAVAILABLE");
    const { data, error } = await database
      .from("course_progress")
      .upsert({ account_email: session.email, ...progress }, {
        onConflict: "account_email,course_id",
      })
      .select(PROGRESS_COLUMNS)
      .single();
    if (error) throw accountUnavailable("PROGRESS_UNAVAILABLE");
    return accountJson({ progress: data });
  } catch (error) {
    return accountErrorResponse(error, "PROGRESS_UNAVAILABLE");
  }
}
