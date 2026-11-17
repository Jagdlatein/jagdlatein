// Build-only projections. Never import course questions, cards or this helper in
// a client component: the category pages receive objectives, counts and URLs only.
import { getLearningCategory, getLearningCategoryByTitle } from "./learning-categories";
import { getLearningModule } from "./learning-curriculum";
import { flashcardCategories, getFlashcardLessonSummary, getFlashcards } from "./learning-flashcards";
import { getDailyReviewCatalog } from "./daily-review-pool";
import { QUESTIONS } from "../data/questions-full";
import { quizLearningOptions, quizQuestionCountries, quizQuestionTopic } from "./quiz-learning-scope";

const ID = /^[a-z][a-z0-9-]{1,159}$/;
const countries = ["DE", "AT", "CH"];
const text = value => typeof value === "string" && value.trim().length > 0;
const record = value => value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;
const commonCountries = value => Array.isArray(value) && value.length === 3 && countries.every(country => value.includes(country));
let categoryCatalog;
let cardCatalog;

function practiceCatalog() {
  if (!categoryCatalog) categoryCatalog = {
    cards: new Set(flashcardCategories.filter(item => Number.isSafeInteger(item.count) && item.count > 0).map(item => item.id)),
    review: new Set(getDailyReviewCatalog().map(item => item.category)),
    quiz: new Set(quizLearningOptions(QUESTIONS).commonOptions.topics.filter(item => Number.isSafeInteger(item.count) && item.count > 0).map(item => item.name)),
  };
  return categoryCatalog;
}

export function categoryPracticeLinks(category) {
  const canonical = getLearningCategory(category?.slug);
  if (!record(category) || !canonical || canonical.title !== category.title || canonical.slug === "jagdrecht") return {};
  const catalog = practiceCatalog(), encoded = encodeURIComponent(canonical.slug);
  return {
    ...(catalog.cards.has(canonical.slug) ? { cardHref: `/lernen/lernkarten?kategorie=${encoded}` } : {}),
    ...(catalog.review.has(canonical.slug) ? { reviewHref: `/lernen/fuenf-minuten?kategorie=${encoded}` } : {}),
    ...(catalog.quiz.has(canonical.title) ? { quizHref: `/quiz-app?topic=${encodeURIComponent(canonical.title)}` } : {}),
  };
}

function actualCourseCards(courseId) {
  if (!cardCatalog) {
    cardCatalog = new Map();
    for (const card of getFlashcards()) {
      if (!cardCatalog.has(card.moduleId)) cardCatalog.set(card.moduleId, []);
      cardCatalog.get(card.moduleId).push(card);
    }
  }
  return cardCatalog.get(courseId) || [];
}

function commonQuestion(question, lessonIds) {
  if (!record(question) || !text(question.id) || !text(question.q) || !text(question.explain) || !lessonIds.has(question.lessonId)
    || !Array.isArray(question.answers) || question.answers.length !== 4 || !Array.isArray(question.correct) || question.correct.length !== 1) return false;
  const ids = question.answers.map(answer => answer?.id), labels = question.answers.map(answer => answer?.text);
  return ids.every(text) && labels.every(text) && new Set(ids).size === 4 && new Set(labels).size === 4 && ids.includes(question.correct[0])
    && quizQuestionTopic(question) !== "Recht" && commonCountries(quizQuestionCountries(question));
}

export function projectCategoryCoursePractice(course, { cardSummary } = {}) {
  const category = getLearningCategoryByTitle(course?.category);
  if (!record(course) || typeof course.id !== "string" || !ID.test(course.id) || !category || !Array.isArray(course.lessons) || !course.lessons.length) return { objectives: [] };
  const actual = getLearningModule(course.id);
  if (!actual || actual.category !== course.category) return { objectives: [] };
  const lessonIds = new Set(course.lessons.map(lesson => lesson?.id));
  // Authored lesson IDs can contain umlauts (for example "gelände"). Only the
  // course ID enters these URLs; lesson IDs are checked by exact membership.
  const validLessons = lessonIds.size === course.lessons.length && [...lessonIds].every(text)
    && actual.lessons.length === lessonIds.size && actual.lessons.every(lesson => lessonIds.has(lesson.id));
  const objectives = Array.isArray(course.objectives) && course.objectives.every(text) ? [...course.objectives] : [];
  const projected = { objectives };
  // Regional law stays with the existing profile/country/region flow. A course
  // containing even one regional question never advertises a common DACH check.
  if (!validLessons || category.slug === "jagdrecht" || !commonCountries(course.countries) || !Array.isArray(course.questions) || !course.questions.length) return projected;
  const questionIds = course.questions.map(question => question?.id);
  if (questionIds.some(id => !text(id)) || new Set(questionIds).size !== questionIds.length || questionIds.length !== actual.questions.length
    || actual.questions.some(question => !questionIds.includes(question.id))) return projected;
  const sharedQuestions = course.questions.filter(question => commonQuestion(question, lessonIds));
  if (sharedQuestions.length === course.questions.length && commonCountries(actual.countries) && actual.questions.every(question => commonQuestion(question, lessonIds))) {
    projected.quizHref = `/kurse/${course.id}#wissenscheck`;
    projected.questionCount = course.questions.length;
  }
  const summary = cardSummary === undefined ? getFlashcardLessonSummary(course.id) : cardSummary;
  if (!record(summary) || !Object.hasOwn(summary, "total") || !Object.hasOwn(summary, "lessons") || !Number.isSafeInteger(summary.total)
    || summary.total <= 0 || summary.total > sharedQuestions.length || !record(summary.lessons)) return projected;
  const counts = Object.entries(summary.lessons);
  if (!counts.length || counts.some(([id, count]) => !lessonIds.has(id) || !Number.isSafeInteger(count) || count <= 0
    || count > sharedQuestions.filter(question => question.lessonId === id).length)
    || counts.reduce((total, [, count]) => total + count, 0) !== summary.total) return projected;
  const cards = actualCourseCards(course.id), actualCounts = new Map();
  if (cards.length !== summary.total || new Set(cards.map(card => card.id)).size !== cards.length || cards.some(card => {
    const question = sharedQuestions.find(item => `flash-${item.id}` === card.id && item.lessonId === card.lessonId);
    if (!question || card.question !== question.q || card.answer !== question.answers.find(answer => question.correct.includes(answer.id))?.text || card.explanation !== question.explain) return true;
    actualCounts.set(card.lessonId, (actualCounts.get(card.lessonId) || 0) + 1);
    return false;
  }) || actualCounts.size !== counts.length || counts.some(([id, count]) => actualCounts.get(id) !== count)) return projected;
  projected.cardHref = `/lernen/lernkarten?kurs=${encodeURIComponent(course.id)}`;
  projected.cardCount = summary.total;
  return projected;
}
