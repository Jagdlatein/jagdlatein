// Source reading is documented in the review. These use real curriculum adapters
// and isolated session/access doubles, never customer records or private files.
const test = require('node:test'), assert = require('node:assert/strict');
const { createLoader: createProjectLoader, local } = require('./helpers/project-module.cjs');
const { redDeerFlehmenBaselineFixture, stripRedDeerFlehmenModule } = require('./helpers/red-deer-flehmen-addition-nov25.cjs');
const { woodpeckerFootBaselineFixture } = require('./helpers/woodpecker-foot-addition-nov25.cjs');
const { insectRespirationBaselineFixture } = require('./helpers/insect-respiration-addition-nov25.cjs');
const { capercaillieToeBaselineFixture } = require('./helpers/capercaillie-toe-addition-nov17.cjs');
const { dogExtinctionBaselineFixture } = require('./helpers/dog-extinction-addition-nov17.cjs');
const { forestExamBaselineFixture } = require('./helpers/forest-exam-additions-nov17.cjs');
const { practiceMeasurementBaselineFixture } = require('./helpers/practice-measurement-additions-nov17.cjs');
// The Nov17 publications already predated today's work. Project only their
// explicitly named appendices for this unchanged d81efdd full-object contract.
const createLoader = overrides => createProjectLoader([
  redDeerFlehmenBaselineFixture, woodpeckerFootBaselineFixture, insectRespirationBaselineFixture,
  capercaillieToeBaselineFixture, dogExtinctionBaselineFixture, forestExamBaselineFixture,
  practiceMeasurementBaselineFixture,
].reduce((current, project) => project(current), overrides));
const { courseId, lessonId, questionIds, sourceURLs, waldwissenURL, stripTrackPostureAddition, trackPostureBaselineFixture, createPublishedLoader } = require('./helpers/track-posture-addition-nov15.cjs');
const old = createPublishedLoader('d81efdd66f3639cb0184316a714d1e88626c3537');
// Compare the actual published curriculum; unrelated local afternoon work must
// neither enter nor hide a false historical comparison.
const publishedAfternoon = old('data/learning-expansion-afternoon-2026-10-16.json');
const load = createLoader({ '../data/learning-expansion-afternoon-2026-10-16.json': publishedAfternoon });
const curriculum = load('lib/learning-curriculum.js'), beforeCurriculum = old('lib/learning-curriculum.js');
const course = curriculum.getLearningModule(courseId), before = beforeCurriculum.getLearningModule(courseId);
const lesson = course.lessons.find(item => item.id === lessonId), fullQuestionIds = questionIds.map(id => `${courseId}-${id}`);
const tools = load('lib/learning-flashcards.js'), cards = tools.getFlashcards(), beforeCards = old('lib/learning-flashcards.js').getFlashcards();
const addedCards = cards.filter(item => item.moduleId === courseId && item.lessonId === lessonId);
const lessonURLs = [...sourceURLs, waldwissenURL];

test('One tail lesson, three questions and two scoped sources preserve every previous raw wildlife object and field order', () => {
  const raw = stripRedDeerFlehmenModule(load('lib/learning-wildlife.js')).wildlifeModules, previous = old('lib/learning-wildlife.js').wildlifeModules;
  assert.equal(JSON.stringify(raw.map(stripTrackPostureAddition)), JSON.stringify(previous));
  assert.deepEqual(course.lessons.slice(0, -1), before.lessons); assert.deepEqual(course.questions.slice(0, -3), before.questions); assert.deepEqual(course.sources.slice(0, -2), before.sources);
  assert.deepEqual([before.lessons.length, before.questions.length, before.sources.length], [3, 8, 4]);
  assert.deepEqual([course.lessons.length, course.questions.length, course.sources.length], [4, 11, 6]);
  assert.equal(course.lessons.at(-1).id, lessonId); assert.equal(course.reviewedOn, before.reviewedOn); assert.equal(course.reviewedOn, '2026-10-04');
});

test('All published full courses, ordered questions and old cards including all 116 starters remain exactly intact', () => {
  assert.equal(JSON.stringify(curriculum.learningModules.map(stripTrackPostureAddition)), JSON.stringify(beforeCurriculum.learningModules));
  assert.equal(JSON.stringify(curriculum.learningQuestions.filter(item => !fullQuestionIds.includes(item.id))), JSON.stringify(beforeCurriculum.learningQuestions));
  assert.equal(JSON.stringify(cards.filter(item => !addedCards.includes(item))), JSON.stringify(beforeCards)); assert.deepEqual(cards.slice(0, 116), beforeCards.slice(0, 116));
  assert.equal(addedCards.length, 3); assert.deepEqual(curriculum.learningCounts, { modules: beforeCurriculum.learningCounts.modules, lessons: beforeCurriculum.learningCounts.lessons + 1, questions: beforeCurriculum.learningCounts.questions + 3 });
});

test('Visible teaching distinguishes normal foot contact from gait and incomplete evidence, without unproved video anatomy', () => {
  const text = lesson.paragraphs.join(' ');
  assert.equal(lesson.reviewedOn, '2026-11-15'); assert.equal(lesson.flashcardExpansion, true);
  assert.match(text, /von den Zehen bis zur Ferse.*Dachs/); assert.match(text, /Zehen den Boden.*Ferse angehoben.*Fuchs/);
  assert.match(text, /letzten Zehenglied.*Schale.*Reh/); assert.match(text, /Auftrittsform ist von der Gangart zu unterscheiden/);
  assert.match(text, /Nicht jeder tragende Fussabschnitt.*vollständig sichtbaren Abdruck/); assert.match(text, /Überlagerungen/); assert.match(text, /weder den Auftrittstyp noch die Tierart/);
  assert.match(text, /Eigene Prüfungsübung/); assert.match(text, /keine massstäbliche Anatomiezeichnung.*kein Nachweis verborgener Knochenstellungen/);
  assert.doesNotMatch(text, /\d|Prozent|Kilometer|Murmeltier|Fischotter|Krankheit|sicher bestimmen|Root|Reviewer/); assert.equal(lesson.image, undefined);
});

test('Three standalone four-choice questions test different foot types and become the same explained cards for CH, AT and DE', () => {
  const questions = course.questions.filter(item => item.lessonId === lessonId), bank = load('data/questions-full.js').QUESTIONS;
  assert.deepEqual(questions.map(item => item.id), fullQuestionIds); assert.equal(new Set(questions.map(item => item.q)).size, 3);
  assert.deepEqual(questions.map(item => item.answers.find(answer => item.correct.includes(answer.id)).text), ['Der Fuss setzt von den Zehen bis zur Ferse auf.', 'Die Zehen, während die Ferse angehoben bleibt.', 'Am letzten Zehenglied, das von der Schale umgeben ist.']);
  const { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const question of questions) {
    assert.equal(question.answers.length, 4); assert.equal(new Set(question.answers.map(item => item.text)).size, 4); assert.equal(question.correct.length, 1); assert.deepEqual(question.countries, ['DE', 'AT', 'CH']);
    for (const country of ['CH', 'AT', 'DE']) assert.ok(quizLearningPool(bank, { country, topic: 'Natur & Revier' }).some(item => item.id === question.id));
    const card = addedCards.find(item => item.id === `flash-${question.id}`); assert.ok(card);
    assert.equal(card.categoryId, 'natur-revier'); assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(answer => question.correct.includes(answer.id)).text); assert.equal(card.explanation, question.explain);
    assert.equal(card.reviewedOn, '2026-11-15'); assert.equal(card.sourceScope, 'lesson'); assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lessonId}`); assert.deepEqual(new Set(card.sources.map(item => item.url)), new Set(lessonURLs));
  }
});

test('Three claim records use independent exact sources while reusing the old Waldwissen source unchanged and only once', () => {
  assert.equal(lesson.evidence.length, 3); assert.deepEqual(course.sources.slice(-2).map(item => item.url), sourceURLs);
  assert.ok(course.sources.slice(-2).every(item => item.checkedOn === '2026-11-15' && JSON.stringify(item.lessonIds) === '["auftrittsformen"]' && item.organization && item.supports));
  assert.equal(new Set(course.sources.map(item => item.url)).size, course.sources.length);
  const original = before.sources.find(item => item.url === waldwissenURL), current = course.sources.find(item => item.url === waldwissenURL);
  assert.deepEqual(current, original); assert.equal(current.checkedOn, undefined); assert.equal(current.lessonIds, undefined);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [[...sourceURLs, waldwissenURL], [...sourceURLs, waldwissenURL], [sourceURLs[0], waldwissenURL]]);
  assert.ok(lesson.evidence.every(item => item.sources.includes(current))); assert.match(course.sources.at(-1).supports, /gedruckte Seite 29, PDF-Seite 31/);
  assert.doesNotMatch(JSON.stringify(course.sources.slice(-2)), /Root|Reviewer|Murmeltier|Fischotter|vollständig geprüft/);
});

test('The three-box original concept diagram is new-lesson-only and all existing diagrams, routes and topic paths remain unchanged', () => {
  const diagrams = load('lib/lesson-diagrams.js'), previous = old('lib/lesson-diagrams.js');
  const diagram = diagrams.getLessonDiagram(courseId, lessonId); assert.deepEqual(lesson.diagram, diagram);
  assert.deepEqual(diagram.steps.map(item => item.title), ['Sohlengänger · Dachs', 'Zehengänger · Fuchs', 'Zehenspitzengänger · Reh']);
  assert.match(diagram.note, /Eigenes Begriffsschema.*kein zeitlicher Ablauf.*kein Trittsiegelfoto.*keine massstäbliche Anatomiezeichnung/);
  for (const module of beforeCurriculum.learningModules) for (const item of module.lessons) assert.deepEqual(diagrams.getLessonDiagram(module.id, item.id), previous.getLessonDiagram(module.id, item.id));
  assert.equal(diagrams.getLessonDiagram(courseId, 'auftrittsformen-fremd'), null);
  assert.deepEqual(load('pages/kurse/[slug].js').getStaticPaths(), old('pages/kurse/[slug].js').getStaticPaths());
  assert.deepEqual(load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId), old('lib/learning-topic-tree.js').getLearningTopicLocation(courseId));
});

test('Search, exact course props, protected lesson-card delivery and print sources connect the complete new material', async () => {
  const search = load('lib/learning-search.js').searchLearning;
  for (const query of ['Sohlengänger', 'Zehenspitzengänger']) {
    const result = search({ query, category: 'natur-revier', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
    assert.ok(result); assert.equal(result.href, `/kurse/${courseId}#lesson-${lessonId}`);
  }
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module, course); assert.equal(props.flashcards.lessons[lessonId], 3); assert.equal(props.lessonPhotos[lessonId], undefined);
  const exported = tools.getFlashcardExport({ courseId, lessonId }); assert.deepEqual(exported.cards, addedCards); assert.equal(exported.selection.returnHref, `/kurse/${courseId}#lesson-${lessonId}`);
  const api = createLoader({ '../data/learning-expansion-afternoon-2026-10-16.json': publishedAfternoon, '../../../../lib/account-access': { getSignedAccountAccess: async () => ({ paid: true }) } })('app/api/lernen/lernkarten/route.js');
  const response = await api.GET(new Request(`https://jagdlatein.test/api/lernen/lernkarten?kurs=${courseId}&lektion=${lessonId}`));
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.equal(response.headers.get('vary'), 'Cookie');
  assert.deepEqual(load('lib/flashcard-payload.js').unpackFlashcards(await response.json()).cards, addedCards);
  assert.deepEqual(new Set(load('pages/lernen/lernkarten-drucken.js').getPrintSourceIndex(addedCards).sourceList.map(item => item.url)), new Set(lessonURLs));
});

test('The real reader shows all teaching, limitations and schema before the closed exact source list and actual lesson date', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server'); let cursor = 0;
  const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? 3 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
  const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${courseId}#lesson-${lessonId}` }) }, './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) }, './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} }, '../hooks/useCourseProgress': { __esModule: true, default: () => ({}) }, './CourseProgressNotice': { __esModule: true, default: () => null } })('components/LearningCourse.js').default;
  const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: tools.getFlashcardLessonSummary(courseId) })), boundary = html.indexOf('<details id="quellen"');
  assert.ok(boundary > 0); for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, boundary).includes(paragraph));
  assert.ok(html.slice(0, boundary).includes(lesson.diagram.note)); assert.match(html, /Lektion 4 von 4/); assert.match(html.slice(boundary), /15\. November 2026/); assert.doesNotMatch(html.slice(boundary), /4\. Oktober 2026/);
  for (const url of lessonURLs) { assert.ok(!html.slice(0, boundary).includes(url)); assert.ok(html.slice(boundary).includes(url)); }
  assert.ok(!html.slice(boundary).split('>')[0].includes('open'));
});

test('An isolated offline pack retains lesson text, all eleven questions, diagram, source scope and its existing access expiry', () => {
  const previous = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-track-posture-regression';
  try {
    const now = Date.parse('2026-11-15T12:00:00Z'), pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'track-posture-test@example.invalid', paidUntil: '2026-11-17T12:00:00Z' }, now);
    const { validateOfflinePack } = load('lib/offline-learning.js'); assert.equal(validateOfflinePack(pack, now), true); assert.equal(validateOfflinePack(pack, pack.expiresAt), false);
    assert.deepEqual(pack.courses[0].lessons, course.lessons); assert.deepEqual(pack.courses[0].questions, course.questions); assert.deepEqual(pack.courses[0].sources, course.sources);
    assert.equal(pack.courses[0].reviewedOn, before.reviewedOn); assert.equal(pack.courses[0].lessons.at(-1).reviewedOn, '2026-11-15'); assert.deepEqual(pack.courses[0].lessons.at(-1).diagram, lesson.diagram);
    assert.ok(!JSON.stringify(pack).includes('track-posture-test@example.invalid'));
  } finally { if (previous === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = previous; }
});

test('The narrow historical projection preserves unrelated future fields, lessons, questions, source scopes and input objects', () => {
  const input = structuredClone(course); input.future = { keep: true };
  input.lessons.push({ id: 'auftrittsformen-extra', keep: true }); input.questions.push({ id: 'auftritt-sohle-extra', lessonId, keep: true });
  input.sources.push({ url: sourceURLs[0], lessonIds: ['spur-abdruck'], checkedOn: '2026-11-15', keep: true });
  const original = structuredClone(input), projected = stripTrackPostureAddition(input);
  assert.deepEqual(input, original); assert.deepEqual(projected.future, { keep: true }); assert.equal(projected.lessons.at(-1).keep, true); assert.equal(projected.questions.at(-1).keep, true); assert.equal(projected.sources.at(-1).keep, true);
  const restored = createLoader(trackPostureBaselineFixture({ '../data/learning-expansion-afternoon-2026-10-16.json': publishedAfternoon }))('lib/learning-curriculum.js');
  assert.equal(JSON.stringify(restored.learningModules), JSON.stringify(beforeCurriculum.learningModules));
});
