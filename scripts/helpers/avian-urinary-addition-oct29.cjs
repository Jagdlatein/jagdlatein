// Remove only this named anatomical appendix from historical snapshots.
const courseId = 'wissen-ausbau-biologie-vogelkoerper-2026';
const lessonId = 'harnwege';
const questionIds = ['harnwege-verlauf', 'harnwege-kloake'];
const sourceURLs = [
  'https://www.poultryhub.org/anatomy-and-physiology/body-systems/excretory-system',
  'https://uwm.edu/safety-assurances/programs/research-compliance/animal-care-program/training-education/training-manual/birds/',
  'https://poultry.extension.org/articles/poultry-anatomy/avian-digestive-system/',
  'https://www.atlashistovet.uff.br/IngSist.Urinario.Aves.htm',
];
function stripAvianUrinaryAddition(module) {
  if (module?.id !== courseId) return module;
  return { ...module,
    lessons: module.lessons.filter(lesson => lesson.id !== lessonId),
    questions: module.questions.filter(question => !questionIds.some(id => question.id === id || question.id === `${courseId}-${id}`)),
    sources: module.sources.filter(source => !sourceURLs.includes(source.url)),
  };
}
function isAvianUrinaryEvidence(record) {
  return record.moduleId === courseId && record.lessonId === lessonId;
}
function stripAvianUrinaryDataset(dataset) {
  return { ...dataset, modules: dataset.modules.map(stripAvianUrinaryAddition),
    evidence: dataset.evidence.filter(record => !isAvianUrinaryEvidence(record)) };
}
function isAvianUrinaryCard(card) {
  return card.moduleId === courseId && questionIds.some(id => card.id === `flash-${courseId}-${id}`);
}
function avianUrinaryBaselineFixture(overrides = {}) {
  const key = '../data/learning-expansion-biology-2026-10-16.json';
  const dataset = Object.hasOwn(overrides, key) ? overrides[key]
    : require('../../data/learning-expansion-biology-2026-10-16.json');
  return { ...overrides, [key]: stripAvianUrinaryDataset(dataset) };
}
module.exports = { courseId, lessonId, questionIds, sourceURLs, stripAvianUrinaryAddition,
  isAvianUrinaryEvidence, stripAvianUrinaryDataset, isAvianUrinaryCard, avianUrinaryBaselineFixture };
