// Build-only validation of authored study goals against actual course lessons.
import { getLearningModule } from "./learning-curriculum";
import { getLearningCategoryByTitle } from "./learning-categories";
import { lessonHash } from "./learning-lesson-navigation";
import { getLearningNavigationLabel } from "./learning-navigation-labels";

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
    ...(relatedLessons.length ? { relatedLessons } : {}),
    ...(goal.caseText ? { caseText: goal.caseText } : {}),
    ...(goal.followUp ? { followUp: goal.followUp } : {}),
  };
}
