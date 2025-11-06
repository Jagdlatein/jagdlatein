// lib/prisma.js
import { PrismaClient } from "@prisma/client";

let prisma = globalThis.prisma || null;
if (!prisma) {
  prisma = new PrismaClient();
  if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
}

export default prisma;
