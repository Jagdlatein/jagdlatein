// Historical snapshots isolate only this exact named one-question appendix.
// Positive current-content comparisons live in test-avian-nictitating-lesson.
const courseId = 'wissen-ausbau-biologie-vogelkoerper-2026';
const lessonId = 'nickhaut', questionId = 'nickhaut-oberflaechenfunktion';
const sourceURLs = ['https://www.mdpi.com/2076-2615/13/23/3656', 'https://bmcvetres.biomedcentral.com/articles/10.1186/s12917-025-04677-0'];
function stripAvianNictitatingAddition(module) {
  if (module?.id !== courseId) return module;
  return { ...module,
    lessons: module.lessons.filter(lesson => lesson.id !== lessonId),
    questions: module.questions.filter(question => question.id !== questionId && question.id !== `${courseId}-${questionId}`),
    sources: module.sources.filter(source => !(sourceURLs.includes(source.url)
      && source.lessonIds?.length === 1 && source.lessonIds[0] === lessonId)),
  };
}
function stripAvianNictitatingDataset(dataset) {
  return { ...dataset, modules: dataset.modules.map(stripAvianNictitatingAddition),
    evidence: dataset.evidence.filter(record => !(record.moduleId === courseId && record.lessonId === lessonId)) };
}
function avianNictitatingBaselineFixture(overrides = {}) {
  const key = '../data/learning-expansion-biology-2026-10-16.json';
  const dataset = Object.hasOwn(overrides, key) ? overrides[key] : require('../../data/learning-expansion-biology-2026-10-16.json');
  return { ...overrides, [key]: stripAvianNictitatingDataset(dataset) };
}
module.exports = { courseId, lessonId, questionId, sourceURLs, stripAvianNictitatingAddition,
  stripAvianNictitatingDataset, avianNictitatingBaselineFixture };
