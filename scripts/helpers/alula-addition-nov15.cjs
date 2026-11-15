// Historical fixtures isolate only this explicitly reviewed lesson appendix.
// Future/unrelated objects remain visible in every positive baseline check.
const courseId = 'wissen-ausbau-federaufbau-funktion-2026';
const lessonId = 'alula';
const questionIds = ['alula-lage', 'alula-funktion'];
const sourceURLs = [
  'https://www.bto.org/sites/default/files/moult-in-birds-web.pdf#page=14',
  'https://pubmed.ncbi.nlm.nih.gov/25951056/',
  'https://www.nature.com/articles/s41598-020-63181-7',
];
const newSource = source => sourceURLs.includes(source.url) && source.checkedOn === '2026-11-15' && JSON.stringify(source.lessonIds) === '["alula"]';
function stripAlulaAddition(module) {
  if (module?.id !== courseId) return module;
  return { ...module,
    lessons: module.lessons.filter(item => item.id !== lessonId),
    questions: module.questions.filter(item => !questionIds.some(id => item.id === id || item.id === `${courseId}-${id}`)),
    sources: module.sources.filter(source => !newSource(source)),
  };
}
function stripAlulaDataset(dataset) {
  return { ...dataset, modules: dataset.modules.map(stripAlulaAddition),
    evidence: dataset.evidence.filter(item => !(item.moduleId === courseId && item.lessonId === lessonId)),
  };
}
function alulaBaselineFixture(overrides = {}) {
  const key = '../data/learning-expansion-wildlife-dogs-2026-10-16.json';
  const dataset = Object.hasOwn(overrides, key) ? overrides[key] : require('../../data/learning-expansion-wildlife-dogs-2026-10-16.json');
  return { ...overrides, [key]: stripAlulaDataset(dataset) };
}
module.exports = { courseId, lessonId, questionIds, sourceURLs, stripAlulaAddition, stripAlulaDataset, alulaBaselineFixture };
