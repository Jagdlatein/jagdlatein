import { NextResponse } from "next/server";
import { getSignedAccountAccess } from "../../../../lib/account-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie" };
  try {
    const access = await getSignedAccountAccess(req, { refresh: true });
    if (!access) return NextResponse.json({ success: false, hasAccess: false, message: "Bitte anmelden." }, { status: 401, headers });
    return NextResponse.json({ success: true, hasAccess: access.paid || access.admin,
      paid: access.paid, admin: access.admin }, { headers });
  } catch {
    return NextResponse.json({ success: false, hasAccess: false, message: "Kontozugriff derzeit nicht verfügbar." }, { status: 503, headers });
  }
}

export const POST = GET;
