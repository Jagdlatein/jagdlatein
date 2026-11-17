import CourseDirectory from "../../components/CourseDirectory";
import { courses as courseCatalog, miniCourses } from "../../lib/course-catalog";
import { learningModules } from "../../lib/learning-curriculum";
import { getLearningCategoryByTitle } from "../../lib/learning-categories";
import { miniCourseDetails } from "../../lib/mini-course-details";

export function getStaticProps() {
  const moduleCategories = new Map(learningModules.map(module => [module.id, getLearningCategoryByTitle(module.category)?.slug]));
  const courses = courseCatalog.map(course => ({ ...course, title: miniCourseDetails[course.id]?.title || course.title.replace(/^[^\p{L}\p{N}]+/u, ""), category: miniCourseDetails[course.id]?.category || moduleCategories.get(course.id), format: miniCourseDetails[course.id] ? "mini" : "detailed" }));
  return { props: { courses, miniCount: miniCourses.length, detailedCount: learningModules.length } };
}
export default function KurseOverview(props) { return <CourseDirectory {...props} />; }
