// Preserve this historical view after the exact separately tested Guttation append.
const { guttationBaselineFixture } = require('./helpers/guttation-addition-nov25.cjs');
// This historical snapshot projects only the separately tested Nov25 fish-gill appendix.
const { fishGillBaselineFixture } = require('./helpers/fish-gill-addition-nov25.cjs');
// Keep the historical contract exact; the named Nov25 bird appendix has
// positive whole-corpus/card preservation in its own live-data suite.
const { woodpeckerFootBaselineFixture } = require('./helpers/woodpecker-foot-addition-nov25.cjs');
// Whole-object positive preservation against the last actually delivered commit.
// The foreign pre-existing afternoon dataset is read unchanged in BOTH loaders.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const { insectRespirationBaselineFixture } = require('./helpers/insect-respiration-addition-nov25.cjs');
const { redDeerFlehmenBaselineFixture } = require('./helpers/red-deer-flehmen-addition-nov25.cjs');
const load = createLoader(insectRespirationBaselineFixture(woodpeckerFootBaselineFixture(redDeerFlehmenBaselineFixture(fishGillBaselineFixture(guttationBaselineFixture()))))), revision = 'a0b078b800c5eafd2a31fa5c6a95c0ee3718132c';
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
const old = previousLoader(), courses = load('lib/learning-curriculum.js').learningModules;
const before = old('lib/learning-curriculum.js').learningModules;
const additions = new Map([
  ['wissen-vertiefung-wild-huehner-nachwuchs', { lessonId: 'auerhuhn-zehenstifte', sourceCount: 4, words: ['Zehenstifte', 'Auftrittsfläche', 'Alpenschneehuhn'] }],
  ['wissen-vertiefung-hunde-klare-lernsignale', { lessonId: 'wissen-vertiefung-hunde-klare-lernsignale-extinktion-erholung', sourceCount: 3, words: ['Extinktion', 'Verstärkung', 'Pause'] }],
]);
const cards = load('lib/learning-flashcards.js').getFlashcards();

test('Only two named appendices extend the 198 courses; every old substantive course field and its order remain exact', () => {
  assert.equal(before.length, 198); assert.deepEqual(courses.map(item => item.id), before.map(item => item.id));
  let lessons = 0, questions = 0;
  for (const previous of before) {
    const current = courses.find(item => item.id === previous.id), addition = additions.get(current.id);
    if (!addition) { assert.deepEqual(current, previous, current.id); continue; }
    const restored = JSON.parse(JSON.stringify(current));
    const extraLessons = restored.lessons.splice(previous.lessons.length), extraQuestions = restored.questions.splice(previous.questions.length), extraSources = restored.sources.splice(previous.sources.length);
    assert.equal(extraLessons.length, 1); const lesson = extraLessons[0]; assert.equal(lesson.id, addition.lessonId); assert.equal(lesson.reviewedOn, '2026-11-17');
    assert.equal(extraQuestions.length, 2); assert.ok(extraQuestions.every(item => item.lessonId === lesson.id));
    assert.equal(extraSources.length, addition.sourceCount); assert.ok(extraSources.every(item => item.checkedOn === '2026-11-17' && JSON.stringify(item.lessonIds) === JSON.stringify([lesson.id])));
    assert.deepEqual(restored, previous, current.id); lessons += extraLessons.length; questions += extraQuestions.length;
  }
  assert.equal(lessons, 2); assert.equal(questions, 4);
  assert.deepEqual(load('lib/learning-categories.js').learningCategoryDetails, old('lib/learning-categories.js').learningCategoryDetails);
  assert.deepEqual(load('lib/learning-topic-tree.js').learningTopicTree, old('lib/learning-topic-tree.js').learningTopicTree);
});

test('All 1790 old cards and the 116 starters stay exact and ordered; four new cards use only their new lesson sources and date', () => {
  const oldCards = old('lib/learning-flashcards.js').getFlashcards(), ids = new Set(oldCards.map(item => item.id));
  assert.equal(oldCards.length, 1790); assert.equal(cards.length, oldCards.length + 4);
  assert.deepEqual(cards.filter(item => ids.has(item.id)), oldCards); assert.deepEqual(cards.slice(0, 116), oldCards.slice(0, 116));
  for (const card of cards.filter(item => !ids.has(item.id))) {
    assert.equal(card.lessonId, additions.get(card.moduleId)?.lessonId); assert.equal(card.reviewedOn, '2026-11-17'); assert.equal(card.sourceScope, 'lesson');
    const course = courses.find(item => item.id === card.moduleId), lesson = course.lessons.find(item => item.id === card.lessonId);
    const allowed = new Set(lesson.evidence.flatMap(claim => claim.sources.map(item => item.url)));
    assert.ok(card.sources.length >= 2 && card.sources.every(item => allowed.has(item.url)));
  }
});

test('Both new lessons flow into real search, category course topics, four-answer checks and dated daily review without duplicating old knowledge', () => {
  const { getLearningOverviewData } = load('lib/learning-overview-server.js'), { getDailyReviewPool } = load('lib/daily-review-pool.js');
  const { searchLearning } = load('lib/learning-search.js'), { lessonHash } = load('lib/learning-lesson-navigation.js');
  const { quizQuestionCountries } = load('lib/quiz-learning-scope.js');
  for (const [id, addition] of additions) {
    const course = courses.find(item => item.id === id), lesson = course.lessons.find(item => item.id === addition.lessonId), href = `/kurse/${id}${lessonHash(lesson.id)}`;
    for (const word of addition.words) assert.ok(lesson.paragraphs.join(' ').includes(word), word);
    const category = load('lib/learning-categories.js').getLearningCategoryByTitle(course.category).slug;
    assert.ok(getLearningOverviewData(category).modules.find(item => item.id === id).topics.some(item => item.href === href && item.title === lesson.title));
    const found = JSON.stringify(searchLearning({ query: addition.words[0], category, page: 1 })); assert.ok(found.includes(id) && found.includes(lesson.title));
    for (const question of course.questions.filter(item => item.lessonId === lesson.id)) {
      assert.equal(question.answers.length, 4); assert.equal(new Set(question.answers.map(item => item.text)).size, 4); assert.equal(question.correct.length, 1);
      assert.deepEqual([...quizQuestionCountries(question)].sort(), ['AT', 'CH', 'DE']);
      const review = getDailyReviewPool().find(item => item.id === question.id); assert.ok(review); assert.equal(review.href, href); assert.equal(review.sourceScope, 'lesson'); assert.deepEqual(review.reading.paragraphs, lesson.paragraphs);
      assert.deepEqual(review.answers, question.answers); assert.deepEqual(review.correct, question.correct);
      const allowed = new Set(lesson.evidence.flatMap(item => item.sources.map(source => source.url))); assert.ok(review.sources.every(item => allowed.has(item.url)));
    }
  }
});

test('The foreign afternoon file and the existing 114 Wildjahr photo entries remain untouched', () => {
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
  const photos = load('lib/wild-year-photographs.js').wildYearPhotographs;
  assert.equal(Object.keys(photos).length, 114);
  assert.deepEqual(photos, old('lib/wild-year-photographs.js').wildYearPhotographs);
  for (const photo of Object.values(photos)) assert.equal(execFileSync('git', ['diff', '--name-only', revision, '--', 'public' + photo.src], { cwd: root, encoding: 'utf8' }).trim(), '');
  const names = execFileSync('git', ['diff', '--name-only', revision, '--', 'lib/*wildyear*', 'lib/*wild-year*', 'lib/*wildlife-photo*', 'public/photos'], { cwd: root, encoding: 'utf8' }).trim();
  assert.equal(names, '');
});
