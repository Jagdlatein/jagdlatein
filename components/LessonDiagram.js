import { LearningDiagram } from "./LearningMedia";
import SoilWaterCapacity from "./SoilWaterCapacity";
import CompassLearning from "./CompassLearning";
import WoodpeckerFootDiagram from "./WoodpeckerFootDiagram";

export default function LessonDiagram({ diagram }) {
  if (diagram?.type === "soil-water-capacity") return <SoilWaterCapacity title={diagram.title} />;
  if (diagram?.type === "compass-learning") return <CompassLearning title={diagram.title} />;
  if (diagram?.type === "woodpecker-foot") return <WoodpeckerFootDiagram diagram={diagram} />;
  return diagram ? <LearningDiagram media={{ icon: "book", diagram }} lessonSpecific /> : null;
}
