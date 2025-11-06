// pages/api/admin/glossar-import.js
export const config = { api: { bodyParser: false }, runtime: "nodejs" };

import formidable from "formidable";
import * as XLSX from "xlsx";
import prisma from "../../../lib/prisma";

function send(res, c, o){ res.status(c).json(o); }

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!process.env.ADMIN_PASS || token !== process.env.ADMIN_PASS) {
      return send(res, 401, { error: "Unauthorized" });
    }

    const form = formidable({ multiples: false });
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
    });

    const f = files?.file;
    const filepath = Array.isArray(f) ? f[0]?.filepath : f?.filepath;
    if (!filepath) return send(res, 400, { error: "Missing file" });

    const wb = XLSX.readFile(filepath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    const required = ["id","term","definition","category","country"];
    const headerOk = rows.length && required.every(k => Object.prototype.hasOwnProperty.call(rows[0], k));
    if (!headerOk) return send(res, 400, { error: `Fehlende Spalten: ${required.join(", ")}` });

    const problems = [];
    const cleaned = rows.map((r, i) => {
      const z = i + 2;
      const id = Number(r.id);
      if (!id) problems.push(`Zeile ${z}: id fehlt/ist keine Zahl`);
      if (!String(r.term || "").trim()) problems.push(`Zeile ${z}: term fehlt`);
      if (!String(r.definition || "").trim()) problems.push(`Zeile ${z}: definition fehlt`);
      return {
        id,
        term: String(r.term || "").trim(),
        definition: String(r.definition || "").trim(),
        category: String(r.category || "").trim(),
        country: String(r.country || "").trim(),
      };
    });
    if (problems.length) return send(res, 400, { error: problems.slice(0,20).join("; ") });

    await prisma.$transaction(
      cleaned.map(row =>
        prisma.glossary.upsert({
          where: { id: row.id },
          update: { term: row.term, definition: row.definition, category: row.category, country: row.country },
          create: row,
        })
      ),
      { timeout: 60000 }
    );

    return send(res, 200, { success: true, imported: cleaned.length });
  } catch (e) {
    return send(res, 500, { error: "Internal Server Error", detail: String(e?.message || e) });
  }
}
