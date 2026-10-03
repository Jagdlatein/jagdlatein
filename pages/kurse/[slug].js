import LearningCourse from "../../components/LearningCourse";
import { getLearningModule, learningModules } from "../../lib/learning-curriculum";

export function getStaticPaths() {
  return { paths: learningModules.map(module => ({ params: { slug: module.id } })), fallback: false };
}

export function getStaticProps({ params }) {
  const module = getLearningModule(params.slug);
  return module ? { props: { module } } : { notFound: true };
}

export default function LearningCoursePage({ module }) {
  return <LearningCourse module={module} />;
}
