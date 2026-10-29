const { plantEnergyBaselineFixture } = require('./helpers/plant-energy-additions-oct27.cjs');
const { adiposeBaselineFixture } = require('./helpers/adipose-learning-additions-oct27.cjs');
const { flightFeatherBaselineFixture } = require('./helpers/flight-feather-additions-oct27.cjs');
const { firearmTermsBaselineFixture } = require('./helpers/firearm-terms-additions-oct27.cjs');
// Structural/content-preservation checks, not a new whole-species certification.
const { digestiveIgnitionBaselineFixture } = require('./helpers/digestive-ignition-additions-oct27.cjs');
const { fishLateralLineBaselineFixture } = require('./helpers/fish-lateral-line-addition.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { stripOctober26Additions, isOctober26Card } = require('./helpers/learning-additions-oct26.cjs');
const { stripOctober27Additions, isOctober27Card, stripOctober27GuideTargets } = require('./helpers/learning-additions-oct27.cjs');
const raw = require('../data/learning-beaver-incisors-2026-10-24.json');
const load = createLoader(plantEnergyBaselineFixture(adiposeBaselineFixture(flightFeatherBaselineFixture(firearmTermsBaselineFixture(digestiveIgnitionBaselineFixture(fishLateralLineBaselineFixture()))))));
const { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const { getWildlifeLearningGuide: guide } = load('lib/wildlife-learning-guide.js');
const { getWildlifeStudyContent } = load('lib/wildlife-study-content.js');
const courseId = 'wissen-biber-schneidezaehne-2026';
const lessonId = 'mundhautfalte-unterwassernagen';
const course = getLearningModule(courseId);
const lesson = course.lessons.find(item => item.id === lessonId);
const urls = ['https://www.infofauna.ch/de/beratungsstellen/biberfachstelle/der-biber/biologie', 'https://www.ooe-umweltanwaltschaft.at/Mediendateien/Biberhandbuch_web2.pdf'];
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const cards = load('lib/learning-flashcards.js').getFlashcards();

test('The original 151-word lesson, two questions, two sources, evidence and two cards stay exact', () => {
  const original = raw.modules[0];
  assert.equal(original.lessons[0].paragraphs.join(' ').split(/\s+/).length, 151);
  assert.equal(hash(original.lessons[0]), '286f1051e8c15e42bd93a7fddc6266ae0f893cfcb2755217c9f831b7008ffaca');
  assert.equal(hash(original.questions.slice(0, 2)), '3be537471869d4557489d42af2cfeab16eb8a35e47205a44e7d83b23effa4f3a');
  assert.equal(hash(original.sources.slice(0, 2)), '59851f87dc808e3c42a64f2f705641a85b5ee682ff37a14e83a5435729d33650');
  assert.equal(hash(raw.evidence.slice(0, 1)), '298bce6b61e3c61b3ff8ff0757323197ecb25a55565cc555128d8603602aa2ac');
  assert.equal(hash(course.lessons[0]), '5ae44effdaf4d92eb13a354cc24386c2dece677d6248897a6b4a45fa9038bbec');
  assert.equal(hash(course.questions.slice(0, 2)), '0cd71a7c33521967dac32e8f01c5c21f5cfae5e454becb08021bdb321432714f');
  assert.equal(hash(cards.filter(card => card.moduleId === courseId && card.lessonId !== lessonId)), '96af31af82a5422df2edd9753e7d3cc177e55bfba3092f7313f8fc194515cd0b');
});

test('One narrow second lesson has its own two-source mapping and explicit honest date without a new course', () => {
  assert.equal(learningModules.filter(item => item.id === courseId).length, 1);
  assert.equal(course.lessons.length, 2);
  assert.equal(course.questions.length, 3);
  assert.equal(course.reviewedOn, '2026-10-24');
  assert.equal(lesson.reviewedOn, '2026-10-24');
  assert.equal(course.sources.length, 4);
  assert.deepEqual(course.sources.slice(2).map(source => source.url), urls);
  assert.ok(course.sources.slice(2).every(source => source.checkedOn === '2026-10-24'));
  assert.equal(lesson.evidence.length, 1);
  assert.deepEqual(lesson.evidence[0].sources.map(source => source.url), urls);
  assert.ok(lesson.evidence[0].sources.every(source => !course.lessons[0].evidence.some(claim => claim.sources.some(old => old.url === source.url))));
  const text = lesson.paragraphs.join(' ');
  assert.match(text, /verschließbare Hautfalte im Maul/);
  assert.match(text, /Verschluss gegen eindringendes Wasser/);
  assert.match(text, /Eigene Denkübung/);
  assert.match(text, /weder einen Schluckvorgang noch eine individuelle Tauchleistung/);
  assert.match(text, /genaue anatomische Lagezeichnung wird daraus nicht abgeleitet/);
  assert.doesNotMatch(text, /\d|Diastema|hinter den Schneidezähnen|Eisen|Härtewert|Minuten|Sekunden/);
  assert.equal(lesson.diagram, undefined);
  assert.equal(lesson.image, undefined);
});

test('All other courses and all historical 1710 card objects including starter order stay exact', () => {
  const woodCourseId = 'wissen-ausbau-oekologie-holzaufbau-2026';
  const woodCourse = getLearningModule(woodCourseId);
  assert.equal(woodCourse.lessons.length, 5);
  assert.equal(woodCourse.questions.length, 33);
  assert.equal(woodCourse.sources.length, 9);
  const birdCourseId = 'wissen-ausbau-biologie-vogelkoerper-2026';
  const birdCourse = getLearningModule(birdCourseId);
  assert.equal(birdCourse.lessons.length, 5);
  assert.equal(birdCourse.questions.length, 33);
  assert.equal(birdCourse.sources.length, 10);
  const historicalCourses = learningModules.filter(item => item.id !== courseId).map(stripOctober26Additions).map(stripOctober27Additions).map(item => item.id === woodCourseId
    ? { ...item, sources: item.sources.slice(0, 5), lessons: item.lessons.slice(0, 4), questions: item.questions.slice(0, 32) }
    : item.id === birdCourseId ? { ...item, sources: item.sources.slice(0, 7), lessons: item.lessons.slice(0, 4), questions: item.questions.slice(0, 32) } : item);
  assert.equal(hash(historicalCourses), '19d22b94329be46dfa9c6a998932008a1234ec19e95afc7c3e3151c4aea805fa');
  assert.equal(hash(cards.slice(0, 116)), '54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
  const historical = cards.filter(card => !isOctober26Card(card) && !isOctober27Card(card) && !(card.moduleId === courseId && card.lessonId === lessonId) && card.id !== 'flash-wissen-ausbau-oekologie-holzaufbau-2026-gefaessverteilung-ringporige-eiche' && card.id !== 'flash-wissen-ausbau-biologie-vogelkoerper-2026-gegenstrom-waermerichtung').sort((a, b) => a.id.localeCompare(b.id));
  assert.equal(historical.length, 1710);
  assert.equal(hash(historical), '9e6f8fde716b30bdb13238c0751522d35b88dcadc2b0d98cc578ce0affaf7a9f');
});

test('Biber keeps its same three targets, anchors and full objects except the real card count; all 113 other species stay exact', () => {
  const species = load('lib/european-wildlife-discovery.js').europeanWildlife;
  const others = species.filter(item => item.slug !== 'biber');
  assert.equal(others.length, 113);
  const historicalGuides = others.map(item => [item.slug, stripOctober27GuideTargets(item.slug, guide(item.slug)).map(target => {
    if (target.moduleId !== 'wissen-ausbau-biologie-vogelkoerper-2026') return target;
    assert.equal(target.flashcardCount, 32);
    return { ...target, flashcardCount: 31 };
  })]);
  assert.equal(hash(historicalGuides), 'd7bce2678395f5ebf109a2c4a44a464a78c00dbda55718be23a642cc7f9b6c6e');
  const targets = guide('biber');
  assert.equal(targets.length, 3);
  assert.equal(targets[0].flashcardCount, 3);
  assert.equal(hash(targets.map((target, index) => index === 0 ? { ...target, flashcardCount: 2 } : target)), '724d42a68ddaa4d73a80b00e9be538ce514da5d6afe5a2e6ddc1245f413b0af6');
  assert.equal(targets[0].href, `/kurse/${courseId}`);
  assert.ok(others.every(item => getWildlifeStudyContent(item.slug, courseId) === null));
});

test('The single new own question, quiz answer and learning card use the same statement and exact sources', () => {
  const questions = course.questions.filter(question => question.lessonId === lessonId);
  assert.equal(questions.length, 1);
  const [question] = questions;
  const correct = question.answers.filter(answer => question.correct.includes(answer.id));
  assert.equal(correct.length, 1);
  assert.equal(correct[0].text, 'Eine verschließbare Hautfalte im Maul.');
  const bank = load('data/questions-full.js').QUESTIONS;
  assert.ok(load('lib/quiz-learning-scope.js').quizLearningPool(bank, { topic: 'Wildkunde' }).some(item => item.id === question.id));
  assert.ok(!learningModules.filter(item => item.id !== courseId).flatMap(item => item.questions).some(item => item.q === question.q));
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
});

test('The real paid portrait response includes both reading texts but no questions or unrelated species', async () => {
  const route = createLoader({ '../../../../lib/account-access': { requirePaidAccount: async () => {} } })('app/api/lernen/artenwissen/route.js');
  const request = art => route.GET(new Request(`https://jagdlatein.test/api/lernen/artenwissen?art=${art}&kurs=${courseId}`));
  const response = await request('biber');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  const content = await response.json();
  assert.equal(content.lessons.length, 2);
  assert.deepEqual(content.lessons[0].paragraphs, course.lessons[0].paragraphs);
  assert.deepEqual(content.lessons[1].paragraphs, lesson.paragraphs);
  assert.deepEqual(content.lessons[1].evidence, lesson.evidence);
  assert.equal(content.reviewedOn, '2026-10-24');
  const disallowed = new Set(['questions', 'answers', 'options', 'correct', 'answer', 'explain', 'modules']);
  function readingOnly(value) { if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) { assert.ok(!disallowed.has(key), key); readingOnly(item); } }
  readingOnly(content);
  for (const slug of ['nutria', 'bisam', 'rotwild']) assert.equal((await request(slug)).status, 404);
});

test('The actual portrait reader shows both texts before final closed sources and the unchanged course path finds the new lesson', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  const content = getWildlifeStudyContent('biber', courseId);
  const state = { key: `biber:${courseId}`, content, error: '', status: 200 };
  const Reader = createLoader({ react: { ...React, useState: () => [state, () => {}], useEffect() {} } })('components/WildlifeStudyContent.js').default;
  const html = renderToStaticMarkup(React.createElement(Reader, { slug: 'biber', target: guide('biber')[0] }));
  const sourceStart = html.indexOf('Ergänzende Fachquellen und Prüfstand');
  const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
  for (const current of course.lessons) for (const paragraph of current.paragraphs) assert.ok(html.slice(0, sourceStart).includes(escape(paragraph)));
  assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
  assert.ok(urls.every(url => html.slice(sourceStart).includes(url)));
  const found = load('lib/learning-search.js').searchLearning({ query: 'Biber Mundhautfalte', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
  assert.equal(found.href, `/kurse/${courseId}#lesson-${lessonId}`);
  assert.equal(found.lessonTitle, lesson.title);
});

test('The existing expiring offline pack preserves the exact old and new lesson evidence and dates', () => {
  const previous = process.env.JL_SESSION_SECRET;
  process.env.JL_SESSION_SECRET = 'test-only-beaver-mouth-offline';
  try {
    const now = Date.parse('2026-10-24T10:25:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'beaver@example.invalid', paidUntil: '2026-10-26T10:25:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(validate(pack, now), true);
    assert.deepEqual(pack.courses[0].lessons, course.lessons);
    assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.equal(pack.courses[0].lessons[1].reviewedOn, '2026-10-24');
    assert.deepEqual(pack.photos, []);
    assert.equal(validate(pack, pack.expiresAt), false);
  } finally {
    if (previous === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = previous;
  }
});
