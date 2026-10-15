import ResearchForPractice from "../../components/ResearchForPractice";
import { getPracticeResearchData } from "../../lib/practice-research-server";

export function getStaticProps() {
  return { props: getPracticeResearchData() };
}

export default ResearchForPractice;
