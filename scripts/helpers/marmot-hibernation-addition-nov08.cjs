// Historical fixtures isolate only these two source-reviewed tail lessons.
const assert = require('node:assert/strict');
const courseId = 'wissen-vertiefung-wild-alpine-winterstrategien';
const lessonIds = ['winterschlaf-regulation', 'aufwaermphasen'];
const questionIds = ['winterschlaf-regelung', 'winterschlaf-unterbrechung'];
const sourceURLs = [
  'https://pubmed.ncbi.nlm.nih.gov/10712291/',
  'https://pubmed.ncbi.nlm.nih.gov/3170823/',
  'https://www.vetmeduni.ac.at/fileadmin/v/fiwi/Publikationen/Populaerwissenschaftliche/Arnold_2015_Murmeltiere_Weidwerk.pdf',
  'https://nationalpark.ch/flora-und-fauna/murmeltier/',
];
const sourceScopes = [[lessonIds[0]], [lessonIds[1]], lessonIds];
function stripMarmotHibernationAddition(module) {
  if (module?.id !== courseId || !module.lessons.some(item => lessonIds.includes(item.id))) return module;
  assert.deepEqual(module.lessons.slice(-2).map(item => item.id), lessonIds);
  assert.ok(module.lessons.slice(-2).every(item => item.reviewedOn === '2026-11-08'));
  assert.deepEqual(module.questions.filter(item => lessonIds.includes(item.lessonId)).map(item => item.id.replace(`${courseId}-`, '')), questionIds);
  assert.deepEqual(module.sources.slice(-3).map(item => item.url), sourceURLs.slice(0, 3));
  assert.ok(module.sources.slice(-3).every((item, index) => item.checkedOn === '2026-11-08' && JSON.stringify(item.lessonIds) === JSON.stringify(sourceScopes[index])));
  return { ...module, lessons: module.lessons.slice(0, -2), questions: module.questions.filter(item => !lessonIds.includes(item.lessonId)), sources: module.sources.slice(0, -3) };
}
function marmotHibernationBaselineFixture(overrides = {}) {
  const key = './learning-wildlife-depth';
  const module = Object.hasOwn(overrides, key) ? overrides[key] : require('./project-module.cjs').createLoader()('lib/learning-wildlife-depth.js');
  return { ...overrides, [key]: { ...module, wildlifeDepthModules: module.wildlifeDepthModules.map(stripMarmotHibernationAddition) } };
}
module.exports = { courseId, lessonIds, questionIds, sourceURLs, sourceScopes, stripMarmotHibernationAddition, marmotHibernationBaselineFixture };
