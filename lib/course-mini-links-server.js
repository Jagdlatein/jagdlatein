import { miniCourses } from "./course-catalog";
import { miniCourseDetails, miniCourseLessonTargets } from "./mini-course-details";

// Reverse only existing authored recommendations. A whole-course match is a
// topic connection, not a claim that every mini-course question fits a lesson.
export function getCourseMiniLinks(module) {
  if (!module || typeof module.id !== "string" || !Array.isArray(module.lessons) || !module.lessons.length) return [];
  const counts = new Map();
  for (const lesson of module.lessons) if (typeof lesson?.id === "string") counts.set(lesson.id, (counts.get(lesson.id) || 0) + 1);
  const links = [];
  for (const course of miniCourses) {
    const details = miniCourseDetails[course.id];
    const wholeCourse = details?.modules.includes(module.id);
    const selected = (miniCourseLessonTargets[course.id] || []).filter(target => target.moduleId === module.id && counts.get(target.lessonId) === 1);
    if (!wholeCourse && !selected.length) continue;
    links.push({ id: course.id, title: details.title || course.title.replace(/^[^\p{L}\p{N}]+/u, ""), href: course.href,
      lessonIds: wholeCourse ? null : module.lessons.filter(lesson => selected.some(target => target.lessonId === lesson.id)).map(lesson => lesson.id) });
  }
  return links.sort((a, b) => a.title.localeCompare(b.title, "de"));
}
