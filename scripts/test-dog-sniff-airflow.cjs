const { practiceKnowledgeBaselineFixture } = require('./helpers/practice-knowledge-additions-oct29.cjs');
const { linkedExamBaselineFixture } = require('./helpers/linked-exam-additions-oct29.cjs');
const { examKnowledgeBaselineFixture } = require('./helpers/exam-knowledge-additions-oct29.cjs');
const { stripDogLearningProcessesAddition } = require('./helpers/dog-learning-processes-additions-oct29.cjs');
const { isPlantEnergyCard } = require('./helpers/plant-energy-additions-oct27.cjs');
const { isAdiposeCard } = require('./helpers/adipose-learning-additions-oct27.cjs');
const { isFlightFeatherCard } = require('./helpers/flight-feather-additions-oct27.cjs');
const { isFirearmTermsCard } = require('./helpers/firearm-terms-additions-oct27.cjs');
const { isScopedCard: isDigestiveIgnitionCard } = require('./helpers/digestive-ignition-additions-oct27.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader: createLinkedProjectLoader, local, root } = require('./helpers/project-module.cjs');
const createLoader = overrides => createLinkedProjectLoader(practiceKnowledgeBaselineFixture(linkedExamBaselineFixture(overrides)));
const { isOctober26Card } = require('./helpers/learning-additions-oct26.cjs');
const { isOctober27Card } = require('./helpers/learning-additions-oct27.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader(examKnowledgeBaselineFixture());
const courseId = 'wissen-vertiefung-hunde-nase-spur-laut';
const lessonId = `${courseId}-ausatemrichtung`;
const rawCourses = load('lib/learning-dog-depth.js').dogDepthModules.map(stripDogLearningProcessesAddition);
const raw = rawCourses.find(course => course.id === courseId);
const course = load('lib/learning-curriculum.js').getLearningModule(courseId);
const lesson = course.lessons.find(item => item.id === lessonId);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const Evidence = load('components/LessonEvidence.js').default;
const evidenceHtml = (current, reviewedOn) => renderToStaticMarkup(React.createElement(Evidence, { lesson: current, reviewedOn, embedded: true }));

test('Append one bounded lesson without changing the six historical lessons, twelve questions or four other courses', () => {
  assert.equal(raw.lessons.length, 7);
  assert.equal(raw.questions.length, 13);
  assert.equal(raw.reviewedOn, '2026-10-12');
  assert.equal(hash(raw.lessons.slice(0, 6)), 'e039667243d6cac9d4e7317b6bb85007fc896a3daa5407415ef1aee85bf6b745');
  assert.equal(hash(raw.questions.slice(0, 12)), '6532c0449e51738455663b3a4dd7ac2d64a410f6ab47fea2fa903bada224b9bc');
  assert.equal(hash(rawCourses.filter(item => item.id !== courseId)), '85e1f1ebd5a9d9cddacd05fd17ad7ee2cc5087fb7a6b0f374f97e0ce909f4717');
  assert.equal(raw.lessons.at(-1).id, lessonId);
  assert.equal(lesson.reviewedOn, '2026-10-24');
  assert.equal(new Set(course.sources.map(source => source.url)).size, course.sources.length);
});

test('The direction, anatomical-model boundary and independent review role remain directly readable', () => {
  const text = lesson.paragraphs.join(' ');
  assert.match(text, /vor den Nasenlöchern eingesogen und seitlich ausgeatmet/);
  assert.match(text, /Labrador-Mischlingsnase/);
  assert.match(text, /mesaticephale/);
  assert.match(text, /keine unabhängige Wiederholung/);
  assert.match(text, /weder seine individuelle Nasenleistung/);
  assert.doesNotMatch(text, /\d|Zentimeter|Hertz|Liter|Wirbel|Verwirbelung|Millionen/);
  assert.equal(lesson.sourceReview.checkedOn, '2026-10-24');
  assert.deepEqual(lesson.sourceReview.sourceIds, ['sniffAirflowCraven', 'sniffAirflowJendrny']);
  assert.equal(lesson.evidence.length, 1);
  assert.equal(lesson.evidence[0].sources.length, 2);
  assert.match(evidenceHtml(lesson, course.reviewedOn), /24\. Oktober 2026/);
  assert.ok(!evidenceHtml(lesson, course.reviewedOn).includes('12. Oktober 2026'));
});

test('One affirmative own question and card preserve answer, explanation and exact claim sources', () => {
  const questions = course.questions.filter(question => question.lessonId === lessonId);
  assert.equal(questions.length, 1);
  const [question] = questions;
  const [correct] = question.answers.filter(answer => question.correct.includes(answer.id));
  assert.equal(correct.text, 'Von vorn zur Nase beim Einatmen und seitlich nach außen beim Ausatmen.');
  const cards = load('lib/learning-flashcards.js').getFlashcards().filter(card => card.lessonId === lessonId);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].question, question.q);
  assert.equal(cards[0].answer, correct.text);
  assert.equal(cards[0].explanation, question.explain);
  assert.deepEqual(cards[0].sources, lesson.evidence[0].sources);
  assert.equal(cards[0].sourceScope, 'lesson');
  assert.equal(cards[0].reviewedOn, '2026-10-24');
  assert.equal(cards[0].courseHref, `/kurse/${courseId}#lesson-${lessonId}`);
  assert.equal(cards[0].options, undefined);
  assert.equal(lesson.flashcardExpansion, true);
});

test('The ISO helper rejects rollover, malformed and absent dates without manufacturing today', () => {
  const { getLessonReviewDate, isLearningReviewDate } = load('lib/learning-review-date.js');
  for (const value of [undefined, null, 20261024, '', '2026-2-01', '2026-02-29', '2026-02-30', '2026-04-31', '2026-13-01', '1900-02-29', '2026-10-24T00:00:00Z']) {
    assert.equal(isLearningReviewDate(value), false, String(value));
    assert.equal(getLessonReviewDate({ reviewedOn: value }, undefined), '');
  }
  for (const value of ['2026-10-24', '2024-02-29', '2000-02-29']) assert.equal(isLearningReviewDate(value), true);
  assert.equal(getLessonReviewDate(lesson, '2026-10-12'), '2026-10-24');
  assert.equal(getLessonReviewDate({}, '2026-10-12'), '2026-10-12');
  assert.equal(getLessonReviewDate({ reviewedOn: '2026-02-30' }, '2026-10-12'), '2026-10-12');
  assert.equal(getLessonReviewDate(undefined, undefined), '');
  const undated = { ...lesson }; delete undated.reviewedOn;
  for (const value of [undefined, '', '2026-02-30', 'wrong']) {
    const html = evidenceHtml(undated, value);
    assert.match(html, /Quellenzuordnung der Ausgangslektion/);
    assert.doesNotMatch(html, /wurden am|Invalid Date/);
    assert.ok(html.includes(lesson.evidence[0].sources[0].url));
  }
});

test('All published starter objects and their order stay exact; only true pre-existing lesson dates correct old extras', () => {
  const cards = load('lib/learning-flashcards.js').getFlashcards();
  assert.equal(hash(cards.slice(0, 116)), '54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
  const affected = cards.filter(card => card.reviewedOn === '2026-10-13' && [courseId, 'wissen-vertiefung-hunde-klare-lernsignale'].includes(card.moduleId));
  assert.equal(affected.length, 7);
  assert.equal(affected.filter(card => card.lessonId.endsWith('-fundkontrolle')).length, 2);
  // Later independently tested appendices were not part of the 1,709-card
  // snapshot. Remove only their exact IDs; retain the original full hash.
  const isLaterAppendixCard = card => isPlantEnergyCard(card) || isAdiposeCard(card)
    || isFlightFeatherCard(card) || isFirearmTermsCard(card) || isDigestiveIgnitionCard(card)
    || card.id === 'flash-wissen-ausbau-oekologie-tierbewegungen-2026-seitenliniensinn-wasserbewegung';
  const oldCards = cards.filter(card => !isOctober26Card(card) && !isOctober27Card(card) && !isLaterAppendixCard(card) && card.lessonId !== lessonId && !(card.moduleId === 'wissen-biber-schneidezaehne-2026' && card.lessonId === 'mundhautfalte-unterwassernagen') && card.id !== 'flash-wissen-ausbau-oekologie-holzaufbau-2026-gefaessverteilung-ringporige-eiche' && card.id !== 'flash-wissen-ausbau-biologie-vogelkoerper-2026-gegenstrom-waermerichtung').map(card => affected.includes(card) ? { ...card, reviewedOn: '2026-10-12' } : card).sort((a, b) => a.id.localeCompare(b.id));
  assert.equal(oldCards.length, 1709);
  assert.equal(hash(oldCards), 'e60d8dc9182448c95248fea11b09e2a90d497906901fa7ebe70841e65d2d3c43', 'All 1709 historical card objects stay exact except seven corrected date fields');
  for (const card of cards.filter(card => card.moduleId === courseId && card.lessonId !== lessonId)) {
    assert.ok(!card.sources.some(source => source.url.includes('s12879-021-06523-8')), 'new lesson source must not be attached to old course cards');
  }
  assert.ok(cards.findIndex(card => card.lessonId === lessonId) >= 116);
  const courseExtras = cards.slice(116).filter(card => card.moduleId === courseId);
  assert.equal(courseExtras[0].lessonId, lessonId);
  assert.ok(courseExtras.findIndex(card => card.lessonId.endsWith('-fundkontrolle')) < courseExtras.findIndex(card => card.lessonId.endsWith('-schnueffeln')));
});

test('Existing course-tree and text-search paths discover the added lesson without a second course', () => {
  assert.equal(rawCourses.filter(item => item.id === courseId).length, 1);
  const location = load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);
  assert.equal(location.categorySlug, 'hundewesen');
  assert.equal(location.groupId, 'nasenarbeit-nachsuche');
  const result = load('lib/learning-search.js').searchLearning({ query: 'seitlich ausgeatmet', category: 'hundewesen' });
  const found = result.results.find(item => item.href.startsWith(`/kurse/${courseId}`));
  assert.ok(found);
  assert.equal(found.href, `/kurse/${courseId}#lesson-${lessonId}`);
  assert.equal(found.lessonTitle, lesson.title);
});

test('New offline packs preserve the narrow date and evidence; undated legacy packs remain valid and source-only', () => {
  const previous = process.env.JL_SESSION_SECRET;
  process.env.JL_SESSION_SECRET = 'unit-test-sniff-date-not-a-credential';
  try {
    const now = Date.parse('2026-10-24T12:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'sniff@example.invalid', paidUntil: '2026-10-26T12:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(validate(pack, now), true);
    assert.deepEqual(pack.courses[0].lessons.at(-1), lesson);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-12');
    const saved = JSON.parse(JSON.stringify(pack));
    assert.match(evidenceHtml(saved.courses[0].lessons.at(-1), saved.courses[0].reviewedOn), /24\. Oktober 2026/);
    delete saved.courses[0].reviewedOn;
    for (const item of saved.courses[0].lessons) delete item.reviewedOn;
    assert.equal(validate(saved, now), true);
    assert.match(evidenceHtml(saved.courses[0].lessons.at(-1), saved.courses[0].reviewedOn), /Quellenzuordnung der Ausgangslektion/);
    assert.equal(saved.expiresAt, pack.expiresAt);
    assert.equal(validate(pack, pack.expiresAt), false);
  } finally {
    if (previous === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = previous;
  }
});

test('The actual offline course reader renders the new lesson review at the existing final source section', () => {
  let stateIndex = 0;
  const hooks = { ...React, useState(initial) { return [stateIndex++ === 1 ? 6 : initial, () => {}]; }, useRef(initial) { return { current: initial }; } };
  const filename = path.join(root, 'components/OfflineLearning.js');
  const source = fs.readFileSync(filename, 'utf8') + '\nexport { OfflineCourse };';
  const { code } = local('next/dist/build/swc').transformSync(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} }, loader = createLoader({ react: hooks });
  new Function('require', 'module', 'exports', code)(id => id === 'react' ? hooks : id.endsWith('.module.css') ? { __esModule: true, default: {} } : id.startsWith('.') ? loader(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), mod, mod.exports);
  const html = renderToStaticMarkup(mod.exports.OfflineCourse({ course, expiresAt: Date.now() + 60000, onExpired() {} }));
  assert.ok(html.includes(lesson.paragraphs[0]));
  assert.ok(html.indexOf('Quellen und Prüfstand') > html.indexOf(lesson.paragraphs[0]));
  assert.match(html, /24\. Oktober 2026/);
  assert.doesNotMatch(html, /12\. Oktober 2026/);
});

test('The card display also rejects impossible ISO calendar days with the shared helper', () => {
  const { formatFlashcardDate } = load('components/LearningFlashcards.js');
  for (const value of [undefined, '', '2026-02-29', '2026-02-30', '2026-04-31', 'wrong']) assert.equal(formatFlashcardDate(value), null);
  assert.equal(formatFlashcardDate('2026-10-24'), '24.10.2026');
  assert.equal(formatFlashcardDate('2024-02-29'), '29.2.2024');
});

test('The actual print renderer labels an old course-source fundkontrolle card with its true inherited lesson date', () => {
  const card = load('lib/learning-flashcards.js').getFlashcards().find(item => item.moduleId === courseId && item.lessonId.endsWith('-fundkontrolle'));
  assert.ok(card);
  assert.equal(card.sourceScope, 'course');
  assert.equal(card.reviewedOn, '2026-10-13');
  const Print = createLoader({
    'next/router': { useRouter: () => ({ query: {}, isReady: true }) },
    '../../components/LearningToolLayout': { __esModule: true, default: ({ children }) => children },
    '../../components/PageMenu': { __esModule: true, default: () => null, closePageMenu() {} },
    '../../components/useFlashcardDeck': { __esModule: true, default: props => ({ ...props, incomplete: false, loading: false }) },
  })('pages/lernen/lernkarten-drucken.js').default;
  const html = renderToStaticMarkup(React.createElement(Print, { cards: [card], categories: [{ id: 'hundewesen', title: 'Hundewesen', count: 1 }] }));
  assert.ok(html.includes(card.question));
  assert.ok(html.includes(card.answer));
  assert.match(html, /Übernommener Prüfstand: 13\.10\.2026/);
  assert.doesNotMatch(html, /Stand des Ausgangskurses|12\.10\.2026|24\.10\.2026/);
  assert.match(html, /Quellen des Ausgangskurses/);
  assert.match(html, /Quellenverzeichnis/);
  assert.ok(card.sources.every(source => html.includes(source.url)));
});
