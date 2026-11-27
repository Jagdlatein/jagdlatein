// Remove only the exact separately reviewed Leaf appendix from historical views.
// Constants were frozen from dataset9e8873a9..., never calculated from live input.
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const expectedHashes = Object.freeze({
  rawLesson: 'f10e6e3bf6e14d523b885e7b349aa3f3106e7e4100c2524d6d83340dbe60d1bf',
  preparedLesson: '130e1ce14a8683a26568a81060a24541d758c09e07f4eace26fe7ed5e46245ce',
  rawQuestion: 'fc9ef81318c508fec0dcdb725b2dd56576f55d53f5d04528b7f20b9a3411b47a',
  preparedQuestion: '07df80db68efc58886ecdefa5bfb86c8e032602e6c8c18a26a8236e8ffb1b6c4',
  sources: 'a00de078fa5495831214bca6d82f3baecfdb7ab4e52af243a02ddbc4db06d730',
  evidence: '86c06a883fe8dbe39b070bb8d7bab4bdb9d56247eab584c78121eb35c260cdb2',
  card: '9e4ec5861527463297d45ec8f0fe28bc4fa9c59e90a32a8c56414c484f9abbc9',
});
const addition = Object.freeze({
  courseId: 'wissen-ausbau-oekologie-blattfunktion-2026', lessonId: 'blattabwurf',
  questionId: 'blattabwurf-abtrennungszone', date: '2026-11-27',
  urls: Object.freeze([
    'https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2015.00634/full',
    'https://www.open.edu/openlearn/mod/oucontent/view.php?id=2284&section=1.4.1',
    'https://news.berkeley.edu/2021/12/03/berkeley-talks-transcript-why-do-leaves-change-color-in-the-fall/',
  ]),
});
const newQuestionId = `${addition.courseId}-${addition.questionId}`;
const newCardId = `flash-${newQuestionId}`;
const assertExact = (value, expected, label) => assert.equal(createHash('sha256').update(JSON.stringify(value)).digest('hex'), expected, label);
const leafQuestion = value => value?.lessonId === addition.lessonId || [addition.questionId, newQuestionId].includes(value?.id);

function stripLeafCourse(course) {
  if (course?.id !== addition.courseId) return course;
  const named = course.lessons.filter(value => value.id === addition.lessonId);
  if (!named.length) {
    assert.equal(course.questions.some(leafQuestion), false, 'No orphan Leaf question');
    assert.equal(course.sources.some(value => addition.urls.includes(value.url)), false, 'No orphan Leaf source');
    return course;
  }
  assert.equal(named.length, 1);
  assert.deepEqual([course.lessons.length, course.questions.length, course.sources.length], [8, 39, 22]);
  assert.deepEqual(course.lessons.map(value => value.id), ['blattbau', 'photosynthese', 'wasserhaushalt', 'blattalterung', 'zellatmung', 'energie-stoffe', 'guttation', addition.lessonId]);
  const lesson = course.lessons.at(-1), question = course.questions.at(-1);
  const prepared = Array.isArray(question.answers);
  assert.equal(lesson, named[0]);
  assert.equal(course.questions.filter(leafQuestion).length, 1);
  assert.equal(question.id, prepared ? newQuestionId : addition.questionId);
  assert.equal(question.lessonId, addition.lessonId);
  assertExact(lesson, expectedHashes[prepared ? 'preparedLesson' : 'rawLesson'], 'Complete named Leaf lesson: text/date/evidence, no diagram');
  assertExact(question, expectedHashes[prepared ? 'preparedQuestion' : 'rawQuestion'], 'Complete named Leaf question: all choices and explanation');
  assertExact(course.sources.slice(-3), expectedHashes.sources, 'Complete three named Leaf sources: labels, scope and reading roles');
  assert.deepEqual(course.sources.slice(-3).map(value => value.url), addition.urls);
  assert.ok(course.sources.slice(-3).every(value => value.checkedOn === addition.date && JSON.stringify(value.lessonIds) === JSON.stringify([addition.lessonId])));
  return { ...course, lessons: course.lessons.slice(0, -1), questions: course.questions.slice(0, -1), sources: course.sources.slice(0, -3) };
}

function stripLeafDataset(data) {
  if (!data?.modules?.some(value => value.id === addition.courseId)) return data;
  const course = data.modules.find(value => value.id === addition.courseId);
  const records = data.evidence.filter(value => value.moduleId === addition.courseId && value.lessonId === addition.lessonId);
  if (!course.lessons.some(value => value.id === addition.lessonId)) {
    assert.equal(records.length, 0, 'No orphan Leaf evidence');
    stripLeafCourse(course);
    return data;
  }
  assert.equal(records.length, 1);
  assert.equal(data.evidence.at(-1), records[0]);
  assertExact(records[0], expectedHashes.evidence, 'Complete named Leaf raw evidence including both claims and exact source roles');
  return { ...data, modules: data.modules.map(stripLeafCourse), evidence: data.evidence.slice(0, -1) };
}

function stripLeafCards(cards) {
  const named = cards.filter(value => value.id === newCardId || value.moduleId === addition.courseId && value.lessonId === addition.lessonId);
  if (!named.length) return cards;
  assert.equal(named.length, 1);
  assert.equal(named[0].id, newCardId);
  assertExact(named[0], expectedHashes.card, 'Complete derived Leaf card: question, answer, explanation, links, dates, source labels');
  return cards.filter(value => value.id !== newCardId);
}

function leafBaselineFixture(overrides = {}) {
  const key = '../data/learning-expansion-ecology-2026-10-16.json';
  const data = Object.hasOwn(overrides, key) ? overrides[key] : require('../../data/learning-expansion-ecology-2026-10-16.json');
  return { ...overrides, [key]: stripLeafDataset(data) };
}
module.exports = { expectedHashes, addition, newQuestionId, newCardId, assertExact, stripLeafCourse, stripLeafDataset, stripLeafCards, leafBaselineFixture };
