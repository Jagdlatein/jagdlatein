// Only the named roe-deer casting appendix, never a blanket date filter.
const courseId = 'wissen-rehwild-jahreslauf';
const lessonId = 'reh-geweihabwurf';
const questionIds = ['reh-abwurf-knochenzone', 'reh-abwurf-bastvergleich'];
const sourceURLs = [
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC10557394/',
  'https://pubmed.ncbi.nlm.nih.gov/1460440/',
];
function stripRoeAntlerCastingAddition(module) {
  if (module?.id !== courseId) return module;
  return { ...module,
    lessons: module.lessons.filter(lesson => lesson.id !== lessonId),
    questions: module.questions.filter(question => !questionIds.some(id => question.id === id || question.id === `${courseId}-${id}`)),
    sources: module.sources.filter(source => !sourceURLs.includes(source.url)),
  };
}
function isRoeAntlerCastingCard(card) {
  return card.moduleId === courseId && questionIds.some(id => card.id === `flash-${courseId}-${id}`);
}
function roeAntlerCastingBaselineFixture(overrides = {}) {
  const key = './learning-wildlife';
  const exports = Object.hasOwn(overrides, key) ? overrides[key]
    : require('./project-module.cjs').createLoader(overrides)('lib/learning-wildlife.js');
  return { ...overrides, [key]: { ...exports, wildlifeModules: exports.wildlifeModules.map(stripRoeAntlerCastingAddition) } };
}
module.exports = { courseId, lessonId, questionIds, sourceURLs,
  stripRoeAntlerCastingAddition, isRoeAntlerCastingCard, roeAntlerCastingBaselineFixture };
