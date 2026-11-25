const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const { stripInsectRespirationCards } = require('./helpers/insect-respiration-addition-nov25.cjs');

const revision = '69e4417ffc881e88432dfc04e3e444f1b1357659';
const load = createLoader();
const data = load('data/exam-alignment/transfer-ecology-2026-11-17.json');
const review = load('data/reviews/transfer-ecology-goals-2026-11-17.json');
const { projectExamLearningGoal } = load('lib/exam-learning-goal-server.js');
const { getLearningModule } = load('lib/learning-curriculum.js');
const { lessonHash } = load('lib/learning-lesson-navigation.js');
const { getFlashcardExport, getFlashcards } = load('lib/learning-flashcards.js');
const expected = [
  ['wildkunde', 'wild-verdauungswege-transfer', 'wissen-ausbau-biologie-verdauungsvergleich-2026', 'caecotrophie', 7, '2026-10-16', 'wissen-ausbau-biologie-verdauungsvergleich-2026-caecotrophie-q4'],
  ['natur-revier', 'natur-gewaesserprofil-transfer', 'wissen-ausbau-gewaesser-sauerstoff-2026', 'messprofil', 3, '2026-10-16', 'wissen-ausbau-gewaesser-sauerstoff-2026-q16'],
  ['wald-pflanzen', 'wald-mykorrhiza-transfer', 'wissen-ausbau-pilze-lebensweisen-2026', 'partnerschaft', 3, '2026-10-16', 'wissen-ausbau-pilze-lebensweisen-2026-q5'],
  ['landwirtschaft-lebensraeume', 'feld-gerstenaufbau-transfer', 'wissen-vertiefung-getreidearten-round6-2026', 'gerste-dreiergruppen', 1, '2026-10-18', 'wissen-vertiefung-getreidearten-round6-2026-gerste-dreiergruppen'],
];

function previousLoader() {
  const cache = new Map();
  return function read(relative) {
    const filename = path.resolve(root, relative), name = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(name && !name.startsWith('../') && !path.isAbsolute(name));
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = name === 'data/learning-expansion-afternoon-2026-10-16.json' ? fs.readFileSync(filename, 'utf8') : execFileSync('git', ['show', `${revision}:${name}`], { cwd: root, encoding: 'utf8', maxBuffer: 30000000 });
    if (name.endsWith('.json')) return JSON.parse(source.replace(/^\uFEFF/, ''));
    const module = { exports: {} }; cache.set(filename, module);
    const { code } = local('next/dist/build/swc').transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? read(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
    return module.exports;
  };
}
const old = previousLoader();

test('Four named categories receive one original transfer goal each; all 36 original learning goals remain exact and ordered', () => {
  assert.deepEqual(Object.keys(data), ['categories']);
  assert.deepEqual(data.categories.map(item => [item.slug, item.goal.id, item.goal.moduleId, item.goal.lessonId]), expected.map(item => item.slice(0, 4)));
  const before = old('data/exam-alignment/learning-goals-2026-11-01.json');
  const current = load('data/exam-alignment/learning-goals-2026-11-01.json');
  assert.deepEqual(current, before);
  const oldIds = new Set(before.categories.flatMap(item => item.goals.map(goal => goal.id)));
  assert.equal(oldIds.size, 36);
  for (const { goal } of data.categories) {
    assert.deepEqual(Object.keys(goal).sort(), ['id', 'title', 'task', 'selfCheck', 'moduleId', 'lessonId', 'caseText', 'followUp', 'relatedLessons'].sort());
    assert.ok(!oldIds.has(goal.id));
    assert.equal(goal.selfCheck.length, 3);
    assert.ok(goal.selfCheck.every(criterion => typeof criterion === 'string' && criterion.startsWith('Ich ') && criterion.length > 40));
    assert.equal(goal.relatedLessons.length, 2);
    assert.equal(new Set(goal.relatedLessons.map(item => `${item.moduleId}#${item.lessonId}`)).size, 2);
    assert.ok(goal.caseText.includes('Papierfall'));
  }
});

test('All four goals project for CH, AT and DE into actual full reading, scoped lesson cards and the existing shared quiz', () => {
  for (const [index, { slug, goal }] of data.categories.entries()) {
    for (const country of ['CH', 'AT', 'DE']) {
      const result = projectExamLearningGoal(goal, { country, categorySlug: slug });
      assert.equal(result.regionalLaw, false);
      assert.equal(result.lessonPractice, true);
      assert.equal(result.href, `/kurse/${goal.moduleId}${lessonHash(goal.lessonId)}`);
      assert.equal(result.quizHref, `/kurse/${goal.moduleId}#wissenscheck`);
      assert.equal(result.cardCount, expected[index][4]);
      assert.equal(result.cardHref, `/lernen/lernkarten?kurs=${goal.moduleId}&lektion=${goal.lessonId}`);
      assert.deepEqual(result.selfCheck, goal.selfCheck);
      assert.equal(result.relatedLessons.length, 2);
      result.relatedLessons.forEach((target, i) => assert.equal(target.href, `/kurse/${goal.relatedLessons[i].moduleId}${lessonHash(goal.relatedLessons[i].lessonId)}`));
      const keys = Object.keys(result);
      assert.ok(!keys.some(key => ['answers', 'correct', 'sources', 'evidence', 'paragraphs'].includes(key)));
    }
  }
});

test('Every referenced course, lesson, original question, source and date is a complete unchanged baseline object', () => {
  const oldModules = old('lib/learning-curriculum.js');
  const ids = new Set(data.categories.flatMap(({ goal }) => [goal.moduleId, ...goal.relatedLessons.map(item => item.moduleId)]));
  for (const id of ids) assert.deepEqual(getLearningModule(id), oldModules.getLearningModule(id), id);
  for (const [index, { goal }] of data.categories.entries()) {
    const course = getLearningModule(goal.moduleId), lesson = course.lessons.find(item => item.id === goal.lessonId);
    assert.equal(course.reviewedOn, expected[index][5]);
    assert.equal(lesson.reviewedOn, undefined);
    assert.ok(lesson.paragraphs.length >= 2 && lesson.paragraphs.every(item => typeof item === 'string' && item.length > 60));
    assert.ok(lesson.exercise && lesson.takeaway);
    const questions = course.questions.filter(item => item.lessonId === lesson.id);
    assert.ok(questions.length > 0);
    for (const question of questions) {
      assert.equal(question.answers.length, 4);
      assert.equal(question.correct.length, 1);
      assert.equal(new Set(question.answers.map(item => item.id)).size, 4);
      assert.equal(new Set(question.answers.map(item => item.text)).size, 4);
      assert.ok(question.answers.some(item => item.id === question.correct[0]));
    }
  }
});

test('Lesson-scoped digital decks inherit actual four-answer cards, full explanations and source boundaries without duplicating cards', () => {
  const before = old('lib/learning-flashcards.js').getFlashcards();
  for (const [index, { goal }] of data.categories.entries()) {
    const selection = { courseId: goal.moduleId, lessonId: goal.lessonId, invalid: false };
    const deck = getFlashcardExport(selection, { withChoices: true });
    assert.equal(deck.selection.invalid, false);
    assert.equal(deck.cards.length, expected[index][4]);
    assert.ok(deck.cards.every(card => card.moduleId === goal.moduleId && card.lessonId === goal.lessonId));
    for (const card of deck.cards) {
      assert.equal(card.choices.length, 4);
      assert.equal(card.choices.filter(choice => choice === card.answer).length, 1);
      assert.ok(card.explanation && card.sources.length >= 2);
      const { choices, ...plainCard } = card;
      assert.deepEqual(plainCard, before.find(item => item.id === card.id));
    }
  }
  // The separately reviewed Nov25 appendix adds exactly its two scoped cards;
  // every historical card remains a complete positive object comparison.
  assert.deepEqual(stripInsectRespirationCards(getFlashcards()), before);
});

test('Each editorial daily-case candidate reuses one actual existing four-answer question and its complete reading, never a new question', () => {
  const pool = load('lib/daily-review-pool.js').getDailyReviewPool();
  const baselineEditorialIds = old('lib/revier-moment-cases-server.js').REVIER_MOMENT_IDS;
  assert.equal(baselineEditorialIds.length, 60);
  for (const [index, { slug, goal }] of data.categories.entries()) {
    const id = expected[index][6];
    assert.ok(!baselineEditorialIds.includes(id));
    const course = getLearningModule(goal.moduleId), question = course.questions.find(item => item.id === id), lesson = course.lessons.find(item => item.id === goal.lessonId);
    const selected = pool.filter(item => item.id === id);
    assert.equal(selected.length, 1);
    assert.equal(selected[0].category, slug);
    assert.equal(selected[0].q, question.q);
    assert.deepEqual(selected[0].answers, question.answers);
    assert.deepEqual(selected[0].correct, question.correct);
    assert.equal(selected[0].explain, question.explain);
    assert.deepEqual(selected[0].reading.paragraphs, lesson.paragraphs);
    assert.equal(selected[0].reading.exercise, lesson.exercise);
    assert.ok(selected[0].sources.length >= 2);
  }
});

test('Source review records distinguish direct originals, original-index access and PDF pages, with limits tied to all four cases', () => {
  assert.equal(review.checkedOn, '2026-11-17');
  assert.equal(review.baselineCommit, revision);
  assert.equal(review.audit.existingGoals, 36);
  assert.deepEqual(review.goals.map(item => item.id), expected.map(item => item[1]));
  for (const [index, record] of review.goals.entries()) {
    assert.equal(record.moduleId, expected[index][2]);
    assert.equal(record.lessonId, expected[index][3]);
    assert.equal(record.existingPrimaryLessonCardCount, expected[index][4]);
    assert.equal(record.existingQuestionForDailyCase, expected[index][6]);
    assert.ok(record.sources.length >= 2 && record.sources.every(source => source.url.startsWith('https://') && source.read && source.role && source.limits));
    assert.ok(record.visibleLimits);
  }
  assert.match(review.goals[1].sources[1].read, /Original-Suchindex/);
  assert.match(review.goals[2].sources[1].read, /gedruckte Seiten 6–7/);
  assert.match(review.goals[2].sources[1].read, /physische PDF-Seiten 2–3/);
  assert.match(review.goals[3].taxonomicLimit, /H\.distichon/);
});

test('Real projection guards still reject missing lessons, wrong categories and broken related references', () => {
  const { goal } = data.categories[0];
  assert.throws(() => projectExamLearningGoal({ ...goal, lessonId: 'not-present' }, { country: 'CH' }), /Lektionsbezug/);
  assert.throws(() => projectExamLearningGoal(goal, { country: 'DE', categorySlug: 'jagdrecht' }), /Lektionsbezug/);
  assert.throws(() => projectExamLearningGoal({ ...goal, relatedLessons: [{ moduleId: goal.moduleId, lessonId: 'not-present' }] }, { country: 'AT' }), /Lektionsbezug/);
  assert.throws(() => projectExamLearningGoal({ ...goal, id: 'Invalid id' }), /Prüfungslernziel/);
});
