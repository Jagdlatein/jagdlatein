import LearningCourse from "../../components/LearningCourse";
import { getLearningModule, learningModules } from "../../lib/learning-curriculum";
import { getFlashcardLessonSummary } from "../../lib/learning-flashcards";
import { getCourseWildlifeLinks } from "../../lib/course-wildlife-links-server";

export function getStaticPaths() {
  return { paths: learningModules.map(module => ({ params: { slug: module.id } })), fallback: false };
}

export function getStaticProps({ params }) {
  const module = getLearningModule(params.slug);
  return module ? { props: { module, flashcards: getFlashcardLessonSummary(module.id), wildlifeLinks: getCourseWildlifeLinks(module) } } : { notFound: true };
}

export default function LearningCoursePage({ module, flashcards, wildlifeLinks = [] }) {
  return <LearningCourse module={module} flashcards={flashcards} wildlifeLinks={wildlifeLinks} />;
}
