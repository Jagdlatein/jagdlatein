import LearningOverview from "../../components/LearningOverview";
import { learningCategoryDetails } from "../../lib/learning-categories";
import { getLearningOverviewData } from "../../lib/learning-overview-server";

export function getStaticPaths() {
  return { paths: learningCategoryDetails.map(category => ({ params: { category: category.slug } })), fallback: false };
}

export function getStaticProps({ params }) {
  const data = getLearningOverviewData(params.category);
  return data ? { props: { data } } : { notFound: true };
}

export default function LearningCategoryPage({ data }) {
  return <LearningOverview key={data.categoryInfo.slug} data={data} />;
}
