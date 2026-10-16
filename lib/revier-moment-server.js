import { getPracticeResearchData } from "./practice-research-server";

const DAY_MS = 86400000;
const TOPIC_COUNT = 3;
const QUESTIONS_PER_TOPIC = 20;
const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Zurich", era: "short", year: "numeric", month: "2-digit", day: "2-digit",
});
const displayFormatter = new Intl.DateTimeFormat("de-CH", {
  timeZone: "Europe/Zurich", day: "numeric", month: "long", year: "numeric",
});
const hasText = value => typeof value === "string" && value.trim().length > 0;
const isDateKey = value => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value);
};
function requireData(condition) {
  if (!condition) throw new Error("Revier-Moment: Der geprüfte Fragenvorrat ist unvollständig oder ungültig.");
}
function copySource(source) {
  const keys = ["id", "organization", "title", "url", "publishedOn", "kind", "supports", "independence"];
  requireData(source && keys.every(key => hasText(source[key])) && /^https:\/\//.test(source.url));
  return Object.fromEntries(keys.map(key => [key, source[key]]));
}
function copyPhoto(photo) {
  const keys = ["src", "alt", "width", "height", "credit", "creditUrl", "licenseUrl", "modifications"];
  requireData(photo && ["src", "alt", "credit", "creditUrl", "licenseUrl"].every(key => hasText(photo[key]))
    && Number.isInteger(photo.width) && photo.width > 0 && Number.isInteger(photo.height) && photo.height > 0
    && typeof photo.modifications === "boolean");
  return Object.fromEntries(keys.map(key => [key, photo[key]]));
}
function copyQuestion(question, sourceIds) {
  requireData(question && ["id", "topicId", "skill", "prompt", "explanation"].every(key => hasText(question[key]))
    && isDateKey(question.reviewedOn) && ["single", "multiple", "sequence"].includes(question.format)
    && Array.isArray(question.options) && question.options.length >= 2
    && question.options.every(option => option && hasText(option.id) && hasText(option.text))
    && Array.isArray(question.sourceIds) && question.sourceIds.length > 0
    && new Set(question.sourceIds).size === question.sourceIds.length && question.sourceIds.every(id => sourceIds.has(id))
    && (question.context === undefined || hasText(question.context)));
  const optionIds = new Set(question.options.map(option => option.id));
  const answerKey = question.format === "sequence" ? "expectedOrder" : "correctIds";
  const answers = question[answerKey];
  requireData(optionIds.size === question.options.length && Array.isArray(answers) && answers.length > 0
    && answers.every(id => optionIds.has(id)) && new Set(answers).size === answers.length
    && (question.format !== "single" || answers.length === 1)
    && (question.format !== "sequence" || answers.length === optionIds.size));
  return {
    id: question.id, topicId: question.topicId, format: question.format, skill: question.skill,
    prompt: question.prompt, ...(question.context === undefined ? {} : { context: question.context }),
    options: question.options.map(({ id, text }) => ({ id, text })), [answerKey]: [...answers],
    explanation: question.explanation, sourceIds: [...question.sourceIds], reviewedOn: question.reviewedOn,
  };
}

// A Swiss civil day, rather than elapsed hours, determines the case. Epoch-based
// day numbering keeps the 60-day cycle continuous through DST and New Year.
// These are rotating, previously reviewed cases; selection is not a new review.
export function getRevierMoment(now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new TypeError("Revier-Moment: now muss ein gültiges Date-Objekt sein.");
  }
  const parts = Object.fromEntries(dayFormatter.formatToParts(now).map(part => [part.type, part.value]));
  const dateKey = `${parts.year.padStart(4, "0")}-${parts.month}-${parts.day}`;
  if (parts.era !== "AD" || !isDateKey(dateKey) || Number(parts.year) < 1) throw new RangeError("Revier-Moment: Datum außerhalb des unterstützten Kalenderbereichs.");
  const day = Math.floor(new Date(`${dateKey}T00:00:00.000Z`).getTime() / DAY_MS);
  const cycleDay = ((day % (TOPIC_COUNT * QUESTIONS_PER_TOPIC)) + TOPIC_COUNT * QUESTIONS_PER_TOPIC) % (TOPIC_COUNT * QUESTIONS_PER_TOPIC);
  const data = getPracticeResearchData();
  requireData(data && Array.isArray(data.topics) && data.topics.length === TOPIC_COUNT
    && new Set(data.topics.map(topic => topic?.id)).size === TOPIC_COUNT
    && Array.isArray(data.questions) && data.questions.length === TOPIC_COUNT * QUESTIONS_PER_TOPIC
    && data.questions.every(question => question && typeof question === "object")
    && new Set(data.questions.map(question => question?.id)).size === data.questions.length);
  const pools = data.topics.map(topic => {
    requireData(topic && ["id", "title", "photoContext"].every(key => hasText(topic[key]))
      && isDateKey(topic.reviewedOn) && Array.isArray(topic.sources) && topic.sources.length > 0);
    const sources = topic.sources.map(copySource);
    const sourceIds = new Set(sources.map(source => source.id));
    requireData(sourceIds.size === sources.length);
    const questions = data.questions.filter(question => question.topicId === topic.id).map(question => copyQuestion(question, sourceIds));
    requireData(questions.length === QUESTIONS_PER_TOPIC);
    return { topic, sources, questions, photo: copyPhoto(data.photos?.[topic.photoKey]) };
  });
  const pool = pools[cycleDay % TOPIC_COUNT];
  const question = pool.questions[Math.floor(cycleDay / TOPIC_COUNT)];
  return {
    dateKey, displayDate: displayFormatter.format(now), question,
    topic: {
      id: pool.topic.id, title: pool.topic.title, reviewedOn: pool.topic.reviewedOn,
      photoContext: pool.topic.photoContext,
      sources: pool.sources.filter(source => question.sourceIds.includes(source.id)),
    },
    photo: pool.photo,
  };
}

// Only this explicit teaser may be passed to the public home page. No answer,
// source mapping, full question, photograph or unused dossier crosses that edge.
export function getRevierMomentPreview(moment) {
  requireData(moment && isDateKey(moment.dateKey) && hasText(moment.displayDate)
    && hasText(moment.question?.prompt) && hasText(moment.topic?.title));
  return { dateKey: moment.dateKey, displayDate: moment.displayDate, prompt: moment.question.prompt, topicTitle: moment.topic.title };
}
