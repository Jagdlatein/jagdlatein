// Exact append-only preservation and integration; no scientific certification.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
const { createLoader: createProjectLoader, local, root } = require('./helpers/project-module.cjs');
const { forestRegenerationBaselineFixture } = require('./helpers/forest-regeneration-additions-nov08.cjs');
const createLoader = overrides => createProjectLoader(forestRegenerationBaselineFixture(overrides));
const { courseId, lessonIds, questionIds, sourceURLs: urls, sourceScopes, stripMarmotHibernationAddition } = require('./helpers/marmot-hibernation-addition-nov08.cjs');
const load = createLoader(), curriculum = load('lib/learning-curriculum.js'), course = curriculum.getLearningModule(courseId);
const tools = load('lib/learning-flashcards.js'), cards = tools.getFlashcards();
const newIds = questionIds.map(id => `${courseId}-${id}`), newCardIds = newIds.map(id => `flash-${id}`);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('Only two tail lessons/questions and three scoped sources extend the complete d5bb4f0 wildlife-depth export and alpine course', () => {
  assert.equal(hash(load('lib/learning-wildlife-depth.js').wildlifeDepthModules.map(stripMarmotHibernationAddition)), '628e4f40b97325bff81524a0b1e41d1375df7eb81f60a9f0ef4222f7bdbc47db');
  assert.equal(hash(stripMarmotHibernationAddition(course)), '815f7bb8602d168b714af273db8e99e219e956e66b571fd75fc84813bef87cfe');
  assert.equal(course.reviewedOn, '2026-10-12');
  assert.equal(course.lessons.length, 7); assert.equal(course.questions.length, 12); assert.equal(course.sources.length, 13);
  assert.deepEqual(course.lessons.slice(0, 5).map(item => item.id), ['horn', 'einstaende', 'gruppen', 'winter', 'protokoll']);
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('All 198 full old courses and all 1773 old cards including 116 starters preserve content and order', () => {
  assert.deepEqual(curriculum.learningCounts, { modules: 198, lessons: 892, questions: 2767 });
  assert.equal(hash(curriculum.learningModules.map(stripMarmotHibernationAddition)), '46e9a61194fd23536c5782c12edf1ca0ad85bfee1043d3b044beae2f462d0fca');
  assert.equal(hash(curriculum.learningModules.filter(item => item.id !== courseId)), 'bcdf9be0bd444f2c434a6e7438e544d8cc5e1a8118188ea65284990b4f7376de');
  assert.equal(cards.length, 1775);
  assert.equal(hash(cards.filter(item => !newCardIds.includes(item.id))), '527bfdba701b5785a6ba9c12d1449e4f2bfd10e7fbc1ae538b91549a74535b1c');
  assert.equal(hash(cards.slice(0, 116)), '54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
});

test('Regulated hibernation teaches metabolism and temperature together with immediate species and diagnostic boundaries', () => {
  const lesson = course.lessons.find(item => item.id === lessonIds[0]), text = lesson.paragraphs.join(' ');
  assert.equal(text.split(/\s+/).length, 120); assert.equal(lesson.title, 'Geregelter Winterschlaf');
  assert.match(text, /Alpenmurmeltier/); assert.match(text, /Stoffwechsel stark heruntergeregelt/);
  assert.match(text, /weniger Energie/); assert.match(text, /regulierte Überwinterungsstrategie/);
  assert.match(text, /niedrige Körpertemperatur beschreibt dabei nur eine Messgröße/);
  assert.match(text, /keine gleiche Ablaufvorschrift für Dachs, Schneehase oder sämtliche Winterschläfer/);
  assert.match(text, /keine Diagnose/); assert.match(text, /Eigene Prüfungsübung/);
  assert.doesNotMatch(text, /\d|Prozent|Grad|Intervall|Abstract|Originaluntersuchung|Gruppen|Füttern|Heilmittel|Therapie/);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [[urls[0], urls[2]]]);
});

test('Arousal phases explain a changing winter pattern without fixed timing or a claimed resolved cause', () => {
  const lesson = course.lessons.find(item => item.id === lessonIds[1]), text = lesson.paragraphs.join(' ');
  assert.equal(text.split(/\s+/).length, 113); assert.equal(lesson.title, 'Aufwärmphasen');
  assert.match(text, /nicht aus einem einzigen durchgehend gleich kalten Zustand/);
  assert.match(text, /steigen Stoffwechselaktivität und Körpertemperatur wieder an/);
  assert.match(text, /erneut eine Winterschlafphase/); assert.match(text, /noch nicht das Ende der Überwinterung/);
  assert.match(text, /nicht als abschließend geklärt/); assert.match(text, /Ein fester Abstand oder eine einheitliche Dauer/);
  assert.match(text, /keine gemessene Temperaturkurve/); assert.match(text, /Eigene Prüfungsübung/);
  assert.doesNotMatch(text, /\d|Wochen|Tage|Stunden|Grad|Prozent|Nervenzell|Abstract|Originaluntersuchung|Replikation/);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [[urls[1], urls[3], urls[2]]]);
});

test('Only new lessons receive the new date; abstract access and non-replication stay documented at the final sources', () => {
  for (const lesson of course.lessons.slice(-2)) { assert.equal(lesson.reviewedOn, '2026-11-08'); assert.equal(lesson.flashcardExpansion, true); assert.equal(lesson.image, undefined); }
  assert.deepEqual(course.sources.slice(-3).map(item => item.url), urls.slice(0, 3));
  assert.ok(course.sources.slice(-3).every((item, index) => item.checkedOn === '2026-11-08' && JSON.stringify(item.lessonIds) === JSON.stringify(sourceScopes[index])));
  assert.ok(course.sources.slice(-3, -1).every(item => /Originalabstract/.test(item.supports) && /keine Volltextlektüre/.test(item.supports)));
  assert.match(course.sources.at(-1).supports, /desselben Autors.*keine unabhängige experimentelle Replikation/);
  assert.deepEqual(course.sources.find(item => item.url === urls[3]), { label: 'Schweizerischer Nationalpark: Murmeltier', url: urls[3] });
  assert.equal(course.sources.filter(item => item.url === urls[3]).length, 1);
  assert.ok(course.lessons.slice(0, 5).every(item => !item.evidence && !item.reviewedOn));
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.ok(lessonIds.every(id => props.lessonPhotos[id] === undefined));
});

test('Two distinct own four-answer understanding questions enter every DACH pool and export two standalone lesson cards', () => {
  const selected = course.questions.filter(item => lessonIds.includes(item.lessonId)); assert.deepEqual(selected.map(item => item.id), newIds);
  const all = load('data/questions-full.js').QUESTIONS, { quizLearningPool } = load('lib/quiz-learning-scope.js');
  assert.ok(course.questions.some(item => item.id === `${courseId}-a7` && item.q === 'Welche Art hält echten Winterschlaf?'));
  for (const question of selected) {
    assert.equal(new Set(question.answers.map(item => item.text)).size, 4); assert.equal(question.correct.length, 1);
    assert.equal(curriculum.learningQuestions.filter(item => item.q === question.q).length, 1);
    for (const country of ['CH', 'AT', 'DE']) assert.ok(quizLearningPool(all, { country, topic: course.topic }).some(item => item.id === question.id));
    const card = cards.find(item => item.id === `flash-${question.id}`); assert.ok(card);
    assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(item => question.correct.includes(item.id)).text);
    assert.equal(card.explanation, question.explain); assert.equal(card.reviewedOn, '2026-11-08'); assert.equal(card.sourceScope, 'lesson');
    assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${question.lessonId}`);
    assert.deepEqual(new Set(card.sources.map(item => item.url)), new Set(question.lessonId === lessonIds[0] ? [urls[0], urls[2]] : [urls[1], urls[3], urls[2]]));
  }
});

test('The existing wildlife branch, course route, precise search results and scoped export connect the new explanations', () => {
  assert.equal(load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId).categorySlug, 'wildkunde');
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.slice(-2), course.lessons.slice(-2));
  for (const lessonId of lessonIds) {
    const query = lessonId === lessonIds[0] ? 'Geregelter Winterschlaf' : 'Aufwärmphasen';
    const result = load('lib/learning-search.js').searchLearning({ query, type: 'course' }).results.find(item => item.id === `course:${courseId}`);
    assert.equal(result.href, `/kurse/${courseId}#lesson-${lessonId}`); assert.equal(props.flashcards.lessons[lessonId], 1);
    const exported = tools.getFlashcardExport({ courseId, lessonId }); assert.equal(exported.cards.length, 1);
    assert.equal(exported.selection.returnHref, `/kurse/${courseId}#lesson-${lessonId}`); assert.ok(newCardIds.includes(exported.cards[0].id));
  }
});

test('Real lesson readers put complete teaching and direct limits first, and source-review details in closed final sources', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  for (let offset = 0; offset < 2; offset++) {
    const lesson = course.lessons[5 + offset]; let cursor = 0;
    const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? 5 + offset : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
    const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${courseId}#lesson-${lesson.id}` }) },
      './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
      './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
      '../hooks/useCourseProgress': { __esModule: true, default: () => ({}) }, './CourseProgressNotice': { __esModule: true, default: () => null } })('components/LearningCourse.js').default;
    const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: tools.getFlashcardLessonSummary(courseId) }));
    const boundary = html.indexOf('<details id="quellen"'); assert.ok(boundary > 0);
    for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, boundary).includes(paragraph));
    const lessonURLs = offset === 0 ? [urls[0], urls[2]] : [urls[1], urls[3], urls[2]];
    assert.ok(lessonURLs.every(url => !html.slice(0, boundary).includes(url) && html.slice(boundary).includes(url)));
    assert.match(html, new RegExp(`Lektion ${6 + offset} von 7`));
    assert.match(html.slice(boundary), /8\. November 2026/); assert.doesNotMatch(html.slice(boundary), /12\. Oktober 2026/);
    assert.ok(!html.slice(boundary).split('>')[0].includes('open'));
  }
});

test('Protected lesson-specific card API and printing retain the exact answer, bounded sources and real lesson date', async () => {
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
    const lessonURLs = lessonId === lessonIds[0] ? [urls[0], urls[2]] : [urls[1], urls[3], urls[2]];
    assert.ok(lessonURLs.every(url => html.slice(appendix).includes(url)));
  }
});

test('An expiring isolated offline pack preserves the complete new teaching and evidence without re-dating the old course', () => {
  const saved = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-marmot-hibernation-offline-fixture';
  try {
    const now = Date.parse('2026-11-08T11:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'offline-fixture@example.invalid', paidUntil: '2026-11-10T11:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(validate(pack, now), true); assert.equal(validate(pack, pack.expiresAt), false);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-12'); assert.deepEqual(pack.courses[0].lessons, course.lessons); assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.ok(pack.courses[0].lessons.slice(-2).every(item => item.reviewedOn === '2026-11-08' && item.evidence.length === 1));
  } finally { if (saved === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = saved; }
});
