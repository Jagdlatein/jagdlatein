import { NextResponse } from "next/server";
import { getRegistrationDatabase, isAccountRegistrationEnabled, readRegistrationRequest,
  registrationErrorResponse, registrationUnavailable, requestAccountRegistration } from "../../../../lib/account-registration";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ enabled: isAccountRegistrationEnabled() }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(req) {
  try {
    if (!isAccountRegistrationEnabled()) throw registrationUnavailable();
    const { email } = await readRegistrationRequest(req);
    const result = await requestAccountRegistration(getRegistrationDatabase(), email);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return registrationErrorResponse(error); }
}
