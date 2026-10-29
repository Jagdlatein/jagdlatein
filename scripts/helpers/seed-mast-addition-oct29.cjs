// Remove only the exact named seed-mast appendix for historical comparisons.
const courseId = 'wissen-ausbau-waldverjuengung-verbiss';
const lessonId = 'samenmast';
const questionIds = ['samenmast-zeitmuster', 'samenmast-synchronitaet'];
const sourceURLs = [
  'https://www.wsl.ch/en/news/wie-die-samenmast-in-europa-synchronisiert-wird/',
  'https://www.lwf.bayern.de/031',
];
function stripSeedMastAddition(module) {
  if (module?.id !== courseId) return module;
  return { ...module,
    lessons: module.lessons.filter(lesson => lesson.id !== lessonId),
    questions: module.questions.filter(question => !questionIds.some(id => question.id === id || question.id === `${courseId}-${id}`)),
    sources: module.sources.filter(source => !sourceURLs.includes(source.url)),
  };
}
function isSeedMastCard(card) {
  return card.moduleId === courseId && questionIds.some(id => card.id === `flash-${courseId}-${id}`);
}
function seedMastBaselineFixture(overrides = {}) {
  const key = './learning-expansion-nature';
  const exports = Object.hasOwn(overrides, key) ? overrides[key]
    : require('./project-module.cjs').createLoader(overrides)('lib/learning-expansion-nature.js');
  return { ...overrides, [key]: { ...exports, natureExpansionModules: exports.natureExpansionModules.map(stripSeedMastAddition) } };
}
module.exports = { courseId, lessonId, questionIds, sourceURLs,
  stripSeedMastAddition, isSeedMastCard, seedMastBaselineFixture };
