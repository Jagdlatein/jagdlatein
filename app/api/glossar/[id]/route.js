// app/api/glossar/[id]/route.js
import prisma from "../../../../lib/prisma";        // <- relativ: app/api/glossar/[id] -> ../../../../lib
import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/adminGuard";

export async function GET(_, { params }) {
  const id = Number(params.id);
  const item = await prisma.glossaryEntry.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, item });
}

export async function PUT(req, { params }) {
  try {
    requireAdmin();
    const id = Number(params.id);
    const data = await req.json();

    if (data.slug) {
      data.slug = data.slug
        .toLowerCase()
        .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 120);
      const other = await prisma.glossaryEntry.findUnique({ where: { slug: data.slug } });
      if (other && other.id !== id) {
        return NextResponse.json({ ok: false, error: "Slug bereits vergeben." }, { status: 409 });
      }
    }

    const updated = await prisma.glossaryEntry.update({ where: { id }, data });
    return NextResponse.json({ ok: true, item: updated });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: e.status || 500 });
  }
}

export async function DELETE(_, { params }) {
  try {
    requireAdmin();
    const id = Number(params.id);
    await prisma.glossaryEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: e.status || 500 });
  }
}
