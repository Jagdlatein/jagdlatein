import { filterQuestions, PACK_INFO } from "../data/questions-full";
import { quizDatabase } from "./quiz-api";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function quizId(value) {
  if (typeof value !== "string" || !UUID.test(value)) throw Object.assign(new Error("Ungültige Rundenkennung."), { status: 400 });
  return value.toLowerCase();
}

export function requireQuizOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin || origin !== new URL(req.url).origin ||
    (req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() !== "application/json") {
    throw Object.assign(new Error("Ungültige Quizanfrage."), { status: 403 });
  }
}

export function roundQuestions(country, topic) {
  if (!PACK_INFO.countries.includes(country) || typeof topic !== "string" ||
    (topic !== "Alle" && !PACK_INFO.topics.includes(topic))) {
    throw Object.assign(new Error("Ungültiges Quizland oder Thema."), { status: 400 });
  }
  const questions = filterQuestions({ country, topic, count: 10 });
  if (!questions.length) throw Object.assign(new Error("Für dieses Thema gibt es in diesem Land keine Fragen."), { status: 400 });
  return questions.map(question => {
    const answers = question.answers.map(answer => ({ id: answer.id, text: answer.text }));
    for (let index = answers.length - 1; index > 0; index -= 1) {
      const next = Math.floor(Math.random() * (index + 1));
      [answers[index], answers[next]] = [answers[next], answers[index]];
    }
    return { id: question.id, q: question.q, answers, correct: question.correct,
      explain: question.explain || "", source: typeof question.source === "string" ? question.source : null };
  });
}

// Explicit allowlist: neither answer keys nor future questions leave the server.
export function publicRound(state) {
  if (!state || !Array.isArray(state.questions)) throw new Error("Missing quiz state");
  const question = ["asking", "feedback"].includes(state.phase) ? state.questions[state.index] : null;
  const feedback = state.phase === "feedback" ? state.feedback : null;
  return {
    roundId: state.roundId, phase: state.phase, index: state.index, total: state.questions.length,
    country: state.country, topic: state.topic, points: state.points,
    correctAnswers: state.correctAnswers, timedOutAnswers: state.timedOutAnswers,
    serverNow: state.serverNow, deadlineAt: state.phase === "asking" ? state.deadlineAt : null,
    question: question ? { id: question.id, q: question.q,
      answers: question.answers.map(answer => ({ id: answer.id, text: answer.text })) } : null,
    feedback: feedback ? {
      questionId: feedback.questionId, correct: feedback.correct, timedOut: feedback.timedOut,
      selectedAnswerId: feedback.selectedAnswerId, correctAnswerIds: feedback.correctAnswerIds,
      explain: feedback.explain, source: feedback.source, earnedPoints: feedback.earnedPoints,
      answeredAt: feedback.answeredAt,
    } : null,
    finishedAt: state.finishedAt || null,
  };
}

export async function rankedQuizRpc(name, args) {
  const { data, error } = await quizDatabase().rpc(name, args);
  if (error) {
    const messages = {
      JL_QUIZ_MISSING: [404, "Diese Runde wurde nicht gefunden."],
      JL_QUIZ_EXPIRED: [409, "Diese Runde ist abgelaufen. Bitte eine neue Runde starten."],
      JL_QUIZ_CONFLICT: [409, "Diese Antwort wurde bereits gespeichert oder die Frage ist nicht mehr aktuell."],
      JL_QUIZ_IDENTITY: [409, "Bitte zuerst einen eigenen Quiznamen wählen."],
      JL_QUIZ_NAME: [409, "Dieser Quizname ist bereits vergeben oder als früherer Name reserviert. Bitte einen anderen wählen."],
      JL_QUIZ_INVALID: [400, "Ungültige Quizanfrage."],
    };
    const key = Object.keys(messages).find(value => error.message?.includes(value));
    if (key) throw Object.assign(new Error(messages[key][1]), { status: messages[key][0] });
    throw Object.assign(new Error("Die Rangliste ist gerade nicht erreichbar."), { status: 503 });
  }
  if (!data || typeof data !== "object") throw Object.assign(new Error("Die Rangliste ist gerade nicht erreichbar."), { status: 503 });
  return data;
}

export function roundResponse(state) {
  return Response.json({ success: true, round: publicRound(state) }, { headers: { "Cache-Control": "private, no-store" } });
}
