// Narrow editorial, integration and exact-preservation checks, not scientific certification.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { createLoader: createProjectLoader, local } = require('./helpers/project-module.cjs');
const { broodPatchBaselineFixture } = require('./helpers/brood-patch-addition-nov08.cjs');
const { featherFieldsBaselineFixture } = require('./helpers/feather-fields-additions-nov08.cjs');
const { foodSporesToxinsBaselineFixture } = require('./helpers/food-spores-toxins-additions-nov08.cjs');
const { ecologyConceptBaselineFixture } = require('./helpers/ecology-concepts-addition-nov08.cjs');
const { digestionAbsorptionBaselineFixture } = require('./helpers/digestion-absorption-addition-nov08.cjs');
const { rootAbsorptionBaselineFixture } = require('./helpers/root-absorption-additions-nov08.cjs');
const createLoader = overrides => createProjectLoader(rootAbsorptionBaselineFixture(digestionAbsorptionBaselineFixture(ecologyConceptBaselineFixture(foodSporesToxinsBaselineFixture(featherFieldsBaselineFixture(broodPatchBaselineFixture(overrides)))))));
const raw = require('../data/learning-expansion-ecology-2026-10-16.json');
const load = createLoader();
const { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const cardTools = load('lib/learning-flashcards.js');
const cards = cardTools.getFlashcards();
const courseId = 'wissen-ausbau-oekologie-holzaufbau-2026';
const lessonId = 'lentizellen';
const questionId = `${courseId}-lentizellen-gasaustausch`;
const cardId = `flash-${questionId}`;
const course = getLearningModule(courseId);
const lesson = course.lessons.find(item => item.id === lessonId);
const urls = [
  'https://www-archiv.fdm.uni-hamburg.de/b-online/d05/05c.htm',
  'https://mmegias.webs2.uvigo.es/02-english/1-vegetal/v-imagenes-grandes/proteccion_peridermis.php',
  'https://boku.ac.at/universitaetsleitung/rektorat/stabsstellen/oeffentlichkeitsarbeit/themen/presseaussendungen/presseaussendungen-2025/24042025-baumrinde-als-co2-aktivistin',
];
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function beforeAppendix(module) {
  return module.id === courseId ? { ...module, sources: module.sources.slice(0, 9),
    lessons: module.lessons.filter(item => item.id !== lessonId),
    questions: module.questions.filter(item => item.lessonId !== lessonId) } : module;
}

test('The complete old ecology dataset and the five old lessons, 33 questions, nine sources and evidence stay exact', () => {
  const original = raw.modules.find(item => item.id === courseId);
  assert.equal(original.reviewedOn, '2026-10-16');
  assert.equal(course.reviewedOn, '2026-10-16');
  assert.deepEqual(original.lessons.slice(0, 5).map(item => item.id), ['leitgewebe', 'kambium', 'jahrringe', 'holztypen', 'gefaessverteilung']);
  const historical = { ...raw, modules: raw.modules.map(beforeAppendix),
    evidence: raw.evidence.filter(item => !(item.moduleId === courseId && item.lessonId === lessonId)) };
  assert.equal(hash(historical), '0bb87939609de8a2e218a634abad35df969fdbbd63d48de0308d69815ff9df5e');
  assert.equal(hash(beforeAppendix(course)), '04f78bc6c2d25350b521d8008f89512c62caea23914b24d3873dc5cb6be9d76d');
});

test('All 198 old full course objects and all 1760 old card objects keep their content and order', () => {
  assert.equal(learningModules.length, 198);
  assert.equal(hash(learningModules.map(beforeAppendix)), '51da9e2afb55736145628fa378bded3d2baafdd34f8ef9a96ee8bd79997fc3d6');
  assert.equal(hash(learningModules.filter(item => item.id !== courseId)), '95a0fa763de8cff48b8b84459fff6561d51071c9fd8053e3a756a3ec5416c873');
  const old = cards.filter(item => item.id !== cardId);
  assert.equal(old.length, 1760);
  assert.equal(hash(old), 'b97bb476757827812ad35b5c923376c562a510e7bb9267b3597f4d0c4912c742');
  assert.equal(hash(cards.slice(0, 116)), '54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
  const oldCourseCards = cards.filter(item => item.moduleId === courseId && item.lessonId !== lessonId);
  assert.equal(oldCourseCards.length, 32);
  assert.equal(hash(oldCourseCards), 'be59911d4b134413499991318b1673703c3537eaeb1105cf94a36297102bf8fa');
  assert.ok(oldCourseCards.every(card => !card.sources.some(source => urls.includes(source.url))));
});

test('Only the sixth lesson has the new review and three precisely scoped sources with bounded independent roles', () => {
  assert.equal(course.lessons.length, 6);
  assert.equal(course.lessons.at(-1), lesson);
  assert.equal(course.questions.length, 34);
  assert.equal(course.sources.length, 12);
  assert.equal(lesson.title, 'Lentizellen');
  assert.equal(lesson.reviewedOn, '2026-11-08');
  assert.deepEqual(course.sources.slice(9).map(source => source.url), urls);
  assert.ok(course.sources.slice(9).every(source => source.checkedOn === '2026-11-08' && JSON.stringify(source.lessonIds) === JSON.stringify([lessonId])));
  assert.equal(lesson.evidence.length, 2);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [urls, urls.slice(0, 2)]);
  assert.match(course.sources[9].supports, /Archiv 1996–2004/);
  assert.match(course.sources[10].supports, /keine experimentelle Replikation/);
  assert.match(course.sources[11].supports, /kein gelesener Originalvolltext/);
  const text = lesson.paragraphs.join(' ');
  assert.match(text, /besondere Zellgruppen.*Lentizellen/);
  assert.match(text, /Gasaustausch zwischen der Atmosphäre und lebenden Geweben unterhalb der Rinde/);
  assert.match(text, /Schwarzen Holunder \(Sambucus nigra\)/);
  assert.match(text, /kein vollständiger Bestimmungsschlüssel/);
  assert.match(text, /keine identischen Formen oder Austauschleistungen aller Gehölze/);
  assert.match(text, /Eigene Prüfungsübung/);
  assert.doesNotMatch(text, /\d|Interzellular|Zwischenzell|Photosynthese|Prozent|Winter|suberin|Korkchemie|Sauerstoffquote/i);
  assert.equal(lesson.diagram, undefined);
  assert.equal(lesson.image, undefined);
});

test('One own understanding question and one standalone card retain the exact answer and are available to CH, AT and DE', () => {
  const questions = course.questions.filter(item => item.lessonId === lessonId);
  assert.equal(questions.length, 1);
  const [question] = questions;
  assert.equal(question.id, questionId);
  assert.equal(learningModules.flatMap(item => item.questions).filter(item => item.q === question.q).length, 1);
  const correct = question.answers.filter(answer => question.correct.includes(answer.id));
  assert.equal(correct.length, 1);
  assert.equal(correct[0].text, 'Sie ermöglichen Gasaustausch zwischen Außenluft und inneren lebenden Geweben.');
  const { quizLearningPool } = load('lib/quiz-learning-scope.js');
  const { QUESTIONS } = load('data/questions-full.js');
  for (const country of ['CH', 'AT', 'DE']) assert.ok(quizLearningPool(QUESTIONS, { country, topic: 'Wald & Pflanzen' }).some(item => item.id === questionId));
  const chosen = cards.filter(item => item.moduleId === courseId && item.lessonId === lessonId);
  assert.equal(chosen.length, 1);
  const [card] = chosen;
  assert.equal(card.id, cardId);
  assert.equal(card.question, question.q);
  assert.equal(card.answer, correct[0].text);
  assert.equal(card.explanation, question.explain);
  assert.equal(card.reviewedOn, '2026-11-08');
  assert.equal(card.sourceScope, 'lesson');
  assert.deepEqual(card.sources.map(source => source.url), urls);
  assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lessonId}`);
  assert.equal(card.options, undefined);
});

test('Existing tree placement, search, course props and precise card export expose the appendix without another category', () => {
  const location = load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);
  assert.equal(location.categorySlug, 'wald-pflanzen');
  assert.equal(location.groupId, 'pflanzenbau-vermehrung');
  const found = load('lib/learning-search.js').searchLearning({ query: 'Lentizellen Holunder', category: 'wald-pflanzen', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
  assert.equal(found.href, `/kurse/${courseId}#lesson-${lessonId}`);
  assert.equal(found.lessonTitle, lesson.title);
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.at(-1), lesson);
  assert.equal(props.flashcards.lessons[lessonId], 1);
  const deck = cardTools.getFlashcardExport({ courseId, lessonId });
  assert.equal(deck.cards.length, 1);
  assert.equal(deck.cards[0].id, cardId);
  assert.equal(deck.selection.returnHref, `/kurse/${courseId}#lesson-${lessonId}`);
});

test('The actual course renderer puts complete learning text before closed final sources with only the new lesson date', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  let index = 0;
  const hooks = { ...React, useState(initial) { return [index++ === 1 ? 5 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
  const Course = createLoader({
    react: hooks,
    'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${courseId}#lesson-${lessonId}` }) },
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
    '../hooks/useCourseProgress': { __esModule: true, default: () => ({}) },
    './CourseProgressNotice': { __esModule: true, default: () => null },
  })('components/LearningCourse.js').default;
  const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: cardTools.getFlashcardLessonSummary(courseId) }));
  const sourceStart = html.indexOf('<details id="quellen"');
  assert.ok(sourceStart > 0);
  for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, sourceStart).includes(paragraph));
  assert.ok(urls.every(url => html.slice(sourceStart).includes(url)));
  assert.match(html.slice(sourceStart), /8\. November 2026/);
  assert.doesNotMatch(html.slice(sourceStart), /16\. Oktober 2026/);
  assert.ok(!html.slice(sourceStart).split('>')[0].includes('open'));
  assert.match(html, /Lektion 6 von 6/);
  const Evidence = load('components/LessonEvidence.js').default;
  const old = renderToStaticMarkup(React.createElement(Evidence, { lesson: course.lessons[0], reviewedOn: course.reviewedOn }));
  assert.match(old, /16\. Oktober 2026/);
  assert.doesNotMatch(old, /November 2026/);
});

test('Actual authenticated card delivery and printing preserve the lesson date, exact answer and final three-source appendix', async () => {
  const route = createLoader({ '../../../../lib/account-access': { getSignedAccountAccess: async () => ({ paid: true }) } })('app/api/lernen/lernkarten/route.js');
  const response = await route.GET(new Request(`https://jagdlatein.test/api/lernen/lernkarten?kurs=${courseId}&lektion=${lessonId}`));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('vary'), 'Cookie');
  const deck = load('lib/flashcard-payload.js').unpackFlashcards(await response.json());
  assert.equal(deck.cards.length, 1);
  assert.deepEqual(deck.cards[0], cards.find(card => card.id === cardId));
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  const Print = createLoader({
    'next/router': { useRouter: () => ({ isReady: true, query: {} }) },
    '../../components/useFlashcardDeck': { __esModule: true, default: () => ({ ...deck, incomplete: false }) },
    '../../components/LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    '../../components/PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
  })('pages/lernen/lernkarten-drucken.js').default;
  const html = renderToStaticMarkup(React.createElement(Print));
  const appendix = html.indexOf('id="lernkarten-quellen"');
  assert.ok(appendix > 0);
  assert.ok(html.indexOf(deck.cards[0].answer) < appendix);
  assert.ok(html.indexOf(deck.cards[0].explanation) < appendix);
  assert.match(html, /Stand der Ausgangslektion: 8\.11\.2026/);
  assert.ok(urls.every(url => html.slice(appendix).includes(url)));
});

test('A real expiring offline pack preserves all old content and the new lesson evidence without inventing review dates', () => {
  const previous = process.env.JL_SESSION_SECRET;
  process.env.JL_SESSION_SECRET = 'isolated-lenticel-offline-test-secret';
  try {
    const now = Date.parse('2026-11-08T11:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'offline-fixture@example.invalid', paidUntil: '2026-11-10T11:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(validate(pack, now), true);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-16');
    assert.deepEqual(pack.courses[0].lessons, course.lessons);
    assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.equal(pack.courses[0].lessons.at(-1).reviewedOn, '2026-11-08');
    assert.deepEqual(pack.courses[0].lessons.at(-1).evidence, lesson.evidence);
    assert.equal(validate(pack, pack.expiresAt), false);
  } finally {
    if (previous === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = previous;
  }
});
