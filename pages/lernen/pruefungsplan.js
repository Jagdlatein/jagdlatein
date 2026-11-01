import ExamStudyPlan from "../../components/ExamStudyPlan";
import { getExamStudyPlanData } from "../../lib/exam-study-plan-server";
import { getPackedDailyReviewCatalog } from "../../lib/daily-review-pool";
import { getExamAlignmentData } from "../../lib/exam-alignment-server";

export default ExamStudyPlan;
export function getStaticProps() {
  return { props: { data: getExamStudyPlanData(), reviewCatalog: getPackedDailyReviewCatalog(), examAlignment: getExamAlignmentData() } };
}
