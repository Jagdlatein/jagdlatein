const { practiceKnowledgeBaselineFixture } = require('./helpers/practice-knowledge-additions-oct29.cjs');
const { linkedExamBaselineFixture } = require('./helpers/linked-exam-additions-oct29.cjs');
const { examKnowledgeBaselineFixture } = require('./helpers/exam-knowledge-additions-oct29.cjs');
const { plantEnergyBaselineFixture, stripPlantEnergyDataset } = require('./helpers/plant-energy-additions-oct27.cjs');
const { adiposeBaselineFixture } = require('./helpers/adipose-learning-additions-oct27.cjs');
const { flightFeatherBaselineFixture } = require('./helpers/flight-feather-additions-oct27.cjs');
const { firearmTermsBaselineFixture } = require('./helpers/firearm-terms-additions-oct27.cjs');
// Narrow data, integration and preservation checks; not scientific certification.
const { digestiveIgnitionBaselineFixture } = require('./helpers/digestive-ignition-additions-oct27.cjs');
const { fishLateralLineBaselineFixture, withoutFishLateralLineDataset } = require('./helpers/fish-lateral-line-addition.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { createLoader: createLinkedProjectLoader, local } = require('./helpers/project-module.cjs');
const createLoader = overrides => createLinkedProjectLoader(practiceKnowledgeBaselineFixture(linkedExamBaselineFixture(overrides)));
const { stripOctober26Additions, isOctober26Card } = require('./helpers/learning-additions-oct26.cjs');
const { stripOctober27Additions, isOctober27Card } = require('./helpers/learning-additions-oct27.cjs');
const raw = stripPlantEnergyDataset(withoutFishLateralLineDataset(require('../data/learning-expansion-ecology-2026-10-16.json')));
const load = createLoader(examKnowledgeBaselineFixture(plantEnergyBaselineFixture(adiposeBaselineFixture(flightFeatherBaselineFixture(firearmTermsBaselineFixture(digestiveIgnitionBaselineFixture(fishLateralLineBaselineFixture())))))));
const courseId = 'wissen-ausbau-oekologie-holzaufbau-2026';
const lessonId = 'gefaessverteilung';
const { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const course = getLearningModule(courseId);
const original = raw.modules.find(item => item.id === courseId);
const lesson = course.lessons.find(item => item.id === lessonId);
const cards = load('lib/learning-flashcards.js').getFlashcards();
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const urls = [
  'https://www.lwf.bayern.de/mam/cms04/forsttechnik-holz/dateien/w75_das_holz_der_eiche-eigenschaften_und_verwendung_bf_gesch.pdf',
  'https://api.pageplace.de/preview/DT0400.9783481029913_A28848045/preview-9783481029913_A28848045.pdf',
  'https://www.wald.rlp.de/nutzen/holz/oeko-rohstoff',
  'https://www.waldwissen.net/de/waldwirtschaft/waldbau/standortskunde/die-birke-unkraut-oder-alternative',
];

test('The four old lesson objects, 32 questions, five sources and their evidence stay exact', () => {
  assert.equal(raw.reviewedOn, '2026-10-16');
  assert.equal(original.reviewedOn, '2026-10-16');
  assert.equal(course.reviewedOn, '2026-10-16');
  assert.equal(hash(original.lessons.slice(0, 4)), 'f75aacf328f04ced91ee62788c65c6920e8ef03b85e6d2c0ae0e04d22e3fda55');
  assert.equal(hash(original.questions.slice(0, 32)), '3cb1799efaa6ada2dbdcd33f639fa88262d1f69e2e3c53ea96582d72b81547a8');
  assert.equal(hash(original.sources.slice(0, 5)), 'b06e1845ae2468a5c1651e5e25d9210023f137acf21609d58bab2e965a51299d');
  assert.equal(hash(raw.evidence.filter(item => item.moduleId === courseId && item.lessonId !== lessonId)), 'd9cbdb2035a3051e6e7d09f573aa7b31f21594bb65794944189f742eb05b9e04');
  assert.equal(hash(raw.modules.filter(item => item.id !== courseId)), '730ec25b50d0ec7bd6a3f46bc7c1a863448914533708ed11370c1e4521793758');
  const historical = { ...course, sources: course.sources.slice(0, 5), lessons: course.lessons.slice(0, 4), questions: course.questions.slice(0, 32) };
  assert.equal(hash(historical), 'b8830a962f8da63e72105f158d5e48ade55d09862f2a8f0a18dab38ddb0fe992');
  const historicalDataset = {
    ...raw,
    modules: raw.modules.map(item => item.id === courseId ? { ...item, sources: item.sources.slice(0, 5), lessons: item.lessons.slice(0, 4), questions: item.questions.slice(0, 32) } : item),
    evidence: raw.evidence.filter(item => !(item.moduleId === courseId && item.lessonId === lessonId)),
  };
  assert.equal(hash(historicalDataset), 'cd86b37ab9f7c94790f45e71049c6686f1f0d3a6363d8102bbc1c51ec79617a0');
});

test('One 150-word fifth lesson has its actual date and three precise independent-source mappings', () => {
  assert.equal(learningModules.filter(item => item.id === courseId).length, 1);
  assert.equal(course.lessons.length, 5);
  assert.equal(course.questions.length, 33);
  assert.equal(course.lessons.at(-1).id, lessonId);
  assert.equal(lesson.paragraphs.join(' ').split(/\s+/).length, 150);
  assert.equal(lesson.reviewedOn, '2026-10-24');
  assert.equal(course.sources.length, 9);
  assert.deepEqual(course.sources.slice(5).map(item => item.url), urls);
  assert.ok(course.sources.slice(5).every(item => item.checkedOn === '2026-10-24' && JSON.stringify(item.lessonIds) === JSON.stringify([lessonId])));
  assert.equal(lesson.evidence.length, 3);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [[urls[0], urls[1]], [urls[1], urls[2]], [urls[2], urls[3]]]);
  const text = lesson.paragraphs.join(' ');
  assert.match(text, /große Frühholzgefäße.*Porenring/);
  assert.match(text, /Spätholzgefäße sind deutlich kleiner/);
  assert.match(text, /Sandbirke ist ein heimisches Beispiel/);
  assert.match(text, /nicht, dass sämtliche Gefäße exakt gleich groß sein müssen/);
  assert.match(text, /keinen vollständigen Holzbestimmungsschlüssel/);
  assert.match(text, /Eigene Denkübung/);
  assert.doesNotMatch(text, /\d|Buche|Linde|Zentimeter|Dichtewert|Gerbstoff|Chemie|Imprägnier|Säge/);
  assert.equal(lesson.diagram, undefined);
  assert.equal(lesson.image, undefined);
});

test('All 197 other courses, 1711 historical card objects and 116 starter objects keep their exact content and order', () => {
  const birdCourseId = 'wissen-ausbau-biologie-vogelkoerper-2026';
  const birdCourse = getLearningModule(birdCourseId);
  assert.equal(birdCourse.lessons.length, 5);
  assert.equal(birdCourse.questions.length, 33);
  assert.equal(birdCourse.sources.length, 10);
  const historicalCourses = learningModules.filter(item => item.id !== courseId).map(stripOctober26Additions).map(stripOctober27Additions).map(item => item.id === birdCourseId
    ? { ...item, sources: item.sources.slice(0, 7), lessons: item.lessons.slice(0, 4), questions: item.questions.slice(0, 32) } : item);
  assert.equal(hash(historicalCourses), 'f77a7604fd1b23f662246da092f7c060784e709ac92ebdc5f351cacd37f4c0f2');
  assert.equal(hash(cards.slice(0, 116)), '54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
  const historical = cards.filter(card => !isOctober26Card(card) && !isOctober27Card(card) && card.id !== 'flash-wissen-ausbau-oekologie-holzaufbau-2026-gefaessverteilung-ringporige-eiche' && card.id !== 'flash-wissen-ausbau-biologie-vogelkoerper-2026-gegenstrom-waermerichtung');
  assert.equal(historical.length, 1711);
  assert.equal(hash(historical), '949d098b9e3bdc6211da3c665cfc9221f1c074660b32a91d04208b6b7324eb32');
  assert.equal(hash([...historical].sort((a, b) => a.id.localeCompare(b.id))), '471a574e4f2e610bc3c673c6351e11348fe00c1b9547a7f7194844651a1ae9a5');
  const oldCourseCards = cards.filter(card => card.moduleId === courseId && card.lessonId !== lessonId);
  assert.equal(oldCourseCards.length, 31);
  assert.equal(hash(oldCourseCards), 'ad49ad2886db253b985de702148c39e25f5915f1e854202752c25616690d6646');
  assert.ok(oldCourseCards.every(card => card.reviewedOn === '2026-10-16' && !card.sources.some(source => urls.includes(source.url))));
  const beforeOctober27 = learningModules.map(stripOctober27Additions);
  assert.deepEqual({ modules: beforeOctober27.length, lessons: beforeOctober27.reduce((sum, item) => sum + item.lessons.length, 0), questions: beforeOctober27.reduce((sum, item) => sum + item.questions.length, 0) }, { modules: 198, lessons: 851, questions: 2709 });
  assert.equal(cards.filter(card => !isOctober27Card(card)).length, 1717);
});

test('The single original new question and card share answer, date, four scoped sources and the existing lesson link', () => {
  const [question] = course.questions.filter(item => item.lessonId === lessonId);
  assert.equal(course.questions.filter(item => item.lessonId === lessonId).length, 1);
  assert.ok(!learningModules.filter(item => item.id !== courseId).flatMap(item => item.questions).some(item => item.q === question.q));
  const correct = question.answers.filter(answer => question.correct.includes(answer.id));
  assert.equal(correct.length, 1);
  assert.equal(correct[0].text, 'Ein Ring großer Frühholzgefäße vor deutlich kleineren Spätholzgefäßen.');
  const bank = load('data/questions-full.js').QUESTIONS;
  const { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const country of ['DE', 'AT', 'CH']) assert.ok(quizLearningPool(bank, { country, topic: 'Wald & Pflanzen' }).some(item => item.id === question.id));
  const chosen = cards.filter(card => card.moduleId === courseId && card.lessonId === lessonId);
  assert.equal(chosen.length, 1);
  const [card] = chosen;
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

test('The existing plant tree, course route and text search expose the new lesson without another branch', () => {
  const location = load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);
  assert.equal(location.categorySlug, 'wald-pflanzen');
  assert.equal(location.groupId, 'pflanzenbau-vermehrung');
  const found = load('lib/learning-search.js').searchLearning({ query: 'ringporig Sandbirke', category: 'wald-pflanzen', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
  assert.equal(found.href, `/kurse/${courseId}#lesson-${lessonId}`);
  assert.equal(found.lessonTitle, lesson.title);
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.at(-1), lesson);
  assert.equal(props.flashcards.lessons[lessonId], 1);
});

test('The actual course renderer shows the whole lesson before the final closed source panel and dates only this lesson 24 October', () => {
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
  const summary = load('lib/learning-flashcards.js').getFlashcardLessonSummary(courseId);
  const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: summary }));
  const sourceStart = html.indexOf('<details id="quellen"');
  assert.ok(sourceStart > 0);
  for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, sourceStart).includes(paragraph));
  assert.ok(urls.every(url => html.slice(sourceStart).includes(url)));
  assert.match(html.slice(sourceStart), /24\. Oktober 2026/);
  assert.doesNotMatch(html.slice(sourceStart), /16\. Oktober 2026/);
  assert.ok(!html.slice(sourceStart).split('>')[0].includes('open'));
  assert.match(html, /Lektion 5 von 5/);
  const Evidence = load('components/LessonEvidence.js').default;
  const oldHtml = renderToStaticMarkup(React.createElement(Evidence, { lesson: course.lessons[0], reviewedOn: course.reviewedOn }));
  assert.match(oldHtml, /16\. Oktober 2026/);
  assert.doesNotMatch(oldHtml, /24\. Oktober 2026/);
});

test('A new expiring offline pack retains both historical and precise new dates with all scoped evidence', () => {
  const previous = process.env.JL_SESSION_SECRET;
  process.env.JL_SESSION_SECRET = 'test-only-wood-vessel-offline';
  try {
    const now = Date.parse('2026-10-24T11:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'wood@example.invalid', paidUntil: '2026-10-26T11:00:00Z' }, now);
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
