// Exact integration and editorial-boundary checks; not scientific certification.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { createLoader, local } = require('./helpers/project-module.cjs');
const raw = require('../data/learning-expansion-biology-2026-10-16.json');
const load = createLoader();
const courseId = 'wissen-ausbau-biologie-vogelkoerper-2026';
const lessonId = 'gegenstrom';
const cardId = `flash-${courseId}-gegenstrom-waermerichtung`;
const { learningModules, getLearningModule, learningCounts } = load('lib/learning-curriculum.js');
const course = getLearningModule(courseId);
const original = raw.modules.find(item => item.id === courseId);
const lesson = course.lessons.at(-1);
const cards = load('lib/learning-flashcards.js').getFlashcards();
const guide = load('lib/wildlife-learning-guide.js').getWildlifeLearningGuide;
const study = load('lib/wildlife-study-content.js').getWildlifeStudyContent;
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const urls = [
  'https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1463-6395.1980.tb01289.x',
  'https://www.allaboutbirds.org/news/how-do-gulls-deal-with-cold-feet/',
  'https://web.stanford.edu/group/stanfordbirds/text/essays/Temperature_Regulation.html',
];

test('The historical full dataset, four lessons, 32 questions with all options, seven sources and evidence stay exact', () => {
  assert.equal(raw.reviewedOn, '2026-10-16');
  assert.equal(original.reviewedOn, '2026-10-16');
  assert.equal(course.reviewedOn, '2026-10-16');
  assert.equal(hash(original.lessons.slice(0, 4)), 'c96ffe3e3f87b23b8879137338fe3609554b470a28030b8544071c308b519475');
  assert.equal(hash(original.questions.slice(0, 32)), 'c90f16c11ef635e5357e5ed8cdcf6e77f7d71630aba8cc1e1cc21e98e8a7829d');
  assert.equal(hash(original.sources.slice(0, 7)), 'bc09dc1a10743d36e8fd1d53dff7b2281a625869e278091836b72f2f1fd7d3c8');
  assert.equal(hash(raw.evidence.filter(item => item.moduleId === courseId && item.lessonId !== lessonId)), '2a3731c09be756a87f3766267ab918c672ae9f9854b9c011889f644064864948');
  const historical = { ...course, sources: course.sources.slice(0, 7), lessons: course.lessons.slice(0, 4), questions: course.questions.slice(0, 32) };
  assert.equal(hash(historical), 'a1a3cfa11b2302fcc0a0bc2391951fb6014f7eecf15ed01936e9672081a51609');
  const historicalDataset = {
    ...raw,
    modules: raw.modules.map(item => item.id === courseId ? { ...item, sources: item.sources.slice(0, 7), lessons: item.lessons.slice(0, 4), questions: item.questions.slice(0, 32) } : item),
    evidence: raw.evidence.filter(item => !(item.moduleId === courseId && item.lessonId === lessonId)),
  };
  assert.equal(hash(historicalDataset), 'ca506d20b3ffa227a7ecc0e79e0f5e120c5f5f736a08bb0cc1552fe228d394b7');
});

test('One 148-word fifth lesson has the correct directions, bounded teaching and exact source roles/date', () => {
  assert.equal(learningModules.filter(item => item.id === courseId).length, 1);
  assert.equal(course.lessons.length, 5);
  assert.equal(course.questions.length, 33);
  assert.equal(lesson.id, lessonId);
  assert.equal(lesson.reviewedOn, '2026-10-24');
  assert.equal(lesson.paragraphs.join(' ').split(/\s+/).length, 148);
  assert.equal(course.sources.length, 10);
  assert.deepEqual(course.sources.slice(7).map(source => source.url), urls);
  assert.ok(course.sources.slice(7).every(source => source.checkedOn === '2026-10-24' && JSON.stringify(source.lessonIds) === JSON.stringify([lessonId])));
  assert.match(course.sources[7].supports, /Tatsächlich gelesener Originalabstract/);
  assert.match(course.sources[7].supports, /Keine Volltextlektüre behauptet/);
  assert.match(course.sources[8].supports, /keine neue experimentelle Wiederholung/);
  assert.match(course.sources[9].supports, /Keine neue Originalmessung oder Replikation/);
  assert.equal(lesson.evidence.length, 2);
  assert.deepEqual(lesson.evidence.map(claim => claim.sources.map(source => source.url)), [urls, urls.slice(1)]);
  const text = lesson.paragraphs.join(' ');
  assert.match(text, /Arterielles Blut fließt vom warmen Körper zu den Füßen/);
  assert.match(text, /Kühleres venöses Blut fließt von dort zum Körper zurück/);
  assert.match(text, /vom wärmeren arteriellen Blut auf das kühlere venöse Blut/);
  assert.match(text, /zufließende Blut abgekühlt und das zurückströmende erwärmt/);
  assert.match(text, /Füße werden dabei weiterhin mit Blut versorgt/);
  assert.match(text, /keine identische Gefäßanordnung sämtlicher Vogelarten/);
  assert.match(text, /weder eine bestimmte Fußtemperatur noch eine unbegrenzte Frostschutzgarantie/);
  assert.doesNotMatch(text, /\d|Prozent|Grad|Hz|Shunt|Adren|Behandlung|immer frostfrei/);
  assert.equal(lesson.diagram, undefined);
  assert.equal(lesson.image, undefined);
});

test('All 197 other courses, 1712 old cards in order and 116 starter objects stay exact without new sources on old cards', () => {
  assert.equal(hash(learningModules.filter(item => item.id !== courseId)), '69600efafa7642aeb4bc5d425f7e1535167047a2a1e021e94d92ad73bbfb866c');
  assert.equal(hash(cards.slice(0, 116)), '54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
  const old = cards.filter(card => card.id !== cardId);
  assert.equal(old.length, 1712);
  assert.equal(hash(old), '1dd032b32aaf020b73ee52f969d27a920698220b912592a9ae667010a3b40014');
  const oldCourseCards = cards.filter(card => card.moduleId === courseId && card.lessonId !== lessonId);
  assert.equal(oldCourseCards.length, 31);
  assert.equal(hash(oldCourseCards), 'a9c91ae59261949272f96d9ae277c8161c81b589fa7a9a67e96f103d3081f281');
  assert.ok(oldCourseCards.every(card => card.reviewedOn === '2026-10-16' && !card.sources.some(source => urls.includes(source.url))));
  assert.deepEqual(learningCounts, { modules: 198, lessons: 849, questions: 2705 });
  assert.equal(cards.length, 1713);
});

test('All 114 full guide objects keep targets, order, labels and paths; only the 73 existing bird-course card counts increase', () => {
  const species = load('lib/european-wildlife-discovery.js').europeanWildlife;
  let updated = 0;
  const historical = species.map(item => ({ slug: item.slug, targets: guide(item.slug).map(target => {
    if (target.moduleId !== courseId) return target;
    updated++;
    assert.equal(target.flashcardCount, 32);
    return { ...target, flashcardCount: 31 };
  }) }));
  assert.equal(historical.length, 114);
  assert.equal(updated, 73);
  assert.equal(hash(historical), 'dabcf95fcf83783958a99fa9d1ba066aa30b1bcfe8afbe42fe0c852b4ab95250');
  const target = guide('stockente').find(item => item.moduleId === courseId);
  assert.equal(target.scope, 'foundation');
  assert.equal(target.href, `/kurse/${courseId}`);
  assert.equal(guide('stockente').length, 3);
});

test('One original question and card use identical answer, explanation, precise date and the existing lesson anchor', () => {
  const chosen = course.questions.filter(question => question.lessonId === lessonId);
  assert.equal(chosen.length, 1);
  const [question] = chosen;
  assert.ok(!learningModules.filter(item => item.id !== courseId).flatMap(item => item.questions).some(item => item.q === question.q));
  const correct = question.answers.filter(answer => question.correct.includes(answer.id));
  assert.equal(correct.length, 1);
  assert.equal(correct[0].text, 'Vom wärmeren arteriellen Blut zum kühleren zurückströmenden venösen Blut.');
  const bank = load('data/questions-full.js').QUESTIONS;
  const quiz = load('lib/quiz-learning-scope.js').quizLearningPool;
  for (const country of ['DE', 'AT', 'CH']) assert.ok(quiz(bank, { country, topic: 'Wildkunde' }).some(item => item.id === question.id));
  const card = cards.find(card => card.id === cardId);
  assert.ok(card);
  assert.equal(cards.filter(card => card.moduleId === courseId && card.lessonId === lessonId).length, 1);
  assert.equal(card.question, question.q);
  assert.equal(card.answer, correct[0].text);
  assert.equal(card.explanation, question.explain);
  assert.equal(card.reviewedOn, '2026-10-24');
  assert.equal(card.sourceScope, 'lesson');
  assert.deepEqual(card.sources.map(source => source.url), urls);
  assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lessonId}`);
  assert.equal(card.options, undefined);
  assert.ok(cards.indexOf(card) >= 116);
});

test('Existing category, search and course props discover the precise new lesson without another course or branch', () => {
  const location = load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);
  assert.equal(location.categorySlug, 'wildkunde');
  assert.equal(location.groupId, 'koerperbau-atmung');
  const found = load('lib/learning-search.js').searchLearning({ query: 'Gegenstrom Entenbein', category: 'wildkunde', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
  assert.equal(found.href, `/kurse/${courseId}#lesson-${lessonId}`);
  assert.equal(found.lessonTitle, lesson.title);
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.at(-1), lesson);
  assert.equal(props.flashcards.lessons[lessonId], 1);
});

test('The actual paid species endpoint preserves only valid optional lesson dates and never returns quiz keys', async () => {
  const route = createLoader({ '../../../../lib/account-access': { requirePaidAccount: async () => {} } })('app/api/lernen/artenwissen/route.js');
  const request = art => route.GET(new Request(`https://jagdlatein.test/api/lernen/artenwissen?art=${art}&kurs=${courseId}`));
  const response = await request('stockente');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  const content = await response.json();
  assert.equal(content.reviewedOn, '2026-10-16');
  assert.equal(content.lessons.length, 5);
  assert.deepEqual(content.lessons.at(-1).paragraphs, lesson.paragraphs);
  assert.deepEqual(content.lessons.at(-1).evidence, lesson.evidence);
  assert.equal(content.lessons.at(-1).reviewedOn, '2026-10-24');
  for (const old of content.lessons.slice(0, 4)) assert.equal(Object.hasOwn(old, 'reviewedOn'), false);
  const denied = new Set(['questions', 'answers', 'options', 'correct', 'answer', 'explain', 'modules']);
  function readingOnly(value) { if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) { assert.ok(!denied.has(key), key); readingOnly(item); } }
  readingOnly(content);
  assert.equal((await request('fuchs')).status, 404);
  const helper = load('lib/learning-review-date.js');
  for (const value of [undefined, '', '2026-02-30', '2026-02-29', 'wrong', '2026-10-24T00:00:00Z']) {
    const projection = createLoader({
      './learning-curriculum': { getLearningModule: () => ({ ...course, lessons: [{ ...lesson, reviewedOn: value }] }) },
    })('lib/wildlife-study-content.js').getWildlifeStudyContent('stockente', courseId);
    assert.equal(Object.hasOwn(projection.lessons[0], 'reviewedOn'), false);
    assert.equal(helper.getLessonReviewDate(projection.lessons[0], projection.reviewedOn), '2026-10-16');
  }
  const beaver = study('biber', 'wissen-biber-schneidezaehne-2026');
  assert.equal(beaver.lessons.find(item => item.id === 'mundhautfalte-unterwassernagen').reviewedOn, '2026-10-24');
  assert.equal(beaver.reviewedOn, '2026-10-24');
});

test('The real portrait renderer shows complete text before closed final sources, with new 24 October and four historical 16 October reviews', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  const target = guide('stockente').find(item => item.moduleId === courseId);
  const content = study('stockente', courseId);
  const state = { key: `stockente:${courseId}`, content, error: '', status: 200 };
  const Reader = createLoader({ react: { ...React, useState: () => [state, () => {}], useEffect() {} } })('components/WildlifeStudyContent.js').default;
  const html = renderToStaticMarkup(React.createElement(Reader, { slug: 'stockente', target }));
  const sourceStart = html.indexOf('Ergänzende Fachquellen und Prüfstand');
  const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
  for (const item of course.lessons) for (const paragraph of item.paragraphs) assert.ok(html.slice(0, sourceStart).includes(escape(paragraph)));
  assert.ok(urls.every(url => html.slice(sourceStart).includes(url)));
  assert.equal((html.match(/wurden am 24\. Oktober 2026/g) || []).length, 1);
  assert.equal((html.match(/wurden am 16\. Oktober 2026/g) || []).length, 4);
  assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
  assert.ok(html.includes('keine identische Gefäßanordnung sämtlicher Vogelarten'));
});

test('The actual course renderer shows the new lesson before its final sources and uses its 24 October review', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  let index = 0;
  const hooks = { ...React, useState(initial) { return [index++ === 1 ? 4 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
  const Course = createLoader({
    react: hooks,
    'next/router': { useRouter: () => ({ asPath: `/kurse/${courseId}#lesson-${lessonId}` }) },
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
    '../hooks/useCourseProgress': { __esModule: true, default: () => ({}) },
    './CourseProgressNotice': { __esModule: true, default: () => null },
  })('components/LearningCourse.js').default;
  const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: load('lib/learning-flashcards.js').getFlashcardLessonSummary(courseId) }));
  const sourceStart = html.indexOf('<details id="quellen"');
  for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, sourceStart).includes(paragraph));
  assert.match(html.slice(sourceStart), /24\. Oktober 2026/);
  assert.doesNotMatch(html.slice(sourceStart), /16\. Oktober 2026/);
  assert.match(html, /Lektion 5 von 5/);
});

test('A valid expiring offline pack preserves the old course date and the precise new lesson/evidence', () => {
  const previous = process.env.JL_SESSION_SECRET;
  process.env.JL_SESSION_SECRET = 'test-only-duck-countercurrent-offline';
  try {
    const now = Date.parse('2026-10-24T11:02:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'duck@example.invalid', paidUntil: '2026-10-26T11:02:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(validate(pack, now), true);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-16');
    assert.deepEqual(pack.courses[0].lessons, course.lessons);
    assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.equal(pack.courses[0].lessons.at(-1).reviewedOn, '2026-10-24');
    assert.deepEqual(pack.courses[0].lessons.at(-1).evidence, lesson.evidence);
    assert.equal(validate(pack, pack.expiresAt), false);
  } finally {
    if (previous === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = previous;
  }
});
