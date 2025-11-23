import { NextResponse } from "next/server";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "none",
  secure: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 40, // 40 Tage
};

// Hilfsfunktion für /auth/check
async function authCheck(req, email) {
  const url = new URL(req.url);
  url.pathname = "/api/auth/check";
  url.searchParams.set("email", email);

  const r = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  return r.json();
}

export async function POST(req) {
  try {
    const body = await req.json();

    if (typeof body?.email !== "string") {
      return NextResponse.json(
        { success: false, message: "E-Mail fehlt." },
        { status: 400 }
      );
    }

    const email = body.email.toLowerCase().trim();

    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: "Bitte gültige E-Mail eingeben." },
        { status: 400 }
      );
    }

    const verify = await authCheck(req, email);

    if (!verify.success) {
      return NextResponse.json(
        { success: false, message: verify.message || "Fehler" },
        { status: 400 }
      );
    }

    // Session Cookies setzen
    cookies().set({ name: "jl_session", value: "1", ...COOKIE_OPTS });
    cookies().set({ name: "jl_email", value: email, ...COOKIE_OPTS });

    if (verify.paid) {
      cookies().set({ name: "jl_paid", value: "1", ...COOKIE_OPTS });
    }

    if (verify.admin) {
      cookies().set({ name: "jl_admin", value: "1", ...COOKIE_OPTS });
    }

    return NextResponse.json({
      success: true,
      paid: verify.paid,
      admin: verify.admin,
      message: "Login erfolgreich",
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.toString() },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach((n) =>
    cookies().set({ name: n, value: "", path: "/", maxAge: 0 })
  );

  return NextResponse.json({ ok: true });
}
