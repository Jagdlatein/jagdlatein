import LearningVideoLibrary from "../../components/LearningVideoLibrary";
import { getLearningVideoLibrary } from "../../lib/learning-video-library";

export function getStaticProps() {
  return { props: { videos: getLearningVideoLibrary() } };
}

export default LearningVideoLibrary;
