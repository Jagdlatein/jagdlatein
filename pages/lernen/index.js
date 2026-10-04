import LearningOverview from "../../components/LearningOverview";
import { getLearningOverviewData } from "../../lib/learning-overview-server";

export function getStaticProps() {
  return { props: { data: getLearningOverviewData() } };
}

export default function LearningOverviewPage({ data }) {
  return <LearningOverview data={data} />;
}
