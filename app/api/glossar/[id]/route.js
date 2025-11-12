// app/api/glossar/[id]/route.js
import prisma from "../../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  const id = Number(params.id);
  const item = await prisma.glossaryEntry.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ ok:false, error:"Not found" }, { status:404 });
  return NextResponse.json({ ok:true, item });
}

// PUT /api/glossar/:id  { term?, body?, country?, category?, slug? }
export async function PUT(req, { params }) {
  const id = Number(params.id);
  const data = await req.json();
  const updated = await prisma.glossaryEntry.update({ where: { id }, data });
  return NextResponse.json({ ok:true, item: updated });
}

// DELETE /api/glossar/:id
export async function DELETE(_, { params }) {
  const id = Number(params.id);
  await prisma.glossaryEntry.delete({ where: { id } });
  return NextResponse.json({ ok:true });
}
