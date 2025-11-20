// app/api/auth/session/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "none",
  secure: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 40,
};

// ---------------------------
// LOGIN CHECK
// ---------------------------
async function authCheck(email) {
  const user = await prisma.user.findUnique({
    where: { id: email },
    include: { access: true },
  });

  if (!user) {
    return {
      exists: false,
      paid: false,
      admin: false,
    };
  }

  const now = new Date();
  const active = user.access && user.access.expiresAt > now;

  return {
    exists: true,
    paid: active,
    admin: user.admin === true,
  };
}

// ---------------------------
// LOGIN (POST)
// ---------------------------
export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Bitte gültige E-Mail." },
        { status: 400 }
      );
    }

    const mail = email.toLowerCase().trim();
    const verify = await authCheck(mail);

    // ❗ BLOCKIERE UNBEKANNTE EMAILS
    if (!verify.exists) {
      return NextResponse.json(
        { success: false, message: "E-Mail ist nicht registriert." },
        { status: 403 }
      );
    }

    // COOKIES setzen
    cookies().set({
      name: "jl_session",
      value: "1",
      ...COOKIE_OPTS,
    });

    cookies().set({
      name: "jl_email",
      value: mail,
      ...COOKIE_OPTS,
    });

    if (verify.paid) {
      cookies().set({
        name: "jl_paid",
        value: "1",
        ...COOKIE_OPTS,
      });
    }

    if (verify.admin) {
      cookies().set({
        name: "jl_admin",
        value: "1",
        ...COOKIE_OPTS,
      });
    }

    return NextResponse.json({
      success: true,
      paid: verify.paid,
      admin: verify.admin,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.toString() },
      { status: 500 }
    );
  }
}

// ---------------------------
// LOGOUT (DELETE)
// ---------------------------
export async function DELETE() {
  ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach((name) =>
    cookies().set({
      name,
      value: "",
      path: "/",
      maxAge: 0,
    })
  );

  return NextResponse.json({ ok: true });
}
