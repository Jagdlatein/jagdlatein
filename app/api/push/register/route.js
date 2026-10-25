export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { readRequestAccountSession } from "../../../../lib/account-access";
import { isPayPalSandboxTestEnvironment } from "../../../../lib/test-environment";
import { isAccountGenerationEnabled } from "../../../../lib/account-session";
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
    if (!registration.legacy) {
      const previous = await database.from("push_tokens").select("registration_kind,platform").eq("token", registration.registration).maybeSingle();
      if (previous.error) {
        if (isPushSchemaError(previous.error)) return pushJson({ success: false, error: "Die Push-Registrierung wird noch eingerichtet." }, 503);
        return pushJson({ success: false, error: "Datenbankfehler" }, 500);
      }
      if (previous.data && (previous.data.registration_kind !== registration.kind || previous.data.platform !== registration.platform)) return pushJson({ success: false, error: "Diese Registrierung gehört zu einer anderen Geräteart." }, 409);
      await requireCurrentAccount(database, session);
    }
    const { error } = await database.from("push_tokens").upsert({
      token: registration.registration, platform: registration.platform, enabled: true, updated_at: new Date().toISOString(),
      ...(isAccountGenerationEnabled() || !registration.legacy ? { account_email: session.email } : {}),
      ...(!registration.legacy ? { registration_kind: registration.kind } : {}),
    }, { onConflict: "token" });
    if (error) {
      if (isPushActorError(error)) return pushJson({ success: false, error: "Bitte melde dich erneut an." }, 401);
      console.error("Push-Token Speicherung fehlgeschlagen.");
      if (!registration.legacy && isPushSchemaError(error)) return pushJson({ success: false, error: "Die Push-Registrierung wird noch eingerichtet." }, 503);
      return pushJson({ success: false, error: "Datenbankfehler" }, 500);
    }
    return pushJson({ success: true });
  } catch (error) {
    if (![400, 401, 403, 409, 413, 415, 503].includes(error?.status)) console.error("Push Registrierung fehlgeschlagen.");
    return pushErrorResponse(error);
  }
}
