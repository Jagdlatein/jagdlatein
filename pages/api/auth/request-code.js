// pages/api/auth/request-code.js
import { allowRate } from "../../../lib/rate-limit";
import { sendLoginCode } from "../../../lib/mail";
import { prisma } from "../../../lib/prisma"; // vorhandene Datei
import crypto from "crypto";

function ok(res, data){ return res.status(200).json(data); }
function bad(res, msg){ return res.status(400).json({ error: msg }); }
function too(res, ms){  return res.status(429).json({ error:"Too many requests", retryAfterMs: ms }); }

export default async function handler(req, res) {
  if (req.method !== "POST") return bad(res, "POST required");
  const { email } = req.body || {};
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad(res, "E-Mail ungültig");

  // Rate-Limits: pro IP und pro E-Mail
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  const ua = req.headers["user-agent"] || "";

  const ipGate = await allowRate({ key:`ip:${ip}`, max: 10, windowMs: 10*60*1000 }); // 10 in 10 Min
  if (!ipGate.ok) return too(res, 10*60*1000);

  const mailGate = await allowRate({ key:`mail:${email}`, max: 5, windowMs: 10*60*1000 }); // 5 in 10 Min
  if (!mailGate.ok) return too(res, 10*60*1000);

  // Code erzeugen (6 Ziffern)
  const code = (""+Math.floor(100000 + Math.random()*900000));
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
  const expiresAt = new Date(Date.now()+10*60*1000);

  // Optional: in DB speichern (einfacher Codes-Tisch)
  await prisma.loginCode.upsert({
    where: { email },
    update: { codeHash, expiresAt },
    create: { email, codeHash, expiresAt },
  });

  try {
    await sendLoginCode(email, code);
    await prisma.mailLog.create({ data:{ to: email, subject:"Dein Login-Code", status:"sent", ip, userAgent: ua }});
    return ok(res, { ok:true });
  } catch (e) {
    await prisma.mailLog.create({ data:{ to: email, subject:"Dein Login-Code", status:"error", error:String(e), ip, userAgent: ua }});
    return res.status(500).json({ error:"Mail-Versand fehlgeschlagen" });
  }
}
