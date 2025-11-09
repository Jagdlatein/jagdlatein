// pages/api/quiz/upload.js
export const config = { api: { bodyParser: false }, runtime: "nodejs" };

import formidable from "formidable";
import * as XLSX from "xlsx";
import prisma from "../../../lib/prisma";

// 🔒 helpers
function getBearer(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}
function isAuthorized(req) {
  const sent = getBearer(req).trim();
  const want = (process.env.ADMIN_PASS || "").trim();
  return Boolean(sent && want && sent === want);
}

function bad(res, c, m) { return res.status(c).json({ error: m }); }
console.log("auth", req.headers.authorization ? "present" : "missing");
console.log("content-type", req.headers["content-type"]);
console.log("parsed.rows", rows.length);
console.log("header", Object.keys(rows[0] || {}));
console.log("sample", rows[0]);
export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json({
        ok: true,
        env: { has_DATABASE_URL: !!process.env.DATABASE_URL, has_ADMIN_PASS: !!process.env.ADMIN_PASS },
        expect: "POST multipart/form-data mit Feldname 'file' + Header Authorization: Bearer <ADMIN_PASS>"
      });
    }
    if (req.method !== "POST") return bad(res, 405, "Method not allowed");
    if (!isAuthorized(req)) return bad(res, 401, "Unauthorized");

    const form = formidable({ multiples: false, maxFileSize: 50 * 1024 * 1024 });
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => err ? reject(err) : resolve({ files }));
    });

    const f = files?.file;
    const filepath = Array.isArray(f) ? f[0]?.filepath : f?.filepath;
    if (!filepath) return bad(res, 400, "Missing file (expected field 'file')");

    const fs = await import("node:fs/promises");
    const buf = await fs.readFile(filepath);

    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    const required = ["id","country","category","topic","question","option_a","option_b","option_c","option_d","correct"];
    const ok = rows.length && required.every(k => Object.prototype.hasOwnProperty.call(rows[0], k));
    if (!ok) return bad(res, 400, `Fehlende Spalten: ${required.join(", ")}`);

    const cleaned = rows.map(r => ({
      id:Number(r.id),
      country:String(r.country||"").trim(), category:String(r.category||"").trim(), topic:String(r.topic||"").trim(),
      question:String(r.question||"").trim(), option_a:String(r.option_a||"").trim(), option_b:String(r.option_b||"").trim(),
      option_c:String(r.option_c||"").trim(), option_d:String(r.option_d||"").trim(), correct:String(r.correct||"").trim().toUpperCase()
    }));

    await prisma.$transaction(cleaned.map(q => prisma.quizQuestion.upsert({
      where:{id:q.id},
      update:{ country:q.country, category:q.category, topic:q.topic, question:q.question,
        option_a:q.option_a, option_b:q.option_b, option_c:q.option_c, option_d:q.option_d, correct:q.correct },
      create:q
    })));

    return res.status(200).json({ ok: true, imported: cleaned.length });
  } catch (e) {
    return bad(res, 500, String(e?.message || e));
  }
}
