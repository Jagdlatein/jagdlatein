// Build-only authored applications of existing lessons. These add practice
// tasks, not new scientific findings, legal releases or review dates.
import ecology from "../data/exam-alignment/transfer-ecology-2026-11-17.json";
import practice from "../data/exam-alignment/transfer-practice-2026-11-17.json";
import exam from "../data/exam-alignment/transfer-exam-2026-11-17.json";
import { learningCategoryDetails, getLearningCategoryByTitle } from "./learning-categories";
import { getLearningModule } from "./learning-curriculum";
import { projectExamLearningGoal } from "./exam-learning-goal-server";
import { quizQuestionCountries, quizQuestionTopic } from "./quiz-learning-scope";

const record = value => value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;
const text = value => typeof value === "string" && value.trim().length > 0;
const shared = value => Array.isArray(value) && value.length === 3 && ["DE", "AT", "CH"].every(country => value.includes(country));
const allowed = new Set(["id", "title", "task", "selfCheck", "moduleId", "lessonId", "caseText", "followUp", "relatedLessons", "regionalLaw"]);
function requireTransfer(condition) { if (!condition) throw new Error("Ungültiger verknüpfter Prüfungsfall"); }

export function getExamTransferGoals(datasets = [ecology, practice, exam]) {
  requireTransfer(Array.isArray(datasets) && datasets.length === 3 && datasets.every(dataset => record(dataset) && Array.isArray(dataset.categories) && dataset.categories.length === 4));
  const entries = datasets.flatMap(dataset => dataset.categories), slugs = learningCategoryDetails.map(category => category.slug), ids = new Set();
  requireTransfer(entries.length === slugs.length && new Set(entries.map(entry => entry?.slug)).size === slugs.length);
  return slugs.map(slug => {
    const entry = entries.find(item => item?.slug === slug), goal = entry?.goal;
    requireTransfer(record(entry) && Object.keys(entry).every(key => ["slug", "goal"].includes(key)) && record(goal) && Object.keys(goal).every(key => allowed.has(key)));
    requireTransfer(typeof goal.id === "string" && /^[a-z][a-z0-9-]{1,100}$/.test(goal.id) && !ids.has(goal.id)); ids.add(goal.id);
    requireTransfer([goal.title, goal.task, goal.caseText, goal.followUp].every(text) && Array.isArray(goal.selfCheck) && goal.selfCheck.length === 3 && goal.selfCheck.every(text) && new Set(goal.selfCheck).size === 3);
    requireTransfer(slug === "jagdrecht" ? goal.regionalLaw === true : goal.regionalLaw === undefined || goal.regionalLaw === false);
    const course = getLearningModule(goal.moduleId), lesson = course?.lessons.find(item => item.id === goal.lessonId);
    requireTransfer(lesson && Array.isArray(lesson.paragraphs) && lesson.paragraphs.length > 0 && lesson.paragraphs.every(text)
      && shared(course.countries) && getLearningCategoryByTitle(course.category)?.slug === slug);
    const questions = course.questions.filter(question => question.lessonId === lesson.id);
    if (slug !== "jagdrecht") requireTransfer(questions.length > 0 && questions.every(question => shared(quizQuestionCountries(question)) && quizQuestionTopic(question) !== "Recht"
      && Array.isArray(question.answers) && question.answers.length === 4 && question.answers.every(answer => record(answer) && text(answer.id) && text(answer.text))
      && new Set(question.answers.map(answer => answer.id)).size === 4 && new Set(question.answers.map(answer => answer.text)).size === 4
      && Array.isArray(question.correct) && question.correct.length === 1 && text(question.correct[0]) && question.answers.some(answer => answer.id === question.correct[0])));
    requireTransfer(Array.isArray(goal.relatedLessons) && goal.relatedLessons.length >= 1 && goal.relatedLessons.length <= 2);
    const related = new Set([`${goal.moduleId}/${goal.lessonId}`]);
    for (const target of goal.relatedLessons) {
      requireTransfer(record(target) && Object.keys(target).sort().join(",") === "lessonId,moduleId");
      const owner = getLearningModule(target.moduleId), other = owner?.lessons.find(item => item.id === target.lessonId), key = `${target.moduleId}/${target.lessonId}`;
      const category = getLearningCategoryByTitle(owner?.category);
      requireTransfer(other && shared(owner.countries) && category && category.slug !== "jagdrecht" && !related.has(key)); related.add(key);
    }
    const cloned = JSON.parse(JSON.stringify(goal));
    projectExamLearningGoal(cloned, { categorySlug: slug });
    return { slug, goal: cloned };
  });
}

export function getCategoryExamTransfer(slug) {
  const entry = getExamTransferGoals().find(item => item.slug === slug);
  return entry ? { title: entry.goal.title, caseText: entry.goal.caseText, href: `/lernen/pruefungsplan?kategorie=${encodeURIComponent(slug)}#exam-plan-learning` } : null;
}
