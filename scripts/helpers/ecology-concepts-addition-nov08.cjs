// Isolates only this explicitly validated appendix in historical fixtures.
const assert = require('node:assert/strict');
const courseId = 'wissen-lebensraeume-biotopverbund';
const lessonIds = ['biotop-biozoenose', 'habitat-nische'];
const questionIds = ['biotop-begriffe', 'nische-voraussetzungen'];
const sourceURLs = [
  'https://bk.naturschutzinformationen.nrw.de/bk/de/glossar/bt',
  'https://www.umweltbundesamt.de/service/glossar/biozoenose',
  'https://www.bpb.de/themen/umwelt/naturschutzpolitik/glossar/511054/oekosystem/',
  'https://openstax.org/books/biology-2e/pages/44-1-the-scope-of-ecology',
  'https://www.osa.uni-freiburg.de/waldwissenschaften/aufgaben/wildtieroekologie-wildtiermanagement/thema2/',
  'https://www.lehrbuch-biologie.springernature.com/glossar/%C3%B6kologische-nische-von-lat-nidus-f%C3%BCr-%E2%80%9Enest%E2%80%9C-engl-ecological-niche',
  'https://openstax.org/books/biology-2e/pages/45-6-community-ecology',
];
function stripEcologyConceptAddition(module) {
  if (module?.id !== courseId || !module.lessons.some(item => lessonIds.includes(item.id))) return module;
  assert.deepEqual(module.lessons.slice(-2).map(item => item.id), lessonIds);
  assert.ok(module.lessons.slice(-2).every(item => item.reviewedOn === '2026-11-08'));
  const questions = module.questions.filter(item => lessonIds.includes(item.lessonId));
  assert.equal(questions.length, 2);
  assert.deepEqual(questions.map(item => item.id.replace(`${courseId}-`, '')), questionIds);
  assert.deepEqual(module.sources.slice(-7).map(item => item.url), sourceURLs);
  assert.ok(module.sources.slice(-7).every((item, index) => item.checkedOn === '2026-11-08' && JSON.stringify(item.lessonIds) === JSON.stringify([lessonIds[index < 4 ? 0 : 1]])));
  return { ...module, lessons: module.lessons.slice(0, -2), questions: module.questions.filter(item => !lessonIds.includes(item.lessonId)), sources: module.sources.slice(0, -7) };
}
function ecologyConceptBaselineFixture(overrides = {}) {
  const key = './learning-wildlife';
  const module = Object.hasOwn(overrides, key) ? overrides[key] : require('./project-module.cjs').createLoader()('lib/learning-wildlife.js');
  return { ...overrides, [key]: { ...module, wildlifeModules: module.wildlifeModules.map(stripEcologyConceptAddition) } };
}
module.exports = { courseId, lessonIds, questionIds, sourceURLs, stripEcologyConceptAddition, ecologyConceptBaselineFixture };
