import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const v = process.env.DATABASE_URL || "";
  const redacted = v.replace(/:\/\/([^:]+):([^@]+)@/,"://$1:****@");
  try {
    const r = await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ ok:true, message:"DB erreichbar", db:redacted, result:r });
  } catch (e) {
    return res.status(500).json({
      ok:false,
      message:"DB NICHT erreichbar",
      db:redacted,
      error:String(e?.message||e),
      hint:"Achte darauf: kein 'DATABASE_URL=' im Wert, keine Anführungszeichen, ggf. IPv4 Pooler (Port 6543) verwenden, dann Redeploy mit Clear Cache."
    });
  }
}
