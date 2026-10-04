import { gameMeatCases } from "./game-meat-cases";
import { dogTrainingExercises } from "./dog-training-journal";
import { oralExamQuestions } from "./oral-exam-trainer";

export const practiceSearchEntries = [
  ...gameMeatCases.map(item => ({ id: `wildbret-${item.id}`, title: item.title, description: item.situation, href: `/lernen/wildbret-fallwerkstatt?eintrag=${item.id}`, categories: ["wildbret-gesundheit"], text: `${item.topic} ${item.question} ${item.takeaway} ${item.checklist.join(" ")}` })),
  ...dogTrainingExercises.map(item => ({ id: `training-${item.id}`, title: item.title, description: item.goal, href: `/lernen/hundetraining-tagebuch?eintrag=${item.id}`, categories: ["hundewesen"], text: `${item.preparation} ${item.steps.join(" ")} ${item.easier} ${item.observe}` })),
  ...oralExamQuestions.map(item => ({ id: `gespraech-${item.id}`, title: item.title, description: item.prompt, href: `/lernen/pruefungsgespraech?eintrag=${item.id}`, categories: [item.categorySlug], text: `${item.model} ${item.criteria.join(" ")} ${item.followUp}` })),
];
