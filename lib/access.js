// /lib/access.js
import prisma from "./prisma";

export async function hasActiveAccess(userId) {
  if (!userId) return false;

  const pass = await prisma.accessPass.findUnique({
    where: { userId },
  });

  if (!pass) return false;
  if (pass.status !== "active") return false;
  if (pass.expiresAt <= new Date()) return false;

  return true;
}
