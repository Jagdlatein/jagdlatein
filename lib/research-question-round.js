import { answerOrder } from "./answer-order";

export const RESEARCH_ROUND_SIZE = 8;

function batch(questions, ids, remaining, seed, generation) {
  return { questions, ids, remaining, seed, generation, index: 0, selection: [], answers: {}, finished: false };
}

export function createResearchRound(questions, seed = 0, generation = 0) {
  const ids = answerOrder(questions, "research-question-pool", seed).map(index => questions[index].id);
  return batch(questions, ids.slice(0, RESEARCH_ROUND_SIZE), ids.slice(RESEARCH_ROUND_SIZE), seed, generation);
}

export function currentResearchQuestion(state) {
  return state.questions.find(question => question.id === state.ids[state.index]);
}

export function canGradeResearchQuestion(question, selection) {
  if (!question || !Array.isArray(selection)) return false;
  const available = new Set(question.options.map(option => option.id));
  if (selection.some(id => !available.has(id)) || new Set(selection).size !== selection.length) return false;
  if (question.format === "sequence") return selection.length === question.options.length;
  return question.format === "single" ? selection.length === 1 : selection.length > 0;
}

export function gradeResearchQuestion(question, selection) {
  if (!canGradeResearchQuestion(question, selection)) return null;
  const expected = question.format === "sequence" ? question.expectedOrder : question.correctIds;
  const correct = question.format === "sequence"
    ? expected.every((id, index) => selection[index] === id)
    : expected.length === selection.length && expected.every(id => selection.includes(id));
  return { correct, selectedIds: [...selection], skipped: false };
}

// All events carry question + generation: a double click or a handler from an
// earlier question/round cannot change the current answer or advance twice.
export function researchRoundReducer(state, event) {
  if (event.generation !== state.generation) return state;
  if (event.type === "freshen") {
    // The initial HTML is reproducible. Mix once after hydration, but never
    // replace a selection/answer made before that effect was delivered.
    if (state.generation !== 0 || state.index !== 0 || state.selection.length || Object.keys(state.answers).length || state.finished) return state;
    return createResearchRound(state.questions, event.seed, 1);
  }
  if (["continue", "retry", "restart"].includes(event.type)) {
    if (!state.finished) return state;
    const generation = state.generation + 1;
    if (event.type === "restart") return createResearchRound(state.questions, event.seed, generation);
    const ids = event.type === "retry"
      ? state.ids.filter(id => !state.answers[id]?.correct)
      : state.remaining.slice(0, RESEARCH_ROUND_SIZE);
    if (!ids.length) return state;
    const remaining = event.type === "retry" ? state.remaining : state.remaining.slice(RESEARCH_ROUND_SIZE);
    return batch(state.questions, ids, remaining, event.seed, generation);
  }
  const question = currentResearchQuestion(state);
  if (!question || state.finished || event.questionId !== question.id) return state;
  const answered = Object.hasOwn(state.answers, question.id);
  if (event.type === "next") {
    if (!answered) return state;
    return state.index + 1 >= state.ids.length ? { ...state, finished: true } : { ...state, index: state.index + 1, selection: [] };
  }
  if (answered) return state;
  if (event.type === "select") {
    if (question.format === "multiple") {
      if (!question.options.some(option => option.id === event.id)) return state;
      return { ...state, selection: state.selection.includes(event.id) ? state.selection.filter(id => id !== event.id) : [...state.selection, event.id] };
    }
    if (question.format === "sequence" && Number.isInteger(event.position) && event.position >= 0 && event.position < question.options.length) {
      if (event.id !== "" && !question.options.some(option => option.id === event.id)) return state;
      const selection = Array.from({ length: question.options.length }, (_, index) => state.selection[index] || "");
      selection[event.position] = event.id;
      return { ...state, selection };
    }
    return state;
  }
  const result = event.type === "skip" ? { correct: false, selectedIds: [...state.selection], skipped: true }
    : event.type === "answer" ? gradeResearchQuestion(question, question.format === "single" ? event.ids : state.selection) : null;
  return result ? { ...state, answers: { ...state.answers, [question.id]: result } } : state;
}
