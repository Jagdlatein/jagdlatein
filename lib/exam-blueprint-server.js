import blueprint from "../data/exam-alignment/learning-goals-2026-11-01.json";
import { learningCategoryDetails } from "./learning-categories";
import { oralExamQuestions } from "./oral-exam-trainer";
import { getLearningModule } from "./learning-curriculum";
import { getLessonReviewDate } from "./learning-review-date";
import { projectExamLearningGoal } from "./exam-learning-goal-server";
import { getExamTransferGoals } from "./exam-transfer-goals-server";

export function getExamBlueprintData() {
  const expected = learningCategoryDetails.map(item => item.slug);
  if (!Array.isArray(blueprint.categories) || blueprint.categories.length !== expected.length || new Set(blueprint.categories.map(item => item.slug)).size !== expected.length || blueprint.categories.some(item => !expected.includes(item.slug))) throw new Error("Ungültige Prüfungslerngebiete");
  const sources = [], sourceKeys = new Map(), goalIds = new Set();
  const categories = expected.map(slug => {
    const category = blueprint.categories.find(item => item.slug === slug);
    if (!Array.isArray(category.goals) || category.goals.length !== 3) throw new Error("Unvollständige Prüfungslernziele");
    const goals = category.goals.map(raw => project(raw, slug));
    const question = category.caseQuestionId && oralExamQuestions.find(item => item.id === category.caseQuestionId && item.categorySlug === slug);
    if (category.caseQuestionId && (!question || slug === "jagdrecht")) throw new Error("Unpassender Übungsfall");
    return { slug, goals, practiceCase: question ? { id: question.id, text: question.prompt, followUp: question.followUp, href: `/lernen/pruefungsgespraech?kategorie=${slug}&eintrag=${question.id}` } : null };
  });
  // Project the original36 first: their objects, source IDs and source order
  // stay stable when the twelve separate transfer tasks are appended.
  for (const addition of getExamTransferGoals()) {
    categories.find(category => category.slug === addition.slug).goals.push(project(addition.goal, addition.slug, true));
  }
  return { categories, sources };

  function project(raw, slug, linked = false) {
    const goal = projectExamLearningGoal(raw, { categorySlug: slug });
    if (goalIds.has(goal.id)) throw new Error("Doppeltes Prüfungslernziel");
    goalIds.add(goal.id);
    const course = getLearningModule(raw.moduleId), lesson = course.lessons.find(item => item.id === raw.lessonId);
    if (course.countries.length !== 3 || !["DE", "AT", "CH"].every(code => course.countries.includes(code))) throw new Error("Regionaler Stoff im gemeinsamen Lernziel");
    const primary = cite(course, lesson, linked);
    const contexts = linked ? [primary, ...raw.relatedLessons.map(target => {
      const owner = getLearningModule(target.moduleId);
      return cite(owner, owner.lessons.find(item => item.id === target.lessonId), true);
    })] : [primary];
    return { ...goal, sourceIds: [...new Set(contexts.flatMap(context => context.sourceIds))], sourceScope: primary.sourceScope,
      ...(linked ? { sourceContexts: contexts } : {}) };
  }

  function cite(course, lesson, strict) {
    const exact = (lesson.evidence || []).flatMap(item => item.sources || []);
    let evidence = exact.length ? exact : course.sources.filter(source => !source.lessonIds || source.lessonIds.includes(lesson.id));
    if (strict) evidence = evidence.filter(source => source.lessonIds === undefined || Array.isArray(source.lessonIds) && source.lessonIds.includes(lesson.id));
    const sourceIds = evidence.map(source => {
      const parsed = new URL(source.url);
      if (parsed.protocol !== "https:" || parsed.username || parsed.password || !(source.label || source.title)) throw new Error("Ungültige Lektionsquelle");
      const reviewedOn = getLessonReviewDate(lesson, course.reviewedOn);
      if (strict && !reviewedOn) throw new Error("Fehlender übernommener Prüfstand");
      const key = `${source.url}:${reviewedOn}`;
      if (!sourceKeys.has(key)) {
        sourceKeys.set(key, `lernziel-quelle-${sources.length + 1}`);
        sources.push({ id: sourceKeys.get(key), title: source.label || source.title, url: source.url, reviewedOn });
      }
      return sourceKeys.get(key);
    });
    if (!sourceIds.length) throw new Error("Fehlende Lektionsnachweise");
    return { moduleId: course.id, lessonId: lesson.id, lessonTitle: lesson.title, sourceIds: [...new Set(sourceIds)], sourceScope: exact.length ? "lesson" : "course" };
  }
}
