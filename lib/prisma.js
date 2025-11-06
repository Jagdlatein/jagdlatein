import { PrismaClient } from "@prisma/client";

let prismaGlobal = globalThis.prisma || null;

if (!prismaGlobal) {
  prismaGlobal = new PrismaClient();
  if (process.env.NODE_ENV !== "production") globalThis.prisma = prismaGlobal;
}

export default prismaGlobal;
