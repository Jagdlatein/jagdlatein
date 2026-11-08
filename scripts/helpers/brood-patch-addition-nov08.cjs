// Historical fixtures remove only this exact, independently tested appendix.
const assert = require('node:assert/strict');
const courseId = 'wissen-ausbau-biologie-fortpflanzung-2026';
const lessonId = 'brutfleck', questionId = 'brutfleck-waermeweg';
const sourceURLs = [
  'https://www.bto.org/learn/about-birds/behaviour/incubation',
  'https://web.stanford.edu/group/stanfordbirds/text/essays/Brood_Patches.html',
  'https://academy.allaboutbirds.org/bird-academys-a-to-z-glossary-of-bird-terms/',
];
function stripBroodPatchAddition(module) {
  if (module?.id !== courseId || !module.lessons.some(item => item.id === lessonId)) return module;
  assert.equal(module.lessons.filter(item => item.id === lessonId).length, 1);
  assert.equal(module.lessons.at(-1).id, lessonId);
  const sources = module.sources.filter(item => sourceURLs.includes(item.url));
  assert.deepEqual(sources.map(item => item.url), sourceURLs);
  assert.ok(sources.every(item => item.checkedOn === '2026-11-08' && JSON.stringify(item.lessonIds) === JSON.stringify([lessonId])));
  const questions = module.questions.filter(item => item.lessonId === lessonId);
  assert.equal(questions.length, 1);
  assert.ok([questionId, `${courseId}-${questionId}`].includes(questions[0].id));
  return { ...module, sources: module.sources.filter(item => !sourceURLs.includes(item.url)),
    lessons: module.lessons.filter(item => item.id !== lessonId),
    questions: module.questions.filter(item => item.lessonId !== lessonId) };
}
function stripBroodPatchDataset(dataset) {
  return { ...dataset, modules: dataset.modules.map(stripBroodPatchAddition),
    evidence: dataset.evidence.filter(item => !(item.moduleId === courseId && item.lessonId === lessonId)) };
}
function broodPatchBaselineFixture(overrides = {}) {
  const key = '../data/learning-expansion-biology-2026-10-16.json';
  const dataset = Object.hasOwn(overrides, key) ? overrides[key] : require('../../data/learning-expansion-biology-2026-10-16.json');
  return { ...overrides, [key]: stripBroodPatchDataset(dataset) };
}
module.exports = { courseId, lessonId, questionId, sourceURLs, stripBroodPatchAddition, stripBroodPatchDataset, broodPatchBaselineFixture };
