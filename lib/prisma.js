// /lib/prisma.js
import { PrismaClient } from "@prisma/client";

// Prisma-Client als Singleton, damit Vercel/Next nicht zu viele Verbindungen öffnet
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // bei Bedarf aktivieren: log: ["query", "error", "warn"]
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
