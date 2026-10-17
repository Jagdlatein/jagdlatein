import { LearningDiagram } from "./LearningMedia";

export default function LessonDiagram({ diagram }) {
  return diagram ? <LearningDiagram media={{ icon: "book", diagram }} lessonSpecific /> : null;
}
