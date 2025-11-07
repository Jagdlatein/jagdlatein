// pages/api/quiz/sample.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const items = await prisma.quizQuestion.findMany({
      take: 5,
      orderBy: { id: "asc" },
      select: { id:true, country:true, category:true, topic:true, question:true, correct:true }
    });
    return res.status(200).json({ ok:true, items });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e?.message||e) });
  }
}
