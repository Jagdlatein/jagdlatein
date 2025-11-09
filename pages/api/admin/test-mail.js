// pages/api/admin/test-mail.js
import { mailer } from "../../../lib/email";

export default async function handler(req,res){
  const auth = req.headers.authorization || "";
  const pass = auth.startsWith("Bearer ") ? auth.slice(7) : (req.query.key || "");
  if (pass !== process.env.ADMIN_PASS) return res.status(401).json({ error:"Unauthorized" });

  const to = req.query.to || process.env.MAIL_FROM;
  try{
    await mailer.sendMail({ from: process.env.MAIL_FROM, to, subject:"Jagdlatein Test-Mail", text:"Hallo! Das ist eine Test-Mail." });
    res.json({ ok:true, to });
  }catch(e){
    res.status(500).json({ ok:false, error:String(e) });
  }
}
