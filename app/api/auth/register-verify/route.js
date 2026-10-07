import { getRegistrationDatabase, isAccountRegistrationEnabled, readRegistrationRequest,
  registrationErrorResponse, registrationUnavailable, verifyAccountRegistration } from "../../../../lib/account-registration";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    if (!isAccountRegistrationEnabled()) throw registrationUnavailable();
    const { email, code } = await readRegistrationRequest(req, true);
    return await verifyAccountRegistration(getRegistrationDatabase(), email, code);
  } catch (error) { return registrationErrorResponse(error); }
}
