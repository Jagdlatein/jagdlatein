import ExamStudyPlan from "../../components/ExamStudyPlan";
import { getExamStudyPlanData } from "../../lib/exam-study-plan-server";
import { getPackedDailyReviewCatalog } from "../../lib/daily-review-pool";
import { getExamAlignmentData } from "../../lib/exam-alignment-server";
import { getExamBlueprintData } from "../../lib/exam-blueprint-server";
import { projectExamStudyPlanPageProps } from "../../lib/exam-study-plan-page-props";

export default ExamStudyPlan;
export function getStaticProps() {
  return { props: projectExamStudyPlanPageProps({ data: getExamStudyPlanData(), reviewCatalog: getPackedDailyReviewCatalog(), examAlignment: getExamAlignmentData(), examBlueprint: getExamBlueprintData() }) };
}
