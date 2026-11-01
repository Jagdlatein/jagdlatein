import ExamStudyPlan from "../../components/ExamStudyPlan";
import { getExamStudyPlanData } from "../../lib/exam-study-plan-server";
import { getPackedDailyReviewCatalog } from "../../lib/daily-review-pool";

export default ExamStudyPlan;
export function getStaticProps() {
  return { props: { data: getExamStudyPlanData(), reviewCatalog: getPackedDailyReviewCatalog() } };
}
