import { accountJson, requireAccountSession, requireSameOriginJson } from "../../../../lib/course-progress-server";
import {
  readAccountExamProfile, writeAccountExamProfile, readAccountExamProfileBody, requireExamProfileAccount, examProfileErrorResponse,
} from "../../../../lib/account-exam-profile-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const session = requireAccountSession(req, "EXAM_PROFILE_UNAVAILABLE");
    return accountJson({ profile: await readAccountExamProfile(session), accountKey: session.accountGeneration });
  } catch (error) { return examProfileErrorResponse(error); }
}

export async function PUT(req) {
  try {
    requireSameOriginJson(req);
    const session = requireAccountSession(req, "EXAM_PROFILE_UNAVAILABLE");
    requireExamProfileAccount(req, session);
    const profile = await readAccountExamProfileBody(req);
    return accountJson({ profile: await writeAccountExamProfile(session, profile), accountKey: session.accountGeneration });
  } catch (error) { return examProfileErrorResponse(error); }
}
