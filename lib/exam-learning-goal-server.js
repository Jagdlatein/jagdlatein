// Build-only validation of authored study goals against actual course lessons.
import { getLearningModule } from "./learning-curriculum";
import { getLearningCategoryByTitle } from "./learning-categories";
import { lessonHash } from "./learning-lesson-navigation";
import { getLearningNavigationLabel } from "./learning-navigation-labels";
import { getFlashcardLessonSummary } from "./learning-flashcards";
import { readFlashcardSelection } from "./flashcard-selection";

// Build-only metadata. Reused goals share one validated summary per course;
// no card text, answers, ratings or source bodies enter the plan projection.
const cardCounts = new WeakMap();
function lessonCardLink(course, lesson) {
  const selection = readFlashcardSelection({ kurs: course.id, lektion: lesson.id });
  if (!selection || selection.invalid) return {};
  const cached = cardCounts.get(course);
  if (!cached || cached.questions !== course.questions || cached.lessons !== course.lessons || cached.questionCount !== course.questions.length || cached.lessonCount !== course.lessons.length) {
    const summary = getFlashcardLessonSummary(course.id);
    const entries = summary?.lessons && !Array.isArray(summary.lessons) && Object.getPrototypeOf(summary.lessons) === Object.prototype ? Object.entries(summary.lessons) : [];
    const valid = summary && Object.getPrototypeOf(summary) === Object.prototype && Object.hasOwn(summary, "total") && Object.hasOwn(summary, "lessons")
      && Number.isSafeInteger(summary.total) && summary.total >= 0 && summary.total <= course.questions.length
      && entries.every(([id, count]) => Number.isSafeInteger(count) && count > 0 && course.lessons.filter(item => item.id === id).length === 1 && count <= course.questions.filter(item => item.lessonId === id).length)
      && entries.reduce((total, [, count]) => total + count, 0) === summary.total;
    cardCounts.set(course, { questions: course.questions, lessons: course.lessons, questionCount: course.questions.length, lessonCount: course.lessons.length, counts: valid ? new Map(entries) : new Map() });
  }
  const cardCount = cardCounts.get(course).counts.get(lesson.id) || 0;
  if (course.lessons.filter(item => item.id === lesson.id).length !== 1 || cardCount > course.questions.filter(item => item.lessonId === lesson.id).length) return {};
  return cardCount ? { cardCount, cardHref: `/lernen/lernkarten?kurs=${encodeURIComponent(course.id)}&lektion=${encodeURIComponent(lesson.id)}` } : {};
}

export function projectExamLearningGoal(goal, { country, categorySlug } = {}) {
  const nonempty = value => typeof value === "string" && value.trim().length > 0;
  if (!goal || typeof goal.id !== "string" || !/^[a-z][a-z0-9-]{1,100}$/.test(goal.id) || !nonempty(goal.title) || !nonempty(goal.task) || !(nonempty(goal.selfCheck) || Array.isArray(goal.selfCheck) && goal.selfCheck.length > 0 && goal.selfCheck.every(nonempty)) || (goal.regionalLaw !== undefined && typeof goal.regionalLaw !== "boolean")) throw new Error("Ungültiges Prüfungslernziel");
  const course = getLearningModule(goal.moduleId);
  const lesson = course?.lessons.find(item => item.id === goal.lessonId);
  const category = getLearningCategoryByTitle(course?.category);
  if (!course || !lesson || !category || (country && !course.countries.includes(country)) || (categorySlug && category.slug !== categorySlug)) throw new Error(`Ungültiger Lektionsbezug: ${goal.id}`);
  const regionalLaw = category.slug === "jagdrecht" || goal.regionalLaw === true;
  const commonQuestion = question => question.countries.length === 3 && ["DE", "AT", "CH"].every(code => question.countries.includes(code)) && question.topic !== "Recht";
  const lessonQuestions = course.questions.filter(question => question.lessonId === lesson.id);
  const lessonPractice = !regionalLaw && lessonQuestions.length > 0 && lessonQuestions.every(commonQuestion);
  const commonCourse = course.countries.length === 3 && ["DE", "AT", "CH"].every(code => course.countries.includes(code));
  const cards = lessonPractice && commonCourse ? lessonCardLink(course, lesson) : {};
  if ((goal.caseText !== undefined && !nonempty(goal.caseText)) || (goal.followUp !== undefined && !nonempty(goal.followUp))) throw new Error("Ungültiger Lernfall");
  const relatedLessons = (goal.relatedLessons || []).map(target => {
    const relatedCourse = getLearningModule(target.moduleId);
    const relatedLesson = relatedCourse?.lessons.find(item => item.id === target.lessonId);
    if (!relatedLesson || (country && !relatedCourse.countries.includes(country)) || getLearningCategoryByTitle(relatedCourse.category)?.slug === "jagdrecht") throw new Error("Ungültiger ergänzender Lektionsbezug");
    return { courseTitle: getLearningNavigationLabel(relatedCourse), lessonTitle: relatedLesson.title, href: `/kurse/${relatedCourse.id}${lessonHash(relatedLesson.id)}` };
  });
  return {
    id: goal.id, title: goal.title, task: goal.task, selfCheck: goal.selfCheck,
    regionalLaw, lessonPractice, courseTitle: getLearningNavigationLabel(course), lessonTitle: lesson.title,
    href: regionalLaw ? null : `/kurse/${course.id}${lessonHash(lesson.id)}`,
    quizHref: regionalLaw || !course.questions.every(commonQuestion) ? null : `/kurse/${course.id}#wissenscheck`,
    ...cards,
    ...(relatedLessons.length ? { relatedLessons } : {}),
    ...(goal.caseText ? { caseText: goal.caseText } : {}),
    ...(goal.followUp ? { followUp: goal.followUp } : {}),
  };
}
