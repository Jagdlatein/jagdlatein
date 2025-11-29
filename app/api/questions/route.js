export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { filterQuestions } from "@/data/questions-full";

export async function GET(req) {
  try {
    const url = new URL(req.url, "http://localhost"); // Fix für Next 14
    const country = (url.searchParams.get("country") || "DE").toUpperCase();
    const topic = url.searchParams.get("topic") || "Alle";

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

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("API /api/questions ERROR:", err);
    return NextResponse.json({ error: "questions_failed" }, { status: 500 });
  }
}
