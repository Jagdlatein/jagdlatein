// Narrow preservation/integration tests; scientific reading is recorded separately.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
const { createLoader: createProjectLoader, local, root } = require('./helpers/project-module.cjs');
const { foodSporesToxinsBaselineFixture } = require('./helpers/food-spores-toxins-additions-nov08.cjs');
const createLoader = overrides => createProjectLoader(foodSporesToxinsBaselineFixture(overrides));
const { courseId, lessonIds, questionIds, sourceURLs: urls, stripFeatherFieldsAddition, stripFeatherFieldsDataset } = require('./helpers/feather-fields-additions-nov08.cjs');
const raw = require('../data/learning-expansion-wildlife-dogs-2026-10-16.json');
const load = createLoader(), curriculum = load('lib/learning-curriculum.js'), course = curriculum.getLearningModule(courseId);
const tools = load('lib/learning-flashcards.js'), cards = tools.getFlashcards();
const newIds = questionIds.map(id => `${courseId}-${id}`), newCardIds = newIds.map(id => `flash-${id}`);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('Only the two exact tail lessons, three questions, four sources and two evidence records extend the complete 9814c5d dataset', () => {
  assert.equal(hash(stripFeatherFieldsDataset(raw)), '1f3b367da031c9ac913cbcac4e5c0b1ba478ace02a2a812f7166590d41466546');
  assert.equal(hash(stripFeatherFieldsAddition(course)), '336510e99cee51948e9d71e4de75a75b56cdbea4b90485cdc7772d7c058ff138');
  assert.equal(raw.reviewedOn, '2026-10-16'); assert.equal(course.reviewedOn, '2026-10-16');
  assert.equal(course.lessons.length, 10); assert.equal(course.questions.length, 25); assert.equal(course.sources.length, 14);
  assert.deepEqual(course.lessons.slice(0, 8).map(item => item.id), ['feinbau', 'waerme', 'farbe', 'pflege', 'wasserschutz', 'federwachstum', 'schwingen', 'steuerfedern']);
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('All 198 complete old courses and all 1762 old full cards including 116 starters retain content and order', () => {
  assert.deepEqual(curriculum.learningCounts, { modules: 198, lessons: 882, questions: 2757 });
  assert.equal(hash(curriculum.learningModules.map(stripFeatherFieldsAddition)), 'bc988ef6d2f76e4bbc5dfb5a8270f5bb9515799482ffba3b3ef31bb4e5d90ba1');
  assert.equal(hash(curriculum.learningModules.filter(item => item.id !== courseId)), '07e326339751036efdf573be2c0e48de95c51c73c39abf2d66abdeea61448e9f');
  assert.equal(cards.length, 1765);
  assert.equal(hash(cards.filter(item => !newCardIds.includes(item.id))), '56746d828571230a4b95dff4c2f2c6f6d6452fd539c675ad8fe25bd0a6581c45');
  assert.equal(hash(cards.slice(0, 116)), '54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
});

test('Federfluren distinguish skin attachment from outside coverage without an absolute all-species bare-zone claim', () => {
  const lesson = course.lessons.find(item => item.id === 'federfluren'), text = lesson.paragraphs.join(' ');
  assert.equal(lesson.title, 'Federfluren'); assert.equal(text.split(/\s+/).length, 147);
  assert.match(text, /Bei vielen Vögeln.*Federfluren oder Pterylae/);
  assert.match(text, /federfreie oder schwächer befiederte Zwischenfelder/);
  assert.match(text, /größere Federn können solche Zwischenfelder überdecken/);
  assert.match(text, /keine für sämtliche Vogelarten identische Flurkarte/);
  assert.match(text, /eigenes Lernschema/); assert.match(text, /Foto.*zeigt die genaue Grenze jeder Flur nicht zwangsläufig/);
  assert.doesNotMatch(text, /\d|Prozent|Temperatur|Kühlung|Kuehlung|Pinguin|Strauß|Daumenfittich|Brutfleck/);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [urls.slice(0, 3), [urls[0], urls[2]]]);
});

test('Fadenfedern distinguish hairlike feather shape and skin receptors while limiting the original pigeon evidence', () => {
  const lesson = course.lessons.find(item => item.id === 'fadenfedern'), text = lesson.paragraphs.join(' ');
  assert.equal(lesson.title, 'Fadenfedern'); assert.equal(text.split(/\s+/).length, 146);
  assert.match(text, /Filoplumen/); assert.match(text, /Schaft mit wenigen oder keinen Ästen; vorhandene Äste sitzen an der Spitze/);
  assert.match(text, /Haut- und Follikelbereich liegen Sinnesrezeptoren/);
  assert.match(text, /nicht in einer vermeintlichen Nervenleitung durch den freien Federschaft/);
  assert.match(text, /Taubenuntersuchung/); assert.match(text, /keine für alle Wildvogelarten gleiche Empfindlichkeit/);
  assert.match(text, /beweisen nicht jede vermutete Bedeutung für den Flug/);
  assert.doesNotMatch(text, /\d|Prozent|Sekunde|Hertz|Reaktionszeit|Luftgeschwindigkeit|Versuchsanleitung|Abschneiden|Zupfen/);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [urls.slice(0, 2), [urls[3], urls[1], urls[2]]]);
  assert.ok(lesson.evidence[1].claim.includes('wiederholen diesen Versuch aber nicht'));
});

test('Only the new lessons use the actual new review date and four precisely scoped source roles; no new false teaching image appears', () => {
  for (const lesson of course.lessons.slice(-2)) {
    assert.equal(lesson.reviewedOn, '2026-11-08'); assert.equal(lesson.flashcardExpansion, true);
    assert.equal(lesson.image, undefined); assert.equal(lesson.diagram, undefined);
  }
  assert.deepEqual(course.sources.slice(-4).map(item => item.url), urls);
  assert.ok(course.sources.slice(-4).every((item, index) => item.checkedOn === '2026-11-08' && JSON.stringify(item.lessonIds) === JSON.stringify(index === 3 ? ['fadenfedern'] : lessonIds)));
  assert.match(course.sources.at(-1).supports, /öffentlich lesbare Original-Summary.*kein Volltext/);
  assert.match(course.sources.at(-1).supports, /keine Wiederholung dieses Versuchs/);
  assert.ok(course.lessons.slice(0, 8).every(item => item.evidence.every(record => record.sources.every(source => !urls.includes(source.url)))));
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.ok(lessonIds.every(id => props.lessonPhotos[id] === undefined));
});

test('Three nonredundant own four-answer questions enter shared DACH quizzes and yield three standalone precisely sourced dated cards', () => {
  const selected = course.questions.filter(item => lessonIds.includes(item.lessonId));
  assert.deepEqual(selected.map(item => item.id), newIds);
  assert.equal(new Set(selected.map(item => item.q)).size, 3);
  const all = load('data/questions-full.js').QUESTIONS, { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const question of selected) {
    assert.equal(new Set(question.answers.map(item => item.text)).size, 4); assert.equal(question.correct.length, 1);
    assert.equal(curriculum.learningQuestions.filter(item => item.q === question.q).length, 1);
    for (const country of ['CH', 'AT', 'DE']) assert.ok(quizLearningPool(all, { country, topic: 'Wildkunde' }).some(item => item.id === question.id));
    const card = cards.find(item => item.id === `flash-${question.id}`); assert.ok(card);
    assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(item => question.correct.includes(item.id)).text);
    assert.equal(card.explanation, question.explain); assert.equal(card.reviewedOn, '2026-11-08'); assert.equal(card.sourceScope, 'lesson');
    assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${question.lessonId}`);
    assert.deepEqual(new Set(card.sources.map(item => item.url)), new Set(question.lessonId === 'federfluren' ? urls.slice(0, 3) : urls));
  }
});

test('Existing category and course route, both exact lesson search links and filtered exports connect the appendix without new categories', () => {
  assert.equal(load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId).categorySlug, 'wildkunde');
  const page = load('pages/kurse/[slug].js'), props = page.getStaticProps({ params: { slug: courseId } }).props;
  assert.equal(props.module.id, courseId); assert.deepEqual(props.module.lessons.slice(-2), course.lessons.slice(-2));
  for (const lessonId of lessonIds) {
    const result = load('lib/learning-search.js').searchLearning({ query: lessonId, category: 'wildkunde', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
    assert.equal(result.href, `/kurse/${courseId}#lesson-${lessonId}`);
    const count = lessonId === 'federfluren' ? 1 : 2;
    assert.equal(props.flashcards.lessons[lessonId], count);
    const exported = tools.getFlashcardExport({ courseId, lessonId }); assert.equal(exported.cards.length, count);
    assert.equal(exported.selection.returnHref, `/kurse/${courseId}#lesson-${lessonId}`);
    assert.ok(exported.cards.every(item => newCardIds.includes(item.id)));
  }
});

test('Both actual lesson views put all learning text and visible limits before closed final sources using only each new lesson date', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  for (let offset = 0; offset < 2; offset++) {
    const lesson = course.lessons[8 + offset]; let cursor = 0;
    const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? 8 + offset : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
    const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${courseId}#lesson-${lesson.id}` }) },
      './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
      './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
      '../hooks/useCourseProgress': { __esModule: true, default: () => ({}) }, './CourseProgressNotice': { __esModule: true, default: () => null } })('components/LearningCourse.js').default;
    const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: tools.getFlashcardLessonSummary(courseId) }));
    const boundary = html.indexOf('<details id="quellen"'); assert.ok(boundary > 0);
    for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, boundary).includes(paragraph));
    const needed = lesson.id === 'federfluren' ? urls.slice(0, 3) : urls;
    assert.ok(needed.every(url => !html.slice(0, boundary).includes(url) && html.slice(boundary).includes(url)));
    assert.match(html, new RegExp(`Lektion ${9 + offset} von 10`));
    assert.match(html.slice(boundary), /8\. November 2026/); assert.doesNotMatch(html.slice(boundary), /16\. Oktober 2026/);
    assert.ok(!html.slice(boundary).split('>')[0].includes('open'));
  }
});

test('Protected exact-lesson card delivery and actual print markup preserve dates, answers and source appendices', async () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  const route = createLoader({ '../../../../lib/account-access': { getSignedAccountAccess: async () => ({ paid: true }) } })('app/api/lernen/lernkarten/route.js');
  for (const lessonId of lessonIds) {
    const response = await route.GET(new Request(`https://jagdlatein.test/api/lernen/lernkarten?kurs=${courseId}&lektion=${lessonId}`));
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.equal(response.headers.get('vary'), 'Cookie');
    const deck = load('lib/flashcard-payload.js').unpackFlashcards(await response.json());
    assert.deepEqual(deck.cards, cards.filter(item => item.moduleId === courseId && item.lessonId === lessonId));
    const Print = createLoader({ 'next/router': { useRouter: () => ({ isReady: true, query: {} }) },
      '../../components/useFlashcardDeck': { __esModule: true, default: () => ({ ...deck, incomplete: false }) },
      '../../components/LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
      '../../components/PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} } })('pages/lernen/lernkarten-drucken.js').default;
    const html = renderToStaticMarkup(React.createElement(Print)), appendix = html.indexOf('id="lernkarten-quellen"'); assert.ok(appendix > 0);
    for (const card of deck.cards) { assert.ok(html.indexOf(card.answer) < appendix); assert.ok(html.indexOf(card.explanation) < appendix); }
    assert.match(html, /Stand der Ausgangslektion: 8\.11\.2026/);
    assert.ok((lessonId === 'federfluren' ? urls.slice(0, 3) : urls).every(url => html.slice(appendix).includes(url)));
  }
});

test('An expiring isolated offline pack retains old content, both full new lessons and evidence while preserving the old course date', () => {
  const saved = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-feather-fields-offline-fixture';
  try {
    const now = Date.parse('2026-11-08T11:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'offline-fixture@example.invalid', paidUntil: '2026-11-10T11:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(validate(pack, now), true); assert.equal(validate(pack, pack.expiresAt), false);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-16');
    assert.deepEqual(pack.courses[0].lessons, course.lessons); assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.ok(pack.courses[0].lessons.slice(-2).every(item => item.reviewedOn === '2026-11-08' && item.evidence.length === 2));
  } finally { if (saved === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = saved; }
});
