// Historical fixtures remove only the two separately reviewed root appendices.
const assert = require('node:assert/strict');
const courseId = 'wissen-pruefung-bodenwasser-wurzelraum-2026';
const lessonIds = ['wurzelhaare', 'endodermis'];
const questionIds = ['wurzelhaare-einzelzelle', 'endodermis-zellwandweg'];
const sourceURLs = [
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC4075452/',
  'https://openstax.org/books/biology-2e/pages/30-3-roots',
  'https://mmegias.webs2.uvigo.es/02-english/2-organos-v/guiada_o_v_rprimario.php?tema=1',
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC3382560/',
];
const sourceScopes = [[lessonIds[0]], lessonIds, lessonIds, [lessonIds[1]]];
function stripRootAbsorptionAddition(module) {
  if (module?.id !== courseId || !module.lessons.some(item => lessonIds.includes(item.id))) return module;
  assert.deepEqual(module.lessons.slice(-2).map(item => item.id), lessonIds);
  assert.ok(module.lessons.slice(-2).every(item => item.reviewedOn === '2026-11-08'));
  const questions = module.questions.filter(item => lessonIds.includes(item.lessonId));
  assert.equal(questions.length, 2);
  assert.deepEqual(questions.map(item => item.id.replace(`${courseId}-`, '')), questionIds);
  const sources = module.sources.filter(item => sourceURLs.includes(item.url));
  assert.deepEqual(sources.map(item => item.url), sourceURLs);
  assert.ok(sources.every((item, index) => item.checkedOn === '2026-11-08' && JSON.stringify(item.lessonIds) === JSON.stringify(sourceScopes[index])));
  let sourceReview = module.sourceReview;
  if (sourceReview?.lessons) {
    const added = module.lessons.slice(-2);
    assert.deepEqual(sourceReview.lessons.slice(-2).map(item => item.lesson), added.map(item => item.title));
    assert.deepEqual(sourceReview.lessons.slice(-2).map(item => item.confirmedClaims), added.map(item => item.evidence.map(record => record.claim)));
    sourceReview = { ...sourceReview, lessons: sourceReview.lessons.slice(0, -2) };
  }
  return { ...module, sources: module.sources.filter(item => !sourceURLs.includes(item.url)),
    lessons: module.lessons.filter(item => !lessonIds.includes(item.id)),
    questions: module.questions.filter(item => !lessonIds.includes(item.lessonId)),
    ...(sourceReview ? { sourceReview } : {}) };
}
function stripRootAbsorptionDataset(dataset) {
  return { ...dataset, modules: dataset.modules.map(stripRootAbsorptionAddition),
    evidence: dataset.evidence.filter(item => !(item.moduleId === courseId && lessonIds.includes(item.lessonId))) };
}
function rootAbsorptionBaselineFixture(overrides = {}) {
  const key = '../data/learning-exam-habitat-2026-10-18.json';
  const dataset = Object.hasOwn(overrides, key) ? overrides[key] : require('../../data/learning-exam-habitat-2026-10-18.json');
  return { ...overrides, [key]: stripRootAbsorptionDataset(dataset) };
}
module.exports = { courseId, lessonIds, questionIds, sourceURLs, sourceScopes, stripRootAbsorptionAddition, stripRootAbsorptionDataset, rootAbsorptionBaselineFixture };
