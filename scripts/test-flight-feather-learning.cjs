const { linkedExamBaselineFixture } = require('./helpers/linked-exam-additions-oct29.cjs');
const { sensesBaselineFixture } = require('./helpers/senses-learning-additions-oct29.cjs');
const { dogLearningProcessesBaselineFixture } = require('./helpers/dog-learning-processes-additions-oct29.cjs');
const { plantEnergyBaselineFixture } = require('./helpers/plant-energy-additions-oct27.cjs');
const { adiposeBaselineFixture } = require('./helpers/adipose-learning-additions-oct27.cjs');
// Editorial preservation and real reader/export integration. Source reading is
// documented separately; these checks do not certify scientific correctness.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { createHash } = require('node:crypto');
const { createLoader: createProjectLoader, local } = require('./helpers/project-module.cjs');
const createLoader = overrides => createProjectLoader(linkedExamBaselineFixture(sensesBaselineFixture(dogLearningProcessesBaselineFixture(overrides))));
const { courseId, lessonIds, questionIds, sourceURLs, stripFlightFeatherAddition,
  stripFlightFeatherDataset, isFlightFeatherCard } = require('./helpers/flight-feather-additions-oct27.cjs');
const { stripFirearmTermsAddition, isFirearmTermsCard } = require('./helpers/firearm-terms-additions-oct27.cjs');
const raw = require('../data/learning-expansion-wildlife-dogs-2026-10-16.json');
const load = createLoader(plantEnergyBaselineFixture(adiposeBaselineFixture())), { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const course = getLearningModule(courseId), original = raw.modules.find(item => item.id === courseId);
const lessons = course.lessons.slice(-2), cards = load('lib/learning-flashcards.js').getFlashcards();
const bto = 'https://www.bto.org/sites/default/files/moult-in-birds-web.pdf';
const cornell = 'https://academy.allaboutbirds.org/feathers-article/';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('Only two exact appended lessons,three questions,two sources and their evidence differ from the complete ab9a214 wildlife-dogs dataset', () => {
  assert.equal(hash(stripFlightFeatherDataset(raw)), 'd399f069db47ce611d67fa2762879ee742433e3ac79c750993255403216a1dd7');
  assert.equal(hash(stripFlightFeatherAddition(original)), '3c224bee11380ffc9ba5f05ea0c62a5a1bee88cdf44175b83d5dd7fefe0369b9');
  assert.equal(hash(raw.modules.filter(item => item.id !== courseId)), 'fcefb210fccacd9f54512fd5067552909228a86c3edcae7f47bc1eaa29ed3594');
  assert.equal(hash(stripFlightFeatherDataset(raw).evidence), '0dbbcbba269cbea6245d1ff97040b6aeb94279d375e051e6c2bca8006f6acabd');
  assert.equal(hash(stripFlightFeatherAddition(course)), '97c85943de0110ad730e84db0381295794c0bd4cad85cac02302c202cad91629');
  assert.equal(raw.reviewedOn, '2026-10-16'); assert.equal(course.reviewedOn, '2026-10-16');
  assert.deepEqual(stripFlightFeatherAddition(original).lessons.map(item => item.id), ['feinbau', 'waerme', 'farbe', 'pflege', 'wasserschutz', 'federwachstum']);
  assert.equal(course.lessons.find(item => item.id === 'wasserschutz').reviewedOn, '2026-10-26');
  assert.equal(course.lessons.find(item => item.id === 'federwachstum').reviewedOn, '2026-10-27');
});

test('The294-word appendix distinguishes hand,ulna and tail with exact two-organization evidence per claim and visible limits', () => {
  assert.equal(course.lessons.length, 8); assert.equal(course.questions.length, 22); assert.equal(course.sources.length, 10);
  assert.deepEqual(lessons.map(item => item.id), lessonIds);
  assert.equal(lessons.flatMap(item => item.paragraphs).join(' ').split(/\s+/).length, 294);
  assert.match(lessons[0].paragraphs.join(' '), /äußeren Flügelabschnitt.*Skelett der Hand/);
  assert.match(lessons[0].paragraphs.join(' '), /Elle, einem Knochen des Unterarms/);
  assert.match(lessons[0].paragraphs.join(' '), /keine ausschließliche Aufgabenverteilung/);
  assert.match(lessons[1].paragraphs.join(' '), /Flugfedern des Schwanzes.*Rectrices/);
  assert.match(lessons[1].paragraphs.join(' '), /keine Behauptung, dass nur der Schwanz/);
  assert.match(lessons[1].paragraphs.join(' '), /selbst erstelltes Lernmodell/);
  for (const lesson of lessons) {
    assert.equal(lesson.reviewedOn, '2026-10-27'); assert.equal(lesson.flashcardExpansion, true);
    assert.equal(lesson.image, undefined); assert.equal(lesson.diagram, undefined);
    assert.doesNotMatch(lesson.paragraphs.join(' '), /\d|Tertial|flugunfähig|Flugunfähigkeit|brems|abschneiden|auszupfen/i);
    assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [[bto, sourceURLs[0]], [cornell, sourceURLs[1]]]);
    const evidence = raw.evidence.find(item => item.moduleId === courseId && item.lessonId === lesson.id);
    for (const claim of evidence.claims) {
      assert.equal(new Set(claim.sourceUrls).size, 2);
      assert.equal(new Set(claim.sourceUrls.map(url => course.sources.find(source => source.url === url).organization)).size, 2);
      for (const url of claim.sourceUrls) assert.ok(claim.sourceRoles[url].length > 40);
    }
  }
  assert.deepEqual(course.sources.slice(-2).map(source => source.url), sourceURLs);
  assert.equal(new Set(course.sources.map(source => source.url)).size, course.sources.length);
  for (const source of course.sources.slice(-2)) { assert.equal(source.checkedOn, '2026-10-27'); assert.deepEqual(source.lessonIds, lessonIds); }
});

test('All198 old full course objects and1725 old full cards retain contents and order,isolating only the separately authorized firearm appendix', () => {
  assert.equal(learningModules.length, 198);
  assert.equal(hash(learningModules.map(item => stripFirearmTermsAddition(stripFlightFeatherAddition(item)))), '5fbd534310dec73ca0d56bec3053c6c06d0a0b3850d35cc8325037ec7221c630');
  const historical = cards.filter(card => !isFlightFeatherCard(card) && !isFirearmTermsCard(card));
  assert.equal(historical.length, 1725); assert.equal(hash(historical), 'c6c2a0dd32d39a5fe226a4f702cf3cafa1e200f5717b6fe3dd6faf489e10230a');
  assert.equal(hash(cards.filter(card => card.moduleId === courseId && !isFlightFeatherCard(card))), '9fed7134967b0d6f9dcc58624d64b999eaae1676ed43259ae64c436829586bd8');
  assert.equal(hash(cards.slice(0, 116)), '54163a2927f5c3f0e57c2075cea70bd26fe05c4b999620a8f82be93ffd7e2ef9');
  assert.equal(cards.filter(card => card.moduleId === courseId).length, 19);
  const foreign = fs.readFileSync(path.join(__dirname, '../data/learning-expansion-afternoon-2026-10-16.json'));
  assert.equal(createHash('sha256').update(foreign).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('Three distinct own questions create exactly three dated lesson cards and enter existing shared country pools', () => {
  const selected = course.questions.filter(question => lessonIds.includes(question.lessonId));
  assert.deepEqual(selected.map(question => question.id), questionIds.map(id => `${courseId}-${id}`));
  assert.equal(new Set(selected.map(question => question.q)).size, 3);
  for (const question of selected) {
    assert.equal(learningModules.flatMap(module => module.questions).filter(item => item.q === question.q).length, 1);
    assert.equal(new Set(question.answers.map(answer => answer.text)).size, 4);
    const chosen = cards.filter(card => card.id === `flash-${question.id}`); assert.equal(chosen.length, 1);
    const [card] = chosen; assert.equal(card.question, question.q);
    assert.equal(card.answer, question.answers.find(answer => question.correct.includes(answer.id)).text);
    assert.equal(card.explanation, question.explain); assert.equal(card.reviewedOn, '2026-10-27');
    assert.equal(card.sourceScope, 'lesson'); assert.deepEqual(card.sources.map(source => source.url), [bto, sourceURLs[0], cornell, sourceURLs[1]]);
    assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${question.lessonId}`); assert.equal(card.options, undefined);
  }
  const bank = load('data/questions-full.js').QUESTIONS, { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const country of ['DE', 'AT', 'CH']) for (const question of selected) assert.ok(quizLearningPool(bank, { country, topic: 'Wildkunde' }).some(item => item.id === question.id));
});

test('Existing category,search and static course delivery expose exact lesson links and lesson card counts', () => {
  const place = load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);
  assert.equal(place.categorySlug, 'wildkunde'); assert.equal(place.groupId, 'koerperbau-atmung');
  for (const [query, lesson] of [['Handschwingen', lessons[0]], ['Rectrices', lessons[1]]]) {
    const result = load('lib/learning-search.js').searchLearning({ query, type: 'course' }).results.find(item => item.id === `course:${courseId}`);
    assert.ok(result); assert.equal(result.href, `/kurse/${courseId}#lesson-${lesson.id}`); assert.equal(result.lessonTitle, lesson.title);
  }
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.slice(-2), lessons);
  assert.equal(props.flashcards.lessons.schwingen, 2); assert.equal(props.flashcards.lessons.steuerfedern, 1);
});

test('Offline delivery retains all new text,questions,evidence and original course date without extending access', () => {
  const previous = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-flight-feather-offline';
  try {
    const now = Date.parse('2026-10-27T18:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'synthetic@example.invalid', paidUntil: '2026-10-29T18:00:00Z' }, now);
    const { validateOfflinePack } = load('lib/offline-learning.js');
    assert.equal(validateOfflinePack(pack, now), true); assert.equal(validateOfflinePack(pack, pack.expiresAt), false);
    assert.deepEqual(pack.courses[0].lessons, course.lessons); assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-16');
    for (const lesson of pack.courses[0].lessons.slice(-2)) { assert.equal(lesson.reviewedOn, '2026-10-27'); assert.deepEqual(lesson.evidence, lessons.find(item => item.id === lesson.id).evidence); }
  } finally { if (previous === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = previous; }
});

test('The actual course reader puts each whole new lesson above its closed final sources and displays only its true lesson date there', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  for (const [offset, lesson] of lessons.entries()) {
    let cursor = 0;
    const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? 6 + offset : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
    const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ asPath: `/kurse/${courseId}#lesson-${lesson.id}` }) },
      './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
      './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
      '../hooks/useCourseProgress': () => ({}), './CourseProgressNotice': { __esModule: true, default: () => null },
    })('components/LearningCourse.js').default;
    const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: load('lib/learning-flashcards.js').getFlashcardLessonSummary(courseId) }));
    const start = html.indexOf('<details id="quellen"'); assert.ok(start > 0);
    for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, start).includes(paragraph));
    for (const url of [bto, sourceURLs[0], cornell, sourceURLs[1]]) { assert.ok(!html.slice(0, start).includes(url)); assert.ok(html.slice(start).includes(url)); }
    assert.ok(html.includes(`Lektion ${7 + offset} von 8`)); assert.match(html.slice(start), /27\. Oktober 2026/);
    assert.doesNotMatch(html.slice(start), /16\. Oktober 2026|26\. Oktober 2026/); assert.ok(!html.slice(start).split('>')[0].includes('open'));
  }
});

test('The historical projector retains unknown future fields and similarly named unrelated questions,sources and courses', () => {
  const untouched = { id: 'another-course', lessons: [{ id: 'schwingen' }] };
  assert.equal(stripFlightFeatherAddition(untouched), untouched);
  const probe = { ...original, future: { keep: true }, lessons: [...original.lessons, { id: 'schwingen-zusatz', keep: true }],
    questions: [...original.questions, { id: 'schwingen-ansatz-neu', lessonId: 'feinbau', keep: true }],
    sources: [...original.sources, { url: `${sourceURLs[0]}?different`, keep: true }] };
  const result = stripFlightFeatherAddition(probe);
  assert.deepEqual(result.future, { keep: true }); assert.equal(result.lessons.at(-1).id, 'schwingen-zusatz');
  assert.equal(result.questions.at(-1).id, 'schwingen-ansatz-neu'); assert.equal(result.sources.at(-1).url, `${sourceURLs[0]}?different`);
});
