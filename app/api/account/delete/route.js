import {
  requireAccountSession, getAccountDatabase, requireCurrentAccount,
  accountJson, accountErrorResponse,
} from "../../../../lib/course-progress-server";
import { JL_ACCOUNT_COOKIE } from "../../../../lib/account-session";
import {
  AccountDeletionError, isAccountDeletionEnabled, deletionUnavailable,
  requiresDeletionReauthentication, requireDeletionReauthentication,
  requireDeletionOrigin, readDeletionConfirmation, deleteCurrentAccount,
} from "../../../../lib/account-deletion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(error) {
  if (error instanceof AccountDeletionError) {
    return accountJson({ code: error.code, message: error.message }, error.status);
  }
  return accountErrorResponse(error);
}

export async function GET(req) {
  try {
    const session = requireAccountSession(req);
    if (!isAccountDeletionEnabled()) return accountJson({ enabled: false });
    const database = getAccountDatabase("ACCOUNT_UNAVAILABLE", session);
    await requireCurrentAccount(database, session);
    return accountJson({ enabled: true, requiresReauthentication: requiresDeletionReauthentication(session),
      ...(session.authenticationMethod === "review-password" ? { reauthenticationMethod: "review-password" } : {}) });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(req) {
  try {
    requireDeletionOrigin(req);
    if (!isAccountDeletionEnabled()) throw deletionUnavailable();
    const session = requireAccountSession(req);
    requireDeletionReauthentication(session);
    await readDeletionConfirmation(req);
    const database = getAccountDatabase("ACCOUNT_UNAVAILABLE", session);
    await requireCurrentAccount(database, session);
    await deleteCurrentAccount(database, session);
    const response = accountJson({ deleted: true });
    for (const name of [JL_ACCOUNT_COOKIE, "jl_session", "jl_paid", "jl_email", "jl_admin"]) {
      response.headers.append("Set-Cookie", `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
    }
    return response;
  } catch (error) { return errorResponse(error); }
}
