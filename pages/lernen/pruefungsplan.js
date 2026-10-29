import ExamStudyPlan from "../../components/ExamStudyPlan";
import { getExamStudyPlanData } from "../../lib/exam-study-plan-server";

export default ExamStudyPlan;
export function getStaticProps() {
  return { props: { data: getExamStudyPlanData() } };
}
