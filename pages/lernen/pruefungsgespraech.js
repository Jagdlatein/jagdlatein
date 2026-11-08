import OralExamTrainer from "../../components/OralExamTrainer";
import { getOralExamLessonLinks } from "../../lib/oral-exam-lesson-links-server";
export default OralExamTrainer;

export function getStaticProps() { return { props: { lessonLinks: getOralExamLessonLinks() } }; }
