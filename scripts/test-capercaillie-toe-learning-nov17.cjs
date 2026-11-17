// Exact existing-course appendix, actual integration and preserved published objects.
// Technical checks do not replace the original institutional source reading.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { addition, stripCapercaillieToeCourse, capercaillieToeBaselineFixture } = require('./helpers/capercaillie-toe-addition-nov17.cjs');
const baseline = 'a0b078b800c5eafd2a31fa5c6a95c0ee3718132c';
const load = createLoader();
const relative = 'lib/learning-wildlife-depth.js';
const source = execFileSync('git', ['show', `${baseline}:${relative}`], { cwd: root, encoding: 'utf8' });
const previousRaw = { exports: {} };
const { code } = local('next/dist/build/swc').transformSync(source, { filename: path.join(root, relative), jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? load(path.resolve(root, 'lib', `${id}.js`)) : local(id), previousRaw, previousRaw.exports);
const beforeLoad = createLoader({ './learning-wildlife-depth': previousRaw.exports });
const curriculum = load('lib/learning-curriculum.js'), before = beforeLoad('lib/learning-curriculum.js');
const course = curriculum.getLearningModule(addition.courseId), lesson = course.lessons.at(-1);
const ids = addition.questionIds.map(id => `${addition.courseId}-${id}`);
const flashcards = load('lib/learning-flashcards.js'), cards = flashcards.getFlashcards();
const newCards = cards.filter(card => ids.some(id => card.id === `flash-${id}`));

test('Only one exact dated tail appendix differs from all published wildlife-depth objects and the complete current curriculum graph', () => {
  const current = load(relative).wildlifeDepthModules;
  assert.deepEqual(current.map(stripCapercaillieToeCourse), previousRaw.exports.wildlifeDepthModules);
  assert.deepEqual(curriculum.learningModules.map(stripCapercaillieToeCourse), before.learningModules);
  assert.deepEqual(createLoader(capercaillieToeBaselineFixture())('lib/learning-curriculum.js').learningModules, before.learningModules);
  const original = before.getLearningModule(addition.courseId);
  assert.deepEqual(course.lessons.slice(0, -1), original.lessons);
  assert.deepEqual(course.questions.slice(0, -2), original.questions);
  assert.deepEqual(course.sources.slice(0, -4), original.sources);
  assert.equal(course.reviewedOn, '2026-10-12');
  assert.equal(curriculum.learningCounts.modules, before.learningCounts.modules);
  assert.equal(curriculum.learningCounts.lessons, before.learningCounts.lessons + 1);
  assert.equal(curriculum.learningCounts.questions, before.learningCounts.questions + 2);
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('The bounded explanation distinguishes named structures, documents each claim and keeps its own date', () => {
  assert.equal(lesson.id, addition.lessonId); assert.equal(lesson.title, 'Zehenstifte');
  assert.equal(lesson.reviewedOn, '2026-11-17'); assert.equal(lesson.flashcardExpansion, true);
  assert.ok(lesson.paragraphs.join(' ').split(/\s+/).length >= 140);
  const text = lesson.paragraphs.join(' ');
  assert.match(text, /Auerhuhn.*Läufe bis zum Zehenansatz befiedert/);
  assert.match(text, /seitlich an den Zehen.*hornige Stifte/);
  assert.match(text, /Balzstifte/); assert.match(text, /keinen ausschließlichen Balzzweck/);
  assert.match(text, /Auftrittsfläche/); assert.match(text, /Alpenschneehuhn.*Befiederung bis über die Zehen/);
  assert.match(text, /verschiedene Strukturen.*ähnlichen Winterfunktion/);
  assert.match(text, /keine Garantie/); assert.match(text, /keine sichere Art-, Geschlechts- oder Altersbestimmung/);
  assert.match(text, /Eigene Papierübung/); assert.match(text, /kein maßstäblicher Bestimmungsschlüssel/);
  assert.doesNotMatch(text, /\d|September|Mai|Millimeter|Zentimeter|umgebildete|Keratin|chemisch/);
  assert.equal(lesson.evidence.length, 2);
  for (const evidence of lesson.evidence) {
    assert.ok(evidence.claim && evidence.sources.length >= 2);
    assert.ok(new Set(evidence.sources.map(source => source.organization)).size >= 2);
    assert.ok(evidence.sources.every(source => addition.urls.includes(source.url) && source.checkedOn === '2026-11-17' && JSON.stringify(source.lessonIds) === JSON.stringify([addition.lessonId])));
  }
});

test('Both real four-choice questions enter all DACH quiz pools once and add exactly two cards while every old card and starter stays exact', () => {
  const previousCards = beforeLoad('lib/learning-flashcards.js').getFlashcards();
  assert.equal(newCards.length, 2); assert.equal(cards.length, previousCards.length + 2);
  assert.deepEqual(cards.filter(card => !newCards.includes(card)), previousCards);
  assert.deepEqual(cards.slice(0, 116), previousCards.slice(0, 116));
  const all = load('data/questions-full.js').QUESTIONS, { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const id of ids) {
    const question = course.questions.find(item => item.id === id), card = newCards.find(item => item.id === `flash-${id}`);
    assert.equal(question.lessonId, addition.lessonId); assert.deepEqual(question.countries, ['DE', 'AT', 'CH']);
    assert.equal(question.answers.length, 4); assert.equal(new Set(question.answers.map(answer => answer.text)).size, 4); assert.equal(question.correct.length, 1);
    assert.ok(question.answers.some(answer => question.correct.includes(answer.id))); assert.ok(question.explain.length > 100);
    assert.equal(curriculum.learningQuestions.filter(item => item.id === id).length, 1);
    for (const country of ['DE', 'AT', 'CH']) assert.equal(quizLearningPool(all, { country, topic: course.topic }).filter(item => item.id === id).length, 1);
    assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(answer => question.correct.includes(answer.id)).text); assert.equal(card.explanation, question.explain);
    assert.equal(card.reviewedOn, '2026-11-17'); assert.equal(card.sourceScope, 'lesson'); assert.equal(card.courseHref, `/kurse/${addition.courseId}#lesson-${addition.lessonId}`);
    assert.deepEqual(card.sources.map(source => source.url), addition.urls);
  }
});

test('Existing subject, Auerhuhn reader, actual course props, shared search and exact-lesson export lead to the added explanation', () => {
  const actual = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: addition.courseId } }).props;
  assert.deepEqual(actual.module.lessons.at(-1), lesson);
  const tree = load('lib/learning-topic-tree.js');
  assert.deepEqual(tree.getLearningTopicLocation(addition.courseId), beforeLoad('lib/learning-topic-tree.js').getLearningTopicLocation(addition.courseId));
  assert.ok(load('lib/wildlife-depth.js').wildlifeDepthBySlug.auerhuhn.courseIds.includes(addition.courseId));
  const search = load('lib/learning-search.js').searchLearning({ query: 'Auerhuhn Zehenstifte', type: 'course' }).results.find(item => item.id === `course:${addition.courseId}`);
  assert.ok(search); assert.equal(search.href, `/kurse/${addition.courseId}#lesson-${addition.lessonId}`);
  assert.equal(Object.hasOwn(search, 'answer'), false); assert.equal(Object.hasOwn(search, 'correct'), false);
  const deck = flashcards.getFlashcardExport({ courseId: addition.courseId, lessonId: addition.lessonId, invalid: false }, { withChoices: true });
  assert.equal(deck.cards.length, 2); assert.ok(deck.cards.every(card => card.choices.length === 4 && card.lessonId === addition.lessonId));
  const printSources = load('pages/lernen/lernkarten-drucken.js').getPrintSourceIndex(newCards).sourceList;
  assert.deepEqual(printSources.map(source => source.url), addition.urls);
});

test('The actual course renderer shows complete learning text and limits before its closed final sources', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server'); let cursor = 0;
  const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? course.lessons.length - 1 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
  const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${addition.courseId}#lesson-${addition.lessonId}` }) },
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
    '../hooks/useCourseProgress': { __esModule: true, default: () => ({}) }, './CourseProgressNotice': { __esModule: true, default: () => null } })('components/LearningCourse.js').default;
  const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: flashcards.getFlashcardLessonSummary(addition.courseId) }));
  const boundary = html.indexOf('<details id="quellen"'); assert.ok(boundary > 0);
  for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, boundary).includes(paragraph));
  for (const url of addition.urls) assert.ok(!html.slice(0, boundary).includes(url) && html.slice(boundary).includes(url));
  assert.ok(!html.slice(boundary).split('>')[0].includes('open')); assert.match(html.slice(boundary), /17\. November 2026/);
});

test('The exact-lesson API protects both new cards and preserves their four choices and lesson-scoped dates', async () => {
  const denied = createLoader({ '../../../../lib/account-access': { getSignedAccountAccess: async () => null } })('app/api/lernen/lernkarten/route.js');
  const allowed = createLoader({ '../../../../lib/account-access': { getSignedAccountAccess: async () => ({ paid: true }) } })('app/api/lernen/lernkarten/route.js');
  const url = `https://jagdlatein.test/api/lernen/lernkarten?kurs=${addition.courseId}&lektion=${addition.lessonId}&choices=1`;
  const blocked = await denied.GET(new Request(url)); assert.equal(blocked.status, 401); assert.doesNotMatch(await blocked.text(), /Zehenstifte|Auftrittsfläche/);
  const response = await allowed.GET(new Request(url)); assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.equal(response.headers.get('vary'), 'Cookie');
  const deck = load('lib/flashcard-payload.js').unpackFlashcards(await response.json());
  assert.equal(deck.cards.length, 2); assert.ok(deck.cards.every(card => card.reviewedOn === '2026-11-17' && card.lessonId === addition.lessonId && card.choices.length === 4));
});

test('The historical appendix helper rejects unrecognised tails and source/date drift instead of hiding unrelated changes', () => {
  for (const mutate of [
    item => item.lessons.push({ id: 'unrelated-tail' }),
    item => { item.lessons.at(-1).reviewedOn = '2026-10-12'; },
    item => item.questions.push({ id: 'unrelated', lessonId: 'other' }),
    item => { item.sources.at(-1).url = 'https://example.test/other'; },
    item => { item.sources.at(-1).lessonIds = ['vergleich']; },
  ]) {
    const changed = structuredClone(course); mutate(changed); assert.throws(() => stripCapercaillieToeCourse(changed));
  }
  const changedOldLesson = structuredClone(course); changedOldLesson.lessons[0].title += ' unapproved';
  assert.notDeepEqual(stripCapercaillieToeCourse(changedOldLesson), before.getLearningModule(addition.courseId));
});
