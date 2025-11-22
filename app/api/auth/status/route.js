import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const c = cookies();

  const isLogged = c.get("jl_session")?.value === "1";
  const email = c.get("jl_email")?.value || null;
  const paid = c.get("jl_paid")?.value === "1";
  const admin = c.get("jl_admin")?.value === "1";

  return NextResponse.json({
    loggedIn: isLogged,
    email,
    paid,
    admin,
  });
}
