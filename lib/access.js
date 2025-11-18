import prisma from "./prisma";

export async function hasActiveAccess(userId) {
  const usr = await prisma.user.findUnique({
    where: { id: userId },
    include: { access: true },
  });

  if (!usr || !usr.access) return false;

  return usr.access.expiresAt > new Date();
}
