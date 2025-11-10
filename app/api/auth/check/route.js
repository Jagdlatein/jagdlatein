// app/api/auth/check/route.js
import { NextResponse } from "next/server";

// 🔌 Prisma Client einmalig bereitstellen (JS only)
import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis;
export const prisma =
  globalForPrisma.prisma || new PrismaClient({ log: ["warn", "error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const dynamic = "force-dynamic";

// 👇 Passe diese Mappings an deine echten Tabellen/Spalten an.
async function findAccessForEmail(email) {
  const e = decodeURIComponent(String(email || "")).trim().toLowerCase();
  if (!e) return { hasAccess: false };

  // 1) User mit aktivem Abo?
  // Beispiele für mögliche Tabellen:
  // - Subscription: { email, status: 'active'|'trialing'|'canceled', plan, currentPeriodEnd }
  // - User: { email, subscriptionActive: boolean, plan, expiresAt }
  let sub = null;

  // Variante A: Separate Subscription-Tabelle
  try {
    sub = await prisma.subscription.findFirst({
      where: {
        email: e,
        status: { in: ["active", "trialing"] },
      },
      orderBy: { updatedAt: "desc" },
    });
  } catch {}

  // Variante B: Flag direkt am User (falls vorhanden)
  let user = null;
  try {
    user = await prisma.user.findFirst({
      where: { email: e },
      // mode:'insensitive' ginge auch so:
      // where: { email: { equals: e, mode: 'insensitive' } }
    });
  } catch {}

  // 2) Einmal-Kauf / Payment erfolgreich?
  // Beispiele: PayPal/Stripe Webhook schreibt in Payment: { email, status, plan, expiresAt }
  let payment = null;
  try {
    payment = await prisma.payment.findFirst({
      where: {
        email: e,
        status: { in: ["COMPLETED", "SUCCEEDED", "APPROVED", "PAID"] },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {}

  // 3) E-Mail-Bestätigung / Token-Flag (optional)
  // Falls du bei Confirm einen Flag setzt, z.B. EmailVerification: { email, verifiedAt }
  let verified = null;
  try {
    verified = await prisma.emailVerification.findFirst({
      where: { email: e, verifiedAt: { not: null } },
      orderBy: { verifiedAt: "desc" },
    });
  } catch {}

  // ---- Access-Logik konsolidieren ----
  const now = new Date();

  // Abo aktiv?
  const subActive =
    !!sub &&
    ["active", "trialing"].includes(sub.status) &&
    (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > now);

  // User-Flag aktiv?
  const userActive =
    !!user &&
    (user.subscriptionActive === true ||
      (user.expiresAt && new Date(user.expiresAt) > now));

  // Einmal-Kauf noch gültig?
  const paymentActive =
    !!payment &&
    (!payment.expiresAt || new Date(payment.expiresAt) > now);

  const hasAccess = Boolean(subActive || userActive || paymentActive);

  // Plan/Expiry aus beliebiger Quelle ableiten (wenn vorhanden)
  const plan =
    (sub && sub.plan) ||
    (user && user.plan) ||
    (payment && payment.plan) ||
    null;

  const expiresAt =
    (sub && sub.currentPeriodEnd) ||
    (user && user.expiresAt) ||
    (payment && payment.expiresAt) ||
    null;

  return { hasAccess, plan, expiresAt };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    // Optional: token vom Confirm-Flow, falls deine Logik das nutzt
    const token = searchParams.get("token");

    // 🔐 Admin-Allowlist (optional; env: "a@b.com,c@d.com")
    const allowEnv = (process.env.ALLOW_ACCESS_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const emailLc = (email || "").trim().toLowerCase();
    if (allowEnv.includes(emailLc)) {
      return NextResponse.json({
        ok: true,
        hasAccess: true,
        status: "allowlist",
        plan: "MANUAL",
        expiresAt: null,
      });
    }

    // ✅ Normale DB-Prüfung
    const { hasAccess, plan, expiresAt } = await findAccessForEmail(email);

    return NextResponse.json({
      ok: true,
      hasAccess: !!hasAccess,
      status: hasAccess ? "active" : "inactive",
      plan: plan || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      // optional: token zurückgeben, falls du’s debuggen willst
      // token: token || null,
    });
  } catch (err) {
    console.error("AUTH CHECK ERROR:", err);
    return NextResponse.json(
      { ok: false, hasAccess: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
