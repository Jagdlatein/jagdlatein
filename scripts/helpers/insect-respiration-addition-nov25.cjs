// Strictly project the single dated Nov25 appendix for historical fixtures.
// Positive whole-object checks live in test-insect-respiration-learning-nov25.cjs.
const assert = require('node:assert/strict');
const addition = Object.freeze({
  courseId: 'wissen-ausbau-habitat-insektenentwicklung-2026', lessonId: 'tracheen-atmung', date: '2026-11-25',
  questionIds: ['tracheen-luftweg', 'tracheen-ventilation'],
  urls: [
    'https://genent.cals.ncsu.edu/bug-bytes/respiratory-system/',
    'https://extension.msstate.edu/newsletters/bugs-eye-view/2021/what-are-insects-the-inside-vol-7-no-16',
  ],
});
function stripInsectRespirationCourse(course) {
  if (course?.id !== addition.courseId || !course.lessons.some(item => item.id === addition.lessonId)) return course;
  assert.equal(course.lessons.length, 6); assert.equal(course.questions.length, 36); assert.equal(course.sources.length, 12);
  const lesson = course.lessons.at(-1);
  assert.equal(lesson.id, addition.lessonId); assert.equal(lesson.title, 'Tracheenatmung');
  assert.equal(lesson.reviewedOn, addition.date); assert.equal(lesson.flashcardExpansion, true);
  assert.equal(lesson.paragraphs.length, 4); assert.ok(lesson.exercise && lesson.takeaway);
  assert.deepEqual(course.questions.slice(-2).map(question => question.id.replace(`${course.id}-`, '')), addition.questionIds);
  assert.ok(course.questions.slice(-2).every(question => question.lessonId === addition.lessonId));
  assert.deepEqual(course.sources.slice(-2).map(source => source.url), addition.urls);
  assert.ok(course.sources.slice(-2).every(source => source.checkedOn === addition.date && JSON.stringify(source.lessonIds) === JSON.stringify([addition.lessonId])));
  return { ...course, lessons: course.lessons.slice(0, -1), questions: course.questions.slice(0, -2), sources: course.sources.slice(0, -2) };
}
function stripInsectRespirationDataset(dataset) {
  if (!dataset?.modules?.some(course => course.id === addition.courseId && course.lessons.some(lesson => lesson.id === addition.lessonId))) return dataset;
  const records = dataset.evidence.filter(item => item.moduleId === addition.courseId && item.lessonId === addition.lessonId);
  assert.equal(records.length, 1); assert.equal(dataset.evidence.at(-1), records[0]);
  assert.equal(records[0].claims.length, 2);
  assert.ok(records[0].claims.every(claim => claim.claim && JSON.stringify(claim.sourceUrls) === JSON.stringify(addition.urls)));
  return { ...dataset, modules: dataset.modules.map(stripInsectRespirationCourse), evidence: dataset.evidence.slice(0, -1) };
}
function insectRespirationBaselineFixture(overrides = {}) {
  const key = '../data/learning-expansion-habitat-depth-2026-10-17.json';
  const dataset = Object.hasOwn(overrides, key) ? overrides[key] : require('../../data/learning-expansion-habitat-depth-2026-10-17.json');
  return { ...overrides, [key]: stripInsectRespirationDataset(dataset) };
}
const newQuestionIds = addition.questionIds.map(id => `${addition.courseId}-${id}`);
const newCardIds = newQuestionIds.map(id => `flash-${id}`);
function stripInsectRespirationCards(cards) {
  const extra = cards.filter(card => newCardIds.includes(card.id));
  if (!extra.length) return cards;
  assert.deepEqual(extra.map(card => card.id), newCardIds);
  assert.ok(extra.every(card => card.moduleId === addition.courseId && card.lessonId === addition.lessonId && card.reviewedOn === addition.date && card.sourceScope === 'lesson'
    && JSON.stringify(card.sources.map(source => source.url)) === JSON.stringify(addition.urls)));
  return cards.filter(card => !newCardIds.includes(card.id));
}
module.exports = { addition, newQuestionIds, newCardIds, stripInsectRespirationCourse, stripInsectRespirationDataset, stripInsectRespirationCards, insectRespirationBaselineFixture };
