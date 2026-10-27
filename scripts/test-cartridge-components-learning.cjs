// Narrow preservation and reader/export checks, not a complete examination syllabus review.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { stripOctober26Additions } = require('./helpers/learning-additions-oct26.cjs');
const { stripIgnitionDataset, digestiveIgnitionBaselineFixture } = require('./helpers/digestive-ignition-additions-oct27.cjs');
const { stripFirearmTermsDataset, firearmTermsBaselineFixture } = require('./helpers/firearm-terms-additions-oct27.cjs');
const { flightFeatherBaselineFixture } = require('./helpers/flight-feather-additions-oct27.cjs');
const raw = stripFirearmTermsDataset(stripIgnitionDataset(require('../data/learning-expansion-field-science-2026-10-17.json')));
const load = createLoader(flightFeatherBaselineFixture(firearmTermsBaselineFixture(digestiveIgnitionBaselineFixture())));
const courseId = 'wissen-ausbau-revierpraxis-beschuss-kennzeichnung-2026';
const lessonId = 'patrone-geschoss-bauteile';
const { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const course = getLearningModule(courseId);
const original = raw.modules.find(item => item.id === courseId);
const lesson = course.lessons.find(item => item.id === lessonId);
const cards = load('lib/learning-flashcards.js').getFlashcards();
const newCards = cards.filter(card => card.moduleId === courseId && card.lessonId === lessonId);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const urls = [
  'https://www.fedpol.admin.ch/dam/de/sd-web/pQ5Q3W4g13Sk/pruefung-schusswaffenhandel.pdf',
  'https://www.hn-sport.de/de/wiki/die-komponenten-einer-patrone',
  'https://saami.org/glossary/cartridge/',
  'https://saami.org/glossary/cartridge-case/',
  'https://saami.org/glossary/primer/',
  'https://saami.org/glossary/propellant/',
];
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');

test('The whole original course, other five modules, historical evidence and dates remain exact', () => {
  assert.equal(hash(stripOctober26Additions(original)), '7bf0d12bfb4fe1231c37f9b9a178f6732f70c4cca13434f48851a3320009ba0a');
  assert.equal(hash(stripOctober26Additions(course)), '7e1fb1a587642677c002e6beb212fcc917a1b3ced3e48c13692e19c3e71ed648');
  assert.equal(hash(course.lessons.slice(0, 4)), 'c8e9062c45f4941cc19118af8ae1a58dfa66d8700a13eb5159ba1d96ca5ed62b');
  assert.equal(hash(course.questions.slice(0, 24)), 'ee9b5d89239c46bd99afda33327e45ae127210e91b088a7a0e8c87fe5650a735');
  assert.equal(hash(course.sources.slice(0, 9)), '2a03cf247d239f3cf13a97544859773a810765e7f9c14fbd5ccc3946c4d939d1');
  assert.equal(hash(raw.modules.filter(item => item.id !== courseId)), 'fea16d8932ba9cc30626ed08349b176e14452d3b2bf05042bbf212d99df44fb0');
  assert.equal(hash(raw.evidence.filter(item => item.moduleId === courseId && item.lessonId !== lessonId)), '22b045211c87f1d697902191930be7ee10530b9cda1996e6b0e9084acfbb83df');
  assert.equal(hash(raw.evidence.filter(item => item.moduleId !== courseId)), '6301af093231dd0f535e884bb505d27f5765e244dc155dcd9bd1ae730bebd992');
  const { modules, evidence, ...metadata } = raw;
  assert.equal(hash(metadata), '05300cd6eab7d90407df1e392dfff3d2da2621dd5419c6701ded9b28ddcbb310');
  assert.equal(raw.reviewedOn, '2026-10-17');
  assert.equal(course.reviewedOn, '2026-10-17');
});

test('One appended 175-word lesson has precise scope, four claim mappings and three independent publishers', () => {
  assert.equal(learningModules.filter(item => item.id === courseId).length, 1);
  assert.equal(course.lessons.length, 5);
  assert.equal(course.questions.length, 26);
  assert.equal(course.lessons.at(-1).id, lessonId);
  assert.equal(lesson.reviewedOn, '2026-10-26');
  const text = lesson.paragraphs.join(' ');
  assert.equal(text.split(/\s+/).length, 175);
  assert.match(text, /konventionelle Zentralfeuer-Kugelpatrone/);
  assert.match(text, /Hülse, Zündhütchen beziehungsweise Zündelement, Treibladung und Geschoss/);
  assert.match(text, /„Patrone“ meint die gesamte Einheit/);
  assert.match(text, /Hülse beherbergt.*Gasabdichtung/);
  assert.match(text, /Zündhütchen übernimmt die Zündaufgabe/);
  assert.match(text, /Treibladung ist der Antriebsstoff; das Geschoss ist das Projektil/);
  assert.match(text, /Eigenes Lernbeispiel/);
  assert.match(text, /weder geöffnet noch bearbeitet/);
  assert.match(text, /nicht auf sämtliche Munitionsarten/);
  assert.match(text, /sagt nichts über die Eignung für eine bestimmte Waffe/);
  assert.doesNotMatch(text, /\d|Ladungsgewicht|Ladedichte|Gasdruckwert|Meter|Joule|Nitrozellulose|Laderezept|Wiederladeanleitung/);
  assert.equal(lesson.image, undefined);
  assert.equal(lesson.diagram, undefined);
  assert.equal(course.sources.length, 15);
  assert.deepEqual(course.sources.slice(9).map(source => source.url), urls);
  assert.ok(course.sources.slice(9).every(source => source.checkedOn === '2026-10-26' && JSON.stringify(source.lessonIds) === JSON.stringify([lessonId])));
  assert.equal(new Set(course.sources.slice(9).map(source => source.organization)).size, 3);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [
    [urls[0], urls[1], urls[2]], [urls[1], urls[3], urls[0]], [urls[1], urls[4]], [urls[1], urls[5]],
  ]);
  for (const claim of lesson.evidence) assert.ok(new Set(claim.sources.map(source => new URL(source.url).hostname)).size >= 2);
  for (const old of course.lessons.slice(0, 4)) assert.ok(old.evidence.every(claim => claim.sources.every(source => !urls.includes(source.url))));
});

test('Two own DACH quiz questions produce two complete cards, preserving every old course card and starter order', () => {
  assert.deepEqual(original.questions.slice(-2).map(question => question.answer), [1, 3]);
  assert.equal(hash(cards.filter(card => card.moduleId === courseId && card.lessonId !== lessonId)), '154f8cc6894a6a0ca8b81763a2deb55ecce956ec5874899667f136719726ca25');
  assert.equal(hash(cards.slice(0, 116)), '54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
  assert.equal(newCards.length, 2);
  const questions = course.questions.filter(question => question.lessonId === lessonId);
  assert.equal(questions.length, 2);
  const bank = load('data/questions-full.js').QUESTIONS;
  const { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const question of questions) {
    assert.ok(!learningModules.filter(item => item.id !== courseId).flatMap(item => item.questions).some(item => item.q === question.q));
    const correct = question.answers.filter(answer => question.correct.includes(answer.id));
    assert.equal(correct.length, 1);
    const card = newCards.find(item => item.id === `flash-${question.id}`);
    assert.ok(card);
    assert.equal(card.question, question.q);
    assert.equal(card.answer, correct[0].text);
    assert.equal(card.explanation, question.explain);
    assert.equal(card.reviewedOn, '2026-10-26');
    assert.equal(card.sourceScope, 'lesson');
    assert.deepEqual(card.sources.map(source => source.url), urls);
    assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lessonId}`);
    assert.equal(card.options, undefined);
    for (const country of ['DE', 'AT', 'CH']) assert.ok(quizLearningPool(bank, { country, topic: 'Waffen & Sicherheit' }).some(item => item.id === question.id));
  }
});

test('The existing category, search and course props expose the new lesson without another course or route', () => {
  const location = load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);
  assert.equal(location.categorySlug, 'waffen-sicherheit');
  assert.equal(location.groupId, 'pflege-kennzeichnung');
  const found = load('lib/learning-search.js').searchLearning({ query: 'Zentralfeuer-Kugelpatrone Zündhütchen', category: 'waffen-sicherheit', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
  assert.ok(found);
  assert.equal(found.href, `/kurse/${courseId}#lesson-${lessonId}`);
  assert.equal(found.lessonTitle, lesson.title);
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.at(-1), lesson);
  assert.equal(props.flashcards.lessons[lessonId], 2);
});

test('The actual course reader shows complete text before closed supplementary sources with the narrow date', () => {
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
  assert.ok(urls.every(url => html.indexOf(url) > sourceStart));
  assert.match(html.slice(sourceStart), /26\. Oktober 2026/);
  assert.doesNotMatch(html.slice(sourceStart), /17\. Oktober 2026/);
  assert.ok(!html.slice(sourceStart).split('>')[0].includes('open'));
  assert.match(html, /Lektion 5 von 5/);
  const Evidence = load('components/LessonEvidence.js').default;
  const oldHtml = renderToStaticMarkup(React.createElement(Evidence, { lesson: course.lessons[0], reviewedOn: course.reviewedOn }));
  assert.match(oldHtml, /17\. Oktober 2026/);
  assert.doesNotMatch(oldHtml, /26\. Oktober 2026/);
});

test('The actual print/PDF layout keeps complete card content before its source appendix', () => {
  const Print = createLoader({
    'next/router': { useRouter: () => ({ query: {}, isReady: true }) },
    '../../components/LearningToolLayout': { __esModule: true, default: ({ children }) => children },
    '../../components/PageMenu': { __esModule: true, default: () => null, closePageMenu() {} },
    '../../components/useFlashcardDeck': { __esModule: true, default: props => ({ ...props, incomplete: false, loading: false }) },
  })('pages/lernen/lernkarten-drucken.js').default;
  const html = renderToStaticMarkup(React.createElement(Print, { cards: newCards, categories: [{ id: 'waffen-sicherheit', title: 'Waffen & Sicherheit', count: 2 }] }));
  const appendix = html.indexOf('<h2 id="lernkarten-quellen">');
  assert.ok(appendix > 0);
  for (const card of newCards) for (const text of [card.question, card.answer, card.explanation]) assert.ok(html.slice(0, appendix).includes(text));
  assert.match(html, /26\.10\.2026/);
  assert.ok(urls.every(url => html.indexOf(url) > appendix));
});

test('A synthetic expiring offline pack and its actual reader retain complete text, evidence and distinct dates', () => {
  const previous = process.env.JL_SESSION_SECRET;
  process.env.JL_SESSION_SECRET = 'test-only-cartridge-offline';
  try {
    const now = Date.parse('2026-10-26T16:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'cartridge@example.invalid', paidUntil: '2026-10-29T16:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(pack.version, 1);
    assert.equal(validate(pack, now), true);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-17');
    assert.deepEqual(pack.courses[0].lessons, course.lessons);
    assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.equal(pack.courses[0].lessons.at(-1).reviewedOn, '2026-10-26');
    assert.deepEqual(pack.courses[0].lessons.at(-1).evidence, lesson.evidence);
    assert.equal(validate(pack, pack.expiresAt), false);
    let index = 0;
    const hooks = { ...React, useState(initial) { return [index++ === 1 ? 4 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
    const filename = path.join(root, 'components/OfflineLearning.js');
    const source = fs.readFileSync(filename, 'utf8') + '\nexport { OfflineCourse };';
    const { code } = local('next/dist/build/swc').transformSync(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    const mod = { exports: {} }, loader = createLoader({ react: hooks });
    new Function('require', 'module', 'exports', code)(id => id === 'react' ? hooks : id.endsWith('.module.css') ? { __esModule: true, default: {} } : id.startsWith('.') ? loader(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), mod, mod.exports);
    const html = renderToStaticMarkup(React.createElement(mod.exports.OfflineCourse, { course: pack.courses[0], expiresAt: Date.now() + 60000, onExpired() {} }));
    const sourceStart = html.indexOf('<summary>Quellen und Prüfstand</summary>');
    assert.ok(sourceStart > 0);
    for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, sourceStart).includes(paragraph));
    assert.ok(urls.every(url => html.indexOf(url) > sourceStart));
    assert.match(html.slice(sourceStart), /26\. Oktober 2026/);
    assert.doesNotMatch(html.slice(sourceStart), /17\. Oktober 2026/);
    const opening = html.slice(html.lastIndexOf('<details', sourceStart), sourceStart);
    assert.match(opening, /^<details(?:\s[^>]*)?>$/);
    assert.doesNotMatch(opening, /\bopen\b/);
  } finally {
    if (previous === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = previous;
  }
});
