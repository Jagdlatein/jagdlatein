// Strict projection of only the two dated Nov17 appendices for historical tests.
// Positive preservation is independently checked in the Nov17 integration suite.
const assert = require('node:assert/strict');
const cases = [
  { id: 'wissen-optik', lesson: 'fernglas-einstellungen', questions: ['fernglas-dioptrie', 'fernglas-fokus'], sources: [
    'https://imaging.nikon.com/sport-optics/guide/binoculars/using/using_01/',
    'https://leica-camera.com/sites/default/files/2021-10/Trinovid_DE_Upd%2B2021.pdf',
    'https://imaging.nikon.com/sport-optics/guide/binoculars/using/using_04/',
  ] },
  { id: 'wissen-wildbrethygiene', lesson: 'messort-temperatur', questions: ['temperatur-oberflaeche', 'temperatur-kuehlgeraet'], sources: [
    'https://www.foodstandards.gov.au/business/food-safety/thermometers',
    'https://www.lwk-niedersachsen.de/lwk/news/42763_Thermometer_im_Einsatz_fuer_die_Hygiene_-_Wissen_fuer_die_Praxis',
    'https://www.foodstandards.gov.scot/business-guidance/running-a-food-business/publications/cooksafe-guide/cooksafe-guide-web-version/cooksafe-guide-web-version-section-3',
  ] },
];
function stripPracticeMeasurementCourse(course) {
  const item = cases.find(item => item.id === course?.id);
  if (!item || !course.lessons.some(lesson => lesson.id === item.lesson)) return course;
  assert.equal(course.lessons.at(-1).id, item.lesson);
  assert.equal(course.lessons.at(-1).reviewedOn, '2026-11-17');
  const questionId = question => question.id.startsWith(`${course.id}-`) ? question.id.slice(course.id.length + 1) : question.id;
  assert.deepEqual(course.questions.filter(question => question.lessonId === item.lesson).map(questionId), item.questions);
  assert.deepEqual(course.questions.slice(-2).map(questionId), item.questions);
  assert.deepEqual(course.sources.slice(-3).map(source => source.url), item.sources);
  assert.ok(course.sources.slice(-3).every(source => JSON.stringify(source.lessonIds) === JSON.stringify([item.lesson])));
  return { ...course, lessons: course.lessons.slice(0, -1), questions: course.questions.slice(0, -2), sources: course.sources.slice(0, -3) };
}
function practiceMeasurementBaselineFixture(overrides = {}) {
  const key = './learning-practice', { createLoader } = require('./project-module.cjs');
  const original = Object.hasOwn(overrides, key) ? overrides[key] : createLoader(overrides)('lib/learning-practice.js');
  return { ...overrides, [key]: { ...original, practiceModules: original.practiceModules.map(stripPracticeMeasurementCourse) } };
}
module.exports = { stripPracticeMeasurementCourse, practiceMeasurementBaselineFixture };
