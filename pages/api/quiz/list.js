// pages/api/quiz/list.js
import { prisma } from "../../lib/prisma";

export default async function handler(req, res) {
  try {
    const {
      q,
      country,
      category,
      topic,
      page = "1",
      pageSize = "20",
    } = req.query;

    const where = {};
    if (q) {
      where.OR = [
        { question: { contains: q, mode: "insensitive" } },
        { optionA: { contains: q, mode: "insensitive" } },
        { optionB: { contains: q, mode: "insensitive" } },
        { optionC: { contains: q, mode: "insensitive" } },
        { optionD: { contains: q, mode: "insensitive" } },
      ];
    }
    if (country && country !== "alle") where.country = country;
    if (category && category !== "alle") where.category = category;
    if (topic && topic !== "alle") where.topic = topic;

    const take = Math.max(1, parseInt(pageSize, 10));
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * take;

    const [items, total] = await Promise.all([
      prisma.quizQuestion.findMany({
        where,
        orderBy: [{ id: "asc" }],
        skip,
        take,
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
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.quizQuestion.count({ where }),
    ]);

    res.status(200).json({ ok: true, total, items });
  } catch (e) {
    res
      .status(500)
      .json({ ok: false, error: e?.message ?? "Unknown error in quiz list" });
  }
}
