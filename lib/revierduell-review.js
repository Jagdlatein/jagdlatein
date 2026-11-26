// Local, untimed practice only. The original completed result is never changed.
import { DUELL_QUESTION_COUNT } from "./revierduell";

export function createDuellReview(questions, answers, generation = 0) {
  if (!Number.isSafeInteger(generation) || generation < 0 || !Array.isArray(questions) || questions.length !== DUELL_QUESTION_COUNT ||
      !Array.isArray(answers) || answers.length !== questions.length || new Set(questions.map(question => question?.id)).size !== questions.length ||
      questions.some((question, index) => !question || typeof question.id !== "string" || !question.id || typeof question.prompt !== "string" || typeof question.explanation !== "string" ||
        !Array.isArray(question.options) || question.options.length !== 4 || question.options.some(option => !option || typeof option.id !== "string" || typeof option.text !== "string") || new Set(question.options.map(option => option.id)).size !== 4 ||
        !Array.isArray(question.correctIds) || question.correctIds.length !== 1 || !question.options.some(option => option.id === question.correctIds[0]) ||
        !answers[index] || answers[index].questionId !== question.id || typeof answers[index].correct !== "boolean" || typeof answers[index].timedOut !== "boolean" || answers[index].timedOut && answers[index].correct)) throw new Error("INVALID_DUELL_REVIEW");
  const selected = questions.filter((_, index) => !answers[index].correct);
  return selected.length ? { generation, questions: Object.freeze(selected), index: 0, phase: "asking", selectedId: null } : null;
}

export function duellReviewReducer(state, event) {
  if (!state || !event || event.generation !== state.generation || event.index !== state.index) return state;
  if (Object.hasOwn(event, "isCurrent")) {
    try { if (typeof event.isCurrent !== "function" || event.isCurrent() !== true) return state; } catch { return state; }
  }
  if (event.type === "answer" && state.phase === "asking" && state.questions[state.index].options.some(option => option.id === event.optionId)) {
    return { ...state, phase: "feedback", selectedId: event.optionId };
  }
  if (event.type === "next" && state.phase === "feedback") {
    return state.index + 1 === state.questions.length ? { ...state, phase: "finished" } : { ...state, phase: "asking", index: state.index + 1, selectedId: null };
  }
  return state;
}
