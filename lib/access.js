// /lib/access.js
import prisma from "./prisma";

/**
 * Prüft, ob ein Nutzer aktiven Zugang hat
 * Zugang gilt, wenn:
 * - user.accessUntil existiert
 * - accessUntil > aktuelle Zeit
 */
export async function hasActiveAccess(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accessUntil: true },
  });

  if (!user || !user.accessUntil) {
    return false;
  }

  const now = new Date();

  // Echte Paywall: nur Zugang, wenn Datum in der Zukunft liegt
  return user.accessUntil > now;
}
