// app/api/auth/check/route.js
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma"; // 4 Ebenen hoch ab /app/api/auth/check

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { ok: false, hasAccess: false, error: "E-Mail fehlt" },
        { status: 400 }
      );
    }

    // 1) Allowlist per ENV (z.B. für Admin/Test)
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

    // 2) Standardweg: AccessPass anhand userId == email
    const pass = await prisma.accessPass.findUnique({
      where: { userId: email }, // userId ist bei dir unique
    });

    const now = new Date();
    const active =
      !!pass &&
      pass.status === "active" &&
      (!pass.expiresAt || new Date(pass.expiresAt) > now);

    return NextResponse.json({
      ok: true,
      hasAccess: active,
      status: active ? "active" : "inactive",
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
