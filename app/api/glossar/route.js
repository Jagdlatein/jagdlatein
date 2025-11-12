// app/api/glossar/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// GET /api/glossar?q=...&country=DE&category=Wild&skip=0&take=20
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const country = searchParams.get("country") || undefined;
  const category = searchParams.get("category") || undefined;
  const skip = Number(searchParams.get("skip") || 0);
  const take = Math.min(Number(searchParams.get("take") || 20), 100);

  const where = {
    ...(q && { OR: [
      { term: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ]}),
    ...(country && { country }),
    ...(category && { category }),
  };

  const [items, total] = await Promise.all([
    prisma.glossaryEntry.findMany({
      where, orderBy: { term: "asc" }, skip, take,
      select: { id:true, term:true, slug:true, country:true, category:true, updatedAt:true }
    }),
    prisma.glossaryEntry.count({ where })
  ]);

  return NextResponse.json({ ok:true, items, total });
}

// POST /api/glossar  { term, body, country?, category?, slug? }
export async function POST(req) {
  const { term, body, country, category, slug } = await req.json();
  if (!term || !body) {
    return NextResponse.json({ ok:false, error:"term und body sind Pflicht." }, { status:400 });
  }
  const finalSlug = slug?.trim() || slugify(term);
  const created = await prisma.glossaryEntry.create({
    data: { term, body, country: country || null, category: category || null, slug: finalSlug }
  });
  return NextResponse.json({ ok:true, item: created });
}
