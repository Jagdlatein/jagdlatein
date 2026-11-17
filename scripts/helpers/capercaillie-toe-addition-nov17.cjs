// Historical fixtures remove exactly this dated, sourced tail appendix.
// The companion integration test positively compares every prior object.
const assert = require('node:assert/strict');
const addition = {
  courseId: 'wissen-vertiefung-wild-huehner-nachwuchs',
  lessonId: 'auerhuhn-zehenstifte',
  questionIds: ['auerhuhn-zehenstifte-funktion', 'auerhuhn-zehenstifte-vergleich'],
  urls: [
    'https://www.birdlife.at/voegel/auerhuhn/',
    'https://baden-wuerttemberg.nabu.de/natur-und-artenwissen/voegel/vogelportraets/das-auerhuhn-im-portraet',
    'https://tw.naturpark-bayer-wald.de/auerhuhn',
    'https://nationalpark.ch/flora-und-fauna/alpenschneehuhn/',
  ],
};
function stripCapercaillieToeCourse(course) {
  if (course?.id !== addition.courseId || !course.lessons.some(lesson => lesson.id === addition.lessonId)) return course;
  const added = course.lessons.at(-1);
  assert.equal(added.id, addition.lessonId);
  assert.equal(added.reviewedOn, '2026-11-17');
  assert.equal(added.flashcardExpansion, true);
  assert.deepEqual(course.questions.filter(question => question.lessonId === addition.lessonId).map(question => question.id.replace(`${course.id}-`, '')), addition.questionIds);
  assert.deepEqual(course.questions.slice(-2).map(question => question.id.replace(`${course.id}-`, '')), addition.questionIds);
  const sources = course.sources.slice(-4);
  assert.deepEqual(sources.map(source => source.url), addition.urls);
  assert.ok(sources.every(source => source.checkedOn === '2026-11-17' && JSON.stringify(source.lessonIds) === JSON.stringify([addition.lessonId])));
  return { ...course, lessons: course.lessons.slice(0, -1), questions: course.questions.slice(0, -2), sources: course.sources.slice(0, -4) };
}
function capercaillieToeBaselineFixture(overrides = {}) {
  const { createLoader } = require('./project-module.cjs');
  const key = './learning-wildlife-depth';
  const wildlife = Object.hasOwn(overrides, key) ? overrides[key] : createLoader(overrides)('lib/learning-wildlife-depth.js');
  return { ...overrides, [key]: { ...wildlife, wildlifeDepthModules: wildlife.wildlifeDepthModules.map(stripCapercaillieToeCourse) } };
}
module.exports = { addition, stripCapercaillieToeCourse, capercaillieToeBaselineFixture };
