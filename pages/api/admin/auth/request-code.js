import prisma from "../../../lib/prisma";
import { sendLoginCode } from "../../../lib/email";

export default async function handler(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ ok:false, error:"email required" });

    const code = Math.floor(100000 + Math.random()*900000).toString();
    const validUntil = new Date(Date.now() + 10*60*1000);

    await prisma.verificationCode.create({ data: { email: email.toLowerCase(), code, validUntil }});
    await sendLoginCode(email, code);

    res.json({ ok:true });
  } catch (e) {
    res.status(500).json({ ok:false, error: String(e) });
  }
}
