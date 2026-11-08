// Focused preservation and integration checks, not scientific certification.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
const { createLoader: createProjectLoader, local, root } = require('./helpers/project-module.cjs');
const { rootAbsorptionBaselineFixture } = require('./helpers/root-absorption-additions-nov08.cjs');
const createLoader = overrides => createProjectLoader(rootAbsorptionBaselineFixture(overrides));
const { courseId, lessonIds, questionIds, sourceURLs: urls, addedSourceURLs, stripDigestionAbsorptionAddition, stripDigestionAbsorptionDataset } = require('./helpers/digestion-absorption-addition-nov08.cjs');
const raw = require('../data/learning-expansion-biology-2026-10-16.json');
const load = createLoader(), curriculum = load('lib/learning-curriculum.js'), course = curriculum.getLearningModule(courseId);
const tools = load('lib/learning-flashcards.js'), cards = tools.getFlashcards();
const newIds = questionIds.map(id => `${courseId}-${id}`), newCardIds = newIds.map(id => `flash-${id}`);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('Only two tail lessons/questions, four scoped sources and two evidence records extend the entire e6b1d55 biology dataset', () => {
  assert.equal(hash(stripDigestionAbsorptionDataset(raw)), '6fbd07512648bd8f5610cc30acfba7fda6866e9ed23137a909c89bbfe502f30a');
  assert.equal(hash(stripDigestionAbsorptionAddition(course)), '0c8e986b069ddd7e43906d95f9ac15122fd564b2d8eb0119be05f4e030b1dfc4');
  assert.equal(raw.reviewedOn, '2026-10-16'); assert.equal(course.reviewedOn, '2026-10-16');
  assert.deepEqual(course.lessons.slice(0, 7).map(item => item.id), ['blinddarm', 'caecotrophie', 'schweinemagen', 'vogelmagen', 'kropfmilch', 'gewoelle', 'vogelblinddaerme']);
  assert.equal(course.lessons.length, 9); assert.equal(course.questions.length, 39); assert.equal(course.sources.length, 24);
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('All 198 old full course objects and 1769 full old cards including 116 starters retain content and order', () => {
  assert.deepEqual(curriculum.learningCounts, { modules: 198, lessons: 888, questions: 2763 });
  assert.equal(hash(curriculum.learningModules.map(stripDigestionAbsorptionAddition)), '58cd263f12d340a62d818241e051703a62e13284f0e9ce932164ba67756b2b74');
  assert.equal(hash(curriculum.learningModules.filter(item => item.id !== courseId)), 'f29dfaf645b8455f3f7076a920e09d733e15d349318a25a0c986585ccd40bdbf');
  assert.equal(cards.length, 1771);
  assert.equal(hash(cards.filter(item => !newCardIds.includes(item.id))), '7ab48c32e7be53876d79d0dc39efd7a7b97ee3f9eefbf815b7d31540100f60cb');
  assert.equal(hash(cards.slice(0, 116)), '54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
});

test('Resorption distinguishes enzymatic breakdown from epithelial uptake with immediate model, fermentation and clinical limits', () => {
  const lesson = course.lessons.find(item => item.id === lessonIds[0]), text = lesson.paragraphs.join(' ');
  assert.equal(text.split(/\s+/).length, 141); assert.equal(lesson.title, 'Verdauung und Resorption');
  assert.match(text, /enzymatisch in kleinere, aufnehmbare Bestandteile zerlegt/);
  assert.match(text, /Aufnahme aus dem Darminhalt durch die Darmauskleidung/);
  assert.match(text, /noch nicht in den Körper aufgenommen/); assert.match(text, /Oberfläche der Aufnahmezellen/);
  assert.match(text, /allgemeine Säuger-Dünndarmmodell/); assert.match(text, /Fermentationsräume bleiben eigene Aufnahmeorte/);
  assert.match(text, /weder eine Fütterungsempfehlung noch eine Krankheitsdiagnose/); assert.match(text, /Eigene Prüfungsübung/);
  assert.doesNotMatch(text, /\d|SGLT|Fructose|Fruktose|Therapie|Dosis|Trägersystem|Transporter/);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [urls.slice(0, 2), urls.slice(0, 2)]);
});

test('Zotten and microvilli distinguish mucosal tissue and luminal cell-surface levels without dimensions or performance claims', () => {
  const lesson = course.lessons.find(item => item.id === lessonIds[1]), text = lesson.paragraphs.join(' ');
  assert.equal(text.split(/\s+/).length, 137); assert.equal(lesson.title, 'Zotten und Mikrovilli');
  assert.match(text, /Zotte ist daher eine Gewebestruktur mit vielen Zellen/);
  assert.match(text, /Enterozyten/); assert.match(text, /Mikrovilli an ihrer zum Darminhalt gerichteten Oberfläche/);
  assert.match(text, /Bürstensaum/); assert.match(text, /Beide vergrößern die für Aufnahmevorgänge verfügbare Oberfläche/);
  assert.match(text, /menschliche Flächenwerte und Zellmaße/); assert.match(text, /keine individuelle Verdauungsleistung/);
  assert.match(text, /Eigene Prüfungsübung/); assert.doesNotMatch(text, /\d|Quadratmeter|Mikrometer|ATP|Aktin|Diagnose/);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [urls.slice(2), urls.slice(2)]);
});

test('New dates and source metadata stay scoped while the reused Merck object and all old evidence remain exact', () => {
  for (const lesson of course.lessons.slice(-2)) { assert.equal(lesson.reviewedOn, '2026-11-08'); assert.equal(lesson.flashcardExpansion, true); assert.equal(lesson.image, undefined); }
  assert.deepEqual(course.sources.slice(-4).map(item => item.url), addedSourceURLs);
  assert.ok(course.sources.slice(-4).every((item, index) => item.checkedOn === '2026-11-08' && JSON.stringify(item.lessonIds) === JSON.stringify([lessonIds[index === 0 ? 0 : 1]])));
  assert.equal(course.sources.filter(item => item.url === urls[1]).length, 1);
  assert.deepEqual(course.sources.find(item => item.url === urls[1]), { label: 'Merck: Physiology of malabsorption – normal digestion', url: urls[1], organization: 'Merck Veterinary Manual; University of Guelph; Iowa State University', supports: 'Nur der allgemeine physiologische Abschnitt zu pankreatischen Enzymen, Gallensalzen und Dünndarmaufnahme; keine klinischen Diagnosen oder Therapien auf Wildarten übertragen.' });
  assert.ok(course.lessons.slice(0, 7).every(item => item.evidence.every(record => record.sources.every(source => !addedSourceURLs.includes(source.url)))));
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.ok(lessonIds.every(id => props.lessonPhotos[id] === undefined));
});

test('Two own four-answer questions enter CH/AT/DE pools and export as exactly dated standalone cards', () => {
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
    assert.deepEqual(new Set(card.sources.map(item => item.url)), new Set(question.lessonId === lessonIds[0] ? urls.slice(0, 2) : urls.slice(2)));
  }
});

test('Existing wildlife branch, course, exact lesson searches and scoped exports connect both explanations', () => {
  assert.equal(load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId).categorySlug, 'wildkunde');
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.slice(-2), course.lessons.slice(-2));
  for (const lessonId of lessonIds) {
    const query = lessonId === lessonIds[0] ? 'Resorption' : 'Mikrovilli';
    const result = load('lib/learning-search.js').searchLearning({ query, type: 'course' }).results.find(item => item.id === `course:${courseId}`);
    assert.equal(result.href, `/kurse/${courseId}#lesson-${lessonId}`); assert.equal(props.flashcards.lessons[lessonId], 1);
    const exported = tools.getFlashcardExport({ courseId, lessonId }); assert.equal(exported.cards.length, 1);
    assert.equal(exported.selection.returnHref, `/kurse/${courseId}#lesson-${lessonId}`); assert.ok(newCardIds.includes(exported.cards[0].id));
  }
});

test('Real lesson readers show full text and immediate limits before final closed sources with the lesson date', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  for (let offset = 0; offset < 2; offset++) {
    const lesson = course.lessons[7 + offset]; let cursor = 0;
    const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? 7 + offset : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
    const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${courseId}#lesson-${lesson.id}` }) },
      './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
      './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
      '../hooks/useCourseProgress': { __esModule: true, default: () => ({}) }, './CourseProgressNotice': { __esModule: true, default: () => null } })('components/LearningCourse.js').default;
    const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: tools.getFlashcardLessonSummary(courseId) }));
    const boundary = html.indexOf('<details id="quellen"'); assert.ok(boundary > 0);
    for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, boundary).includes(paragraph));
    assert.ok((offset === 0 ? urls.slice(0, 2) : urls.slice(2)).every(url => !html.slice(0, boundary).includes(url) && html.slice(boundary).includes(url)));
    assert.match(html, new RegExp(`Lektion ${8 + offset} von 9`));
    assert.match(html.slice(boundary), /8\. November 2026/); assert.doesNotMatch(html.slice(boundary), /16\. Oktober 2026/);
    assert.ok(!html.slice(boundary).split('>')[0].includes('open'));
  }
});

test('Protected exact-lesson card API and print output preserve the answer, source scope and new lesson date', async () => {
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
    assert.ok((lessonId === lessonIds[0] ? urls.slice(0, 2) : urls.slice(2)).every(url => html.slice(appendix).includes(url)));
  }
});

test('An expiring isolated offline pack retains the full course and new evidence without updating the old course date', () => {
  const saved = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-digestion-absorption-offline-fixture';
  try {
    const now = Date.parse('2026-11-08T11:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'offline-fixture@example.invalid', paidUntil: '2026-11-10T11:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(validate(pack, now), true); assert.equal(validate(pack, pack.expiresAt), false);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-16'); assert.deepEqual(pack.courses[0].lessons, course.lessons); assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.ok(pack.courses[0].lessons.slice(-2).every(item => item.reviewedOn === '2026-11-08' && item.evidence.length === 2));
  } finally { if (saved === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = saved; }
});
