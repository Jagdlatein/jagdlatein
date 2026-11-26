// Server-only public subset. Keep the full maintained curriculum out of clients.
import { createHash, webcrypto } from "node:crypto";
import references from "../data/revierduell-question-ids-v1.json";
import { QUESTIONS } from "../data/questions-full";
import { getDailyReviewPool } from "./daily-review-pool";
import { learningModules } from "./learning-curriculum";
import { getLessonReviewDate } from "./learning-review-date";
import { getLearningCategoryByTitle } from "./learning-categories";
import { quizLearningPool, quizQuestionCountries, quizQuestionTopic } from "./quiz-learning-scope";
import { DUELL_ALGORITHM_VERSION, createDuellSeed, createDuellRound, normaliseDuellSeed, parseDuellTarget, normaliseDuellRevision } from "./revierduell";
import { DUELL_TOPICS, normaliseDuellTopic } from "./revierduell-topics";

const text = value => typeof value === "string" && value.trim().length > 0;
const requireData = value => { if (!value) throw new Error("DUELL_REVIEWED_BANK_UNAVAILABLE"); };
export function getDuellBank() {
  requireData(Array.isArray(references) && references.length >= 57 && references.every(text) && new Set(references).size === references.length);
  const pool = getDailyReviewPool();
  requireData(Array.isArray(QUESTIONS) && QUESTIONS.every(question => question && text(question.id)));
  const eligibleQuizIds = new Set(quizLearningPool(QUESTIONS, { topic: "Alle" }).map(question => question.id));
  const bank = references.map(id => {
    const matches = pool.filter(item => item.id === id); requireData(matches.length === 1);
    const quizMatches = QUESTIONS.filter(question => question.id === id);
    requireData(quizMatches.length === 1 && eligibleQuizIds.has(id));
    const quiz = quizMatches[0], quizCountries = quizQuestionCountries(quiz);
    requireData(quizQuestionTopic(quiz) !== "Recht" && Array.isArray(quizCountries) && quizCountries.length === 3 && ["CH", "AT", "DE"].every(country => quizCountries.includes(country)));
    const item = matches[0], owners = learningModules.filter(course => course.questions.some(question => question.id === id)); requireData(owners.length === 1);
    requireData(getLearningCategoryByTitle(quizQuestionTopic(quiz))?.slug === item.category);
    const course = owners[0], question = course.questions.find(value => value.id === id), lesson = course.lessons.find(value => value.id === question.lessonId);
    requireData(lesson && question.topic !== "Recht" && normaliseDuellTopic(item.category) && Array.isArray(question.countries) && question.countries.length === 3 && ["CH", "AT", "DE"].every(country => question.countries.includes(country)));
    requireData(text(quiz.q) && text(quiz.explain) && text(item.courseTitle) && Array.isArray(quiz.answers) && quiz.answers.length === 4 && Array.isArray(quiz.correct) && quiz.correct.length === 1 && quiz.answers.every(answer => answer && text(answer.id) && text(answer.text)) && new Set(quiz.answers.map(answer => answer.id)).size === 4 && quiz.answers.some(answer => answer.id === quiz.correct[0]));
    // Teach from the canonical quiz entry; its course context must still agree.
    requireData(item.q === quiz.q && item.explain === quiz.explain && Array.isArray(item.answers) && item.answers.length === quiz.answers.length && item.answers.every((answer, index) => answer.id === quiz.answers[index].id && answer.text === quiz.answers[index].text) && Array.isArray(item.correct) && item.correct.length === quiz.correct.length && item.correct.every((answer, index) => answer === quiz.correct[index]));
    const reviewedOn = getLessonReviewDate(lesson, course.reviewedOn); requireData(reviewedOn && ["lesson", "course"].includes(item.sourceScope) && item.sources.length > 0 && item.sources.every(source => text(source.label) && /^https:\/\//.test(source.url)));
    return { id, categorySlug: item.category, courseTitle: item.courseTitle, prompt: quiz.q,
      options: quiz.answers.map(answer => ({ id: answer.id, text: answer.text })), correctIds: [...quiz.correct], explanation: quiz.explain,
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
