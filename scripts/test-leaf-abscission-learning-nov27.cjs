// Full old-object preservation and actual reader/card/quiz/export adapters.
// Source review is separate; I/O, account and browser/device claims stay isolated.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const { addition, newQuestionId, newCardId, expectedHashes, assertExact, stripLeafCourse, stripLeafDataset, stripLeafCards, leafBaselineFixture } = require('./helpers/leaf-abscission-addition-nov27.cjs');
const baseline = '17f1e676bb100caaf6350259819f5d57c1a11ec8';
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const image = ({ priority, fill, ...props }) => React.createElement('img', props);
const load = createLoader({ 'next/image': image });

function previousLoader() {
  const cache = new Map();
  return function read(relative) {
    const filename = path.resolve(root, relative), name = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(name && !name.startsWith('../') && !path.isAbsolute(name));
    if (cache.has(filename)) return cache.get(filename).exports;
    // The explicitly protected foreign file is held byte-identical on both
    // sides. This comparison does not claim that its local changes were shipped.
    const source = name === 'data/learning-expansion-afternoon-2026-10-16.json' ? fs.readFileSync(filename, 'utf8')
      : execFileSync('git', ['show', `${baseline}:${name}`], { cwd: root, encoding: 'utf8', maxBuffer: 30000000 });
    if (name.endsWith('.json')) return JSON.parse(source.replace(/^\uFEFF/, ''));
    const module = { exports: {} }; cache.set(filename, module);
    const { code } = local('next/dist/build/swc').transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(name => {
      if (name.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      if (name === 'next/image') return image;
      return name.startsWith('.') ? read(path.resolve(path.dirname(filename), path.extname(name) ? name : `${name}.js`)) : local(name);
    }, module, module.exports);
    return module.exports;
  };
}
const old = previousLoader(), before = old('lib/learning-curriculum.js');
const curriculum = load('lib/learning-curriculum.js'), course = curriculum.getLearningModule(addition.courseId), lesson = course.lessons.at(-1);
const tools = load('lib/learning-flashcards.js'), cards = tools.getFlashcards(), card = cards.find(value => value.id === newCardId);

test('Only the exact Leaf append changes the raw dataset; all198 old complete ordered courses and their dates remain positive exact', () => {
  const file = 'data/learning-expansion-ecology-2026-10-16.json';
  assert.deepEqual(stripLeafDataset(load(file)), old(file));
  assert.deepEqual(curriculum.learningModules.map(stripLeafCourse), before.learningModules);
  assert.deepEqual(createLoader(leafBaselineFixture())('lib/learning-curriculum.js').learningModules, before.learningModules);
  assert.deepEqual(before.learningCounts, { modules: 198, lessons: 907, questions: 2796 });
  assert.deepEqual(curriculum.learningCounts, { modules: 198, lessons: 908, questions: 2797 });
  assert.deepEqual(course.lessons.slice(0, -1), before.getLearningModule(addition.courseId).lessons);
  assert.deepEqual(course.questions.slice(0, -1), before.getLearningModule(addition.courseId).questions);
  assert.deepEqual(course.sources.slice(0, -3), before.getLearningModule(addition.courseId).sources);
  assert.equal(course.reviewedOn, '2026-10-16'); assert.equal(load(file).reviewedOn, '2026-10-16');
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('The complete154-word lesson links senescence and abscission, declares model limits and uses only an own paper exercise', () => {
  const text = lesson.paragraphs.join(' ');
  assert.equal(text.split(/\s+/).length, 154); assert.equal(lesson.id, addition.lessonId); assert.equal(lesson.reviewedOn, addition.date);
  for (const term of ['Abszission', 'Abtrennungszone', 'Blattstiel zum Spross', 'Zusammenhalt von Zellen', 'miteinander verknüpft', 'kein fester Abwurftermin', 'Ein loses Blatt am Boden', 'Eigene Papierübung', 'kein mikroskopisches Messbild']) assert.ok(text.includes(term), term);
  assert.doesNotMatch(text, /\d|Prozent|Auxin|Ethylen|Kork|Schutzschicht|Suberin|Lignin|Nährstoff/);
  assert.equal(lesson.image, undefined); assert.equal(lesson.diagram, undefined); assert.equal(lesson.flashcardExpansion, true); assert.ok(lesson.exercise && lesson.takeaway);
  assert.equal(lesson.evidence.length, 2); assert.ok(lesson.evidence.every(value => JSON.stringify(value.sources.map(source => source.url)) === JSON.stringify(addition.urls)));
});

test('Three actual source readings remain limited to the new lesson; old sources and dates and correct hybrid-study roles stay exact', () => {
  const review = load('data/reviews/leaf-abscission-learning-2026-11-27.json');
  assert.equal(review.baselineCommit, baseline); assert.equal(review.reviewedOn, addition.date); assert.equal(review.lessonId, addition.lessonId); assert.equal(review.claims.length, 2);
  assert.deepEqual(review.sources.map(value => value.url), addition.urls); assert.ok(review.sources.every(value => value.actuallyRead && value.supports && value.exclude));
  assert.match(review.sourceLimits, /T89=Populus tremula×P\.tremuloides/); assert.match(review.sourceLimits, /keine experimentellen Replikationen/); assert.match(review.sourceLimits, /Originalverlagsseite/);
  assert.equal(review.media.newPhotosVideosOrCopiedFigures, false); assert.equal(review.media.newDiagramAsset, false);
  const sources = course.sources.slice(-3); assert.deepEqual(sources.map(value => value.url), addition.urls); assert.equal(new Set(sources.map(value => value.organization)).size, 3);
  assert.ok(sources.every(value => value.checkedOn === addition.date && JSON.stringify(value.lessonIds) === JSON.stringify([addition.lessonId])));
  for (const prior of course.lessons.slice(0, -1)) assert.deepEqual(course.sources.filter(value => !value.lessonIds || value.lessonIds.includes(prior.id)), before.getLearningModule(addition.courseId).sources.filter(value => !value.lessonIds || value.lessonIds.includes(prior.id)));
});

test('One original four-choice question derives one card; all1804 old ordered cards and116 starter objects remain exact', () => {
  const previous = old('lib/learning-flashcards.js').getFlashcards(); assert.equal(previous.length, 1804); assert.equal(cards.length, 1805); assert.ok(card);
  assert.deepEqual(stripLeafCards(cards), previous); assert.deepEqual(cards.slice(0, 116), previous.slice(0, 116));
  const question = course.questions.find(value => value.id === newQuestionId); assert.ok(question); assert.equal(question.answers.length, 4); assert.equal(new Set(question.answers.map(value => value.text)).size, 4); assert.equal(question.correct.length, 1);
  const all = load('data/questions-full.js').QUESTIONS, { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const country of ['CH', 'AT', 'DE']) assert.equal(quizLearningPool(all, { country, topic: course.topic }).filter(value => value.id === newQuestionId).length, 1);
  assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(value => question.correct.includes(value.id)).text); assert.equal(card.explanation, question.explain);
  assert.equal(card.reviewedOn, addition.date); assert.equal(card.sourceScope, 'lesson'); assert.deepEqual(card.sources.map(value => value.url), addition.urls);
  assert.equal(card.learningHref, `/kurse/${addition.courseId}#lesson-${addition.lessonId}`); assert.equal(card.courseHref, card.learningHref);
  assert.ok(before.learningModules.flatMap(value => value.questions).every(value => value.q !== question.q));
});

test('Current course, existing category, search, daily reading and digital/print card exports resolve the exact same full lesson', () => {
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: addition.courseId } }).props;
  assert.deepEqual(props.module.lessons.at(-1), lesson); assert.equal(props.flashcards.lessons[addition.lessonId], 1); assert.equal(props.lessonPhotos[addition.lessonId], undefined);
  assert.deepEqual(load('lib/learning-topic-tree.js').getLearningTopicLocation(addition.courseId), old('lib/learning-topic-tree.js').getLearningTopicLocation(addition.courseId));
  const overview = load('lib/learning-overview-server.js').getLearningOverviewData('wald-pflanzen'); assert.ok(overview.modules.find(value => value.id === addition.courseId).topics.some(value => value.href === card.learningHref));
  const result = load('lib/learning-search.js').searchLearning({ query: 'Abtrennungszone Blattabwurf', type: 'course' }).results.find(value => value.id === `course:${addition.courseId}`); assert.ok(result); assert.equal(result.href, card.learningHref); assert.equal(Object.hasOwn(result, 'correct'), false);
  const daily = load('lib/daily-review-pool.js').getDailyReviewPool().find(value => value.id === newQuestionId); assert.ok(daily); assert.deepEqual(daily.reading.paragraphs, lesson.paragraphs); assert.equal(daily.reading.exercise, lesson.exercise); assert.deepEqual(daily.sources.map(value => value.url), addition.urls);
  const deck = tools.getFlashcardExport({ courseId: addition.courseId, lessonId: addition.lessonId, invalid: false }, { withChoices: true }); assert.equal(deck.cards.length, 1); assert.equal(deck.cards[0].choices.length, 4);
  assert.deepEqual(load('pages/lernen/lernkarten-drucken.js').getPrintSourceIndex([card]).sourceList.map(value => value.url), addition.urls);
});

test('A real signed isolated offline pack preserves every new paragraph/date and renders all content before final closed sources', () => {
  const previousSecret = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-leaf-append-test-only';
  try {
    const now = Date.parse('2026-11-27T14:00:00Z'), pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [addition.courseId], sounds: false }, { email: 'leaf-fixture@example.invalid', paidUntil: '2026-11-29T12:00:00Z' }, now);
    assert.equal(load('lib/offline-learning.js').validateOfflinePack(pack, now), true); assert.deepEqual(pack.courses[0].lessons.at(-1), lesson); assert.equal(pack.courses[0].reviewedOn, '2026-10-16');
    const filename = path.join(root, 'components/OfflineLearning.js'), source = fs.readFileSync(filename, 'utf8') + '\nexport { OfflineCourse };';
    const { code } = local('next/dist/build/swc').transformSync(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    let cursor = 0;
    const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? course.lessons.length - 1 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
    const child = createLoader({ react: hooks }), module = { exports: {} };
    new Function('require', 'module', 'exports', code)(name => name === 'react' ? hooks : name.endsWith('.module.css') ? { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) } : name.startsWith('.') ? child(path.resolve(path.dirname(filename), path.extname(name) ? name : `${name}.js`)) : local(name), module, module.exports);
    const html = renderToStaticMarkup(React.createElement(module.exports.OfflineCourse, { course: pack.courses[0], expiresAt: pack.expiresAt, onExpired() {} }));
    for (const paragraph of lesson.paragraphs) { assert.ok(html.includes(paragraph)); assert.ok(html.indexOf(paragraph) < html.indexOf('Quellen und Prüfstand')); }
    const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom'), dom = new JSDOM(html);
    try {
      const sources = [...dom.window.document.querySelectorAll('details')].find(value => value.querySelector('summary')?.textContent === 'Quellen und Prüfstand');
      assert.ok(sources); assert.equal(sources.open, false);
      const urls = [...sources.querySelectorAll('a[href]')].map(value => value.getAttribute('href'));
      assert.ok(addition.urls.every(url => urls.includes(url)));
    } finally { dom.window.close(); }
  } finally { if (previousSecret === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = previousSecret; }
});

test('Only exact complete named objects can be stripped; unrelated old edits or generic truncation never disappear', () => {
  for (const mutate of [value => value.lessons.push({ id: 'other' }), value => { value.lessons.at(-1).paragraphs[0] += ' drift'; }, value => { value.lessons.at(-1).reviewedOn = '2026-10-16'; }, value => { value.questions.at(-1).answers.reverse(); }, value => { value.questions.at(-1).explain += ' drift'; }, value => { value.sources.at(-1).lessonIds = ['blattbau']; }, value => { value.sources.at(-1).label += ' drift'; }]) { const changed = structuredClone(course); mutate(changed); assert.throws(() => stripLeafCourse(changed)); }
  const changed = structuredClone(course); changed.lessons[0].paragraphs[0] += ' unapproved old text'; assert.notDeepEqual(stripLeafCourse(changed), before.getLearningModule(addition.courseId));
  const data = structuredClone(load('data/learning-expansion-ecology-2026-10-16.json')); data.evidence.at(-1).claims[0].claim += ' drift'; assert.throws(() => stripLeafDataset(data));
  const altered = structuredClone(cards); altered.find(value => value.id === newCardId).answer += ' drift'; assert.throws(() => stripLeafCards(altered));
  assert.equal(stripLeafCourse(before.getLearningModule(addition.courseId)), before.getLearningModule(addition.courseId));
  assertExact(lesson, expectedHashes.preparedLesson, 'Frozen prepared lesson');
});

test('The actual mounted course quiz offers four blind choices and discloses feedback only after each of the four answer paths', async () => {
  const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom'), { createRoot } = local('react-dom/client');
  const question = course.questions.find(value => value.id === newQuestionId);
  for (const option of question.answers) {
    const address = `/kurse/${addition.courseId}#lesson-${addition.lessonId}`, dom = new JSDOM('<div id="root"></div>', { url: `https://isolated.invalid${address}`, pretendToBeVisual: true });
    const saved = new Map(['window', 'document', 'navigator', 'IS_REACT_ACT_ENVIRONMENT'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    dom.window.HTMLElement.prototype.scrollIntoView = () => {}; dom.window.scrollTo = () => {};
    const router = { isReady: true, query: {}, asPath: address }, link = ({ href, children, prefetch, scroll, ...props }) => React.createElement('a', { ...props, href: typeof href === 'string' ? href : href.pathname }, children);
    const native = createLoader({ 'next/router': { useRouter: () => router }, 'next/link': { __esModule: true, default: link }, 'next/image': image, './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) }, './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} }, './ExamProfileSummary': { __esModule: true, default: () => null }, '../hooks/useCourseProgress': { __esModule: true, default: () => ({}) }, './CourseProgressNotice': { __esModule: true, default: () => null }, '../hooks/useSelectionPageStart': { __esModule: true, default: () => ({ focusSelection() {}, cancelSelectionFocus() {} }) }, '../lib/daily-review': { REVIEW_STORAGE_KEY: 'isolated-leaf-only', recordReviewAnswer() {} } });
    let ui;
    try {
      ui = createRoot(dom.window.document.getElementById('root')); await React.act(async () => ui.render(React.createElement(native('components/LearningCourse.js').default, { module: course, flashcards: tools.getFlashcardLessonSummary(addition.courseId) })));
      const doc = dom.window.document, practice = doc.querySelector('[data-course-lesson-practice]'); assert.equal(practice.dataset.courseLessonPractice, addition.lessonId); assert.equal(practice.disabled, false); assert.equal(doc.getElementById('quellen').open, false);
      await React.act(async () => practice.click()); const panel = doc.getElementById('wissenscheck'); assert.equal(panel.open, true); assert.equal(doc.getElementById('current-question').textContent, question.q);
      const choices = [...panel.querySelectorAll('[role="group"] button')]; assert.equal(choices.length, 4); assert.equal(panel.querySelector('[role="status"]'), null); assert.equal(panel.textContent.includes(question.explain), false); assert.equal(choices.some(value => value.textContent.includes('Richtige Antwort')), false);
      await React.act(async () => choices.find(value => value.textContent === option.text).click()); assert.ok(panel.querySelector('[role="status"]').textContent.includes(question.explain)); assert.equal([...panel.querySelectorAll('[role="group"] button')].every(value => value.disabled), true); assert.equal([...panel.querySelectorAll('[role="group"] button')].filter(value => value.textContent.includes('Richtige Antwort')).length, 1);
      const sources = doc.getElementById('quellen'); assert.equal(sources.open, false);
      const urls = [...sources.querySelectorAll('a[href]')].map(value => value.getAttribute('href')); assert.ok(addition.urls.every(url => urls.includes(url)));
      for (const paragraph of lesson.paragraphs) { const node = [...doc.querySelectorAll('p')].find(value => value.textContent === paragraph); assert.ok(node); assert.ok(node.compareDocumentPosition(sources) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING); }
    } finally { if (ui) await React.act(async () => ui.unmount()); dom.window.close(); for (const [key, value] of saved) if (value) Object.defineProperty(globalThis, key, value); else delete globalThis[key]; }
  }
});
