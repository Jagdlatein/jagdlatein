import blueprint from "../data/exam-alignment/learning-goals-2026-11-01.json";
import { learningCategoryDetails } from "./learning-categories";
import { oralExamQuestions } from "./oral-exam-trainer";
import { getLearningModule } from "./learning-curriculum";
import { getLessonReviewDate } from "./learning-review-date";
import { projectExamLearningGoal } from "./exam-learning-goal-server";

export function getExamBlueprintData() {
  const expected = learningCategoryDetails.map(item => item.slug);
  if (!Array.isArray(blueprint.categories) || blueprint.categories.length !== expected.length || new Set(blueprint.categories.map(item => item.slug)).size !== expected.length || blueprint.categories.some(item => !expected.includes(item.slug))) throw new Error("Ungültige Prüfungslerngebiete");
  const sources = [], sourceKeys = new Map(), goalIds = new Set();
  const categories = expected.map(slug => {
    const category = blueprint.categories.find(item => item.slug === slug);
    if (!Array.isArray(category.goals) || category.goals.length !== 3) throw new Error("Unvollständige Prüfungslernziele");
    const goals = category.goals.map(raw => {
      const goal = projectExamLearningGoal(raw, { categorySlug: slug });
      if (goalIds.has(goal.id)) throw new Error("Doppeltes Prüfungslernziel");
      goalIds.add(goal.id);
      const course = getLearningModule(raw.moduleId), lesson = course.lessons.find(item => item.id === raw.lessonId);
      if (course.countries.length !== 3 || !["DE", "AT", "CH"].every(code => course.countries.includes(code))) throw new Error("Regionaler Stoff im gemeinsamen Lernziel");
      const exact = (lesson.evidence || []).flatMap(item => item.sources || []);
      const evidence = exact.length ? exact : course.sources.filter(source => !source.lessonIds || source.lessonIds.includes(lesson.id));
      const sourceIds = evidence.map(source => {
        const parsed = new URL(source.url);
        if (parsed.protocol !== "https:" || parsed.username || parsed.password || !(source.label || source.title)) throw new Error("Ungültige Lektionsquelle");
        const reviewedOn = getLessonReviewDate(lesson, course.reviewedOn);
        const key = `${source.url}:${reviewedOn}`;
        if (!sourceKeys.has(key)) {
          sourceKeys.set(key, `lernziel-quelle-${sources.length + 1}`);
          sources.push({ id: sourceKeys.get(key), title: source.label || source.title, url: source.url, reviewedOn });
        }
        return sourceKeys.get(key);
      });
      if (!sourceIds.length) throw new Error("Fehlende Lektionsnachweise");
      return { ...goal, sourceIds: [...new Set(sourceIds)], sourceScope: exact.length ? "lesson" : "course" };
    });
    const question = category.caseQuestionId && oralExamQuestions.find(item => item.id === category.caseQuestionId && item.categorySlug === slug);
    if (category.caseQuestionId && (!question || slug === "jagdrecht")) throw new Error("Unpassender Übungsfall");
    return { slug, goals, practiceCase: question ? { id: question.id, text: question.prompt, followUp: question.followUp, href: `/lernen/pruefungsgespraech?kategorie=${slug}&eintrag=${question.id}` } : null };
  });
  return { categories, sources };
}
