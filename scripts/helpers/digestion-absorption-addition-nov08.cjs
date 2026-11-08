// Historical fixtures isolate exactly this two-lesson, four-source appendix.
const assert = require('node:assert/strict');
const courseId = 'wissen-ausbau-biologie-verdauungsvergleich-2026';
const lessonIds = ['resorption', 'zotten-mikrovilli'];
const questionIds = ['resorption-unterschied', 'zotten-mikrovilli-ebenen'];
const sourceURLs = [
  'https://vivo.colostate.edu/hbooks/pathphys/digestion/smallgut/index.html',
  'https://www.merckvetmanual.com/digestive-system/diseases-of-the-small-intestine-in-small-animals/malabsorption-syndromes-in-small-animals',
  'https://vivo.colostate.edu/hbooks/pathphys/digestion/smallgut/anatomy.html',
  'https://histology.leeds.ac.uk/home/digestive/small_intestine/',
  'https://e-learn.anatomy.uzh.ch/anatomie/Histologie/histo_HTML/histo_A_Epithel/epithel_07.html',
];
const addedSourceURLs = [sourceURLs[0], ...sourceURLs.slice(2)];
function stripDigestionAbsorptionAddition(module) {
  if (module?.id !== courseId || !module.lessons.some(item => lessonIds.includes(item.id))) return module;
  assert.deepEqual(module.lessons.slice(-2).map(item => item.id), lessonIds);
  assert.ok(module.lessons.slice(-2).every(item => item.reviewedOn === '2026-11-08'));
  assert.deepEqual(module.questions.filter(item => lessonIds.includes(item.lessonId)).map(item => item.id.replace(`${courseId}-`, '')), questionIds);
  assert.deepEqual(module.sources.slice(-4).map(item => item.url), addedSourceURLs);
  assert.ok(module.sources.slice(-4).every((item, index) => item.checkedOn === '2026-11-08' && JSON.stringify(item.lessonIds) === JSON.stringify([lessonIds[index === 0 ? 0 : 1]])));
  return { ...module, lessons: module.lessons.slice(0, -2), questions: module.questions.filter(item => !lessonIds.includes(item.lessonId)), sources: module.sources.slice(0, -4) };
}
function stripDigestionAbsorptionDataset(dataset) {
  return { ...dataset, modules: dataset.modules.map(stripDigestionAbsorptionAddition), evidence: dataset.evidence.filter(item => !(item.moduleId === courseId && lessonIds.includes(item.lessonId))) };
}
function digestionAbsorptionBaselineFixture(overrides = {}) {
  const key = '../data/learning-expansion-biology-2026-10-16.json';
  const dataset = Object.hasOwn(overrides, key) ? overrides[key] : require('../../data/learning-expansion-biology-2026-10-16.json');
  return { ...overrides, [key]: stripDigestionAbsorptionDataset(dataset) };
}
module.exports = { courseId, lessonIds, questionIds, sourceURLs, addedSourceURLs, stripDigestionAbsorptionAddition, stripDigestionAbsorptionDataset, digestionAbsorptionBaselineFixture };
