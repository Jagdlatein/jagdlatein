// Historical fixtures isolate only these two explicitly validated appendices.
const assert = require('node:assert/strict');
const courseId = 'wissen-ausbau-revierpraxis-lebensmittelbakterien-2026';
const lessonIds = ['bakteriensporen', 'vorgebildete-toxine'];
const questionIds = ['bakteriensporen-ueberdauern', 'vorgebildete-toxine-hitze'];
const sourceURLs = [
  'https://www.bfr.bund.de/lebensmittel-und-futtermittelsicherheit/bewertung-mikrobieller-risiken-von-lebensmitteln/gesundheitliche-bewertung-von-bakterien/bacillus-cereus/',
  'https://openstax.org/books/microbiology/pages/3-3-unique-characteristics-of-prokaryotic-cells',
  'https://www.bfr.bund.de/cm/350/verbrauchertipps-schutz-vor-lebensmittelbedingten-erkrankungen-durch-bakterielle-toxine.pdf',
  'https://www.cdc.gov/staph-food-poisoning/about/index.html',
];
function stripFoodSporesToxinsAddition(module) {
  if (module?.id !== courseId || !module.lessons.some(item => lessonIds.includes(item.id))) return module;
  assert.deepEqual(module.lessons.slice(-2).map(item => item.id), lessonIds);
  assert.ok(module.lessons.slice(-2).every(item => item.reviewedOn === '2026-11-08'));
  const questions = module.questions.filter(item => lessonIds.includes(item.lessonId));
  assert.equal(questions.length, 2);
  assert.deepEqual(questions.map(item => item.id.replace(`${courseId}-`, '')), questionIds);
  const sources = module.sources.filter(item => sourceURLs.includes(item.url));
  assert.deepEqual(sources.map(item => item.url), sourceURLs);
  assert.ok(sources.every((item, index) => item.checkedOn === '2026-11-08' && JSON.stringify(item.lessonIds) === JSON.stringify([lessonIds[index < 2 ? 0 : 1]])));
  return { ...module, sources: module.sources.filter(item => !sourceURLs.includes(item.url)),
    lessons: module.lessons.filter(item => !lessonIds.includes(item.id)),
    questions: module.questions.filter(item => !lessonIds.includes(item.lessonId)) };
}
function stripFoodSporesToxinsDataset(dataset) {
  return { ...dataset, modules: dataset.modules.map(stripFoodSporesToxinsAddition),
    evidence: dataset.evidence.filter(item => !(item.moduleId === courseId && lessonIds.includes(item.lessonId))) };
}
function foodSporesToxinsBaselineFixture(overrides = {}) {
  const key = '../data/learning-expansion-field-science-2026-10-17.json';
  const dataset = Object.hasOwn(overrides, key) ? overrides[key] : require('../../data/learning-expansion-field-science-2026-10-17.json');
  return { ...overrides, [key]: stripFoodSporesToxinsDataset(dataset) };
}
module.exports = { courseId, lessonIds, questionIds, sourceURLs, stripFoodSporesToxinsAddition, stripFoodSporesToxinsDataset, foodSporesToxinsBaselineFixture };
