// pages/api/quiz/list.js
import prisma from "../../../lib/prisma"; // <-- 3 Ebenen hoch!

export default async function handler(req, res) {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const take = Math.min(Number(pageSize) || 20, 100);
    const skip = Math.max((Number(page) || 1) - 1, 0) * take;

    const [items, total] = await Promise.all([
      prisma.quizQuestion.findMany({
        skip,
        take,
        orderBy: { id: "asc" },
        select: {
          id: true,
          country: true,
          category: true,
          topic: true,
          question: true,
          optionA: true,
          optionB: true,
          optionC: true,
          optionD: true,
          correct: true,
        },
      }),
      prisma.quizQuestion.count(),
    ]);

    res.status(200).json({ ok: true, items, total, page: Number(page), pageSize: take });
  } catch (err) {
    res
      .status(500)
      .json({ ok: false, error: err?.message || "Unknown error in /api/quiz/list" });
  }
}
