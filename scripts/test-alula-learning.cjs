// This historical snapshot projects only the separately tested Nov25 fish-gill appendix.
const { fishGillBaselineFixture } = require('./helpers/fish-gill-addition-nov25.cjs');
// Source reading is documented separately. These isolated regression checks
// verify preservation and the real learning/quiz/card/print/offline adapters.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { createLoader: createProjectLoader, local, root } = require('./helpers/project-module.cjs');
const { trackPostureBaselineFixture } = require('./helpers/track-posture-addition-nov15.cjs');
const { redDeerFlehmenBaselineFixture } = require('./helpers/red-deer-flehmen-addition-nov25.cjs');
const { woodpeckerFootBaselineFixture } = require('./helpers/woodpecker-foot-addition-nov25.cjs');
const { insectRespirationBaselineFixture } = require('./helpers/insect-respiration-addition-nov25.cjs');
const { capercaillieToeBaselineFixture } = require('./helpers/capercaillie-toe-addition-nov17.cjs');
const { dogExtinctionBaselineFixture } = require('./helpers/dog-extinction-addition-nov17.cjs');
const { forestExamBaselineFixture } = require('./helpers/forest-exam-additions-nov17.cjs');
const { practiceMeasurementBaselineFixture } = require('./helpers/practice-measurement-additions-nov17.cjs');
// Keep this published Alula snapshot exact while the separately tested
// Wildspuren appendix retains its own full-current positive object comparison.
// Separate pre-existing snapshot repair: these named publications followed
// c5a0157. Their original helpers preserve all unrelated fields and sources.
const createLoader = overrides => createProjectLoader([
  fishGillBaselineFixture, redDeerFlehmenBaselineFixture, woodpeckerFootBaselineFixture, insectRespirationBaselineFixture,
  capercaillieToeBaselineFixture, dogExtinctionBaselineFixture, forestExamBaselineFixture,
  practiceMeasurementBaselineFixture, trackPostureBaselineFixture,
].reduce((current, project) => project(current), overrides));
const { courseId, lessonId, questionIds, sourceURLs, stripAlulaAddition, stripAlulaDataset, alulaBaselineFixture } = require('./helpers/alula-addition-nov15.cjs');
const revision = 'c5a015713b2fc7181af09f1dfca23bc57be53730';
const rawPath = 'data/learning-expansion-wildlife-dogs-2026-10-16.json';
const raw = JSON.parse(fs.readFileSync(path.join(root, rawPath), 'utf8'));
function historicalLoader() {
  const cache = new Map(), swc = local('next/dist/build/swc');
  function historic(relative) {
    const filename = path.resolve(root, relative), file = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(file && !file.startsWith('../') && !path.isAbsolute(file));
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = execFileSync('git', ['show', `${revision}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 30000000 });
    const module = { exports: {} }; cache.set(filename, module);
    if (filename.endsWith('.json')) { module.exports = JSON.parse(source.replace(/^\uFEFF/, '')); return module.exports; }
    const { code } = swc.transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.endsWith('.module.css') ? { __esModule: true, default: {} } : id.startsWith('.') ? historic(path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')) : local(id), module, module.exports);
    return module.exports;
  }
  return historic;
}
const old = historicalLoader();
// Compare the published curriculum in both loaders. The unrelated local
// afternoon work is never used to manufacture a false positive Git comparison.
const publishedAfternoon = old('data/learning-expansion-afternoon-2026-10-16.json');
const load = createLoader({ '../data/learning-expansion-afternoon-2026-10-16.json': publishedAfternoon });
const curriculum = load('lib/learning-curriculum.js'), beforeCurriculum = old('lib/learning-curriculum.js');
const course = curriculum.getLearningModule(courseId), before = beforeCurriculum.getLearningModule(courseId);
const lesson = course.lessons.find(item => item.id === lessonId), fullQuestionIds = questionIds.map(id => `${courseId}-${id}`);
const comparisonURLs = ['https://academy.allaboutbirds.org/feathers-article/', 'https://www.bto.org/sites/default/files/moult-in-birds-web.pdf', 'https://www.sciencelearn.org.nz/resources/308-feathers-and-flight'];
const lessonURLs = [...sourceURLs, ...comparisonURLs];
const tools = load('lib/learning-flashcards.js'), cards = tools.getFlashcards(), beforeCards = old('lib/learning-flashcards.js').getFlashcards();
const addedCards = cards.filter(item => item.moduleId === courseId && item.lessonId === lessonId);

test('Alula is one exact tail lesson, two questions, three lesson-only sources and one evidence record; all old raw objects remain exact', () => {
  const previous = old(rawPath), original = previous.modules.find(item => item.id === courseId), current = raw.modules.find(item => item.id === courseId);
  assert.deepEqual(stripAlulaDataset(raw), previous);
  assert.deepEqual(current.lessons.slice(0, -1), original.lessons);
  assert.deepEqual(current.questions.slice(0, -2), original.questions);
  assert.deepEqual(current.sources.slice(0, -3), original.sources);
  assert.deepEqual([current.lessons.length, current.questions.length, current.sources.length], [11, 27, 17]);
  assert.equal(current.lessons.at(-1).id, lessonId); assert.equal(raw.reviewedOn, previous.reviewedOn); assert.equal(course.reviewedOn, '2026-10-16');
});

test('Every published old full course, ordered question and card including 116 starters survives the two-card appendage', () => {
  assert.deepEqual(curriculum.learningModules.map(stripAlulaAddition), beforeCurriculum.learningModules);
  assert.deepEqual(curriculum.learningQuestions.filter(item => !fullQuestionIds.includes(item.id)), beforeCurriculum.learningQuestions);
  assert.deepEqual(cards.filter(item => !addedCards.includes(item)), beforeCards); assert.deepEqual(cards.slice(0, 116), beforeCards.slice(0, 116));
  assert.equal(addedCards.length, 2);
  assert.deepEqual(curriculum.learningCounts, { modules: beforeCurriculum.learningCounts.modules, lessons: beforeCurriculum.learningCounts.lessons + 1, questions: beforeCurriculum.learningCounts.questions + 2 });
});

test('The 182-word visible explanation teaches location and qualified flight contribution, without invented metrics or video proof', () => {
  const text = lesson.paragraphs.join(' ');
  assert.equal(text.split(/\s+/).length, 182); assert.equal(lesson.reviewedOn, '2026-11-15'); assert.equal(lesson.flashcardExpansion, true);
  assert.match(text, /kleine Federgruppe sitzt am Daumen.*Vorderkante nahe dem Handgelenk/);
  assert.match(text, /kann die Alula den Auftrieb erhöhen und einen Strömungsabriss hinauszögern/);
  assert.match(text, /Winkel des Flügels zur anströmenden Luft/); assert.match(text, /nicht bei jeder Art und Flugsituation gleich/);
  assert.match(text, /sichere Landung.*nicht garantiert/); assert.match(text, /entfernter Flugfilm kann die kleine Alula unaufgelöst lassen/);
  assert.match(text, /Eigene Prüfungsübung/); assert.match(text, /keine massstäbliche Anatomiezeichnung/);
  assert.doesNotMatch(text, /\d|Prozent|Grad|Kilometer|Meter pro|Originalabstract|Root|Reviewer|Windkanalversuch/); assert.equal(lesson.image, undefined);
});

test('Two distinct four-answer questions test anatomy and function, producing the same explained dated cards across CH/AT/DE', () => {
  const questions = course.questions.filter(item => item.lessonId === lessonId), bank = load('data/questions-full.js').QUESTIONS;
  assert.deepEqual(questions.map(item => item.id), fullQuestionIds);
  assert.equal(new Set(questions.map(item => item.q)).size, 2);
  const correct = questions.map(item => item.answers.find(answer => item.correct.includes(answer.id)).text);
  assert.deepEqual(correct, ['Am Daumen an der Flügelvorderkante nahe dem Handgelenk.', 'Sie kann den Auftrieb erhöhen und einen Strömungsabriss hinauszögern.']);
  const { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const question of questions) {
    assert.equal(new Set(question.answers.map(item => item.text)).size, 4); assert.equal(question.correct.length, 1);
    assert.deepEqual(question.countries, ['DE', 'AT', 'CH']);
    for (const country of ['CH', 'AT', 'DE']) assert.ok(quizLearningPool(bank, { country, topic: 'Wildkunde' }).some(item => item.id === question.id));
    const card = addedCards.find(item => item.id === `flash-${question.id}`); assert.ok(card);
    assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(answer => question.correct.includes(answer.id)).text);
    assert.equal(card.explanation, question.explain); assert.equal(card.reviewedOn, '2026-11-15'); assert.equal(card.sourceScope, 'lesson');
    assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lessonId}`); assert.deepEqual(new Set(card.sources.map(item => item.url)), new Set(lessonURLs));
  }
});

test('Only alula gets three new scoped source roles; the old BTO URL and evidence labels remain unchanged', () => {
  const added = course.sources.slice(-3);
  assert.deepEqual(added.map(item => item.url), sourceURLs);
  assert.ok(added.every(item => item.checkedOn === '2026-11-15' && JSON.stringify(item.lessonIds) === '["alula"]' && item.organization && item.supports));
  assert.equal(new Set(course.sources.map(item => item.url)).size, course.sources.length);
  assert.deepEqual(course.sources.slice(0, -3), before.sources);
  for (const oldLesson of before.lessons) assert.deepEqual(course.lessons.find(item => item.id === oldLesson.id).evidence, oldLesson.evidence);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [[sourceURLs[0], sourceURLs[2], sourceURLs[1]], [sourceURLs[1], sourceURLs[2]], comparisonURLs]);
  assert.match(added[1].supports, /Originalabstract.*kein gelesener Volltext/);
  assert.match(added[2].supports, /Modellflügel-Windkanalversuche.*Präparaten/); assert.match(added[2].supports, /keine identische Wiederholung/);
  assert.doesNotMatch(JSON.stringify(added), /Root|Reviewer|Umsetzung|arXiv|2001\.03964/);
});

test('The original three-box concept diagram is lesson-only; every old diagram and existing course path remains exact', () => {
  const diagrams = load('lib/lesson-diagrams.js'), previous = old('lib/lesson-diagrams.js'), diagram = diagrams.getLessonDiagram(courseId, lessonId);
  assert.deepEqual(lesson.diagram, diagram); assert.deepEqual(diagram.steps.map(item => item.title), ['Daumenfittich (Alula)', 'Hand- und Armschwingen', 'Steuerfedern']);
  assert.match(diagram.note, /Eigenes Begriffsschema/); assert.match(diagram.note, /keinen zeitlichen Ablauf/); assert.match(diagram.note, /Keine maßstäbliche Anatomiezeichnung/); assert.match(diagram.note, /keine Strömungssimulation/); assert.match(diagram.note, /kein Nachweis einer Alula im Film/);
  for (const module of beforeCurriculum.learningModules) for (const item of module.lessons) assert.deepEqual(diagrams.getLessonDiagram(module.id, item.id), previous.getLessonDiagram(module.id, item.id));
  assert.equal(diagrams.getLessonDiagram(courseId, 'alula-unbekannt'), null);
  assert.deepEqual(load('pages/kurse/[slug].js').getStaticPaths(), old('pages/kurse/[slug].js').getStaticPaths());
  assert.deepEqual(load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId), old('lib/learning-topic-tree.js').getLearningTopicLocation(courseId));
});

test('Existing search, exact lesson props, card exports and protected print delivery connect the complete new lesson', async () => {
  const result = load('lib/learning-search.js').searchLearning({ query: 'Daumenfittich', category: 'wildkunde', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
  assert.ok(result); assert.equal(result.href, `/kurse/${courseId}#lesson-${lessonId}`);
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module, course); assert.equal(props.flashcards.lessons.alula, 2); assert.equal(props.lessonPhotos.alula, undefined);
  const exported = tools.getFlashcardExport({ courseId, lessonId }); assert.deepEqual(exported.cards, addedCards); assert.equal(exported.selection.returnHref, `/kurse/${courseId}#lesson-${lessonId}`);
  const api = createLoader({ '../data/learning-expansion-afternoon-2026-10-16.json': publishedAfternoon, '../../../../lib/account-access': { getSignedAccountAccess: async () => ({ paid: true }) } })('app/api/lernen/lernkarten/route.js');
  const response = await api.GET(new Request(`https://jagdlatein.test/api/lernen/lernkarten?kurs=${courseId}&lektion=${lessonId}`));
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.equal(response.headers.get('vary'), 'Cookie');
  assert.deepEqual(load('lib/flashcard-payload.js').unpackFlashcards(await response.json()).cards, addedCards);
  assert.deepEqual(new Set(load('pages/lernen/lernkarten-drucken.js').getPrintSourceIndex(addedCards).sourceList.map(item => item.url)), new Set(lessonURLs));
});

test('The real course reader shows text, limits and diagram before closed sources with the lesson date', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server'); let cursor = 0;
  const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? 10 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
  const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${courseId}#lesson-${lessonId}` }) }, './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) }, './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} }, '../hooks/useCourseProgress': { __esModule: true, default: () => ({}) }, './CourseProgressNotice': { __esModule: true, default: () => null } })('components/LearningCourse.js').default;
  const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: tools.getFlashcardLessonSummary(courseId) })), boundary = html.indexOf('<details id="quellen"');
  assert.ok(boundary > 0);
  for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, boundary).includes(paragraph));
  assert.ok(html.slice(0, boundary).includes(lesson.diagram.note)); assert.match(html, /Lektion 11 von 11/);
  assert.match(html.slice(boundary), /15\. November 2026/); assert.doesNotMatch(html.slice(boundary), /16\. Oktober 2026/);
  for (const url of lessonURLs) { assert.ok(!html.slice(0, boundary).includes(url)); assert.ok(html.slice(boundary).includes(url)); }
  assert.ok(!html.slice(boundary).split('>')[0].includes('open'));
});

test('An isolated offline pack preserves the full lesson, questions, diagram, sources and access expiry', () => {
  const previous = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-alula-learning-regression';
  try {
    const now = Date.parse('2026-11-15T12:00:00Z'), pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'alula-test@example.invalid', paidUntil: '2026-11-17T12:00:00Z' }, now);
    const { validateOfflinePack } = load('lib/offline-learning.js'); assert.equal(validateOfflinePack(pack, now), true); assert.equal(validateOfflinePack(pack, pack.expiresAt), false);
    assert.deepEqual(pack.courses[0].lessons, course.lessons); assert.deepEqual(pack.courses[0].questions, course.questions); assert.deepEqual(pack.courses[0].sources, course.sources);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-16'); assert.equal(pack.courses[0].lessons.at(-1).reviewedOn, '2026-11-15'); assert.deepEqual(pack.courses[0].lessons.at(-1).diagram, lesson.diagram);
    assert.ok(!JSON.stringify(pack).includes('alula-test@example.invalid'));
  } finally { if (previous === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = previous; }
});

test('The narrow historical helper preserves future lessons, unrelated fields, other source scopes and evidence', () => {
  const data = structuredClone(raw); data.future = { keep: true }; const module = data.modules.find(item => item.id === courseId);
  module.lessons.push({ id: 'alula-extra', keep: true }); module.questions.push({ id: 'alula-lage-extra', lessonId: 'feinbau', keep: true });
  module.sources.push({ url: sourceURLs[0], lessonIds: ['anderer-bereich'], checkedOn: '2026-11-15', keep: true }); data.evidence.push({ moduleId: 'anderer-kurs', lessonId, claims: [] });
  const input = structuredClone(data), projected = stripAlulaDataset(data), kept = projected.modules.find(item => item.id === courseId);
  assert.deepEqual(data, input); assert.deepEqual(projected.future, { keep: true }); assert.equal(kept.lessons.at(-1).id, 'alula-extra'); assert.equal(kept.questions.at(-1).id, 'alula-lage-extra');
  assert.equal(kept.sources.at(-1).keep, true); assert.equal(projected.evidence.at(-1).moduleId, 'anderer-kurs');
  assert.deepEqual(alulaBaselineFixture({ '../data/learning-expansion-wildlife-dogs-2026-10-16.json': raw })['../data/learning-expansion-wildlife-dogs-2026-10-16.json'], old(rawPath));
});
