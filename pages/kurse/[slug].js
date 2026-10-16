import LearningCourse from "../../components/LearningCourse";
import { getLearningModule, learningModules } from "../../lib/learning-curriculum";
import { getFlashcardLessonSummary } from "../../lib/learning-flashcards";

export function getStaticPaths() {
  return { paths: learningModules.map(module => ({ params: { slug: module.id } })), fallback: false };
}

export function getStaticProps({ params }) {
  const module = getLearningModule(params.slug);
  return module ? { props: { module, flashcards: getFlashcardLessonSummary(module.id) } } : { notFound: true };
}

export default function LearningCoursePage({ module, flashcards }) {
  return <LearningCourse module={module} flashcards={flashcards} />;
}
