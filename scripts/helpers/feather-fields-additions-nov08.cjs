// Historical comparisons isolate only these two precisely named appendices.
const assert = require('node:assert/strict');
const courseId = 'wissen-ausbau-federaufbau-funktion-2026';
const lessonIds = ['federfluren', 'fadenfedern'];
const questionIds = ['federfluren-ueberdeckung', 'fadenfedern-form', 'fadenfedern-rezeptorort'];
const sourceURLs = [
  'https://www.poultryhub.org/anatomy-and-physiology/body-systems/integumentary-surface-of-the-bird',
  'https://academy.allaboutbirds.org/bird-academys-a-to-z-glossary-of-bird-terms/',
  'https://rubegalab.uconn.edu/lecture-notes-feathers/',
  'https://link.springer.com/article/10.1007/BF00610731',
];
function stripFeatherFieldsAddition(module) {
  if (module?.id !== courseId || !module.lessons.some(item => lessonIds.includes(item.id))) return module;
  assert.deepEqual(module.lessons.slice(-2).map(item => item.id), lessonIds);
  assert.ok(module.lessons.slice(-2).every(item => item.reviewedOn === '2026-11-08'));
  const questions = module.questions.filter(item => lessonIds.includes(item.lessonId));
  assert.equal(questions.length, 3);
  assert.deepEqual(questions.map(item => item.id.replace(`${courseId}-`, '')), questionIds);
  const sources = module.sources.filter(item => sourceURLs.includes(item.url));
  assert.deepEqual(sources.map(item => item.url), sourceURLs);
  assert.ok(sources.every((item, index) => item.checkedOn === '2026-11-08' && JSON.stringify(item.lessonIds) === JSON.stringify(index === 3 ? ['fadenfedern'] : lessonIds)));
  return { ...module, sources: module.sources.filter(item => !sourceURLs.includes(item.url)),
    lessons: module.lessons.filter(item => !lessonIds.includes(item.id)),
    questions: module.questions.filter(item => !lessonIds.includes(item.lessonId)) };
}
function stripFeatherFieldsDataset(dataset) {
  return { ...dataset, modules: dataset.modules.map(stripFeatherFieldsAddition),
    evidence: dataset.evidence.filter(item => !(item.moduleId === courseId && lessonIds.includes(item.lessonId))) };
}
function featherFieldsBaselineFixture(overrides = {}) {
  const key = '../data/learning-expansion-wildlife-dogs-2026-10-16.json';
  const dataset = Object.hasOwn(overrides, key) ? overrides[key] : require('../../data/learning-expansion-wildlife-dogs-2026-10-16.json');
  return { ...overrides, [key]: stripFeatherFieldsDataset(dataset) };
}
module.exports = { courseId, lessonIds, questionIds, sourceURLs, stripFeatherFieldsAddition, stripFeatherFieldsDataset, featherFieldsBaselineFixture };
