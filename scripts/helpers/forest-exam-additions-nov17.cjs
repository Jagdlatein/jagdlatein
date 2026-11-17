// Remove only the two dated Nov17 forest appendices from historical fixtures.
// Positive baseline comparisons live in test-forest-exam-expansion-nov17.cjs.
const assert = require('node:assert/strict');
const cases = [
  { courseId: 'wissen-ausbau-waldverjuengung-verbiss', lessonId: 'haehersaat', questionIds: ['haehersaat-samenweg', 'haehersaat-erfolg'], urls: [
    'https://mastweb.wsl.ch/de/samenmast-erkennen/stieleiche/',
    'https://www.nna.niedersachsen.de/download/100685/B01-2_Wald_und_Naturschutz_-_Forschungsergebnisse_aus_dem_Forstamt_Sellhorn.pdf#page=153',
    'https://www.waldwissen.net/de/lebensraum-wald/tiere-im-wald/voegel/der-eichelhaeher',
  ] },
  { courseId: 'wissen-ausbau-habitat-insektenentwicklung-2026', lessonId: 'buchdrucker-brutbild', questionIds: ['buchdrucker-eiablage', 'buchdrucker-gangmuster'], urls: [
    'https://waldschutz.wsl.ch/de/wald/krankheiten-schaedlinge-stoerungen/waldschaedlinge/der-buchdrucker/',
    'https://www.lwf.bayern.de/mam/cms04/service/dateien/ph_borkenkaefer-2025-bf_rz_bf.pdf#page=21',
    'https://www.waldwissen.net/de/waldwirtschaft/schadensmanagement/insekten/wichtige-borkenkaeferarten-und-ihre-oekologische-bedeutung',
  ] },
];
function stripForestExamCourse(course) {
  const item = cases.find(item => item.courseId === course?.id);
  if (!item || !course.lessons.some(lesson => lesson.id === item.lessonId)) return course;
  assert.equal(course.lessons.at(-1).id, item.lessonId);
  assert.equal(course.lessons.at(-1).reviewedOn, '2026-11-17');
  assert.deepEqual(course.questions.filter(question => question.lessonId === item.lessonId).map(question => question.id.replace(`${course.id}-`, '')), item.questionIds);
  assert.deepEqual(course.sources.slice(-3).map(source => source.url), item.urls);
  assert.ok(course.sources.slice(-3).every(source => source.checkedOn === '2026-11-17' && JSON.stringify(source.lessonIds) === JSON.stringify([item.lessonId])));
  return { ...course, lessons: course.lessons.slice(0, -1), questions: course.questions.filter(question => question.lessonId !== item.lessonId), sources: course.sources.slice(0, -3) };
}
function stripForestExamDataset(dataset) {
  if (!dataset?.modules?.some(module => module.id === cases[1].courseId && module.lessons.some(lesson => lesson.id === cases[1].lessonId))) return dataset;
  return { ...dataset, modules: dataset.modules.map(stripForestExamCourse), evidence: dataset.evidence.filter(record => !(record.moduleId === cases[1].courseId && record.lessonId === cases[1].lessonId)) };
}
function forestExamBaselineFixture(overrides = {}) {
  const { createLoader } = require('./project-module.cjs');
  const natureKey = './learning-expansion-nature', dataKey = '../data/learning-expansion-habitat-depth-2026-10-17.json';
  const nature = Object.hasOwn(overrides, natureKey) ? overrides[natureKey] : createLoader(overrides)('lib/learning-expansion-nature.js');
  const dataset = Object.hasOwn(overrides, dataKey) ? overrides[dataKey] : require('../../data/learning-expansion-habitat-depth-2026-10-17.json');
  return { ...overrides, [natureKey]: { ...nature, natureExpansionModules: nature.natureExpansionModules.map(stripForestExamCourse) }, [dataKey]: stripForestExamDataset(dataset) };
}
module.exports = { cases, stripForestExamCourse, stripForestExamDataset, forestExamBaselineFixture };
