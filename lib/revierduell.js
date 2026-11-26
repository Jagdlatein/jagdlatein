// Pure, versioned game mechanics. This module imports no teaching bank,
// account, statistics, storage, clock or network implementation.
import { normaliseDuellTopic } from "./revierduell-topics";
export { normaliseDuellTopic } from "./revierduell-topics";
export const DUELL_QUESTION_COUNT = 7;
export const DUELL_QUESTION_MS = 12000;
export const DUELL_MAX_SCORE = 8330;
export const DUELL_ALGORITHM_VERSION = 1;
export const DUELL_HIGHSCORE_KEY = "jagdlatein-revierduell-highscore-v1";

export function normaliseDuellSeed(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(value) ? value : null;
}

export function isDuellScore(value) {
  return Number.isInteger(value) && value >= 0 && value <= DUELL_MAX_SCORE;
}

export function parseDuellTarget(value) {
  if (typeof value !== "string" || !/^(?:0|[1-9][0-9]{0,3})$/.test(value)) return null;
  const score = Number(value);
  return isDuellScore(score) ? score : null;
}

export function normaliseDuellRevision(value) {
  return typeof value === "string" && /^[a-f0-9]{16}$/i.test(value) ? value.toLowerCase() : null;
}

export function createDuellSeed(secureCrypto = globalThis.crypto) {
  if (!secureCrypto || typeof secureCrypto.getRandomValues !== "function") throw new Error("DUELL_SECURE_RANDOM_UNAVAILABLE");
  const bytes = new Uint8Array(16);
  try { secureCrypto.getRandomValues(bytes); } catch { throw new Error("DUELL_SECURE_RANDOM_UNAVAILABLE"); }
  return "d1_" + Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
}

// FNV-1a and this exact Mulberry32 integer stream form game algorithm version1.
// Streams are reproducible, not a cryptographic signature or proof of a score.
function stream(key) {
  let value = 2166136261;
  for (let index = 0; index < key.length; index++) value = Math.imul(value ^ key.charCodeAt(index), 16777619) >>> 0;
  return () => {
    value = (value + 0x6D2B79F5) >>> 0;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return (mixed ^ (mixed >>> 14)) >>> 0;
  };
}

function integer(next, maximum) {
  const limit = 4294967296 - (4294967296 % maximum);
  let value;
  do { value = next(); } while (value >= limit);
  return value % maximum;
}

function shuffled(values, key) {
  const result = [...values], next = stream(key);
  for (let index = result.length - 1; index > 0; index--) {
    const swap = integer(next, index + 1);
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

const compareId = (left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
function validQuestion(question) {
  return question && typeof question === "object" && !Array.isArray(question)
    && typeof question.id === "string" && question.id.length > 0
    && typeof question.categorySlug === "string" && /^[a-z0-9-]{1,64}$/.test(question.categorySlug) && question.categorySlug !== "jagdrecht"
    && typeof question.prompt === "string" && question.prompt.trim().length > 0
    && typeof question.explanation === "string" && question.explanation.trim().length > 0
    && Array.isArray(question.options) && question.options.length === 4
    && question.options.every(option => option && typeof option.id === "string" && option.id.length > 0 && typeof option.text === "string" && option.text.trim().length > 0)
    && new Set(question.options.map(option => option.id)).size === 4
    && Array.isArray(question.correctIds) && question.correctIds.length === 1
    && question.options.some(option => option.id === question.correctIds[0]);
}

function copiedQuestion(question) {
  return { ...question, options: question.options.map(option => ({ ...option })), correctIds: [...question.correctIds] };
}

// The caller supplies an explicitly projected flat bank. It owns the public
// payload allowlist; no entire curriculum or inherited private data is loaded.
export function createDuellRound(bank, seed, topic = null) {
  if (!normaliseDuellSeed(seed) || !Array.isArray(bank) || bank.length < DUELL_QUESTION_COUNT || !bank.every(validQuestion)
      || new Set(bank.map(question => question.id)).size !== bank.length) throw new Error("INVALID_DUELL_BANK_OR_SEED");
  const byCategory = new Map();
  for (const question of bank) {
    if (!byCategory.has(question.categorySlug)) byCategory.set(question.categorySlug, []);
    byCategory.get(question.categorySlug).push(question);
  }
  const selectedTopic = normaliseDuellTopic(topic);
  if (selectedTopic) {
    const candidates = byCategory.get(selectedTopic);
    if (!candidates || candidates.length < DUELL_QUESTION_COUNT) throw new Error("DUELL_TOPIC_NEEDS_SEVEN_QUESTIONS");
    return shuffled([...candidates].sort(compareId), "topic-questions:" + seed + ":" + selectedTopic).slice(0, DUELL_QUESTION_COUNT).map(selected => ({
      ...copiedQuestion(selected),
      options: shuffled([...selected.options].sort(compareId), "answers:" + seed + ":" + selected.id).map(option => ({ ...option })),
    }));
  }
  if (byCategory.size < DUELL_QUESTION_COUNT) throw new Error("DUELL_NEEDS_SEVEN_CATEGORIES");
  const categories = shuffled([...byCategory.keys()].sort(), "categories:" + seed).slice(0, DUELL_QUESTION_COUNT);
  return categories.map(category => {
    const candidates = [...byCategory.get(category)].sort(compareId);
    const selected = shuffled(candidates, "question:" + seed + ":" + category)[0];
    return {
      ...copiedQuestion(selected),
      options: shuffled([...selected.options].sort(compareId), "answers:" + seed + ":" + selected.id).map(option => ({ ...option })),
    };
  });
}

export function duellAnswerPoints(correct, remainingMs, previousStreak = 0) {
  if (correct !== true || !Number.isFinite(remainingMs) || remainingMs <= 0
      || !Number.isInteger(previousStreak) || previousStreak < 0 || previousStreak >= DUELL_QUESTION_COUNT) return 0;
  const seconds = Math.floor(Math.min(DUELL_QUESTION_MS, remainingMs) / 1000);
  return 500 + 35 * seconds + 90 * previousStreak;
}

export function duellRank(correct, total = DUELL_QUESTION_COUNT) {
  if (!Number.isInteger(total) || total < 1 || total > DUELL_QUESTION_COUNT || !Number.isInteger(correct) || correct < 0 || correct > total) return null;
  const ratio = correct / total;
  if (ratio === 1) return { id: "fuchs", label: "Wissensfuchs" };
  if (ratio >= 5 / 7) return { id: "sicher", label: "Spurensicher" };
  if (ratio >= 3 / 7) return { id: "spur", label: "Auf guter Spur" };
  return { id: "neugierig", label: "Neugierig unterwegs" };
}

export function compareDuellTarget(score, target) {
  if (!isDuellScore(score) || !isDuellScore(target)) return null;
  return score > target ? "won" : score === target ? "tied" : "missed";
}

export function duellChallengeUrl({ seed, score, revision, topic = null }) {
  const validSeed = normaliseDuellSeed(seed), validRevision = normaliseDuellRevision(revision);
  if (!validSeed || !isDuellScore(score) || !validRevision) throw new Error("INVALID_DUELL_CHALLENGE");
  const query = new URLSearchParams({ duell: validSeed, ziel: String(score), v: validRevision, utm_source: "revierduell", utm_medium: "share", utm_campaign: "revierduell" });
  const selectedTopic = normaliseDuellTopic(topic);
  if (selectedTopic) query.set("thema", selectedTopic);
  return "https://jagdlatein.de/revierduell?" + query.toString();
}

export function parseDuellHighscore(serialized) {
  return parseDuellTarget(serialized);
}

function checkedRound(questions) {
  if (!Array.isArray(questions) || questions.length !== DUELL_QUESTION_COUNT || !questions.every(validQuestion)
      || new Set(questions.map(question => question.id)).size !== DUELL_QUESTION_COUNT) throw new Error("INVALID_DUELL_ROUND");
  return questions.map(copiedQuestion);
}

export function createDuellState(questions, generation = 0) {
  if (!Number.isSafeInteger(generation) || generation < 0) throw new Error("INVALID_DUELL_GENERATION");
  return { questions: checkedRound(questions), generation, phase: "ready", index: 0, score: 0, streak: 0, correctCount: 0, answers: [], startedAt: null, deadline: null };
}

const validNow = now => Number.isFinite(now) && now >= 0 && now <= Number.MAX_SAFE_INTEGER - DUELL_QUESTION_MS;
export function duellRemainingMs(state, now) {
  if (state?.phase !== "asking" || !validNow(now)) return 0;
  return Math.max(0, Math.min(DUELL_QUESTION_MS, state.deadline - now));
}

// Every event is bound to its original round generation and question index.
// A UI must additionally reject callbacks from unmounted or replaced URL owners.
export function duellReducer(state, event) {
  if (!event || event.generation !== state.generation || event.index !== state.index) return state;
  if (Object.hasOwn(event, "isCurrent")) {
    try { if (typeof event.isCurrent !== "function" || event.isCurrent() !== true) return state; }
    catch { return state; }
  }
  if (event.type === "restart") {
    if (state.phase !== "finished" || state.generation >= Number.MAX_SAFE_INTEGER) return state;
    return createDuellState(state.questions, state.generation + 1);
  }
  if (event.type === "start") {
    return state.phase === "ready" && validNow(event.now)
      ? { ...state, phase: "asking", startedAt: event.now, deadline: event.now + DUELL_QUESTION_MS } : state;
  }
  if (event.type === "next") {
    if (state.phase !== "feedback") return state;
    if (state.index + 1 === DUELL_QUESTION_COUNT) return { ...state, phase: "finished", startedAt: null, deadline: null };
    return validNow(event.now) && event.now >= state.answers[state.answers.length - 1].answeredAt
      ? { ...state, phase: "asking", index: state.index + 1, startedAt: event.now, deadline: event.now + DUELL_QUESTION_MS } : state;
  }
  if (!["answer", "timeout"].includes(event.type) || state.phase !== "asking" || !validNow(event.now) || event.now < state.startedAt) return state;
  const timedOut = event.now >= state.deadline, question = state.questions[state.index];
  if (event.type === "timeout" && !timedOut) return state;
  if (!timedOut && !question.options.some(option => option.id === event.optionId)) return state;
  const selectedId = timedOut ? null : event.optionId;
  const correct = !timedOut && question.correctIds.includes(selectedId), remainingMs = Math.max(0, state.deadline - event.now);
  const points = duellAnswerPoints(correct, remainingMs, state.streak), streak = correct ? state.streak + 1 : 0;
  const result = { questionId: question.id, selectedId, correct, timedOut, answeredAt: event.now, elapsedMs: Math.min(DUELL_QUESTION_MS, event.now - state.startedAt), remainingMs, points, streak };
  return { ...state, phase: "feedback", score: state.score + points, streak, correctCount: state.correctCount + (correct ? 1 : 0), answers: [...state.answers, result] };
}
