// Scoped biology, preservation and integration checks; not scientific certification.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
const { createLoader: createProjectLoader, local, root } = require('./helpers/project-module.cjs');
const { digestionAbsorptionBaselineFixture } = require('./helpers/digestion-absorption-addition-nov08.cjs');
const { courseId, lessonIds, questionIds, sourceURLs: urls, sourceScopes, stripRootAbsorptionAddition, stripRootAbsorptionDataset } = require('./helpers/root-absorption-additions-nov08.cjs');
const createLoader = overrides => createProjectLoader(digestionAbsorptionBaselineFixture(overrides));
const raw = require('../data/learning-exam-habitat-2026-10-18.json');
const load = createLoader(), curriculum = load('lib/learning-curriculum.js'), course = curriculum.getLearningModule(courseId);
const tools = load('lib/learning-flashcards.js'), cards = tools.getFlashcards();
const newIds = questionIds.map(id => `${courseId}-${id}`), newCardIds = newIds.map(id => `flash-${id}`);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expectedSources = [[urls[0], urls[1], urls[2]], [urls[1], urls[2], urls[3]]];

test('Two exact tail lessons/questions, four scoped sources and two evidence records preserve the entire e6b1d55 soil dataset', () => {
  assert.equal(hash(stripRootAbsorptionDataset(raw)), '12e01f4fec38e33386463fca5d7e06dadbdace00e99499f373b2af2a7239a7df');
  assert.equal(hash(stripRootAbsorptionAddition(course)), 'da82fb1543f7374569b12e3c9cef7dfc59d98a21cc1aa3bd54985d529dadb0a7');
  assert.equal(raw.reviewedOn, '2026-10-18'); assert.equal(course.reviewedOn, '2026-10-18'); assert.equal(course.sourceReview.reviewedOn, '2026-10-18');
  assert.equal(course.lessons.length, 6); assert.equal(course.questions.length, 18); assert.equal(course.sources.length, 12);
  assert.deepEqual(course.lessons.slice(0, 4).map(item => item.id), ['wasserbindung', 'speichergrenzen', 'wurzelraumspeicher', 'wasserwege-stress']);
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('All 198 full old courses and 1769 complete old cards including 116 starters retain content and order', () => {
  assert.deepEqual(curriculum.learningCounts, { modules: 198, lessons: 888, questions: 2763 });
  assert.equal(hash(curriculum.learningModules.map(stripRootAbsorptionAddition)), '58cd263f12d340a62d818241e051703a62e13284f0e9ce932164ba67756b2b74');
  assert.equal(hash(curriculum.learningModules.filter(item => item.id !== courseId)), 'a1e4001b56970c697e5ec4bf4b2b3e7db820ed3080e8305274d7bd927dcf3b77');
  assert.equal(cards.length, 1771);
  assert.equal(hash(cards.filter(item => !newCardIds.includes(item.id))), '7ab48c32e7be53876d79d0dc39efd7a7b97ee3f9eefbf815b7d31540100f60cb');
  assert.equal(hash(cards.slice(0, 116)), '54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
});

test('Wurzelhaare add individual-cell origin and contact surface while distinguishing depth, root organ and fungal hypha', () => {
  const lesson = course.lessons.find(item => item.id === lessonIds[0]), text = lesson.paragraphs.join(' ');
  assert.equal(text.split(/\s+/).length, 122);
  assert.match(text, /Ausstülpung einer einzelnen Zelle/); assert.match(text, /Rhizodermis/);
  assert.match(text, /Reifungszone einer jungen Wurzel/); assert.match(text, /Oberfläche.*vergrößern/);
  assert.match(text, /Wasser und gelösten mineralischen Nährstoffen/); assert.match(text, /andere Betrachtungsebene.*Durchwurzelungstiefe/);
  assert.match(text, /kein mehrzelliges Seitenwurzelorgan und kein Pilzfaden/);
  assert.match(text, /weder, dass jede Wurzel Wurzelhaare trägt/); assert.match(text, /alles Wasser ausschließlich/);
  assert.match(text, /Eigene Prüfungsübung/);
  assert.doesNotMatch(text, /\d|Prozent|Millimeter|Zentimeter|Dichte|Ertragssteigerung|Absterben/);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [urls.slice(0, 3), urls.slice(1, 3)]);
});

test('Endodermis interrupts the pure cell-wall route with possible earlier membrane entry and a bounded young-root model', () => {
  const lesson = course.lessons.find(item => item.id === lessonIds[1]), text = lesson.paragraphs.join(' ');
  assert.equal(text.split(/\s+/).length, 143);
  assert.match(text, /jungen, primär gebauten Wurzel/); assert.match(text, /innerste Schicht der Wurzelrinde/);
  assert.match(text, /Zentralzylinder mit den Leitgeweben/); assert.match(text, /außerhalb der Zellmembranen heißt apoplastischer Weg/);
  assert.match(text, /unterbrechen den durchgehenden freien Zellwandweg/); assert.match(text, /Membranübertritt wird erforderlich/);
  assert.match(text, /bereits weiter außen erfolgt/); assert.match(text, /nicht zwangsläufig erst an der Endodermis/);
  assert.match(text, /keine vollständige Sperre gegen jedes Gift oder jeden Krankheitserreger/);
  assert.match(text, /weder alle Entwicklungsstadien.*noch gemessene Leistungen einer Baumart/);
  assert.doesNotMatch(text, /\d|Suberin|Lignin|Wachs|ausschließlich in Wurzeln|Pestizid|Bewässerung|Düngung/);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [urls.slice(1, 3), urls.slice(1)]);
});

test('New dates and actual independent source roles are confined to the two appendices without photograph or a global review promise', () => {
  for (const lesson of course.lessons.slice(-2)) { assert.equal(lesson.reviewedOn, '2026-11-08'); assert.equal(lesson.flashcardExpansion, true); assert.equal(lesson.image, undefined); }
  assert.deepEqual(course.sources.slice(-4).map(item => item.url), urls);
  assert.ok(course.sources.slice(-4).every((item, index) => item.checkedOn === '2026-11-08' && JSON.stringify(item.lessonIds) === JSON.stringify(sourceScopes[index])));
  assert.match(course.sources.at(-4).supports, /Review, Abstract und Introduction/);
  assert.match(course.sources.at(-3).supports, /Suberin-Vereinfachung.*nicht übernommen/);
  assert.match(course.sources.at(-2).supports, /verschiedene Sprachfassungen zählen nur einmal/);
  assert.match(course.sources.at(-1).supports, /Originalarbeit, Abstract, Introduction und erster Results-Block/);
  assert.match(course.sources.at(-1).supports, /keine unabhängige Wiederholung/);
  assert.ok(course.lessons.slice(0, 4).every(item => item.evidence.every(record => record.sources.every(source => !urls.includes(source.url)))));
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.ok(lessonIds.every(id => props.lessonPhotos[id] === undefined));
});

test('Two own four-answer recall questions become two actual dated source-specific cards in every DACH learning pool', () => {
  const selected = course.questions.filter(item => lessonIds.includes(item.lessonId)); assert.deepEqual(selected.map(item => item.id), newIds);
  const all = load('data/questions-full.js').QUESTIONS, { quizLearningPool } = load('lib/quiz-learning-scope.js');
  selected.forEach((question, index) => {
    assert.equal(new Set(question.answers.map(item => item.text)).size, 4); assert.equal(question.correct.length, 1);
    assert.equal(curriculum.learningQuestions.filter(item => item.q === question.q).length, 1);
    for (const country of ['CH', 'AT', 'DE']) assert.ok(quizLearningPool(all, { country, topic: course.topic }).some(item => item.id === question.id));
    const card = cards.find(item => item.id === `flash-${question.id}`); assert.ok(card, 'An actual standalone flashcard must exist, not merely a quiz question');
    assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(item => question.correct.includes(item.id)).text);
    assert.equal(card.explanation, question.explain); assert.equal(card.reviewedOn, '2026-11-08'); assert.equal(card.sourceScope, 'lesson');
    assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${question.lessonId}`);
    assert.deepEqual(card.sources.map(item => item.url), expectedSources[index]);
  });
});

test('Existing soil category, direct course reader, shared search and real selected-card exports connect both lessons', () => {
  assert.deepEqual(load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId), { categorySlug: 'landwirtschaft-lebensraeume', groupId: 'boden-wasserhaushalt', groupTitle: 'Böden & Wasserhaushalt' });
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.slice(-2), course.lessons.slice(-2));
  lessonIds.forEach((lessonId, index) => {
    const result = load('lib/learning-search.js').searchLearning({ query: index === 0 ? 'Wurzelhaare' : 'Caspary-Streifen', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
    assert.equal(result.href, `/kurse/${courseId}#lesson-${lessonId}`); assert.equal(props.flashcards.lessons[lessonId], 1);
    const exported = tools.getFlashcardExport({ courseId, lessonId }); assert.equal(exported.cards.length, 1);
    assert.equal(exported.selection.returnHref, `/kurse/${courseId}#lesson-${lessonId}`); assert.equal(exported.cards[0].id, newCardIds[index]);
  });
});

test('Both real readers place complete explanations and scope before closed final sources, with exact lesson evidence inside the course appendix', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  lessonIds.forEach((id, index) => {
    const lesson = course.lessons[4 + index]; let cursor = 0;
    const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? 4 + index : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
    const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${courseId}#lesson-${id}` }) },
      './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
      './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
      '../hooks/useCourseProgress': { __esModule: true, default: () => ({}) }, './CourseProgressNotice': { __esModule: true, default: () => null } })('components/LearningCourse.js').default;
    const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: tools.getFlashcardLessonSummary(courseId) }));
    const boundary = html.indexOf('<details id="quellen"'); assert.ok(boundary > 0);
    for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, boundary).includes(paragraph));
    assert.ok(expectedSources[index].every(url => !html.slice(0, boundary).includes(url) && html.slice(boundary).includes(url)));
    const lessonEvidence = html.slice(boundary, html.indexOf('Eigene Lerntexte und Übungsfragen', boundary));
    assert.ok(expectedSources[index].every(url => lessonEvidence.includes(url)));
    const excluded = urls.filter(url => !expectedSources[index].includes(url)); assert.ok(excluded.every(url => !lessonEvidence.includes(url)));
    assert.match(html.slice(boundary), /Alle Quellen dieses Themenbereichs/);
    assert.match(html, new RegExp(`Lektion ${5 + index} von 6`));
    assert.match(html.slice(boundary), /8\. November 2026/); assert.doesNotMatch(html.slice(boundary), /18\. Oktober 2026/);
    assert.ok(!html.slice(boundary).split('>')[0].includes('open'));
  });
});

test('The protected exact-lesson card API and actual print reader retain complete answers, source scope and dates without an unauthenticated leak', async () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  const denied = createLoader({ '../../../../lib/account-access': { getSignedAccountAccess: async () => null } })('app/api/lernen/lernkarten/route.js');
  const noAccess = await denied.GET(new Request(`https://jagdlatein.test/api/lernen/lernkarten?kurs=${courseId}&lektion=endodermis`));
  assert.equal(noAccess.status, 401); assert.doesNotMatch(await noAccess.text(), /Membranübertritt|Caspary|Rhizodermis/);
  const route = createLoader({ '../../../../lib/account-access': { getSignedAccountAccess: async () => ({ paid: true }) } })('app/api/lernen/lernkarten/route.js');
  for (let index = 0; index < lessonIds.length; index++) {
    const lessonId = lessonIds[index], response = await route.GET(new Request(`https://jagdlatein.test/api/lernen/lernkarten?kurs=${courseId}&lektion=${lessonId}`));
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.equal(response.headers.get('vary'), 'Cookie');
    const deck = load('lib/flashcard-payload.js').unpackFlashcards(await response.json());
    assert.deepEqual(deck.cards, cards.filter(item => item.moduleId === courseId && item.lessonId === lessonId)); assert.equal(deck.cards.length, 1);
    const Print = createLoader({ 'next/router': { useRouter: () => ({ isReady: true, query: {} }) },
      '../../components/useFlashcardDeck': { __esModule: true, default: () => ({ ...deck, incomplete: false }) },
      '../../components/LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
      '../../components/PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} } })('pages/lernen/lernkarten-drucken.js').default;
    const html = renderToStaticMarkup(React.createElement(Print)), appendix = html.indexOf('id="lernkarten-quellen"'); assert.ok(appendix > 0);
    for (const card of deck.cards) { assert.ok(html.indexOf(card.answer) < appendix); assert.ok(html.indexOf(card.explanation) < appendix); }
    assert.match(html, /Stand der Ausgangslektion: 8\.11\.2026/); assert.ok(expectedSources[index].every(url => html.slice(appendix).includes(url)));
  }
});

test('Isolated signed offline packs preserve all six full lessons and scoped evidence while retaining the old course date', () => {
  const saved = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-root-absorption-offline-fixture';
  try {
    const now = Date.parse('2026-11-08T11:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'offline-fixture@example.invalid', paidUntil: '2026-11-10T11:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(validate(pack, now), true); assert.equal(validate(pack, pack.expiresAt), false);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-18'); assert.deepEqual(pack.courses[0].lessons, course.lessons); assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.ok(pack.courses[0].lessons.slice(-2).every(item => item.reviewedOn === '2026-11-08' && item.evidence.length === 2));
  } finally { if (saved === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = saved; }
});
