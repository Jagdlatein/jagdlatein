// app/api/glossar/import/route.js
export const runtime = "nodejs"; // sicherstellen: Node runtime (für Buffer, xlsx)
import prisma from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/adminGuard";
import * as XLSX from "xlsx";

function slugify(s = "") {
  return s
    .toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 120);
}

function normalizeKey(k = "") {
  return String(k).trim().toLowerCase();
}

// Erwartete Spalten: term, body, (optional) country, category, slug
function normalizeRow(raw) {
  const obj = {};
  for (const [k, v] of Object.entries(raw || {})) {
    obj[normalizeKey(k)] = typeof v === "string" ? v.trim() : v ?? "";
  }
  const term = String(obj.term || "").trim();
  const body = String(obj.body || "").trim();
  let slug = String(obj.slug || "").trim();
  const country = obj.country ? String(obj.country).trim() : null;
  const category = obj.category ? String(obj.category).trim() : null;

  if (!term || !body) return null;
  if (!slug) slug = slugify(term);

  return { term, body, slug, country, category };
}

export async function POST(req) {
  try {
    requireAdmin();

    const form = await req.formData();
    const mode = (form.get("mode") || "create").toString(); // "create" | "upsert"
    const file = form.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, error: "Datei fehlt (CSV/XLSX)" }, { status: 400 });
    }

    // Datei einlesen
    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);

    // Mit xlsx parsen (funktioniert für CSV, XLSX, XLS)
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return NextResponse.json({ ok: false, error: "Leere Datei / kein Sheet gefunden" }, { status: 400 });

    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
    if (!rows.length) return NextResponse.json({ ok: false, error: "Keine Datenzeilen gefunden" }, { status: 400 });

    let total = 0, inserted = 0, updated = 0, skipped = 0;
    const errors = [];

    if (mode === "create") {
      // Nur neue Slugs anlegen – Duplikate werden übersprungen
      const data = [];
      for (const r of rows) {
        total++;
        const n = normalizeRow(r);
        if (!n) { skipped++; continue; }
        data.push(n);
      }

      // createMany mit skipDuplicates auf UNIQUE(slug)
      if (data.length) {
        const result = await prisma.glossaryEntry.createMany({
          data,
          skipDuplicates: true,
        });

        // result.count = Anzahl tatsächlich eingefügter Datensätze
        inserted = result.count;
        skipped += data.length - inserted; // Rest waren Duplikate
      }
    } else {
      // UPSERT: pro Zeile slug-unique upsert
      for (const r of rows) {
        total++;
        const n = normalizeRow(r);
        if (!n) { skipped++; continue; }

        try {
          // existiert?
          const ex = await prisma.glossaryEntry.findUnique({ where: { slug: n.slug } });
          if (!ex) {
            await prisma.glossaryEntry.create({ data: n });
            inserted++;
          } else {
            await prisma.glossaryEntry.update({
              where: { slug: n.slug },
              data: {
                term: n.term,
                body: n.body,
                country: n.country,
                category: n.category,
              },
            });
            updated++;
          }
        } catch (e) {
          skipped++;
          errors.push({ slug: n.slug, error: String(e?.message || e) });
        }
      }
    }

    return NextResponse.json({ ok: true, mode, total, inserted, updated, skipped, errors });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status });
  }
}
