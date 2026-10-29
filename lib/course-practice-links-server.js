import { gameMeatCases } from "./game-meat-cases";
import { dogTrainingExercises } from "./dog-training-journal";

// Reverse only existing authored course recommendations. These are whole-course
// topic links; reading a journal exercise never prepares or saves an entry.
export function getCoursePracticeLinks(module) {
  if (!module || typeof module.id !== "string" || !Array.isArray(module.lessons) || !module.lessons.length) return [];
  return [
    ...gameMeatCases.filter(item => item.course === module.id).map(item => ({
      id: `wildbret-${item.id}`, title: item.title,
      href: `/lernen/wildbret-fallwerkstatt?eintrag=${encodeURIComponent(item.id)}`,
    })),
    ...dogTrainingExercises.filter(item => item.course === module.id).map(item => ({
      id: `training-${item.id}`, title: item.title,
      href: `/lernen/hundetraining-tagebuch?eintrag=${encodeURIComponent(item.id)}`,
    })),
  ];
}
