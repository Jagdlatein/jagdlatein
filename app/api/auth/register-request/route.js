import { NextResponse } from "next/server";
import { getRegistrationDatabase, isAccountRegistrationEnabled, readRegistrationRequest,
  registrationErrorResponse, registrationUnavailable, requestAccountRegistration,
  REGISTRATION_CODE_REQUEST_MESSAGE } from "../../../../lib/account-registration";
import { isLoginMailRecipientAllowed } from "../../../../lib/test-environment";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ enabled: isAccountRegistrationEnabled() }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(req) {
  try {
    if (!isAccountRegistrationEnabled()) throw registrationUnavailable();
    const { email } = await readRegistrationRequest(req);
    if (!isLoginMailRecipientAllowed(email)) return NextResponse.json({ success: true,
      message: REGISTRATION_CODE_REQUEST_MESSAGE }, { headers: { "Cache-Control": "no-store" } });
    const result = await requestAccountRegistration(getRegistrationDatabase(), email);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return registrationErrorResponse(error); }
}
