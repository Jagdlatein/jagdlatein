import { LearningDiagram } from "./LearningMedia";
import SoilWaterCapacity from "./SoilWaterCapacity";
import CompassLearning from "./CompassLearning";

export default function LessonDiagram({ diagram }) {
  if (diagram?.type === "soil-water-capacity") return <SoilWaterCapacity title={diagram.title} />;
  if (diagram?.type === "compass-learning") return <CompassLearning title={diagram.title} />;
  return diagram ? <LearningDiagram media={{ icon: "book", diagram }} lessonSpecific /> : null;
}
