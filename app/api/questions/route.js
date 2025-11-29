export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { filterQuestions } from "@/data/questions-full";

export async function GET(req) {
  try {
    const url = new URL(req.url, "http://localhost"); // Fix für Next 14
    const country = (url.searchParams.get("country") || "DE").toUpperCase();
    const topic = url.searchParams.get("topic") || "Alle";

    const questions = filterQuestions({
      country,
      topic,
      count: 10,
    });

    function shuffleArray(arr) {
    return arr
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(obj => obj.value);
}

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("API /api/questions ERROR:", err);
    return NextResponse.json(
      { error: "questions_failed" },
      { status: 500 }
    );
  }
}
