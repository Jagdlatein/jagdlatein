// Server-only public subset. Keep the full maintained curriculum out of clients.
import { createHash, webcrypto } from "node:crypto";
import references from "../data/revierduell-question-ids-v1.json";
import { getDailyReviewPool } from "./daily-review-pool";
import { learningModules } from "./learning-curriculum";
import { getLessonReviewDate } from "./learning-review-date";
import { DUELL_ALGORITHM_VERSION, createDuellSeed, createDuellRound, normaliseDuellSeed, parseDuellTarget, normaliseDuellRevision } from "./revierduell";
import { DUELL_TOPICS, normaliseDuellTopic } from "./revierduell-topics";

const text = value => typeof value === "string" && value.trim().length > 0;
const requireData = value => { if (!value) throw new Error("DUELL_REVIEWED_BANK_UNAVAILABLE"); };
export function getDuellBank() {
  requireData(Array.isArray(references) && references.length >= 57 && references.every(text) && new Set(references).size === references.length);
  const pool = getDailyReviewPool();
  const bank = references.map(id => {
    const matches = pool.filter(item => item.id === id); requireData(matches.length === 1);
    const item = matches[0], owners = learningModules.filter(course => course.questions.some(question => question.id === id)); requireData(owners.length === 1);
    const course = owners[0], question = course.questions.find(value => value.id === id), lesson = course.lessons.find(value => value.id === question.lessonId);
    requireData(lesson && question.topic !== "Recht" && normaliseDuellTopic(item.category) && Array.isArray(question.countries) && question.countries.length === 3 && ["CH", "AT", "DE"].every(country => question.countries.includes(country)));
    requireData(text(item.q) && text(item.explain) && text(item.courseTitle) && item.answers.length === 4 && item.correct.length === 1 && item.answers.every(answer => text(answer.id) && text(answer.text)) && new Set(item.answers.map(answer => answer.id)).size === 4 && item.answers.some(answer => answer.id === item.correct[0]));
    const reviewedOn = getLessonReviewDate(lesson, course.reviewedOn); requireData(reviewedOn && ["lesson", "course"].includes(item.sourceScope) && item.sources.length > 0 && item.sources.every(source => text(source.label) && /^https:\/\//.test(source.url)));
    return { id, categorySlug: item.category, courseTitle: item.courseTitle, prompt: item.q,
      options: item.answers.map(answer => ({ id: answer.id, text: answer.text })), correctIds: [...item.correct], explanation: item.explain,
      href: item.href, sourceScope: item.sourceScope, reviewedOn,
      sources: item.sources.map((source, index) => ({ id: `duell-source-${index + 1}`, title: source.label, url: source.url })) };
  });
  requireData(new Set(bank.map(question => question.prompt.trim().toLocaleLowerCase("de"))).size === bank.length);
  requireData(DUELL_TOPICS.every(topic => bank.filter(question => question.categorySlug === topic.slug).length >= 7));
  return bank;
}

export function duellBankRevision(bank, topic = null) {
  // Includes presentation context and provenance. Changes never silently reuse
  // an old shared challenge revision, even if a question keeps its stable ID.
  return createHash("sha256").update(JSON.stringify({ algorithmVersion: DUELL_ALGORITHM_VERSION, rules: [7, 12000, 500, 35, 90], topic: normaliseDuellTopic(topic), questions: bank })).digest("hex").slice(0, 16);
}

export function getDuellPageProps(query = {}, secureCrypto = webcrypto) {
  const bank = getDuellBank(), topic = normaliseDuellTopic(query.thema), revision = duellBankRevision(bank, topic);
  const topics = DUELL_TOPICS.map(item => ({ ...item, count: bank.filter(question => question.categorySlug === item.slug).length }));
  const requestSelection = { seedQuery: normaliseDuellSeed(query.duell), targetQuery: parseDuellTarget(query.ziel), revisionQuery: normaliseDuellRevision(query.v), topicQuery: topic };
  const seed = requestSelection.seedQuery || createDuellSeed(secureCrypto);
  const unavailable = Boolean(requestSelection.seedQuery && requestSelection.revisionQuery && requestSelection.revisionQuery !== revision);
  const target = requestSelection.seedQuery && !unavailable ? requestSelection.targetQuery : null;
  return { seed, revision, target, topic, topics, unavailable, requestSelection,
    questions: unavailable ? [] : createDuellRound(bank, seed, topic),
    linkNotice: !requestSelection.seedQuery && query.ziel !== undefined ? "Dieser Challenge-Link ist unvollständig. Du kannst eine neue Runde ohne Zielpunktzahl spielen." : null };
}
