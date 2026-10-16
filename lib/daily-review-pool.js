import { learningModules } from "./learning-curriculum";
import { getLearningCategoryByTitle } from "./learning-categories";
import { lessonHash } from "./learning-lesson-navigation";
import { packDailyReviewCatalog } from "./daily-review-catalog";

// Server-only maintained question details. Static props expose only the catalog below.
// Reuse course questions, never expand local law to all of DACH.
let maintainedPool;
export function getDailyReviewPool() {
  if (!maintainedPool) maintainedPool = learningModules.flatMap(course => getLearningCategoryByTitle(course.category)?.slug === "jagdrecht" ? [] : course.questions.filter(question => question.topic !== "Recht" && question.countries.length === 3).map(question => ({
    id: question.id, q: question.q, answers: question.answers, correct: question.correct, explain: question.explain,
    category: getLearningCategoryByTitle(course.category)?.slug || "pruefung-sprache",
    courseTitle: course.title, href: `/kurse/${course.id}${lessonHash(question.lessonId)}`, sources: course.sources,
  })));
  return maintainedPool;
}

export function getDailyReviewCatalog() {
  return getDailyReviewPool().map(({ id, category }) => ({ id, category }));
}

export function getPackedDailyReviewCatalog() {
  return packDailyReviewCatalog(getDailyReviewCatalog());
}

export function getDailyReviewQuestions(ids) {
  if (!Array.isArray(ids) || !ids.length || ids.length > 8 || new Set(ids).size !== ids.length ||
      ids.some(id => typeof id !== "string" || !/^[a-z][a-z0-9-]{1,159}$/.test(id))) {
    throw new Error("Ungültige Wiederholungsfragen.");
  }
  const available = new Map(getDailyReviewPool().map(question => [question.id, question]));
  if (ids.some(id => !available.has(id))) throw new Error("Ungültige Wiederholungsfragen.");
  return ids.map(id => available.get(id));
}
