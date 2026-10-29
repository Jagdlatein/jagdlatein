import { oralExamQuestions } from "./oral-exam-trainer";

// Reverse only the existing authored whole-course recommendations. This is a
// topic connection, not a claim that each lesson is covered by the question.
export function getCourseOralExamLinks(module) {
  if (!module || typeof module.id !== "string" || !Array.isArray(module.lessons) || !module.lessons.length) return [];
  return oralExamQuestions.filter(question => question.course === module.id).map(question => ({
    id: question.id,
    title: question.title,
    href: `/lernen/pruefungsgespraech?eintrag=${encodeURIComponent(question.id)}`,
  }));
}
