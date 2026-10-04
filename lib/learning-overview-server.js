import { learningModules, learningPaths } from "./learning-curriculum";
import { getLearningCategory } from "./learning-categories";

// Overview pages need summaries; lesson text and answer keys stay in the course pages.
export function getLearningOverviewData(categorySlug) {
  const categoryInfo = categorySlug ? getLearningCategory(categorySlug) : null;
  if (categorySlug && !categoryInfo) return null;
  const selected = categoryInfo ? learningModules.filter(module => module.category === categoryInfo.title) : learningModules;
  const modules = selected.map(module => ({
    id: module.id, title: module.title, description: module.description,
    category: module.category, countries: module.countries, minutes: module.minutes, level: module.level,
    lessonTitles: module.lessons.map(lesson => lesson.title),
    lessonCount: module.lessons.length, questionCount: module.questions.length,
  }));
  const categoryCounts = Object.fromEntries(learningModules.map(module => [module.category, 0]));
  for (const module of learningModules) categoryCounts[module.category] += 1;
  return {
    categoryInfo, modules, paths: learningPaths, categoryCounts,
    counts: { modules: modules.length, lessons: selected.reduce((sum, module) => sum + module.lessons.length, 0), questions: selected.reduce((sum, module) => sum + module.questions.length, 0) },
  };
}
