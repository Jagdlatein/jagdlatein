import { NextResponse } from "next/server";
import { filterQuestions } from "../../../data/questions-full";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const country = (searchParams.get("country") || "DE").toUpperCase();
    const topic = searchParams.get("topic") || "Alle";

    // 10 Fragen – wie in deiner alten Logik
    const questions = filterQuestions({ country, topic, count: 10 });

    return NextResponse.json({ ok: true, questions });
  } catch (err) {
    console.error("Fehler in /api/questions:", err);
    return NextResponse.json({ ok: false, questions: [] });
  }
}
