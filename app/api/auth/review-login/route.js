import { getAccountDatabase, accountJson } from "../../../../lib/course-progress-server";
import { JL_ACCOUNT_COOKIE, createAccountSession, readAccountSession } from "../../../../lib/account-session";
import { requireDeletionOrigin } from "../../../../lib/account-deletion";
import { reviewLoginConfiguration } from "../../../../lib/apple-review-login-policy";
import { ReviewLoginError, verifyReviewLogin, readReviewLoginBody } from "../../../../lib/apple-review-login";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    if (!reviewLoginConfiguration()) return accountJson({ success: false, message: "Die Anmeldung ist derzeit nicht verfügbar." }, 503);
    requireDeletionOrigin(request);
    const body = await readReviewLoginBody(request);
    // The global account bucket remains authoritative even if an IP header is
    // missing. Raw network identifiers are never stored or logged.
    const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() || "unknown";
    const identity = await verifyReviewLogin(getAccountDatabase(), { ...body, ip });
    const token = createAccountSession(identity.email, Date.now(), identity);
    const session = readAccountSession(token);
    if (!token || !session) throw new ReviewLoginError(503);
    const maxAge = Math.max(0, session.expiresAt - Math.floor(Date.now() / 1000));
    if (!maxAge) throw new ReviewLoginError(503);
    const response = accountJson({ success: true, paid: identity.paid, admin: false });
    response.headers.append("Set-Cookie", `${JL_ACCOUNT_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
    return response;
  } catch (error) {
    const status = error instanceof ReviewLoginError ? error.status : [403, 415].includes(error?.status) ? error.status : 503;
    const message = error instanceof ReviewLoginError ? error.message : "Die Anmeldung ist derzeit nicht verfügbar.";
    return accountJson({ success: false, message }, status);
  }
}
