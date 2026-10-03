import { createClient } from "@supabase/supabase-js";
import { courses } from "./course-catalog";
import { JL_ACCOUNT_COOKIE, isAccountSessionConfigured, readAccountSession } from "./account-session";

export const PROGRESS_COLUMNS = "course_id,status,answered_questions,total_questions,score,best_score,completed_at,updated_at";

class AccountApiError extends Error {
  constructor(code, status, message) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function accountUnavailable(code = "ACCOUNT_UNAVAILABLE") {
  return new AccountApiError(code, 503,
    code === "PROGRESS_UNAVAILABLE"
      ? "Der Kursfortschritt ist noch nicht verfügbar. Bitte später erneut versuchen."
      : "Dein Konto ist derzeit nicht verfügbar. Bitte später erneut versuchen.");
}

export function sessionRenewalRequired() {
  return new AccountApiError("SESSION_RENEWAL_REQUIRED", 401,
    "Bitte melde dich erneut mit einem E-Mail-Code an, um dein Konto zu öffnen.");
}

export function requireAccountSession(req, unavailableCode = "ACCOUNT_UNAVAILABLE") {
  if (!isAccountSessionConfigured()) throw accountUnavailable(unavailableCode);
  const session = readAccountSession(req.cookies?.get(JL_ACCOUNT_COOKIE)?.value);
  if (!session) throw sessionRenewalRequired();
  return session;
}

export function getAccountDatabase(unavailableCode = "ACCOUNT_UNAVAILABLE") {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw accountUnavailable(unavailableCode);
  try {
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  } catch {
    throw accountUnavailable(unavailableCode);
  }
}

export function requireSameOriginJson(req) {
  let sameOrigin = false;
  try {
    sameOrigin = new URL(req.headers.get("origin")).origin === new URL(req.url).origin;
  } catch {}
  if (!sameOrigin) {
    throw new AccountApiError("INVALID_ORIGIN", 403, "Diese Anfrage ist nicht erlaubt.");
  }
  const contentType = (req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new AccountApiError("INVALID_PROGRESS", 415, "Bitte Kursfortschritt als JSON senden.");
  }
}

export function validateCourseProgress(body) {
  const keys = ["courseId", "answeredQuestions", "totalQuestions", "score", "completed"];
  const course = courses.find(item => item.id === body?.courseId);
  if (
    !body || typeof body !== "object" || Array.isArray(body) ||
    Object.keys(body).some(key => !keys.includes(key)) || !course ||
    !Number.isInteger(body.answeredQuestions) || !Number.isInteger(body.totalQuestions) ||
    !Number.isInteger(body.score) || typeof body.completed !== "boolean" ||
    body.totalQuestions !== course.totalQuestions || body.totalQuestions <= 0 ||
    body.answeredQuestions < 0 || body.answeredQuestions > body.totalQuestions ||
    body.score < 0 || body.score > body.answeredQuestions ||
    (body.completed && body.answeredQuestions !== body.totalQuestions)
  ) {
    throw new AccountApiError("INVALID_PROGRESS", 400, "Die Kursdaten sind ungültig.");
  }
  return {
    course_id: course.id,
    status: body.completed ? "completed" : "in_progress",
    answered_questions: body.answeredQuestions,
    total_questions: body.totalQuestions,
    score: body.score,
    best_score: body.completed ? body.score : 0,
  };
}

export function accountJson(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" },
  });
}

export function accountErrorResponse(error, unavailableCode = "ACCOUNT_UNAVAILABLE") {
  const safeError = error instanceof AccountApiError ? error : accountUnavailable(unavailableCode);
  return accountJson({ code: safeError.code, message: safeError.message }, safeError.status);
}
