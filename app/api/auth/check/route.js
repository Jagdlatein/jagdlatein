// app/api/auth/check/route.js
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

function hasModel(client, name) {
  return !!client && Object.prototype.hasOwnProperty.call(client, name);
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const emailRaw = searchParams.get("email");
    const email = (emailRaw || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { ok: false, hasAccess: false, error: "E-Mail fehlt" },
        { status: 400 }
      );
    }

    // 1) Allowlist (ENV)
    const allowEnv = (process.env.ALLOW_ACCESS_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (allowEnv.includes(email)) {
      return NextResponse.json({
        ok: true,
        hasAccess: true,
        status: "allowlist",
        plan: "MANUAL",
        expiresAt: null,
      });
    }

    const now = new Date();

    // 2) Wenn AccessGrant-Model existiert → zuerst dort prüfen
    if (hasModel(prisma, "accessGrant")) {
      const grant = await prisma.accessGrant.findFirst({
        where: { email },
        orderBy: { updatedAt: "desc" },
      });
      const valid =
        !!grant && (!grant.expiresAt || new Date(grant.expiresAt) > now);
      if (valid) {
        return NextResponse.json({
          ok: true,
          hasAccess: true,
          status: "active",
          plan: grant?.plan || null,
          expiresAt: grant?.expiresAt || null,
        });
      }
      // kein Treffer → unten weiter mit AccessPass
    }

    // 3) Fallback/Standard: User + AccessPass (so wie in deinem Schema)
    // User.id ist bei dir i. d. R. die E-Mail (oder "anon_*").
    // Wir suchen direkt den Pass über userId == email (unique).
    let pass = null;
    try {
      pass = await prisma.accessPass.findUnique({
        where: { userId: email }, // userId ist unique laut Schema
      });
      // Falls du User-IDs nicht als E-Mail speicherst, ersatzweise:
      // const user = await prisma.user.findUnique({ where: { id: email }});
      // if (user) pass = await prisma.accessPass.findUnique({ where: { userId: user.id }});
    } catch {}

    const passActive =
      !!pass &&
      pass.status === "active" &&
      (!pass.expiresAt || new Date(pass.expiresAt) > now);

    return NextResponse.json({
      ok: true,
      hasAccess: passActive,
      status: passActive ? "active" : "inactive",
      plan: pass?.plan || null,
      expiresAt: pass?.expiresAt || null,
    });
  } catch (err) {
    console.error("AUTH CHECK ERROR:", err);
    return NextResponse.json(
      { ok: false, hasAccess: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
