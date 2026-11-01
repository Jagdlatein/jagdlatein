// Only the exact ceca appendix is isolated for the earlier urinary snapshot.
// Its positive complete-content tests remain in test-avian-ceca-lesson.cjs.
const courseId = 'wissen-ausbau-biologie-verdauungsvergleich-2026';
const lessonId = 'vogelblinddaerme', questionId = 'vogelblinddaerme-funktion';
const sourceURLs = ['https://poultry.extension.org/articles/poultry-anatomy/avian-digestive-system/', 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0213503'];
function stripAvianCecaAddition(module) {
  if (module?.id !== courseId) return module;
  return { ...module,
    lessons: module.lessons.filter(lesson => lesson.id !== lessonId),
    questions: module.questions.filter(question => question.id !== questionId && question.id !== `${courseId}-${questionId}`),
    sources: module.sources.filter(source => !(sourceURLs.includes(source.url)
      && source.lessonIds?.length === 1 && source.lessonIds[0] === lessonId)),
  };
}
function stripAvianCecaDataset(dataset) {
  return { ...dataset, modules: dataset.modules.map(stripAvianCecaAddition),
    evidence: dataset.evidence.filter(record => !(record.moduleId === courseId && record.lessonId === lessonId)) };
}
function avianCecaBaselineFixture(overrides = {}) {
  const key = '../data/learning-expansion-biology-2026-10-16.json';
  const dataset = Object.hasOwn(overrides, key) ? overrides[key] : require('../../data/learning-expansion-biology-2026-10-16.json');
  return { ...overrides, [key]: stripAvianCecaDataset(dataset) };
}
module.exports = { courseId, lessonId, questionId, sourceURLs, stripAvianCecaAddition, stripAvianCecaDataset, avianCecaBaselineFixture };
