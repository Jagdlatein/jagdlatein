import { LearningDiagram } from "./LearningMedia";
import SoilWaterCapacity from "./SoilWaterCapacity";

export default function LessonDiagram({ diagram }) {
  if (diagram?.type === "soil-water-capacity") return <SoilWaterCapacity title={diagram.title} />;
  return diagram ? <LearningDiagram media={{ icon: "book", diagram }} lessonSpecific /> : null;
}
