// Isolate only this exact named appendix in historical full-object checks.
const courseId = 'wissen-vertiefung-populationsoekologie';
const lessonId = 'artenbeziehungen';
const questionIds = ['artenbeziehungen-vergleich', 'artenbeziehungen-parasitismus'];
const sourceURLs = [
  'https://openstax.org/books/biology-2e/pages/45-6-community-ecology',
  'https://serc.carleton.edu/microbelife/topics/marinesymbiosis/index.html',
];
function stripSpeciesRelationsAddition(module) {
  if (module?.id !== courseId) return module;
  return { ...module,
    lessons: module.lessons.filter(lesson => lesson.id !== lessonId),
    questions: module.questions.filter(question => !questionIds.some(id => question.id === id || question.id === `${courseId}-${id}`)),
    sources: module.sources.filter(source => !sourceURLs.includes(source.url)),
  };
}
function isSpeciesRelationsCard(card) {
  return card.moduleId === courseId && questionIds.some(id => card.id === `flash-${courseId}-${id}`);
}
function speciesRelationsBaselineFixture(overrides = {}) {
  const key = './learning-deepening-nature';
  const exports = Object.hasOwn(overrides, key) ? overrides[key]
    : require('./project-module.cjs').createLoader(overrides)('lib/learning-deepening-nature.js');
  return { ...overrides, [key]: { ...exports, natureDeepeningModules: exports.natureDeepeningModules.map(stripSpeciesRelationsAddition) } };
}
module.exports = { courseId, lessonId, questionIds, sourceURLs,
  stripSpeciesRelationsAddition, isSpeciesRelationsCard, speciesRelationsBaselineFixture };
