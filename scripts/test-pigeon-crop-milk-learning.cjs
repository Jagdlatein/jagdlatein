const { flightFeatherBaselineFixture } = require('./helpers/flight-feather-additions-oct27.cjs');
const { firearmTermsBaselineFixture } = require('./helpers/firearm-terms-additions-oct27.cjs');
// Exact preservation, source scope and real reader/export checks; not a scientific certification.
const { digestiveIgnitionBaselineFixture, stripGewoelleDataset } = require('./helpers/digestive-ignition-additions-oct27.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { createLoader, local } = require('./helpers/project-module.cjs');
const raw = stripGewoelleDataset(require('../data/learning-expansion-biology-2026-10-16.json'));
const courseId = 'wissen-ausbau-biologie-verdauungsvergleich-2026';
const lessonId = 'kropfmilch';
const load = createLoader(flightFeatherBaselineFixture(firearmTermsBaselineFixture(digestiveIgnitionBaselineFixture())));
const { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const course = getLearningModule(courseId);
const original = raw.modules.find(item => item.id === courseId);
const lesson = course.lessons.at(-1);
const cards = load('lib/learning-flashcards.js').getFlashcards();
const urls = [
  'https://link.springer.com/article/10.1186/1471-2164-12-452',
  'https://funaab.edu.ng/funaab-ocw/LectureByWeek/LectureByWeek/VBA%20301/Lecture%201.pdf',
  'https://www.wald.rlp.de/wald/voegel/ringeltaube',
  'https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/ringeltaube-columba-palumbus',
];
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const stripAddition = item => item.id !== courseId ? item : {
  ...item, sources: item.sources.slice(0, 11),
  lessons: item.lessons.filter(entry => entry.id !== lessonId),
  questions: item.questions.filter(entry => entry.lessonId !== lessonId),
};
const referenceRaw = {
  ...raw, modules: raw.modules.map(stripAddition),
  evidence: raw.evidence.filter(item => !(item.moduleId === courseId && item.lessonId === lessonId)),
};
// A baseline projection of this single JSON addition keeps unrelated concurrently
// authored additions visible in BOTH loaders. No unrelated field is stripped.
const referenceLoad = createLoader(flightFeatherBaselineFixture(firearmTermsBaselineFixture(digestiveIgnitionBaselineFixture({ '../data/learning-expansion-biology-2026-10-16.json': referenceRaw }))));

test('All four old lessons, 32 questions, 11 sources, dates and five other biology courses remain exact', () => {
  assert.equal(hash(stripAddition(original)), 'fa1f649044b5b002b50e2997dd9a91425335cb1c12a69a58038dafc8b3306a00');
  assert.equal(hash(raw.modules.filter(item => item.id !== courseId)), '4ebae31f4c7f8601887dd0cf0994b09cfc800d27886100a6645c79c702af9403');
  assert.equal(hash(referenceRaw.evidence.filter(item => item.moduleId === courseId)), '40212a492cae51aa79eef6767dd711a77964cd31503cc6c64264295aafc2efd1');
  assert.equal(hash(stripAddition(course)), 'a14d0cad0b0bbd52e1a2131ae7572674b2b6d2adadedd48449063d54a82248b2');
  assert.equal(raw.reviewedOn, '2026-10-16');
  assert.equal(course.reviewedOn, '2026-10-16');
  assert.deepEqual(learningModules.map(stripAddition), referenceLoad('lib/learning-curriculum.js').learningModules);
});

test('One appended 143-word lesson has precise domestic and wild-species scopes with four mapped sources', () => {
  assert.equal(learningModules.filter(item => item.id === courseId).length, 1);
  assert.equal(course.lessons.length, 5);
  assert.equal(course.questions.length, 34);
  assert.equal(lesson.id, lessonId);
  assert.equal(lesson.reviewedOn, '2026-10-27');
  assert.equal(lesson.flashcardExpansion, true);
  assert.equal(lesson.paragraphs.join(' ').split(/\s+/).length, 143);
  const text = lesson.paragraphs.join(' ');
  assert.match(text, /Bei Haustauben \(Columba livia\)/);
  assert.match(text, /Männchen und Weibchen können Kropfmilch bilden/);
  assert.match(text, /abgeschilferte, fetthaltige Zellen aus der Kropfauskleidung/);
  assert.match(text, /aus dem Kropf hochgewürgt/);
  assert.match(text, /gehaltene King-Haustauben/);
  assert.match(text, /nicht, dass die Haustaubenstudie Ringeltauben untersucht hätte/);
  assert.match(text, /weder dieselbe Kropffunktion bei sämtlichen Vogelarten noch eine Anleitung zur Handaufzucht/);
  assert.doesNotMatch(text, /\d|Prolaktin|Prolactin|Prozent|ausschließlich aus|keine Sekrete|keine Kohlenhydrate/);
  assert.equal(lesson.image, undefined);
  assert.equal(lesson.diagram, undefined);
  assert.equal(course.sources.length, 15);
  assert.deepEqual(course.sources.slice(11).map(item => item.url), urls);
  assert.ok(course.sources.slice(11).every(item => item.checkedOn === '2026-10-27' && JSON.stringify(item.lessonIds) === JSON.stringify([lessonId])));
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [[urls[0], urls[1]], [urls[0], urls[2]], [urls[2], urls[3]]]);
  const record = raw.evidence.find(item => item.moduleId === courseId && item.lessonId === lessonId);
  assert.match(record.claims[0].sourceRoles[urls[0]], /nicht als eigener Geschlechtervergleich/);
  assert.match(record.claims[0].sourceRoles[urls[1]], /keine zweite experimentelle Replikation/);
});

test('Two distinct own questions/cards retain exact source evidence while all existing card objects and starter order remain exact', () => {
  const added = cards.filter(item => item.moduleId === courseId && item.lessonId === lessonId);
  assert.equal(added.length, 2);
  const historical = cards.filter(item => !(item.moduleId === courseId && item.lessonId === lessonId));
  assert.deepEqual(historical, referenceLoad('lib/learning-flashcards.js').getFlashcards());
  assert.equal(hash(cards.slice(0, 116)), '54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
  assert.equal(hash(cards.filter(item => item.moduleId === courseId && item.lessonId !== lessonId)), '5e1525be0b64232c4350ef00c7341caf97c05eeccf307008c4783df45e1abbd0');
  const questions = course.questions.filter(item => item.lessonId === lessonId);
  assert.equal(questions.length, 2);
  assert.notEqual(questions[0].q, questions[1].q);
  const bank = load('data/questions-full.js').QUESTIONS;
  const { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const question of questions) {
    assert.ok(!learningModules.flatMap(item => item.questions).some(item => item.id !== question.id && item.q === question.q));
    const [correct] = question.answers.filter(item => question.correct.includes(item.id));
    const card = added.find(item => item.id === `flash-${question.id}`);
    assert.equal(card.question, question.q);
    assert.equal(card.answer, correct.text);
    assert.equal(card.explanation, question.explain);
    assert.equal(card.reviewedOn, '2026-10-27');
    assert.equal(card.sourceScope, 'lesson');
    assert.deepEqual(card.sources.map(item => item.url), urls);
    assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lessonId}`);
    assert.equal(card.options, undefined);
    for (const country of ['DE', 'AT', 'CH']) assert.ok(quizLearningPool(bank, { country, topic: 'Wildkunde' }).some(item => item.id === question.id));
  }
});

test('Existing category, search, course and flashcard props expose the lesson without a new course or route', () => {
  const location = load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);
  assert.equal(location.categorySlug, 'wildkunde');
  const found = load('lib/learning-search.js').searchLearning({ query: 'Kropfmilch', category: 'wildkunde', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
  assert.ok(found);
  assert.equal(found.href, `/kurse/${courseId}#lesson-${lessonId}`);
  assert.equal(found.lessonTitle, lesson.title);
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.at(-1), lesson);
  assert.equal(props.flashcards.lessons[lessonId], 2);
});

test('The real course renderer places all learning text above closed final sources with the true lesson date', () => {
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
  assert.ok(sourceStart > 0);
  for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, sourceStart).includes(paragraph));
  assert.ok(urls.every(url => html.slice(sourceStart).includes(url)));
  assert.ok(urls.every(url => !html.slice(0, sourceStart).includes(url)));
  assert.match(html.slice(sourceStart), /27\. Oktober 2026/);
  assert.doesNotMatch(html.slice(sourceStart), /16\. Oktober 2026/);
  assert.ok(!html.slice(sourceStart).split('>')[0].includes('open'));
  assert.match(html, /Lektion 5 von 5/);
  const Evidence = load('components/LessonEvidence.js').default;
  const oldHtml = renderToStaticMarkup(React.createElement(Evidence, { lesson: course.lessons[0], reviewedOn: course.reviewedOn }));
  assert.match(oldHtml, /16\. Oktober 2026/);
  assert.doesNotMatch(oldHtml, /27\. Oktober 2026/);
});

test('An expiring offline pack preserves old dates, complete questions and the new lesson evidence', () => {
  const previous = process.env.JL_SESSION_SECRET;
  process.env.JL_SESSION_SECRET = 'test-only-pigeon-crop-milk';
  try {
    const now = Date.parse('2026-10-27T09:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'pigeon@example.invalid', paidUntil: '2026-10-29T09:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(validate(pack, now), true);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-16');
    assert.deepEqual(pack.courses[0].lessons, course.lessons);
    assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.equal(pack.courses[0].lessons.at(-1).reviewedOn, '2026-10-27');
    assert.deepEqual(pack.courses[0].lessons.at(-1).evidence, lesson.evidence);
    assert.equal(validate(pack, pack.expiresAt), false);
  } finally {
    if (previous === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = previous;
  }
});
