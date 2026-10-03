import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { JL_ACCOUNT_COOKIE } from "../../../../lib/account-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "Login nur noch mit E-Mail-Code möglich.",
    },
    { status: 405 }
  );
}

export async function DELETE() {
  ["jl_session", "jl_paid", "jl_email", "jl_admin", JL_ACCOUNT_COOKIE].forEach((name) => {
    cookies().set({
      name,
      value: "",
      path: "/",
      maxAge: 0,
    });
  });

  return NextResponse.json({ success: true });
}
