// Only the two explicitly reviewed additions are removed for earlier snapshot
// tests. Every historical field, question, source object and order stays tested.
const additions = new Map([
  ['wissen-ausbau-federaufbau-funktion-2026', { lessonId: 'wasserschutz', sources: 5 }],
  ['wissen-ausbau-revierpraxis-beschuss-kennzeichnung-2026', { lessonId: 'patrone-geschoss-bauteile', sources: 9 }],
]);

function stripOctober26Additions(course) {
  const addition = additions.get(course.id);
  if (!addition) return course;
  return {
    ...course,
    sources: course.sources.slice(0, addition.sources),
    lessons: course.lessons.filter(lesson => lesson.id !== addition.lessonId),
    questions: course.questions.filter(question => question.lessonId !== addition.lessonId),
  };
}

function isOctober26Card(card) {
  return additions.get(card.moduleId)?.lessonId === card.lessonId;
}

module.exports = { stripOctober26Additions, isOctober26Card };
