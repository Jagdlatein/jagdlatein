// Historical comparison projects only this exact, independently tested appendix.
const assert = require('node:assert/strict');
const courseId = 'wissen-ausbau-oekologie-holzaufbau-2026';
const lessonId = 'lentizellen';
const questionId = 'lentizellen-gasaustausch';
const sourceURLs = [
  'https://www-archiv.fdm.uni-hamburg.de/b-online/d05/05c.htm',
  'https://mmegias.webs2.uvigo.es/02-english/1-vegetal/v-imagenes-grandes/proteccion_peridermis.php',
  'https://boku.ac.at/universitaetsleitung/rektorat/stabsstellen/oeffentlichkeitsarbeit/themen/presseaussendungen/presseaussendungen-2025/24042025-baumrinde-als-co2-aktivistin',
];
function stripLenticelAddition(module) {
  if (module?.id !== courseId || !module.lessons.some(item => item.id === lessonId)) return module;
  assert.equal(module.lessons.filter(item => item.id === lessonId).length, 1);
  assert.equal(module.lessons.at(-1).id, lessonId);
  assert.deepEqual(module.sources.filter(source => sourceURLs.includes(source.url)).map(source => source.url), sourceURLs);
  assert.ok(module.sources.filter(source => sourceURLs.includes(source.url)).every(source => JSON.stringify(source.lessonIds) === JSON.stringify([lessonId]) && source.checkedOn === '2026-11-08'));
  const questions = module.questions.filter(question => question.lessonId === lessonId);
  assert.equal(questions.length, 1);
  assert.ok([questionId, `${courseId}-${questionId}`].includes(questions[0].id));
  return { ...module,
    sources: module.sources.filter(source => !sourceURLs.includes(source.url)),
    lessons: module.lessons.filter(lesson => lesson.id !== lessonId),
    questions: module.questions.filter(question => question.id !== questionId && question.id !== `${courseId}-${questionId}`),
  };
}
function stripLenticelDataset(dataset) {
  return { ...dataset, modules: dataset.modules.map(stripLenticelAddition),
    evidence: dataset.evidence.filter(record => !(record.moduleId === courseId && record.lessonId === lessonId)) };
}
function lenticelBaselineFixture(overrides = {}) {
  const key = '../data/learning-expansion-ecology-2026-10-16.json';
  const dataset = Object.hasOwn(overrides, key) ? overrides[key] : require('../../data/learning-expansion-ecology-2026-10-16.json');
  return { ...overrides, [key]: stripLenticelDataset(dataset) };
}
module.exports = { stripLenticelAddition, stripLenticelDataset, lenticelBaselineFixture };
