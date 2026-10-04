export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { filterQuestions } from "@/data/questions-full";
import { requirePaidAccount } from "../../../lib/account-access";

export async function GET(req) {
  try {
    await requirePaidAccount(req);
    const url = new URL(req.url, "http://localhost"); // Fix für Next 14
    const country = (url.searchParams.get("country") || "DE").toUpperCase();
    const topic = url.searchParams.get("topic") || "Alle";
    if (!["DE", "AT", "CH"].includes(country) || topic.length > 120 || /[\u0000-\u001f\u007f]/.test(topic)) {
      return NextResponse.json({ error: "Ungültiges Quizland oder Thema." }, { status: 400 });
    }

    let questions = filterQuestions({
      country,
      topic,
      count: 10,
    });

    // -----------------------------
    // Shuffle-Funktion
    // -----------------------------
    function shuffleArray(arr) {
      return arr
        .map((value) => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map((obj) => obj.value);
    }

    // --------------------------------------------
    // Antworten JE FRAGE mischen + korrekte IDs neu setzen
    // --------------------------------------------
    questions = questions.map((q) => {
      const shuffledAnswers = shuffleArray(q.answers);

      // neue korrekte Antwort-IDs bestimmen
      const newCorrect = shuffledAnswers
        .filter((ans) => q.correct.includes(ans.id))
        .map((ans) => ans.id);

      return {
        ...q,
        answers: shuffledAnswers,
        correct: newCorrect,
      };
    });

    return NextResponse.json({ questions }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("API /api/questions ERROR:", err);
    return NextResponse.json({ error: [401, 403, 503].includes(err?.status) ? err.message : "questions_failed" }, { status: [401, 403, 503].includes(err?.status) ? err.status : 500 });
  }
}
