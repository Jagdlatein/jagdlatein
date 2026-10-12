// Use this metadata builder from getServerSideProps so the full curriculum and
// its question data stay on the server rather than in the personal-page bundle.
import { courses } from "./course-catalog";
import { learningModules } from "./learning-curriculum";
import { miniCourseDetails } from "./mini-course-details";
import { getLearningCategory, getLearningCategoryByTitle } from "./learning-categories";

export function getMyCourseCatalog() {
  const modules = new Map(learningModules.map(module => [module.id, module]));
  return courses.map(course => {
    const module = modules.get(course.id);
    const category = module ? getLearningCategoryByTitle(module.category) : getLearningCategory(miniCourseDetails[course.id]?.category);
    if (!category) throw new Error(`Kategorie fehlt für Kurs ${course.id}`);
    return { id: course.id, title: course.title.replace(/^[^\p{L}\p{N}]+/u, "").trim(),
      description: course.description, href: course.href, totalQuestions: course.totalQuestions,
      categorySlug: category.slug, categoryTitle: category.title };
  });
}
