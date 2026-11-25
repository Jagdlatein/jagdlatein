// Project only the named, dated appendix for historical fixtures. Positive
// whole-object preservation is checked against the published f1926db baseline.
const assert = require('node:assert/strict');
const addition = Object.freeze({
  courseId: 'wissen-ausbau-biologie-vogelkoerper-2026', lessonId: 'spechtfuss-kletterhaltung', date: '2026-11-25',
  questionIds: ['spechtfuss-grundschema', 'spechtfuss-bewegliche-haltung'],
  urls: [
    'https://bdml.stanford.edu/twiki/pub/Main/PerchingPapers/BockAndMiller.pdf',
    'https://www.bto.org/learn/about-birds/bird-families/picidae-woodpeckers',
    'https://www.vogelwarte.ch/de/entdecken/spechte/',
  ],
});
function stripWoodpeckerFootCourse(course) {
  if (course?.id !== addition.courseId || !course.lessons.some(item => item.id === addition.lessonId)) return course;
  assert.equal(course.lessons.length, 11); assert.equal(course.questions.length, 42); assert.equal(course.sources.length, 28);
  const lesson = course.lessons.at(-1);
  assert.equal(lesson.id, addition.lessonId); assert.equal(lesson.title, 'Spechtfuss: Grundschema und Kletterhaltung');
  assert.equal(lesson.reviewedOn, addition.date); assert.equal(lesson.flashcardExpansion, true);
  assert.equal(lesson.paragraphs.length, 3); assert.ok(lesson.exercise && lesson.takeaway);
  assert.deepEqual(course.questions.slice(-2).map(question => question.id.replace(`${course.id}-`, '')), addition.questionIds);
  assert.ok(course.questions.slice(-2).every(question => question.lessonId === addition.lessonId));
  assert.deepEqual(course.sources.slice(-3).map(source => source.url), addition.urls);
  assert.ok(course.sources.slice(-3).every(source => source.checkedOn === addition.date && JSON.stringify(source.lessonIds) === JSON.stringify([addition.lessonId])));
  return { ...course, lessons: course.lessons.slice(0, -1), questions: course.questions.slice(0, -2), sources: course.sources.slice(0, -3) };
}
function stripWoodpeckerFootDataset(dataset) {
  if (!dataset?.modules?.some(course => course.id === addition.courseId && course.lessons.some(lesson => lesson.id === addition.lessonId))) return dataset;
  const records = dataset.evidence.filter(item => item.moduleId === addition.courseId && item.lessonId === addition.lessonId);
  assert.equal(records.length, 1); assert.equal(dataset.evidence.at(-1), records[0]); assert.equal(records[0].claims.length, 3);
  assert.deepEqual(records[0].claims.map(claim => claim.sourceUrls), [addition.urls.slice(0, 2), addition.urls, addition.urls]);
  assert.ok(records[0].claims.every(claim => claim.claim && JSON.stringify(Object.keys(claim.sourceRoles)) === JSON.stringify(claim.sourceUrls)
    && Object.values(claim.sourceRoles).every(role => typeof role === 'string' && role.length > 30)));
  return { ...dataset, modules: dataset.modules.map(stripWoodpeckerFootCourse), evidence: dataset.evidence.slice(0, -1) };
}
function woodpeckerFootBaselineFixture(overrides = {}) {
  const key = '../data/learning-expansion-biology-2026-10-16.json';
  const dataset = Object.hasOwn(overrides, key) ? overrides[key] : require('../../data/learning-expansion-biology-2026-10-16.json');
  return { ...overrides, [key]: stripWoodpeckerFootDataset(dataset) };
}
const newQuestionIds = addition.questionIds.map(id => `${addition.courseId}-${id}`);
const newCardIds = newQuestionIds.map(id => `flash-${id}`);
function stripWoodpeckerFootCards(cards) {
  const extra = cards.filter(card => newCardIds.includes(card.id));
  if (!extra.length) return cards;
  assert.deepEqual(extra.map(card => card.id), newCardIds);
  assert.ok(extra.every(card => card.moduleId === addition.courseId && card.lessonId === addition.lessonId && card.reviewedOn === addition.date && card.sourceScope === 'lesson'
    && JSON.stringify(card.sources.map(source => source.url)) === JSON.stringify(addition.urls)));
  return cards.filter(card => !newCardIds.includes(card.id));
}
module.exports = { addition, newQuestionIds, newCardIds, stripWoodpeckerFootCourse, stripWoodpeckerFootDataset, stripWoodpeckerFootCards, woodpeckerFootBaselineFixture };
