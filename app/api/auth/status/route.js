import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCOUNT_SESSION_MAX_AGE, JL_ACCOUNT_COOKIE, createAccountSession } from "../../../../lib/account-session";
import { getSignedAccountAccess } from "../../../../lib/account-access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie" };
  try {
    const cookieStore = await cookies();
    const access = await getSignedAccountAccess({ cookies: cookieStore }, { refresh: true });
    if (!access) {
      cookieStore.set({ name: JL_ACCOUNT_COOKIE, value: "", path: "/", httpOnly: true,
        sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 0 });
      return NextResponse.json({ loggedIn: false, email: null, paid: false, admin: false }, { headers });
    }
    const token = createAccountSession(access.email, Date.now(), {
      ...access,
      // Legacy cookies have no separate authentication stamp. Preserve their
      // original issue/deadline rather than granting another forty days.
      authenticatedAt: access.authenticatedAt ?? access.issuedAt,
    });
    if (!token) throw new Error("Session unavailable");
    cookieStore.set({ name: JL_ACCOUNT_COOKIE, value: token, path: "/", httpOnly: true,
      sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: ACCOUNT_SESSION_MAX_AGE });
    return NextResponse.json({ loggedIn: true, email: access.email, paid: access.paid, admin: access.admin }, { headers });
  } catch {
    return NextResponse.json({ loggedIn: false, message: "Dein Konto ist derzeit nicht verfügbar. Bitte erneut versuchen." },
      { status: 503, headers });
  }
}
