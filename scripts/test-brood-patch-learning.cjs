// Exact preservation/integration checks; these do not certify scientific claims.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { courseId, lessonId, sourceURLs: urls, stripBroodPatchAddition, stripBroodPatchDataset } = require('./helpers/brood-patch-addition-nov08.cjs');
const raw = require('../data/learning-expansion-biology-2026-10-16.json');
const load = createLoader(), curriculum = load('lib/learning-curriculum.js');
const tools = load('lib/learning-flashcards.js'), cards = tools.getFlashcards();
const course = curriculum.getLearningModule(courseId), lesson = course.lessons.find(item => item.id === lessonId);
const questionId = `${courseId}-brutfleck-waermeweg`, cardId = `flash-${questionId}`;
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('The complete previous dataset, four old lessons, 32 old questions, eleven old sources and all old evidence remain exact', () => {
  assert.equal(hash(stripBroodPatchDataset(raw)), '893d0f9b1351bfb0ae362559588d118017368e2a0d2fe6606a3d32aebd8435db');
  assert.equal(hash(stripBroodPatchAddition(course)), '797103dec948df18b9611ae3ab2d8fa3fdf35498c4cd2cb14340eb555c1abc9e');
  assert.equal(raw.reviewedOn, '2026-10-16'); assert.equal(course.reviewedOn, '2026-10-16');
  assert.deepEqual(course.lessons.slice(0, 4).map(item => item.id), ['rehdiapause', 'plazenta', 'eiaufbau', 'eibildung']);
  assert.equal(course.lessons.length, 5); assert.equal(course.questions.length, 33); assert.equal(course.sources.length, 14);
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('All 198 complete old courses and 1761 full old cards including the 116 starters preserve objects and order', () => {
  assert.deepEqual(curriculum.learningCounts, { modules: 198, lessons: 880, questions: 2754 });
  assert.equal(hash(curriculum.learningModules.map(stripBroodPatchAddition)), '5cb017a59ebf474276f432f2bb333e78589c4edd19290e8913ec30bf96206963');
  assert.equal(hash(curriculum.learningModules.filter(item => item.id !== courseId)), 'c311aea54abb4d65e6f8f12f32a1031e50d85c4238e8be8418938c71d70d70ec');
  assert.equal(cards.length, 1762);
  assert.equal(hash(cards.filter(item => item.id !== cardId)), 'a720fc10472b82491c47d99b339008bb8cf1307d2b3b736e3bd1957ec58374d4');
  assert.equal(hash(cards.slice(0, 116)), '54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
});

test('The fifth 118-word lesson explains the adult skin-to-egg heat path with visible variation limits and precisely scoped sources', () => {
  assert.equal(course.lessons.at(-1), lesson); assert.equal(lesson.title, 'Brutfleck');
  assert.equal(lesson.reviewedOn, '2026-11-08'); assert.equal(lesson.flashcardExpansion, true);
  const text = lesson.paragraphs.join(' '); assert.equal(text.split(/\s+/).length, 118);
  assert.match(text, /Bei vielen brütenden Vögeln/); assert.match(text, /Hautbereich an Brust oder Bauch/);
  assert.match(text, /Gefäßreichtum.*warmes Blut nahe an die Hautoberfläche/);
  assert.match(text, /Wärmeübertragung vom Elternvogel zum Gelege/);
  assert.match(text, /Ausbildung ist artabhängig/); assert.match(text, /nicht als allgemeiner Geschlechts- oder Brutstadiennachweis/);
  assert.match(text, /Eigene Prüfungsübung/);
  assert.doesNotMatch(text, /\d|Grad|Prozent|Hormon|Therapie|Behandlung|Bruttemperatur|Brutdauer/);
  assert.equal(lesson.image, undefined); assert.equal(lesson.diagram, undefined);
  const sources = course.sources.slice(-3);
  assert.deepEqual(sources.map(item => item.url), urls);
  assert.ok(sources.every(item => item.checkedOn === '2026-11-08' && JSON.stringify(item.lessonIds) === '["brutfleck"]'));
  assert.equal(lesson.evidence.length, 2);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [urls, urls.slice(1)]);
  assert.match(sources[0].supports, /keine eigene Originalmessreihe/);
  assert.match(sources[1].supports, /keine experimentelle Replikation/);
  assert.match(sources[2].supports, /Nur der Original-Glossareintrag/);
  assert.ok(course.lessons.slice(0, 4).every(item => item.evidence.every(record => record.sources.every(source => !urls.includes(source.url)))));
});

test('One own four-answer question yields one dated standalone card and shared CH/AT/DE quiz entry', () => {
  const selected = course.questions.filter(item => item.lessonId === lessonId); assert.equal(selected.length, 1);
  const [question] = selected, [card] = cards.filter(item => item.id === cardId);
  assert.equal(question.id, questionId); assert.equal(question.correct.length, 1);
  assert.equal(new Set(question.answers.map(item => item.text)).size, 4);
  assert.equal(curriculum.learningQuestions.filter(item => item.q === question.q).length, 1);
  assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(item => question.correct.includes(item.id)).text);
  assert.equal(card.explanation, question.explain); assert.equal(card.reviewedOn, '2026-11-08'); assert.equal(card.sourceScope, 'lesson');
  assert.deepEqual(card.sources.map(item => item.url), urls);
  assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lessonId}`);
  const { quizLearningPool } = load('lib/quiz-learning-scope.js'), { QUESTIONS } = load('data/questions-full.js');
  for (const country of ['CH', 'AT', 'DE']) assert.ok(quizLearningPool(QUESTIONS, { country, topic: 'Wildkunde' }).some(item => item.id === questionId));
});

test('Existing category and course route, exact lesson search and export connect the lesson without a new category', () => {
  const location = load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);
  assert.equal(location.categorySlug, 'wildkunde');
  const result = load('lib/learning-search.js').searchLearning({ query: 'Brutfleck', category: 'wildkunde', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
  assert.equal(result.href, `/kurse/${courseId}#lesson-${lessonId}`); assert.equal(result.lessonTitle, 'Brutfleck');
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.at(-1), lesson); assert.equal(props.flashcards.lessons[lessonId], 1);
  assert.equal(props.lessonPhotos[lessonId], undefined);
  const exported = tools.getFlashcardExport({ courseId, lessonId }); assert.equal(exported.cards.length, 1);
  assert.equal(exported.cards[0].id, cardId); assert.equal(exported.selection.returnHref, `/kurse/${courseId}#lesson-${lessonId}`);
});

test('The actual lesson reader puts full text and limits first and the three sources closed at the end with only the new date', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server'); let cursor = 0;
  const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? 4 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
  const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${courseId}#lesson-${lessonId}` }) },
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
    '../hooks/useCourseProgress': { __esModule: true, default: () => ({}) }, './CourseProgressNotice': { __esModule: true, default: () => null } })('components/LearningCourse.js').default;
  const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: tools.getFlashcardLessonSummary(courseId) }));
  const boundary = html.indexOf('<details id="quellen"'); assert.ok(boundary > 0);
  for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, boundary).includes(paragraph));
  assert.ok(urls.every(url => !html.slice(0, boundary).includes(url) && html.slice(boundary).includes(url)));
  assert.match(html, /Lektion 5 von 5/); assert.match(html.slice(boundary), /8\. November 2026/);
  assert.doesNotMatch(html.slice(boundary), /16\. Oktober 2026/); assert.ok(!html.slice(boundary).split('>')[0].includes('open'));
});

test('Protected card API and actual print output retain the exact answer, source scope and date', async () => {
  const route = createLoader({ '../../../../lib/account-access': { getSignedAccountAccess: async () => ({ paid: true }) } })('app/api/lernen/lernkarten/route.js');
  const response = await route.GET(new Request(`https://jagdlatein.test/api/lernen/lernkarten?kurs=${courseId}&lektion=${lessonId}`));
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.equal(response.headers.get('vary'), 'Cookie');
  const deck = load('lib/flashcard-payload.js').unpackFlashcards(await response.json()); assert.equal(deck.cards.length, 1);
  assert.deepEqual(deck.cards[0], cards.find(item => item.id === cardId));
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  const Print = createLoader({ 'next/router': { useRouter: () => ({ isReady: true, query: {} }) },
    '../../components/useFlashcardDeck': { __esModule: true, default: () => ({ ...deck, incomplete: false }) },
    '../../components/LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    '../../components/PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} } })('pages/lernen/lernkarten-drucken.js').default;
  const html = renderToStaticMarkup(React.createElement(Print)), appendix = html.indexOf('id="lernkarten-quellen"');
  assert.ok(appendix > 0); assert.ok(html.indexOf(deck.cards[0].answer) < appendix); assert.ok(html.indexOf(deck.cards[0].explanation) < appendix);
  assert.ok(urls.every(url => html.slice(appendix).includes(url))); assert.match(html, /Stand der Ausgangslektion: 8\.11\.2026/);
});

test('An expiring isolated offline course pack preserves all old material and the new lesson evidence and date', () => {
  const saved = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-brood-patch-offline-fixture';
  try {
    const now = Date.parse('2026-11-08T11:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'offline-fixture@example.invalid', paidUntil: '2026-11-10T11:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(validate(pack, now), true); assert.equal(validate(pack, pack.expiresAt), false);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-16');
    assert.deepEqual(pack.courses[0].lessons, course.lessons); assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.deepEqual(pack.courses[0].lessons.at(-1).evidence, lesson.evidence); assert.equal(pack.courses[0].lessons.at(-1).reviewedOn, '2026-11-08');
  } finally { if (saved === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = saved; }
});
