import OfflineLearning from "../../components/OfflineLearning";
import { getLearningOverviewData } from "../../lib/learning-overview-server";
export async function getStaticProps() {
  const data = getLearningOverviewData();
  return { props: { courses: data.modules.map(({ id, title, category, lessonCount, questionCount }) => ({ id, title, category, lessonCount, questionCount })) } };
}
export default OfflineLearning;
