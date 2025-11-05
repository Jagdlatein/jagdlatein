// src/app/api/admin/import/route.ts
export const runtime = "nodejs";          // wichtig für Prisma auf Vercel
export const maxDuration = 60;            // optional: lange Imports

import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

const Row = z.object({
  text: z.string().min(1),
  a: z.string(),
  b: z.string(),
  c: z.string(),
  d: z.string(),
  correct: z.number().int().min(0).max(3),
  topic: z.string().optional(),
});

export async function GET() {
  // Healthcheck: zeigt, ob du eingeloggt & Admin bist
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, reason: "NO_SESSION" }, { status: 401 });
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ ok: false, reason: "NOT_ADMIN" }, { status: 403 });
  }
  return NextResponse.json({ ok: true, user: session.user });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized (no session)" }, { status: 401 });
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden (not admin)" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const rows = z.array(Row).parse(body.rows);

    await prisma.$transaction(async (tx) => {
      for (const r of rows) {
        const q = await tx.question.create({
          data: { text: r.text, correctIx: r.correct, topic: r.topic },
        });
        await tx.answer.createMany({
          data: [
            { questionId: q.id, text: r.a },
            { questionId: q.id, text: r.b },
            { questionId: q.id, text: r.c },
            { questionId: q.id, text: r.d },
          ],
        });
      }
    });

    return NextResponse.json({ ok: true, imported: rows.length });
  } catch (err: any) {
    console.error("IMPORT_ERROR", err);
    const msg =
      err?.issues?.[0]?.message ??
      err?.message ??
      "Unknown error while importing.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
