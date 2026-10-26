// Concrete data-preservation and reader/export integration checks, not scientific certification.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { stripOctober26Additions, isOctober26Card } = require('./helpers/learning-additions-oct26.cjs');
const load = createLoader();
const raw = require('../data/learning-expansion-wildlife-dogs-2026-10-16.json');
const courseId = 'wissen-ausbau-federaufbau-funktion-2026';
const lessonId = 'wasserschutz';
const { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const course = getLearningModule(courseId);
const original = raw.modules.find(item => item.id === courseId);
const lesson = course.lessons.find(item => item.id === lessonId);
const cards = load('lib/learning-flashcards.js').getFlashcards();
const newCards = cards.filter(card => card.moduleId === courseId && card.lessonId === lessonId);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const cornell = 'https://academy.allaboutbirds.org/feathers-article/';
const originalStudy = 'https://pubmed.ncbi.nlm.nih.gov/20437221/';
const review = 'https://doi.org/10.1111/jav.03259';
const urls = [cornell, review, originalStudy];
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');

test('The full historical dataset, original course fields and all other courses remain exact', () => {
  const historicalRawModule = { ...original, sources: original.sources.slice(0, 5), lessons: original.lessons.slice(0, 4), questions: original.questions.slice(0, 16) };
  assert.equal(hash(historicalRawModule), '9ff29ff15b57c500668ee9205f26f434a9dc7389fd1ed6f28d2ac2270d4517cb');
  assert.equal(hash(raw.modules.filter(item => item.id !== courseId)), 'cd1ec92eff8f748f0ce4ad5c788a9ac84537973f3ce1bce1f37b0e054625b1fd');
  assert.equal(hash(raw.evidence.filter(item => item.moduleId === courseId && item.lessonId !== lessonId)), 'df4f6c5641e1e5150b6fd400f1ac0f806185cee911a6a3fb98513c29ff10612f');
  const historicalDataset = {
    ...raw,
    scope: raw.scope.replace('25 Lektionen und 98 Fragen', '24 Lektionen und 96 Fragen'),
    modules: raw.modules.map(item => item.id === courseId ? historicalRawModule : item),
    evidence: raw.evidence.filter(item => !(item.moduleId === courseId && item.lessonId === lessonId)),
  };
  assert.equal(hash(historicalDataset), '70d2ee28f3f6d01d36d1848baa37c2055965c1603e0027242b35b56724475ff2');
  const historicalCourse = { ...course, sources: course.sources.slice(0, 5), lessons: course.lessons.slice(0, 4), questions: course.questions.slice(0, 16) };
  assert.equal(hash(historicalCourse), 'a772842ece4e285cbcdf50a01eb7f54bf4edc782ea67e592ba287e1c1508354e');
  // The separately reviewed ammunition addition is removed by the exact
  // October-26 module/lesson whitelist; no historical field is ignored.
  assert.equal(hash(learningModules.filter(item => item.id !== courseId).map(stripOctober26Additions)), '96f520fd1e8b3c43c8b0e7c07279ff4b3af376cedf784b01e43c2b4fe95cda50');
  assert.equal(raw.reviewedOn, '2026-10-16');
  assert.equal(course.reviewedOn, '2026-10-16');
});

test('One appended self-contained lesson has a narrow review date and two precise source mappings', () => {
  assert.equal(learningModules.filter(item => item.id === courseId).length, 1);
  assert.equal(course.lessons.length, 5);
  assert.equal(course.questions.length, 18);
  assert.equal(course.lessons.at(-1).id, lessonId);
  assert.equal(lesson.reviewedOn, '2026-10-26');
  const text = lesson.paragraphs.join(' ');
  const words = text.split(/\s+/).length;
  assert.ok(words >= 150 && words <= 190);
  assert.match(text, /Überlappende Körperfedern.*geordnete Feinstruktur/);
  assert.match(text, /gehaltenen Stockenten/);
  assert.match(text, /länger blockiertem Zugang.*verschlechterte sich der Gefiederzustand/);
  assert.match(text, /kürzere Versuch zeigte keine entsprechende signifikante Veränderung/);
  assert.match(text, /nur der Originalabstract geprüft/);
  assert.match(text, /wiederholt aber diesen Versuch nicht/);
  assert.match(text, /keine unbegrenzte Undurchlässigkeit/);
  assert.match(text, /noch nicht vollständig geklärt/);
  assert.doesNotMatch(text, /\d|Kormoran|alle Vogelarten|Kontaktwinkel|Prozent|Meter|Wachsester|Fettsäure/);
  assert.equal(lesson.image, undefined);
  assert.equal(lesson.diagram, undefined);
  assert.equal(course.sources.length, 7);
  assert.deepEqual(course.sources.slice(5).map(source => source.url), [originalStudy, review]);
  assert.ok(course.sources.slice(5).every(source => source.checkedOn === '2026-10-26' && JSON.stringify(source.lessonIds) === JSON.stringify([lessonId])));
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [[cornell, review], [originalStudy, review]]);
  const record = raw.evidence.find(item => item.moduleId === courseId && item.lessonId === lessonId);
  assert.match(record.claims[1].sourceRoles[originalStudy], /Nur der Originalabstract/);
  assert.match(record.claims[1].sourceRoles[review], /keine neue Versuchswiederholung/);
});

test('All published cards including starter order stay exact; two own questions become correctly dated cards', () => {
  const historical = cards.filter(card => !isOctober26Card(card));
  assert.equal(historical.length, 1713);
  assert.equal(hash(historical), 'cdc940d3c490db17651079605f4ac647c4ddc7a95d4b79de7ac706ac69c6fa2b');
  assert.equal(hash(cards.slice(0, 116)), '54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
  assert.equal(hash(cards.filter(card => card.moduleId === courseId && card.lessonId !== lessonId)), '37e764c2cfe0b658882558851339be1e8f3469371ee272e995e8dc2efa63612e');
  assert.equal(newCards.length, 2);
  const questions = course.questions.filter(item => item.lessonId === lessonId);
  assert.equal(questions.length, 2);
  const bank = load('data/questions-full.js').QUESTIONS;
  const { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const question of questions) {
    const [answer] = question.answers.filter(item => question.correct.includes(item.id));
    const card = newCards.find(item => item.id === `flash-${question.id}`);
    assert.ok(card);
    assert.equal(card.question, question.q);
    assert.equal(card.answer, answer.text);
    assert.equal(card.explanation, question.explain);
    assert.equal(card.reviewedOn, '2026-10-26');
    assert.equal(card.sourceScope, 'lesson');
    assert.deepEqual(card.sources.map(source => source.url), urls);
    assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lessonId}`);
    assert.equal(card.options, undefined);
    for (const country of ['DE', 'AT', 'CH']) assert.ok(quizLearningPool(bank, { country, topic: 'Wildkunde' }).some(item => item.id === question.id));
  }
});

test('The existing category branch, search and course props expose the exact new lesson without a new route', () => {
  const location = load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);
  assert.equal(location.categorySlug, 'wildkunde');
  assert.equal(location.groupId, 'koerperbau-atmung');
  const found = load('lib/learning-search.js').searchLearning({ query: 'Bürzeldrüse', category: 'wildkunde', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
  assert.ok(found);
  assert.equal(found.href, `/kurse/${courseId}#lesson-${lessonId}`);
  assert.equal(found.lessonTitle, lesson.title);
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.at(-1), lesson);
  assert.equal(props.flashcards.lessons[lessonId], 2);
});

test('The real course reader places complete learning content before the closed sources and uses the true lesson date', () => {
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
  const flashcards = load('lib/learning-flashcards.js').getFlashcardLessonSummary(courseId);
  const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards }));
  const sourceStart = html.indexOf('<details id="quellen"');
  assert.ok(sourceStart > 0);
  for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, sourceStart).includes(paragraph));
  assert.ok(urls.every(url => html.slice(sourceStart).includes(url)));
  assert.ok(urls.every(url => !html.slice(0, sourceStart).includes(url)));
  assert.match(html.slice(sourceStart), /26\. Oktober 2026/);
  assert.doesNotMatch(html.slice(sourceStart), /16\. Oktober 2026/);
  assert.ok(!html.slice(sourceStart).split('>')[0].includes('open'));
  assert.match(html, /Lektion 5 von 5/);
  const Evidence = load('components/LessonEvidence.js').default;
  const oldHtml = renderToStaticMarkup(React.createElement(Evidence, { lesson: course.lessons[0], reviewedOn: course.reviewedOn }));
  assert.match(oldHtml, /16\. Oktober 2026/);
  assert.doesNotMatch(oldHtml, /26\. Oktober 2026/);
});

test('The real print/PDF layout contains the two complete cards and the source appendix at the end', () => {
  const Print = createLoader({
    'next/router': { useRouter: () => ({ query: {}, isReady: true }) },
    '../../components/LearningToolLayout': { __esModule: true, default: ({ children }) => children },
    '../../components/PageMenu': { __esModule: true, default: () => null, closePageMenu() {} },
    '../../components/useFlashcardDeck': { __esModule: true, default: props => ({ ...props, incomplete: false, loading: false }) },
  })('pages/lernen/lernkarten-drucken.js').default;
  const html = renderToStaticMarkup(React.createElement(Print, { cards: newCards, categories: [{ id: 'wildkunde', title: 'Wildkunde', count: 2 }] }));
  const appendix = html.indexOf('<h2 id="lernkarten-quellen">');
  assert.ok(appendix > 0);
  for (const card of newCards) {
    assert.ok(html.slice(0, appendix).includes(card.question));
    assert.ok(html.slice(0, appendix).includes(card.answer));
    assert.ok(html.slice(0, appendix).includes(card.explanation));
  }
  assert.match(html, /26\.10\.2026/);
  assert.ok(urls.every(url => html.indexOf(url) > appendix));
});

test('Fresh offline packs retain all new and historical dates, sources and questions without changing the pack schema', () => {
  const previous = process.env.JL_SESSION_SECRET;
  process.env.JL_SESSION_SECRET = 'test-only-feather-water-offline';
  try {
    const now = Date.parse('2026-10-26T12:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'feathers@example.invalid', paidUntil: '2026-10-28T12:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(pack.version, 1);
    assert.equal(validate(pack, now), true);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-16');
    assert.deepEqual(pack.courses[0].lessons, course.lessons);
    assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.equal(pack.courses[0].lessons.at(-1).reviewedOn, '2026-10-26');
    assert.deepEqual(pack.courses[0].lessons.at(-1).evidence, lesson.evidence);
    assert.equal(validate(pack, pack.expiresAt), false);
  } finally {
    if (previous === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = previous;
  }
});

test('The actual offline reader shows the lesson before its closed source panel and preserves the narrow date', () => {
  let index = 0;
  const hooks = { ...React, useState(initial) { return [index++ === 1 ? 4 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
  const filename = path.join(root, 'components/OfflineLearning.js');
  const source = fs.readFileSync(filename, 'utf8') + '\nexport { OfflineCourse };';
  const { code } = local('next/dist/build/swc').transformSync(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} }, loader = createLoader({ react: hooks });
  new Function('require', 'module', 'exports', code)(id => id === 'react' ? hooks : id.endsWith('.module.css') ? { __esModule: true, default: {} } : id.startsWith('.') ? loader(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), mod, mod.exports);
  const html = renderToStaticMarkup(React.createElement(mod.exports.OfflineCourse, { course, expiresAt: Date.now() + 60000, onExpired() {} }));
  const sourceStart = html.indexOf('<summary>Quellen und Prüfstand</summary>');
  assert.ok(sourceStart > 0);
  for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, sourceStart).includes(paragraph));
  assert.ok(urls.every(url => html.slice(sourceStart).includes(url)));
  assert.match(html.slice(sourceStart), /26\. Oktober 2026/);
  assert.doesNotMatch(html.slice(sourceStart), /16\. Oktober 2026/);
  const opening = html.slice(html.lastIndexOf('<details', sourceStart), sourceStart);
  assert.match(opening, /^<details(?:\s[^>]*)?>$/);
  assert.doesNotMatch(opening, /\sopen(?:\s|=|>)/);
});
