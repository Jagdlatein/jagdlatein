import { getWildlifeLearningGuide } from "./wildlife-learning-guide";
import { getLearningModule } from "./learning-curriculum";
import { isLearningReviewDate } from "./learning-review-date";

// Server-side projection of existing authored lessons. Keep one source of truth:
// the portrait reads the same paragraphs as the established course, not a second
// generated summary that could drift away from it.
export function getWildlifeStudyContent(slug, moduleId) {
  const target = getWildlifeLearningGuide(slug).find(item => item.moduleId === moduleId);
  if (!target) return null;
  const module = getLearningModule(moduleId);
  if (!module) return null;
  const lessons = module.lessons.filter(lesson => !target.lessonId || lesson.id === target.lessonId);
  if (!lessons.length) return null;
  return { species: slug, moduleId, title: target.title, scope: target.scope, modelNote: target.modelNote || "",
    reviewedOn: module.reviewedOn || "", sources: module.sources || [],
    scopeNotes: [...new Set(Object.values(module.countryNotes || {}).filter(note => typeof note === "string" && note.trim()))],
    lessons: lessons.map(({ id, title, paragraphs, takeaway, exercise, diagram, evidence, reviewedOn }) => ({
      id, title, paragraphs, takeaway, exercise, ...(diagram ? { diagram } : {}), ...(evidence ? { evidence } : {}),
      ...(isLearningReviewDate(reviewedOn) ? { reviewedOn } : {}),
    })) };
}
