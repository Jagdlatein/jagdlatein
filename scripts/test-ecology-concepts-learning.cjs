const { winterForestBaselineFixture } = require('./helpers/winter-forest-baseline-nov08.cjs');
// Exact preservation and integration checks; no scientific certification.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
const { createLoader: createProjectLoader, local, root } = require('./helpers/project-module.cjs');
const { digestionAbsorptionBaselineFixture } = require('./helpers/digestion-absorption-addition-nov08.cjs');
const { rootAbsorptionBaselineFixture } = require('./helpers/root-absorption-additions-nov08.cjs');
const createLoader = overrides => createProjectLoader(winterForestBaselineFixture(rootAbsorptionBaselineFixture(digestionAbsorptionBaselineFixture(overrides))));
const { courseId, lessonIds, questionIds, sourceURLs: urls, stripEcologyConceptAddition } = require('./helpers/ecology-concepts-addition-nov08.cjs');
const load = createLoader(), curriculum = load('lib/learning-curriculum.js'), course = curriculum.getLearningModule(courseId);
const tools = load('lib/learning-flashcards.js'), cards = tools.getFlashcards();
const newIds = questionIds.map(id => `${courseId}-${id}`), newCardIds = newIds.map(id => `flash-${id}`);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('Only two exact tail lessons/questions and seven scoped sources extend the full 98fc900 wildlife module and old course', () => {
  assert.equal(hash(load('lib/learning-wildlife.js').wildlifeModules.map(stripEcologyConceptAddition)), 'c98bb8ee45be5ddac71f3f72e25395b7df4988f15e281eb5bb1dd48a594ce59a');
  assert.equal(hash(stripEcologyConceptAddition(course)), 'bb1895d360087da13d0636bf49ef86cd5ff1ee6f931bb6e7afd3ffbdaf204743');
  assert.equal(course.reviewedOn, '2026-10-04');
  assert.equal(course.lessons.length, 5); assert.equal(course.questions.length, 10); assert.equal(course.sources.length, 11);
  assert.deepEqual(course.lessons.slice(0, 3).map(item => item.id), ['biotop-funktion', 'biotop-netz', 'biotop-planung']);
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('All 198 complete old course objects and all 1767 old cards including 116 starters retain content and order', () => {
  assert.deepEqual(curriculum.learningCounts, { modules: 198, lessons: 886, questions: 2761 });
  assert.equal(hash(curriculum.learningModules.map(stripEcologyConceptAddition)), '94d662c9b0a8e895c082e0f2a88ba26a0e9bddb6f6fb42bac8520a4881ebda14');
  assert.equal(hash(curriculum.learningModules.filter(item => item.id !== courseId)), 'd485bf042e6d1e4022a55ecafb632846024f3ec3db03417b74bb635d45d3820f');
  assert.equal(cards.length, 1769);
  assert.equal(hash(cards.filter(item => !newCardIds.includes(item.id))), '11b37e129c74c8e2f81ddc1a916420cdc2dd763452d71b725b003b5851f5c07a');
  assert.equal(hash(cards.slice(0, 116)), '54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
});

test('Biotop and Biozönose distinguish habitat, the full living community and the interacting ecosystem', () => {
  const lesson = course.lessons.find(item => item.id === lessonIds[0]), text = lesson.paragraphs.join(' ');
  assert.equal(lesson.title, 'Biotop und Biozönose'); assert.equal(text.split(/\s+/).length, 129);
  assert.match(text, /Ein Biotop ist der Lebensraum einer Lebensgemeinschaft/);
  assert.match(text, /Pflanzen, Tiere, Pilze und Mikroorganismen/);
  assert.match(text, /mehr als die jagdbaren Tiere/); assert.match(text, /Wechselwirkungen zwischen ihnen/);
  assert.match(text, /Unbelebte, also abiotische Bedingungen/);
  assert.match(text, /Eigene Prüfungsübung/); assert.match(text, /keine rechtliche Schutzgebietseinstufung/);
  assert.doesNotMatch(text, /\d|Konkurrenzausschluss|Schutzgebiet ist|Kartenmaßstab/);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [urls.slice(0, 4), urls.slice(2, 4)]);
});

test('Habitat and niche connect the existing habitat-quality lesson to conditions, resources and relations without a universal language rule', () => {
  const lesson = course.lessons.find(item => item.id === lessonIds[1]), text = lesson.paragraphs.join(' ');
  assert.equal(lesson.title, 'Habitat und Nische'); assert.equal(text.split(/\s+/).length, 151);
  assert.match(text, /sprichst du hier von ihrem Habitat/); assert.match(text, /bereits behandelte Habitatqualität/);
  assert.match(text, /physikalischen und biologischen Voraussetzungen/); assert.match(text, /Ressourcennutzung und Beziehungen zu anderen Arten/);
  assert.match(text, /keine kleine räumliche Ecke und keinen Punkt auf der Karte/);
  assert.match(text, /Eigene Prüfungsübung/); assert.match(text, /keine vollständige Nische einer wirklichen Art/);
  assert.doesNotMatch(text, /\d|Fundamentalnische|Realnische|Konkurrenzausschluss|immer nur eine Art|niemals Biotop/);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [[urls[4], urls[6]], urls.slice(4)]);
});

test('Only new lessons receive the true new date and exact source scope; no borrowed photograph or global re-review appears', () => {
  for (const lesson of course.lessons.slice(-2)) { assert.equal(lesson.reviewedOn, '2026-11-08'); assert.equal(lesson.flashcardExpansion, true); assert.equal(lesson.image, undefined); }
  assert.deepEqual(course.sources.slice(-7).map(item => item.url), urls);
  assert.ok(course.sources.slice(-7).every((item, index) => item.checkedOn === '2026-11-08' && JSON.stringify(item.lessonIds) === JSON.stringify([lessonIds[index < 4 ? 0 : 1]])));
  assert.match(course.sources.at(-1).supports, /keine zweite unabhängige Institution/);
  assert.match(course.sources.at(-2).supports, /keine Volllektüre des Lehrbuchs/);
  assert.ok(course.lessons.slice(0, 3).every(item => !item.evidence && !item.reviewedOn));
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.ok(lessonIds.every(id => props.lessonPhotos[id] === undefined));
});

test('Two unique own four-answer questions enter each DACH pool and become exactly sourced dated standalone cards', () => {
  const selected = course.questions.filter(item => lessonIds.includes(item.lessonId)); assert.deepEqual(selected.map(item => item.id), newIds);
  const all = load('data/questions-full.js').QUESTIONS, { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const question of selected) {
    assert.equal(new Set(question.answers.map(item => item.text)).size, 4); assert.equal(question.correct.length, 1);
    assert.equal(curriculum.learningQuestions.filter(item => item.q === question.q).length, 1);
    for (const country of ['CH', 'AT', 'DE']) assert.ok(quizLearningPool(all, { country, topic: course.topic }).some(item => item.id === question.id));
    const card = cards.find(item => item.id === `flash-${question.id}`); assert.ok(card);
    assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(item => question.correct.includes(item.id)).text);
    assert.equal(card.explanation, question.explain); assert.equal(card.reviewedOn, '2026-11-08'); assert.equal(card.sourceScope, 'lesson');
    assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${question.lessonId}`);
    assert.deepEqual(new Set(card.sources.map(item => item.url)), new Set(question.lessonId === lessonIds[0] ? urls.slice(0, 4) : urls.slice(4)));
  }
});

test('The existing nature branch, course, exact lesson searches and scoped exports connect both concepts', () => {
  assert.equal(load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId).categorySlug, 'natur-revier');
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.slice(-2), course.lessons.slice(-2));
  for (const lessonId of lessonIds) {
    const query = lessonId === lessonIds[0] ? 'Biozönose' : 'ökologische Nische';
    const result = load('lib/learning-search.js').searchLearning({ query, type: 'course' }).results.find(item => item.id === `course:${courseId}`);
    assert.equal(result.href, `/kurse/${courseId}#lesson-${lessonId}`); assert.equal(props.flashcards.lessons[lessonId], 1);
    const exported = tools.getFlashcardExport({ courseId, lessonId }); assert.equal(exported.cards.length, 1);
    assert.equal(exported.selection.returnHref, `/kurse/${courseId}#lesson-${lessonId}`); assert.ok(newCardIds.includes(exported.cards[0].id));
  }
});

test('Real readers show complete learning and important limits before closed final sources with the actual lesson date', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  for (let offset = 0; offset < 2; offset++) {
    const lesson = course.lessons[3 + offset]; let cursor = 0;
    const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? 3 + offset : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
    const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${courseId}#lesson-${lesson.id}` }) },
      './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
      './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
      '../hooks/useCourseProgress': { __esModule: true, default: () => ({}) }, './CourseProgressNotice': { __esModule: true, default: () => null } })('components/LearningCourse.js').default;
    const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: tools.getFlashcardLessonSummary(courseId) }));
    const boundary = html.indexOf('<details id="quellen"'); assert.ok(boundary > 0);
    for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, boundary).includes(paragraph));
    assert.ok((offset === 0 ? urls.slice(0, 4) : urls.slice(4)).every(url => !html.slice(0, boundary).includes(url) && html.slice(boundary).includes(url)));
    assert.match(html, new RegExp(`Lektion ${4 + offset} von 5`));
    assert.match(html.slice(boundary), /8\. November 2026/); assert.doesNotMatch(html.slice(boundary), /4\. Oktober 2026/);
    assert.ok(!html.slice(boundary).split('>')[0].includes('open'));
  }
});

test('Protected exact-lesson card API and actual print output preserve each answer, scoped sources and lesson date', async () => {
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
    assert.ok((lessonId === lessonIds[0] ? urls.slice(0, 4) : urls.slice(4)).every(url => html.slice(appendix).includes(url)));
  }
});

test('An expiring isolated offline pack preserves both complete new lessons and evidence without changing the course date', () => {
  const saved = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-ecology-concepts-offline-fixture';
  try {
    const now = Date.parse('2026-11-08T11:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'offline-fixture@example.invalid', paidUntil: '2026-11-10T11:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(validate(pack, now), true); assert.equal(validate(pack, pack.expiresAt), false);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-04'); assert.deepEqual(pack.courses[0].lessons, course.lessons); assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.ok(pack.courses[0].lessons.slice(-2).every(item => item.reviewedOn === '2026-11-08' && item.evidence.length === 2));
  } finally { if (saved === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = saved; }
});
