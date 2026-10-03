export const RESULT_COLUMNS = "event_id,type,country,topic,total_questions,correct_answers,timed_out_answers,points,duration_seconds,finished_at";

export class ActivityResultError extends Error {
  constructor(message, status = 400, code = "INVALID_RESULT") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function validateActivityResult(body) {
  const keys = ["eventId", "type", "country", "topic", "totalQuestions", "correctAnswers", "timedOutAnswers", "points", "durationSeconds"];
  const valid = body && typeof body === "object" && !Array.isArray(body) &&
    Object.keys(body).length === keys.length && Object.keys(body).every(key => keys.includes(key)) &&
    typeof body.eventId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.eventId) &&
    ["quiz", "ansitz"].includes(body.type) &&
    typeof body.topic === "string" && body.topic.trim().length > 0 && body.topic.length <= 120 && !/[\u0000-\u001f\u007f]/.test(body.topic) &&
    [body.totalQuestions, body.correctAnswers, body.timedOutAnswers, body.points, body.durationSeconds].every(Number.isInteger) &&
    body.totalQuestions >= 1 && body.totalQuestions <= 10000 &&
    body.correctAnswers >= 0 && body.correctAnswers <= body.totalQuestions &&
    body.timedOutAnswers >= 0 && body.timedOutAnswers <= body.totalQuestions - body.correctAnswers &&
    body.durationSeconds >= 0 && body.durationSeconds <= 86400 &&
    (body.type === "quiz"
      ? ["DE", "AT", "CH"].includes(body.country) && body.points >= body.correctAnswers * 100 && body.points <= body.correctAnswers * 400 && body.points % 10 === 0
      : body.country === null && body.topic === "Ansitzsimulator" && body.totalQuestions === 25 && body.timedOutAnswers === 0 && body.points === body.correctAnswers);
  if (!valid) throw new ActivityResultError("Die Ergebnisdaten sind ungültig.");
  return {
    event_id: body.eventId.toLowerCase(),
    type: body.type,
    country: body.country,
    topic: body.topic.trim(),
    total_questions: body.totalQuestions,
    correct_answers: body.correctAnswers,
    timed_out_answers: body.timedOutAnswers,
    points: body.points,
    duration_seconds: body.durationSeconds,
  };
}

export function sameActivityResult(stored, candidate) {
  return Object.keys(candidate).every(key => stored?.[key] === candidate[key]);
}
