// Real curriculum, card, search and reader integrations plus positive
// complete-object preservation against the published f1926db baseline.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createLoader: createProjectLoader, root, local } = require('./helpers/project-module.cjs');
const { redDeerFlehmenBaselineFixture } = require('./helpers/red-deer-flehmen-addition-nov25.cjs');
const createLoader = overrides => createProjectLoader(redDeerFlehmenBaselineFixture(overrides));
const { addition, newQuestionIds, newCardIds, stripWoodpeckerFootCourse, stripWoodpeckerFootDataset, stripWoodpeckerFootCards, woodpeckerFootBaselineFixture } = require('./helpers/woodpecker-foot-addition-nov25.cjs');
const baseline = 'f1926db0ab56f51fab3a5666dc36b65e756c29d7';
const rawPath = 'data/learning-expansion-biology-2026-10-16.json';
const load = createLoader();
function previousLoader() {
  const cache = new Map();
  return function read(relative) {
    const filename = path.resolve(root, relative), name = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(name && !name.startsWith('../') && !path.isAbsolute(name));
    if (cache.has(filename)) return cache.get(filename).exports;
    // The expressly preserved foreign file is identical on both sides of this
    // comparison, never rewritten or staged by this test.
    const source = name === 'data/learning-expansion-afternoon-2026-10-16.json' ? fs.readFileSync(filename, 'utf8') : execFileSync('git', ['show', `${baseline}:${name}`], { cwd: root, encoding: 'utf8', maxBuffer: 30000000 });
    if (name.endsWith('.json')) return JSON.parse(source.replace(/^\uFEFF/, ''));
    const module = { exports: {} }; cache.set(filename, module);
    const { code } = local('next/dist/build/swc').transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? read(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
    return module.exports;
  };
}
const old = previousLoader(), curriculum = load('lib/learning-curriculum.js'), before = old('lib/learning-curriculum.js');
const course = curriculum.getLearningModule(addition.courseId), lesson = course.lessons.at(-1);
const tools = load('lib/learning-flashcards.js'), cards = tools.getFlashcards(), newCards = cards.filter(card => newCardIds.includes(card.id));

test('Exactly one named end lesson, two questions and three scoped sources preserve all 198 full old course objects and the raw dataset', () => {
  assert.deepEqual(stripWoodpeckerFootDataset(load(rawPath)), old(rawPath));
  assert.equal(before.learningModules.length, 198);
  assert.deepEqual(curriculum.learningModules.map(stripWoodpeckerFootCourse), before.learningModules);
  assert.deepEqual(createLoader(woodpeckerFootBaselineFixture())('lib/learning-curriculum.js').learningModules, before.learningModules);
  assert.deepEqual(before.learningCounts, { modules: 198, lessons: 903, questions: 2788 });
  assert.deepEqual(curriculum.learningCounts, { modules: 198, lessons: 904, questions: 2790 });
  assert.equal(load(rawPath).reviewedOn, '2026-10-16'); assert.equal(course.reviewedOn, '2026-10-16'); assert.equal(course.contentAddedOn, '2026-10-16');
  assert.deepEqual(course.lessons.slice(0, -1), before.getLearningModule(addition.courseId).lessons);
  assert.deepEqual(course.questions.slice(0, -2), before.getLearningModule(addition.courseId).questions);
  assert.deepEqual(course.sources.slice(0, -3), before.getLearningModule(addition.courseId).sources);
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('The complete bounded lesson distinguishes the explicit four-toed ground pattern from movable climbing posture without a universal or manipulation claim', () => {
  assert.equal(lesson.id, addition.lessonId); assert.equal(lesson.title, 'Spechtfuss: Grundschema und Kletterhaltung');
  assert.equal(lesson.reviewedOn, addition.date); assert.equal(lesson.flashcardExpansion, true);
  const text = lesson.paragraphs.join(' '), words = text.split(/\s+/).length;
  assert.ok(words >= 150 && words <= 200);
  for (const term of ['ausdrücklich vierzehigen', 'Zwei Zehen weisen nach vorn, zwei nach hinten', 'zygodactyl', 'äussere Zehe seitwärts', 'gekrümmte Krallen', 'Borke', 'Stützschwanz', 'keine identische Fussform sämtlicher Spechtarten', 'ungeprüft übernehmen', 'weder eine sichere Artzuordnung noch eine bestimmte Halteleistung', 'kein Vogel gefangen']) assert.ok(text.includes(term), term);
  assert.doesNotMatch(text, /\d|Grad|Prozent|Kilogramm|alle Spechte|bei jedem Specht|Gehirn|Stossdämpfer|ausnahmslos/);
  assert.equal(lesson.evidence.length, 3);
  assert.deepEqual(lesson.evidence.map(record => record.sources.map(source => source.url)), [addition.urls.slice(0, 2), addition.urls, addition.urls]);
  assert.match(lesson.exercise, /Eigene Papierübung/); assert.match(lesson.exercise, /nicht als Art- oder Leistungsnachweis/);
});

test('The three independently authored originals have exact lesson scopes and differentiated read roles; no historical scan-host or image is counted as an extra source', () => {
  const sources = course.sources.slice(-3);
  assert.deepEqual(sources.map(source => source.url), addition.urls);
  assert.equal(new Set(sources.map(source => source.organization)).size, 3);
  assert.ok(sources.every(source => source.checkedOn === addition.date && JSON.stringify(source.lessonIds) === JSON.stringify([addition.lessonId])));
  assert.ok(course.lessons.slice(0, -1).every(item => item.evidence.every(record => record.sources.every(source => !addition.urls.includes(source.url)))));
  const review = load('data/reviews/woodpecker-foot-learning-2026-11-25.json');
  assert.equal(review.reviewedOn, addition.date); assert.equal(review.baselineCommit, baseline); assert.equal(review.lessonId, addition.lessonId);
  assert.deepEqual(review.sources.map(source => source.url), addition.urls);
  assert.ok(review.sources.every(source => source.actuallyRead && source.role && source.excluded));
  assert.match(review.originalPaperReadScope, /Stanford ist Scan-Host/); assert.match(review.originalPaperReadScope, /visuell geprüft/);
  assert.match(sources[2].supports, /für sich kein Nachweis eines exakten seitlichen Winkels/);
  assert.deepEqual(review.media, { newPhotos: false, newVideos: false, originalPaperIllustrationsReused: false });
});

test('Two plausible four-answer questions enter all three country pools exactly once, while all 1796 old cards and 116 starters remain exact and ordered', () => {
  const oldCards = old('lib/learning-flashcards.js').getFlashcards();
  assert.equal(oldCards.length, 1796); assert.equal(cards.length, 1798); assert.equal(newCards.length, 2);
  assert.deepEqual(cards.filter(card => !newCards.includes(card)), oldCards);
  assert.deepEqual(stripWoodpeckerFootCards(cards), oldCards);
  assert.deepEqual(cards.slice(0, 116), oldCards.slice(0, 116));
  const all = load('data/questions-full.js').QUESTIONS, { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const id of newQuestionIds) {
    const question = course.questions.find(item => item.id === id), card = newCards.find(item => item.id === `flash-${id}`);
    assert.equal(question.lessonId, addition.lessonId); assert.deepEqual(question.countries, ['DE', 'AT', 'CH']);
    assert.equal(question.answers.length, 4); assert.equal(new Set(question.answers.map(answer => answer.text)).size, 4); assert.equal(question.correct.length, 1);
    assert.equal(curriculum.learningQuestions.filter(item => item.id === id).length, 1);
    for (const country of ['DE', 'AT', 'CH']) assert.equal(quizLearningPool(all, { country, topic: course.topic }).filter(item => item.id === id).length, 1);
    assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(answer => question.correct.includes(answer.id)).text);
    assert.equal(card.explanation, question.explain); assert.equal(card.reviewedOn, addition.date); assert.equal(card.sourceScope, 'lesson');
    assert.deepEqual(card.sources.map(source => source.url), addition.urls);
  }
  const first = course.questions.find(item => item.id === newQuestionIds[0]), second = course.questions.find(item => item.id === newQuestionIds[1]);
  assert.equal(first.answers.find(answer => first.correct.includes(answer.id)).text, 'Zwei Zehen weisen nach vorn, zwei nach hinten.');
  assert.match(second.answers.find(answer => second.correct.includes(answer.id)).text, /Bauplan und Haltung sind zu unterscheiden/);
  assert.doesNotMatch(first.q + second.q, /Zehe I|Zehe IV|Winkel|Grad|Kraft/);
});

test('Existing category, course, search, daily reading and digital/print-deck integrations resolve the complete new lesson without a new route', () => {
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: addition.courseId } }).props;
  assert.deepEqual(props.module.lessons.at(-1), lesson); assert.equal(props.flashcards.lessons[addition.lessonId], 2); assert.equal(props.lessonPhotos[addition.lessonId], undefined);
  assert.deepEqual(load('lib/learning-topic-tree.js').getLearningTopicLocation(addition.courseId), old('lib/learning-topic-tree.js').getLearningTopicLocation(addition.courseId));
  const overview = load('lib/learning-overview-server.js').getLearningOverviewData('wildkunde');
  assert.ok(overview.modules.find(item => item.id === addition.courseId).topics.some(item => item.href === `/kurse/${addition.courseId}#lesson-${addition.lessonId}`));
  const result = load('lib/learning-search.js').searchLearning({ query: 'Spechtfuss Kletterhaltung', type: 'course' }).results.find(item => item.id === `course:${addition.courseId}`);
  assert.ok(result); assert.equal(result.href, `/kurse/${addition.courseId}#lesson-${addition.lessonId}`); assert.equal(Object.hasOwn(result, 'correct'), false);
  const pool = load('lib/daily-review-pool.js').getDailyReviewPool();
  for (const id of newQuestionIds) {
    const item = pool.find(question => question.id === id); assert.ok(item);
    assert.deepEqual(item.reading.paragraphs, lesson.paragraphs); assert.equal(item.reading.exercise, lesson.exercise); assert.equal(item.sourceScope, 'lesson');
    assert.deepEqual(item.sources.map(source => source.url), addition.urls);
  }
  const deck = tools.getFlashcardExport({ courseId: addition.courseId, lessonId: addition.lessonId, invalid: false }, { withChoices: true });
  assert.equal(deck.cards.length, 2); assert.ok(deck.cards.every(card => card.choices.length === 4 && card.lessonId === addition.lessonId));
  const sources = load('pages/lernen/lernkarten-drucken.js').getPrintSourceIndex(newCards).sourceList;
  assert.deepEqual(sources.map(source => source.url), addition.urls);
});

test('Actual course and print readers render full teaching before closed final sources and use the new lesson date while preserving the old course date', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server'); let cursor = 0;
  const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? course.lessons.length - 1 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
  const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${addition.courseId}#lesson-${addition.lessonId}` }) },
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
    '../hooks/useCourseProgress': { __esModule: true, default: () => ({}) }, './CourseProgressNotice': { __esModule: true, default: () => null } })('components/LearningCourse.js').default;
  const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: tools.getFlashcardLessonSummary(addition.courseId) }));
  const boundary = html.indexOf('<details id="quellen"'); assert.ok(boundary > 0);
  for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, boundary).includes(paragraph));
  for (const url of addition.urls) assert.ok(!html.slice(0, boundary).includes(url) && html.slice(boundary).includes(url));
  assert.ok(!html.slice(boundary).split('>')[0].includes('open')); assert.match(html.slice(boundary), /25\. November 2026/);
  const deck = tools.getFlashcardExport({ courseId: addition.courseId, lessonId: addition.lessonId, invalid: false });
  const Print = createLoader({ 'next/router': { useRouter: () => ({ isReady: true, query: {} }) },
    '../../components/useFlashcardDeck': { __esModule: true, default: () => ({ ...deck, incomplete: false }) },
    '../../components/LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    '../../components/PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} } })('pages/lernen/lernkarten-drucken.js').default;
  const print = renderToStaticMarkup(React.createElement(Print)), appendix = print.indexOf('id="lernkarten-quellen"'); assert.ok(appendix > 0);
  for (const card of newCards) { assert.ok(print.indexOf(card.answer) < appendix); assert.ok(print.indexOf(card.explanation) < appendix); }
  assert.match(print, /Stand der Ausgangslektion: 25\.11\.2026/); assert.ok(addition.urls.every(url => print.slice(appendix).includes(url)));
});

test('Actual card API retains access boundaries, four choices and scoped dates; unknown or multiple selections disclose no replacement deck', async () => {
  const denied = createLoader({ '../../../../lib/account-access': { getSignedAccountAccess: async () => null } })('app/api/lernen/lernkarten/route.js');
  const allowed = createLoader({ '../../../../lib/account-access': { getSignedAccountAccess: async () => ({ paid: true }) } })('app/api/lernen/lernkarten/route.js');
  const url = `https://jagdlatein.test/api/lernen/lernkarten?kurs=${addition.courseId}&lektion=${addition.lessonId}&choices=1`;
  const blocked = await denied.GET(new Request(url)); assert.equal(blocked.status, 401); assert.doesNotMatch(await blocked.text(), /Spechtfuss|Kletterhaltung/);
  const response = await allowed.GET(new Request(url)); assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.equal(response.headers.get('vary'), 'Cookie');
  const deck = load('lib/flashcard-payload.js').unpackFlashcards(await response.json());
  assert.equal(deck.cards.length, 2); assert.ok(deck.cards.every(card => card.reviewedOn === addition.date && card.lessonId === addition.lessonId && card.choices.length === 4));
  const invalid = await allowed.GET(new Request(url.replace(addition.lessonId, 'not-present'))); assert.equal(invalid.status, 200);
  const empty = load('lib/flashcard-payload.js').unpackFlashcards(await invalid.json()); assert.deepEqual(empty.cards, []); assert.equal(empty.selection.invalid, true);
  const repeated = await allowed.GET(new Request(url + '&lektion=' + addition.lessonId)); assert.equal(repeated.status, 400);
  assert.doesNotMatch(await repeated.text(), /Spechtfuss|Kletterhaltung|zygodactyl/);
});

test('Strict historical isolation rejects unrelated tails, date/scope drift, evidence changes and card metadata drift instead of masking them', () => {
  for (const mutate of [
    item => item.lessons.push({ id: 'unrelated-tail' }),
    item => { item.lessons.at(-1).reviewedOn = '2026-10-16'; },
    item => item.questions.push({ id: 'unrelated', lessonId: 'other' }),
    item => { item.sources.at(-1).url = 'https://example.invalid/other'; },
    item => { item.sources.at(-1).lessonIds = ['vogelbein']; },
  ]) { const changed = structuredClone(course); mutate(changed); assert.throws(() => stripWoodpeckerFootCourse(changed)); }
  const changedOld = structuredClone(course); changedOld.lessons[0].title += ' unapproved';
  assert.notDeepEqual(stripWoodpeckerFootCourse(changedOld), before.getLearningModule(addition.courseId));
  const dataset = structuredClone(load(rawPath)); dataset.evidence.at(-1).claims[0].sourceUrls.pop(); assert.throws(() => stripWoodpeckerFootDataset(dataset));
  const roles = structuredClone(load(rawPath)); delete roles.evidence.at(-1).claims[1].sourceRoles[addition.urls[2]]; assert.throws(() => stripWoodpeckerFootDataset(roles));
  const changedCards = structuredClone(cards); changedCards.find(card => card.id === newCards[0].id).reviewedOn = '2026-10-16'; assert.throws(() => stripWoodpeckerFootCards(changedCards));
});
