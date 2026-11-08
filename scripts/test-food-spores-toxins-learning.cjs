// Narrow source-scope, preservation and integration tests; no scientific certification.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
const { createLoader: createProjectLoader, local, root } = require('./helpers/project-module.cjs');
const { ecologyConceptBaselineFixture } = require('./helpers/ecology-concepts-addition-nov08.cjs');
const { digestionAbsorptionBaselineFixture } = require('./helpers/digestion-absorption-addition-nov08.cjs');
const { rootAbsorptionBaselineFixture } = require('./helpers/root-absorption-additions-nov08.cjs');
const createLoader = overrides => createProjectLoader(rootAbsorptionBaselineFixture(digestionAbsorptionBaselineFixture(ecologyConceptBaselineFixture(overrides))));
const { courseId, lessonIds, questionIds, sourceURLs: urls, stripFoodSporesToxinsAddition, stripFoodSporesToxinsDataset } = require('./helpers/food-spores-toxins-additions-nov08.cjs');
const raw = require('../data/learning-expansion-field-science-2026-10-17.json');
const load = createLoader(), curriculum = load('lib/learning-curriculum.js'), course = curriculum.getLearningModule(courseId);
const tools = load('lib/learning-flashcards.js'), cards = tools.getFlashcards();
const newIds = questionIds.map(id => `${courseId}-${id}`), newCardIds = newIds.map(id => `flash-${id}`);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('The two exact tail lessons/questions, four scoped sources and two evidence records preserve the complete 0d9e2f5 dataset', () => {
  assert.equal(hash(stripFoodSporesToxinsDataset(raw)), '1a280879618f86d99c92a4eded1a394acf37a7aa9224d097800830a35daf32a0');
  assert.equal(hash(stripFoodSporesToxinsAddition(course)), '94b6a4414bcd271afbe7e10d0b4877d73cff2ba8fc12d5f9c3e15a79e91a7952');
  assert.equal(raw.reviewedOn, '2026-10-17'); assert.equal(course.reviewedOn, '2026-10-17');
  assert.equal(course.lessons.length, 6); assert.equal(course.questions.length, 26); assert.equal(course.sources.length, 12);
  assert.deepEqual(course.lessons.slice(0, 4).map(item => item.id), ['begriffe', 'salmonellen', 'campylobacter', 'listerien']);
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('All 198 complete old course objects and all 1765 old full card objects including 116 starters retain content and order', () => {
  assert.deepEqual(curriculum.learningCounts, { modules: 198, lessons: 884, questions: 2759 });
  assert.equal(hash(curriculum.learningModules.map(stripFoodSporesToxinsAddition)), 'dd23d2a5fe07ceb2b146727b12f024b09b1c5f44d4f02c6777ae0eaff7f0a338');
  assert.equal(hash(curriculum.learningModules.filter(item => item.id !== courseId)), '2236645f5c3bff5cda826c5d159459cda597e65ed00878e0abf30ebf9b975383');
  assert.equal(cards.length, 1767);
  assert.equal(hash(cards.filter(item => !newCardIds.includes(item.id))), 'beb8c25f2dbe545bc83b4c6c3f5678256db8f6a4f57cbb143430423afcc8b4d1');
  assert.equal(hash(cards.slice(0, 116)), '54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
});

test('Bakteriensporen explain survival, vegetative cells and germination with a bounded B. cereus example', () => {
  const lesson = course.lessons.find(item => item.id === 'bakteriensporen'), text = lesson.paragraphs.join(' ');
  assert.equal(lesson.title, 'Bakteriensporen'); assert.equal(text.split(/\s+/).length, 132);
  assert.match(text, /widerstandsfähige Überdauerungsformen/); assert.match(text, /aktiven, sogenannten vegetativen Zellen/);
  assert.match(text, /Unter geeigneten Bedingungen können Endosporen auskeimen/);
  assert.match(text, /Bacillus cereus/); assert.match(text, /während Sporen überleben/);
  assert.match(text, /Nicht alle Bakterien/); assert.match(text, /weder eine Sterilisationsanleitung noch die Freigabe/);
  assert.match(text, /Eigene Prüfungsübung/);
  assert.doesNotMatch(text, /\d|Grad|Minut|Sekund|Stund|Dosis|Inkubation|Kulturmedium|Konservenherstellung|Krankheitssymptom/);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [[urls[1], urls[0]], urls.slice(0, 2)]);
});

test('Bakterientoxine distinguish already formed S. aureus enterotoxin from living bacteria and reject an all-toxin heat-stability claim', () => {
  const lesson = course.lessons.find(item => item.id === 'vorgebildete-toxine'), text = lesson.paragraphs.join(' ');
  assert.equal(lesson.title, 'Bakterientoxine'); assert.equal(text.split(/\s+/).length, 144);
  assert.match(text, /Staphylococcus aureus/); assert.match(text, /bereits im Lebensmittel entstehen/);
  assert.match(text, /Bakterienzelle und Toxin sind deshalb unterschiedliche Dinge/);
  assert.match(text, /bereits vorhandene S\.-aureus-Enterotoxine nicht sicher/);
  assert.match(text, /Nicht jedes Bakterientoxin hat dieselbe Hitzeempfindlichkeit/);
  assert.match(text, /Diese Erklärung gibt keine Speise frei/); assert.match(text, /Eigene Prüfungsübung/);
  assert.doesNotMatch(text, /\d|Grad|Minut|Sekund|Stund|Dosis|Symptom|Medikament|Antibiotik|Therapie|Rezeptur/);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [urls.slice(2), urls.slice(2)]);
});

test('Only the new lessons have the actual new date and exactly scoped independent source roles with no copied photograph', () => {
  for (const lesson of course.lessons.slice(-2)) { assert.equal(lesson.reviewedOn, '2026-11-08'); assert.equal(lesson.flashcardExpansion, true); assert.equal(lesson.image, undefined); }
  assert.deepEqual(course.sources.slice(-4).map(item => item.url), urls);
  assert.ok(course.sources.slice(-4).every((item, index) => item.checkedOn === '2026-11-08' && JSON.stringify(item.lessonIds) === JSON.stringify([lessonIds[index < 2 ? 0 : 1]])));
  assert.match(course.sources.at(-2).supports, /Stand 2020.*Seite 1/);
  assert.match(course.sources.at(-1).supports, /keine US-Grenzwerte|Keine US-Grenzwerte/);
  assert.ok(course.lessons.slice(0, 4).every(item => item.evidence.every(record => record.sources.every(source => !urls.includes(source.url)))));
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.ok(lessonIds.every(id => props.lessonPhotos[id] === undefined));
});

test('Two unique own four-answer understanding questions enter all DACH pools and become exactly sourced dated standalone cards', () => {
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
    assert.deepEqual(new Set(card.sources.map(item => item.url)), new Set(question.lessonId === 'bakteriensporen' ? urls.slice(0, 2) : urls.slice(2)));
  }
});

test('The existing hygiene category, course route, exact lesson searches and filtered exports connect both lessons without new categories', () => {
  assert.equal(load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId).categorySlug, 'wildbret-gesundheit');
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.slice(-2), course.lessons.slice(-2));
  for (const lessonId of lessonIds) {
    const result = load('lib/learning-search.js').searchLearning({ query: lessonId === 'bakteriensporen' ? 'Bakteriensporen' : 'Bakterientoxine', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
    assert.equal(result.href, `/kurse/${courseId}#lesson-${lessonId}`); assert.equal(props.flashcards.lessons[lessonId], 1);
    const exported = tools.getFlashcardExport({ courseId, lessonId }); assert.equal(exported.cards.length, 1);
    assert.equal(exported.selection.returnHref, `/kurse/${courseId}#lesson-${lessonId}`); assert.ok(newCardIds.includes(exported.cards[0].id));
  }
});

test('Both real lesson readers show complete learning and important limits before closed final sources with the new lesson date', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  for (let offset = 0; offset < 2; offset++) {
    const lesson = course.lessons[4 + offset]; let cursor = 0;
    const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? 4 + offset : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
    const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${courseId}#lesson-${lesson.id}` }) },
      './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
      './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
      '../hooks/useCourseProgress': { __esModule: true, default: () => ({}) }, './CourseProgressNotice': { __esModule: true, default: () => null } })('components/LearningCourse.js').default;
    const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: tools.getFlashcardLessonSummary(courseId) }));
    const boundary = html.indexOf('<details id="quellen"'); assert.ok(boundary > 0);
    for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, boundary).includes(paragraph));
    assert.ok((offset === 0 ? urls.slice(0, 2) : urls.slice(2)).every(url => !html.slice(0, boundary).includes(url) && html.slice(boundary).includes(url)));
    assert.match(html, new RegExp(`Lektion ${5 + offset} von 6`));
    assert.match(html.slice(boundary), /8\. November 2026/); assert.doesNotMatch(html.slice(boundary), /17\. Oktober 2026/);
    assert.ok(!html.slice(boundary).split('>')[0].includes('open'));
  }
});

test('Protected exact-lesson card API and actual print output retain the answer, scoped sources and real lesson date', async () => {
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
    assert.ok((lessonId === 'bakteriensporen' ? urls.slice(0, 2) : urls.slice(2)).every(url => html.slice(appendix).includes(url)));
  }
});

test('An expiring isolated offline pack preserves the complete course, both new lessons and evidence without changing the old course date', () => {
  const saved = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-food-spores-toxins-offline-fixture';
  try {
    const now = Date.parse('2026-11-08T11:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'offline-fixture@example.invalid', paidUntil: '2026-11-10T11:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(validate(pack, now), true); assert.equal(validate(pack, pack.expiresAt), false);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-17'); assert.deepEqual(pack.courses[0].lessons, course.lessons); assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.ok(pack.courses[0].lessons.slice(-2).every(item => item.reviewedOn === '2026-11-08' && item.evidence.length === 2));
  } finally { if (saved === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = saved; }
});
