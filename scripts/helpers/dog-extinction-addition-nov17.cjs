// Restore only the named November-17 appendix for historical positive checks.
// Validate its exact boundary before removing it; never replace old expectations.
const assert = require('node:assert/strict');
const courseId = 'wissen-vertiefung-hunde-klare-lernsignale';
const shortLessonId = 'extinktion-erholung';
const lessonId = `${courseId}-${shortLessonId}`;
const sourceKeys = ['extinctionBentosela', 'extinctionBouton', 'extinctionMsd'];
const sourceURLs = [
  'https://www.pawsoflife.org/Library/Learning/Bentosela%202008.pdf',
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC8428921/',
  'https://www.merckvetmanual.com/behavior/behavioral-medicine-introduction/treatment-of-behavior-problems-in-animals',
];
const questionIds = [1, 2].map(index => `${lessonId}-frage-${index}`);
const curriculumQuestionIds = questionIds.map(id => `${courseId}-${id}`);
function stripDogExtinctionAddition(module) {
  if (module?.id !== courseId || !module.lessons.some(item => item.id === lessonId)) return module;
  assert.equal(module.lessons.filter(item => item.id === lessonId).length, 1);
  assert.equal(module.lessons.at(-1).id, lessonId);
  assert.equal(module.lessons.at(-1).reviewedOn, '2026-11-17');
  assert.equal(module.lessons.at(-1).sourceReview.checkedOn, '2026-11-17');
  assert.deepEqual(module.lessons.at(-1).sourceReview.sourceIds, sourceKeys);
  const expectedQuestionIds = Array.isArray(module.questions[0]?.answers) ? curriculumQuestionIds : questionIds;
  assert.deepEqual(module.questions.filter(item => item.lessonId === lessonId).map(item => item.id), expectedQuestionIds);
  assert.deepEqual(module.questions.slice(-2).map(item => item.id), expectedQuestionIds);
  assert.deepEqual(module.sources.filter(item => sourceURLs.includes(item.url)).map(item => item.url).sort(), [...sourceURLs].sort());
  assert.ok(module.sources.filter(item => sourceURLs.includes(item.url)).every(item => item.checkedOn === '2026-11-17' && JSON.stringify(item.lessonIds) === JSON.stringify([lessonId])));
  return { ...module, lessons: module.lessons.slice(0, -1), questions: module.questions.slice(0, -2),
    sources: module.sources.filter(item => !sourceURLs.includes(item.url)) };
}
const isDogExtinctionCard = card => card.moduleId === courseId && card.lessonId === lessonId;
function dogExtinctionBaselineFixture(overrides = {}) {
  const key = './learning-dog-depth';
  const original = Object.hasOwn(overrides, key) ? overrides[key]
    : require('./project-module.cjs').createLoader(overrides)('lib/learning-dog-depth.js');
  return { ...overrides, [key]: { ...original, dogDepthModules: original.dogDepthModules.map(stripDogExtinctionAddition) } };
}
module.exports = { courseId, shortLessonId, lessonId, sourceKeys, sourceURLs, questionIds, curriculumQuestionIds,
  stripDogExtinctionAddition, isDogExtinctionCard, dogExtinctionBaselineFixture };
