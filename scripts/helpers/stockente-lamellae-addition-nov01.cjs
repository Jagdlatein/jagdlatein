// Historical snapshots remove only this named one-question appendix. Positive
// full-object preservation is checked independently against Git 873c459.
const courseId = 'wissen-federwild-beobachtung', lessonId = 'vogel-lamellen';
const questionId = 'vogel-lamellen-funktion';
const sourceURLs = [
  'https://mcb.berkeley.edu/courses/bio1a/lab/downloads/Bio1AL_Diveristy_Birds.pdf',
  'https://www.wwt.org.uk/uploads/documents/1405931943_diningoutfactsheet.pdf',
  'https://www.ducks.org/conservation/waterfowl-research-science/the-scoop-on-duck-bills',
];
function stripStockenteLamellaeAddition(module) {
  if (module?.id !== courseId) return module;
  return { ...module,
    lessons: module.lessons.filter(lesson => lesson.id !== lessonId),
    questions: module.questions.filter(question => question.id !== questionId && question.id !== `${courseId}-${questionId}`),
    sources: module.sources.filter(source => !(sourceURLs.includes(source.url)
      && source.lessonIds?.length === 1 && source.lessonIds[0] === lessonId)),
  };
}
function stockenteLamellaeBaselineFixture(overrides = {}) {
  const key = './learning-wildlife';
  const current = Object.hasOwn(overrides, key) ? overrides[key]
    : require('./project-module.cjs').createLoader(overrides)('lib/learning-wildlife.js');
  return { ...overrides, [key]: { ...current, wildlifeModules: current.wildlifeModules.map(stripStockenteLamellaeAddition) } };
}
module.exports = { courseId, lessonId, questionId, sourceURLs, stripStockenteLamellaeAddition, stockenteLamellaeBaselineFixture };
