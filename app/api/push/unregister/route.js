export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { readRequestAccountSession } from "../../../../lib/account-access";
import { isPayPalSandboxTestEnvironment } from "../../../../lib/test-environment";
import { requireCurrentAccount, requireSameOriginJson } from "../../../../lib/course-progress-server";
import { getPushDatabase, isPushActorError, isPushSchemaError, parsePushRegistration, pushJson, pushErrorResponse, readPushJson } from "../../../../lib/push-registration";

export async function POST(req) {
  try {
    if (isPayPalSandboxTestEnvironment()) return Response.json({ success: false, error: "Push ist in der Testumgebung deaktiviert." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    const session = readRequestAccountSession(req);
    if (!session) return pushJson({ success: false, error: "Bitte anmelden." }, 401);
    requireSameOriginJson(req);
    const registration = parsePushRegistration(await readPushJson(req));
    const database = getPushDatabase(session);
    await requireCurrentAccount(database, session);
    const { error } = await database.from("push_tokens").update({ enabled: false, updated_at: new Date().toISOString() })
      .eq("token", registration.registration).eq("registration_kind", registration.kind)
      .eq("platform", registration.platform).eq("account_email", session.email);
    if (error) {
      if (isPushActorError(error)) return pushJson({ success: false, error: "Bitte melde dich erneut an." }, 401);
      if (isPushSchemaError(error)) return pushJson({ success: false, error: "Die Push-Registrierung wird noch eingerichtet." }, 503);
      return pushJson({ success: false, error: "Die Registrierung konnte nicht deaktiviert werden." }, 500);
    }
    // Deliberately idempotent: this response does not disclose another owner's registration.
    return pushJson({ success: true });
  } catch (error) {
    if (![400, 401, 403, 409, 413, 415, 503].includes(error?.status)) console.error("Push Deaktivierung fehlgeschlagen.");
    return pushErrorResponse(error);
  }
}
