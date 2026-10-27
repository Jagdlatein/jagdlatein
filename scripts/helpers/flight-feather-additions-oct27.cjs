// Exact editorial appendix projection for historical fixtures. Every unrelated
// field, object and array order remains part of the original full-object check.
const courseId = 'wissen-ausbau-federaufbau-funktion-2026';
const lessonIds = ['schwingen', 'steuerfedern'];
const questionIds = ['schwingen-ansatz', 'schwingen-flugrollen', 'steuerfedern-ort-funktion'];
const sourceURLs = [
  'https://www.fws.gov/lab/featheratlas/glossary.html',
  'https://www.sciencelearn.org.nz/resources/308-feathers-and-flight',
];
function isFlightFeatherEvidence(item) {
  return item.moduleId === courseId && lessonIds.includes(item.lessonId);
}
function stripFlightFeatherAddition(module) {
  if (module.id !== courseId) return module;
  return { ...module,
    lessons: module.lessons.filter(item => !lessonIds.includes(item.id)),
    questions: module.questions.filter(item => !questionIds.some(id => item.id === id || item.id === `${courseId}-${id}`)),
    sources: module.sources.filter(item => !sourceURLs.includes(item.url)),
  };
}
function stripFlightFeatherDataset(dataset) {
  return { ...dataset, modules: dataset.modules.map(stripFlightFeatherAddition),
    evidence: dataset.evidence.filter(item => !isFlightFeatherEvidence(item)) };
}
function isFlightFeatherCard(card) {
  return card.moduleId === courseId && questionIds.some(id => card.id === `flash-${courseId}-${id}`);
}
function flightFeatherBaselineFixture(overrides = {}) {
  const key = '../data/learning-expansion-wildlife-dogs-2026-10-16.json';
  const dataset = Object.hasOwn(overrides, key) ? overrides[key]
    : require('../../data/learning-expansion-wildlife-dogs-2026-10-16.json');
  return { ...overrides, [key]: stripFlightFeatherDataset(dataset) };
}
module.exports = { courseId, lessonIds, questionIds, sourceURLs,
  stripFlightFeatherAddition, stripFlightFeatherDataset,
  isFlightFeatherCard, isFlightFeatherEvidence, flightFeatherBaselineFixture };
