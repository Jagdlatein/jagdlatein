import { wildYearCatalog } from "./wild-year-catalog";
import { getWildlifeLearningGuide } from "./wildlife-learning-guide";
import { jawModelsBySlug } from "./wildlife-jaw-models";

// Server-only navigation projection. Reverse the authored species-specific
// assignments, never broad foundations or guesses from a course title.
export function getCourseWildlifeLinks(module) {
  if (!module || typeof module.id !== "string" || !Array.isArray(module.lessons) || !module.lessons.length) return [];
  const lessonCounts = new Map();
  for (const lesson of module.lessons) if (typeof lesson?.id === "string") lessonCounts.set(lesson.id, (lessonCounts.get(lesson.id) || 0) + 1);
  const links = [];
  for (const species of wildYearCatalog) {
    const targets = getWildlifeLearningGuide(species.slug).filter(target => target.scope === "species" && target.moduleId === module.id &&
      (target.lessonId === undefined || typeof target.lessonId === "string" && lessonCounts.get(target.lessonId) === 1));
    if (!targets.length) continue;
    const wholeCourse = targets.some(target => target.lessonId === undefined);
    const lessonIds = wholeCourse ? null : module.lessons.filter(lesson => targets.some(target => target.lessonId === lesson.id)).map(lesson => lesson.id);
    links.push({ slug: species.slug, name: species.name, lessonIds,
      portraitHref: `/wildkunde/${species.slug}#${targets[0].topicId || `art-lerntext-${module.id}`}`,
      yearHref: `/lernen/wildjahr?art=${encodeURIComponent(species.slug)}`,
      modelHref: jawModelsBySlug[species.slug] ? `/lernen/kiefer-3d?art=${encodeURIComponent(species.slug)}` : null });
  }
  return links.sort((a, b) => a.name.localeCompare(b.name, "de"));
}
