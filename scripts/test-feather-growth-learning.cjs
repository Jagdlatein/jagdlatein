const { plantEnergyBaselineFixture } = require('./helpers/plant-energy-additions-oct27.cjs');
const { adiposeBaselineFixture } = require('./helpers/adipose-learning-additions-oct27.cjs');
const { flightFeatherBaselineFixture, stripFlightFeatherDataset } = require('./helpers/flight-feather-additions-oct27.cjs');
const { firearmTermsBaselineFixture } = require('./helpers/firearm-terms-additions-oct27.cjs');
// Narrow editorial and integration checks; source reading is documented separately.
const { digestiveIgnitionBaselineFixture } = require('./helpers/digestive-ignition-additions-oct27.cjs');
const { fishLateralLineBaselineFixture } = require('./helpers/fish-lateral-line-addition.cjs');
const test = require('node:test'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { createLoader, local } = require('./helpers/project-module.cjs');
const raw = stripFlightFeatherDataset(require('../data/learning-expansion-wildlife-dogs-2026-10-16.json'));
const load = createLoader(plantEnergyBaselineFixture(adiposeBaselineFixture(flightFeatherBaselineFixture(firearmTermsBaselineFixture(digestiveIgnitionBaselineFixture(fishLateralLineBaselineFixture())))))), courseId = 'wissen-ausbau-federaufbau-funktion-2026', lessonId = 'federwachstum';
const questionId = 'federwachstum-blutversorgung', cardId = `flash-${courseId}-${questionId}`;
const bto = 'https://www.bto.org/sites/default/files/moult-in-birds-web.pdf';
const fsu = 'https://micro.magnet.fsu.edu/primer/techniques/fluorescence/gallery/downfeathers.html';
const { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const course = getLearningModule(courseId), original = raw.modules.find(item => item.id === courseId);
const lesson = course.lessons.at(-1), cards = load('lib/learning-flashcards.js').getFlashcards();
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function beforeGrowth(module) {
  return module.id !== courseId ? module : { ...module,
    sources: module.sources.filter(source => source.url !== fsu),
    lessons: module.lessons.filter(item => item.id !== lessonId),
    questions: module.questions.filter(item => ![questionId, `${courseId}-${questionId}`].includes(item.id)),
  };
}

test('Only the exact feather-growth addition differs from the complete ac6b5af dataset, five lessons,18 questions and seven source objects', () => {
  const historicalRaw = { ...raw, modules: raw.modules.map(beforeGrowth), evidence: raw.evidence.filter(item => !(item.moduleId === courseId && item.lessonId === lessonId)) };
  assert.equal(hash(historicalRaw), 'be24f8161b73f259d0c7010239382e3b6d49720bf1e8f9d828ecc8c87f47429a');
  assert.equal(hash(beforeGrowth(original)), 'd9c29f4f2e02d508cdb8ad983a69bc51dcc959a4e64068248493ecc4c5a01c20');
  assert.equal(hash(raw.modules.filter(item => item.id !== courseId)), 'fcefb210fccacd9f54512fd5067552909228a86c3edcae7f47bc1eaa29ed3594');
  assert.equal(hash(raw.evidence.filter(item => item.moduleId === courseId && item.lessonId !== lessonId)), '3fdbe96aca7fe384a8fd8fdd121be601ab3ccd4e91fa05a1ac341ea360878f59');
  assert.equal(hash(beforeGrowth(course)), 'acf2f16ea7765d5210cc3c68728addb39316bcce1c7d9a24b0d25d8db79fcbe2');
  assert.equal(raw.reviewedOn, '2026-10-16'); assert.equal(course.reviewedOn, '2026-10-16');
  assert.equal(course.lessons.find(item => item.id === 'wasserschutz').reviewedOn, '2026-10-26');
});

test('One134-word appended anatomy lesson has two concrete source mappings and only its own new review date', () => {
  assert.equal(course.lessons.length, 6); assert.equal(course.questions.length, 19); assert.equal(course.sources.length, 8);
  assert.equal(lesson.id, lessonId); assert.equal(lesson.reviewedOn, '2026-10-27'); assert.equal(lesson.flashcardExpansion, true);
  assert.equal(lesson.paragraphs.join(' ').split(/\s+/).length, 134);
  const text = lesson.paragraphs.join(' ');
  assert.match(text, /Federfollikel, einer kleinen Vertiefung der Haut/);
  assert.match(text, /Während des Wachstums.*über Blutgefäße versorgt/);
  assert.match(text, /Beim Ausreifen zieht sich die Federpulpa.*zurück/);
  assert.match(text, /Blutversorgung des wachsenden Federinneren endet/);
  assert.match(text, /umgebende Haut.*nicht als blutlos/);
  assert.match(text, /keinen gemeinsamen Mausertag/); assert.match(text, /weder eine sichere Beurteilung der Blutversorgung noch eine Anleitung zum Eingriff/);
  assert.doesNotMatch(text, /\d|Schilddrüse|thyroid|Evolution|Blutung|auszupfen|schneiden|Medikament|vollständig hohl/);
  assert.equal(lesson.image, undefined); assert.equal(lesson.diagram, undefined);
  assert.equal(course.sources.at(-1).url, fsu); assert.equal(course.sources.at(-1).checkedOn, '2026-10-27'); assert.deepEqual(course.sources.at(-1).lessonIds, [lessonId]);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [[bto, fsu], [bto, fsu]]);
  const record = raw.evidence.find(item => item.moduleId === courseId && item.lessonId === lessonId);
  assert.match(record.claims[0].sourceRoles[bto], /Seite 10/); assert.match(record.claims[1].sourceRoles[bto], /Seite 25/);
  assert.match(record.claims[1].sourceRoles[fsu], /Keine umgebende Aussage/);
});

test('All198 prior full course objects and all1720 prior cards including116 starters retain exact contents and order', () => {
  assert.equal(learningModules.length, 198);
  assert.equal(hash(learningModules.map(beforeGrowth)), '2db74f0237e7983eacefd03a86abe19c071e73ebabb83b8da0fd59785b732cd8');
  const historical = cards.filter(card => card.id !== cardId);
  assert.equal(historical.length, 1720); assert.equal(hash(historical), 'e01e7e45482cc7eac2d3ab980cd40a0188eabae531e90d712276ccab5bdd44c6');
  assert.equal(hash(cards.filter(card => card.moduleId === courseId && card.id !== cardId)), '38f3887cbe5115266243b8c748d9b12983fc25e11521c675537a9dc980e2af50');
  assert.equal(hash(cards.slice(0, 116)), '54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
  assert.equal(cards.filter(card => card.moduleId === courseId).length, 16);
});

test('One distinct own question becomes one exact dated card and remains in each existing shared country quiz pool', () => {
  const questions = course.questions.filter(item => item.lessonId === lessonId); assert.equal(questions.length, 1);
  const [question] = questions, [answer] = question.answers.filter(item => question.correct.includes(item.id));
  assert.equal(question.id, `${courseId}-${questionId}`); assert.equal(new Set(question.answers.map(item => item.text)).size, 4);
  assert.ok(!learningModules.flatMap(module => module.questions).some(item => item.id !== question.id && item.q === question.q));
  const chosen = cards.filter(card => card.id === cardId); assert.equal(chosen.length, 1);
  const [card] = chosen; assert.equal(card.question, question.q); assert.equal(card.answer, answer.text); assert.equal(card.explanation, question.explain);
  assert.equal(card.reviewedOn, '2026-10-27'); assert.equal(card.sourceScope, 'lesson'); assert.deepEqual(card.sources, lesson.evidence[0].sources);
  assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lessonId}`); assert.equal(card.options, undefined);
  const bank = load('data/questions-full.js').QUESTIONS, { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const country of ['DE', 'AT', 'CH']) assert.ok(quizLearningPool(bank, { country, topic: 'Wildkunde' }).some(item => item.id === question.id));
});

test('The existing course branch, search, static course props and expiring offline pack retain the full new lesson and precise evidence', () => {
  const location = load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId); assert.equal(location.categorySlug, 'wildkunde'); assert.equal(location.groupId, 'koerperbau-atmung');
  const result = load('lib/learning-search.js').searchLearning({ query: 'Federfollikel', category: 'wildkunde', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
  assert.equal(result.href, `/kurse/${courseId}#lesson-${lessonId}`); assert.equal(result.lessonTitle, lesson.title);
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.at(-1), lesson); assert.equal(props.flashcards.lessons[lessonId], 1);
  const previous = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-feather-growth-offline';
  try {
    const now = Date.parse('2026-10-27T11:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'feather@example.invalid', paidUntil: '2026-10-29T11:00:00Z' }, now);
    const { validateOfflinePack } = load('lib/offline-learning.js');
    assert.equal(validateOfflinePack(pack, now), true); assert.equal(validateOfflinePack(pack, pack.expiresAt), false);
    assert.deepEqual(pack.courses[0].lessons, course.lessons); assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-16'); assert.equal(pack.courses[0].lessons.at(-1).reviewedOn, '2026-10-27');
    assert.deepEqual(pack.courses[0].lessons.at(-1).evidence, lesson.evidence);
  } finally { if (previous === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = previous; }
});

test('The real course reader shows the complete sixth lesson above its closed final two-source evidence and inherited date', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server'); let index = 0;
  const hooks = { ...React, useState(initial) { return [index++ === 1 ? 5 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
  const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ asPath: `/kurse/${courseId}#lesson-${lessonId}` }) },
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
    '../hooks/useCourseProgress': () => ({}), './CourseProgressNotice': { __esModule: true, default: () => null },
  })('components/LearningCourse.js').default;
  const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: load('lib/learning-flashcards.js').getFlashcardLessonSummary(courseId) }));
  const sourceStart = html.indexOf('<details id="quellen"'); assert.ok(sourceStart > 0);
  for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, sourceStart).includes(paragraph));
  for (const url of [bto, fsu]) { assert.ok(html.slice(sourceStart).includes(url)); assert.ok(!html.slice(0, sourceStart).includes(url)); }
  assert.match(html, /Lektion 6 von 6/); assert.match(html.slice(sourceStart), /27\. Oktober 2026/);
  assert.doesNotMatch(html.slice(sourceStart), /16\. Oktober 2026|26\. Oktober 2026/);
  assert.ok(!html.slice(sourceStart).split('>')[0].includes('open'));
});
