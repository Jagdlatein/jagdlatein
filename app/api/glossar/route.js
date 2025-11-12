// app/api/glossar/route.js
import prisma from "../../../lib/prisma";     // <- relativ: app/api/glossar -> ../../../lib
import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/adminGuard";

function slugify(s = "") {
  return s
    .toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 120);
}

// GET /api/glossar?q=&country=&category=&skip=0&take=20&sort=term&dir=asc
export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").trim();
  const country = sp.get("country") || undefined;
  const category = sp.get("category") || undefined;
  const skip = Math.max(0, Number(sp.get("skip") || 0));
  const take = Math.min(100, Math.max(1, Number(sp.get("take") || 20)));
  const sort = sp.get("sort") || "term";
  const dir = (sp.get("dir") || "asc").toLowerCase() === "desc" ? "desc" : "asc";

  const where = {
    ...(q && {
      OR: [
        { term: { contains: q, mode: "insensitive" } },
        { body: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(country && { country }),
    ...(category && { category }),
  };

  const [items, total] = await Promise.all([
    prisma.glossaryEntry.findMany({
      where,
      orderBy: { [sort]: dir },
      skip,
      take,
      select: { id: true, term: true, slug: true, country: true, category: true, updatedAt: true },
    }),
    prisma.glossaryEntry.count({ where }),
  ]);

  return NextResponse.json({ ok: true, items, total });
}

// POST /api/glossar  { term, body, country?, category?, slug? }
export async function POST(req) {
  try {
    requireAdmin(); // Cookie jl_admin=1 notwendig
    const { term, body, country, category, slug } = await req.json();
    if (!term?.trim() || !body?.trim()) {
      return NextResponse.json({ ok: false, error: "term und body sind Pflicht." }, { status: 400 });
    }
    const finalSlug = (slug?.trim() || slugify(term)).slice(0, 120);

    const dupe = await prisma.glossaryEntry.findUnique({ where: { slug: finalSlug } });
    if (dupe) return NextResponse.json({ ok: false, error: "Slug bereits vergeben." }, { status: 409 });

    const created = await prisma.glossaryEntry.create({
      data: {
        term: term.trim(),
        body: body.trim(),
        country: country?.trim() || null,
        category: category?.trim() || null,
        slug: finalSlug,
      },
    });
    return NextResponse.json({ ok: true, item: created });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: e.status || 500 });
  }
}

