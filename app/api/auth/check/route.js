// app/api/auth/check/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

// 🔌 Prisma Client – Singleton vermeiden Doppelverbindungen bei Hot-Reload
const globalForPrisma = globalThis;
export const prisma =
  globalForPrisma.prisma || new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const emailRaw = searchParams.get("email");

    if (!emailRaw) {
      return NextResponse.json(
        { ok: false, hasAccess: false, error: "E-Mail fehlt" },
        { status: 400 }
      );
    }

    const email = emailRaw.trim().toLowerCase();

    // 1️⃣ Allowlist (optional, über .env)
    // Beispiel: ALLOW_ACCESS_EMAILS=hannes@example.com,kunde@domain.ch
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

    // 2️⃣ DB-Zugriff (AccessGrant)
    const grant = await prisma.accessGrant.findFirst({
      where: { email },
      orderBy: { updatedAt: "desc" },
    });

    const now = new Date();
    const valid =
      !!grant && (!grant.expiresAt || new Date(grant.expiresAt) > now);

    return NextResponse.json({
      ok: true,
      hasAccess: valid,
      status: valid ? "active" : "inactive",
      plan: grant?.plan || null,
      expiresAt: grant?.expiresAt || null,
    });
  } catch (err) {
    console.error("AUTH CHECK ERROR:", err);
    return NextResponse.json(
      { ok: false, hasAccess: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
