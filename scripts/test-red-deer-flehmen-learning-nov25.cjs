// Bounded new learning content, real adapters and positive old-object/diagram
// preservation. No real user, storage, network, credentials or device browser.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const { addition, newQuestionIds, newCardIds, cardSourceUrls, stripRedDeerFlehmenCourse, stripRedDeerFlehmenModule, stripRedDeerFlehmenCards, redDeerFlehmenBaselineFixture } = require('./helpers/red-deer-flehmen-addition-nov25.cjs');
const baseline = '61019897797d9fe851ff3bb25e46a5a5a534e578';
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const image = ({ priority, fill, ...props }) => React.createElement('img', props);
const load = createLoader({ 'next/image': image });
function previousLoader() {
  const cache = new Map();
  return function read(relative) {
    const filename = path.resolve(root, relative), name = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(name && !name.startsWith('../') && !path.isAbsolute(name));
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = name === 'data/learning-expansion-afternoon-2026-10-16.json' ? fs.readFileSync(filename, 'utf8') : execFileSync('git', ['show', `${baseline}:${name}`], { cwd: root, encoding: 'utf8', maxBuffer: 30000000 });
    if (name.endsWith('.json')) return JSON.parse(source.replace(/^\uFEFF/, ''));
    const module = { exports: {} }; cache.set(filename, module);
    const { code } = local('next/dist/build/swc').transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => {
      if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      if (id === 'next/image') return image;
      return id.startsWith('.') ? read(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id);
    }, module, module.exports);
    return module.exports;
  };
}
const old = previousLoader(), curriculum = load('lib/learning-curriculum.js'), before = old('lib/learning-curriculum.js');
const course = curriculum.getLearningModule(addition.courseId), lesson = course.lessons.at(-1);
const tools = load('lib/learning-flashcards.js'), cards = tools.getFlashcards(), addedCards = cards.filter(card => newCardIds.includes(card.id));

test('One named end lesson preserves every old wildlife export and all 198 complete courses, in exact old order and with old dates', () => {
  assert.deepEqual(stripRedDeerFlehmenModule(load('lib/learning-wildlife.js')), old('lib/learning-wildlife.js'));
  assert.deepEqual(curriculum.learningModules.map(stripRedDeerFlehmenCourse), before.learningModules);
  assert.deepEqual(createLoader(redDeerFlehmenBaselineFixture())('lib/learning-curriculum.js').learningModules, before.learningModules);
  assert.deepEqual(before.learningCounts, { modules: 198, lessons: 904, questions: 2790 });
  assert.deepEqual(curriculum.learningCounts, { modules: 198, lessons: 905, questions: 2792 });
  assert.equal(course.reviewedOn, '2026-10-04'); assert.equal(lesson.reviewedOn, addition.date);
  assert.deepEqual(course.lessons.slice(0, -1), before.getLearningModule(addition.courseId).lessons);
  assert.deepEqual(course.questions.slice(0, -2), before.getLearningModule(addition.courseId).questions);
  assert.deepEqual(course.sources.slice(0, -3), before.getLearningModule(addition.courseId).sources);
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('The complete bounded lesson teaches posture and sensory role with its own paper comparison, without organ, hormone, metric or sequence claims', () => {
  assert.equal(lesson.id, addition.lessonId); assert.equal(lesson.flashcardExpansion, true);
  const text = lesson.paragraphs.join(' '), words = text.split(/\s+/).length; assert.ok(words >= 170 && words <= 220);
  for (const term of ['Haupt ist angehoben', 'Hals gestreckt', 'Maul geöffnet', 'Oberlippe zurückgezogen', 'Aufnahme chemischer Hinweise', 'Harn weiblicher Tiere', 'Lautäusserung', 'keine feste Reihenfolge', 'Eigene Papierübung', 'weder Harnproben gesammelt noch Tiere angelockt']) assert.ok(text.includes(term), term);
  assert.doesNotMatch(text, /\d|Vomeronasal|Jacobson|Drüse|Hormone|Hormonwert|Fruchtbarkeit|Trächtigkeit|Gesundheit|garantiert|bei jedem Hirsch/i);
  assert.equal(lesson.evidence.length, 3); assert.ok(lesson.exercise && lesson.takeaway);
  assert.deepEqual(lesson.evidence.map(item => item.sources.map(source => source.url)), [[addition.urls[0], addition.urls[2]], addition.urls, addition.urls]);
});

test('Three exact original source roles and scopes apply only to the new lesson; original course facts are not redated', () => {
  const sources = course.sources.slice(-3), review = load('data/reviews/red-deer-flehmen-learning-2026-11-25.json');
  assert.deepEqual(sources.map(source => source.url), addition.urls); assert.equal(new Set(sources.map(source => source.organization)).size, 3);
  assert.ok(sources.every(source => source.checkedOn === addition.date && JSON.stringify(source.lessonIds) === JSON.stringify([addition.lessonId])));
  for (const prior of course.lessons.slice(0, -1)) assert.deepEqual(course.sources.filter(source => !source.lessonIds || source.lessonIds.includes(prior.id)), before.getLearningModule(addition.courseId).sources);
  assert.equal(review.baselineCommit, baseline); assert.equal(review.reviewedOn, addition.date); assert.equal(review.lessonId, addition.lessonId);
  assert.deepEqual(review.sources.map(source => source.url), addition.urls); assert.equal(review.claims.length, 3);
  assert.ok(review.sources.every(source => source.actuallyRead && source.role && source.excluded));
  assert.match(review.sources[0].actuallyRead, /Tabelle 5/); assert.match(review.sources[1].actuallyRead, /PDF-Seite 3, gedruckte Seite 10/);
  assert.match(review.sources[2].actuallyRead, /gedruckte Seiten 10–11/); assert.match(review.sources[2].role, /Kein Steinbockübertrag/);
  assert.equal(review.diagram.newPhotosVideosOrCopiedFigures, false);
});

test('Two genuine four-answer questions create exactly two scoped cards; all 1798 old cards and 116 starters remain full-object exact', () => {
  const previous = old('lib/learning-flashcards.js').getFlashcards();
  assert.equal(previous.length, 1798); assert.equal(cards.length, 1800); assert.equal(addedCards.length, 2);
  assert.deepEqual(stripRedDeerFlehmenCards(cards), previous); assert.deepEqual(cards.slice(0, 116), previous.slice(0, 116));
  const all = load('data/questions-full.js').QUESTIONS, { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const id of newQuestionIds) {
    const question = course.questions.find(item => item.id === id), card = addedCards.find(item => item.id === `flash-${id}`);
    assert.ok(question && card); assert.equal(question.lessonId, addition.lessonId);
    assert.equal(question.answers.length, 4); assert.equal(new Set(question.answers.map(answer => answer.text)).size, 4); assert.equal(question.correct.length, 1);
    for (const country of ['DE', 'AT', 'CH']) assert.equal(quizLearningPool(all, { country, topic: course.topic }).filter(item => item.id === id).length, 1);
    assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(answer => question.correct.includes(answer.id)).text);
    assert.equal(card.explanation, question.explain); assert.equal(card.reviewedOn, addition.date); assert.equal(card.sourceScope, 'lesson');
    assert.deepEqual(card.sources.map(source => source.url), cardSourceUrls);
  }
  const questions = course.questions.slice(-2);
  assert.equal(questions[0].answers.find(answer => questions[0].correct.includes(answer.id)).text, 'Flehmen.');
  assert.equal(questions[1].answers.find(answer => questions[1].correct.includes(answer.id)).text, 'Flehmen gehört zur Aufnahme chemischer Hinweise; Röhren ist eine Lautäusserung.');
  assert.notEqual(questions[0].correct[0], questions[1].correct[0]);
});

test('Existing course/category/search/daily-reading and selected digital/print-card adapters all resolve the same complete new lesson', () => {
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: addition.courseId } }).props;
  assert.deepEqual(props.module.lessons.at(-1), lesson); assert.equal(props.flashcards.lessons[addition.lessonId], 2); assert.equal(props.lessonPhotos[addition.lessonId], undefined);
  assert.deepEqual(load('lib/learning-topic-tree.js').getLearningTopicLocation(addition.courseId), old('lib/learning-topic-tree.js').getLearningTopicLocation(addition.courseId));
  const overview = load('lib/learning-overview-server.js').getLearningOverviewData('wildkunde');
  assert.ok(overview.modules.find(item => item.id === addition.courseId).topics.some(item => item.href === `/kurse/${addition.courseId}#lesson-${addition.lessonId}`));
  const result = load('lib/learning-search.js').searchLearning({ query: 'Flehmen chemische Hinweise', type: 'course' }).results.find(item => item.id === `course:${addition.courseId}`);
  assert.ok(result); assert.equal(result.href, `/kurse/${addition.courseId}#lesson-${addition.lessonId}`); assert.equal(Object.hasOwn(result, 'correct'), false);
  for (const id of newQuestionIds) {
    const item = load('lib/daily-review-pool.js').getDailyReviewPool().find(question => question.id === id); assert.ok(item);
    assert.deepEqual(item.reading.paragraphs, lesson.paragraphs); assert.equal(item.reading.exercise, lesson.exercise); assert.equal(item.sourceScope, 'lesson');
    assert.deepEqual(item.sources.map(source => source.url), cardSourceUrls);
  }
  const deck = tools.getFlashcardExport({ courseId: addition.courseId, lessonId: addition.lessonId, invalid: false }, { withChoices: true });
  assert.equal(deck.cards.length, 2); assert.ok(deck.cards.every(card => card.choices.length === 4));
  assert.deepEqual(load('pages/lernen/lernkarten-drucken.js').getPrintSourceIndex(addedCards).sourceList.map(source => source.url), cardSourceUrls);
});

test('The real comparison renderer uses an unnumbered list and responsive two-column rules; all 904 former diagram objects and rendered HTML remain exact', () => {
  const diagrams = load('lib/lesson-diagrams.js'), oldDiagrams = old('lib/lesson-diagrams.js');
  const Component = load('components/LessonDiagram.js').default, Previous = old('components/LessonDiagram.js').default;
  assert.equal(lesson.diagram.type, 'comparison'); assert.equal(lesson.diagram.steps.length, 2); assert.match(lesson.diagram.note, /keine zeitliche Abfolge/);
  const html = renderToStaticMarkup(React.createElement(Component, { diagram: lesson.diagram }));
  assert.match(html, /<ul\b/); assert.doesNotMatch(html, /<ol\b|stepNumber|<img|<video|<iframe|https?:/);
  for (const step of lesson.diagram.steps) assert.ok(html.includes(step.title) && html.includes(step.text));
  let checked = 0;
  for (const module of before.learningModules) for (const item of module.lessons) {
    const prior = oldDiagrams.getLessonDiagram(module.id, item.id), current = diagrams.getLessonDiagram(module.id, item.id);
    assert.deepEqual(current, prior, `${module.id}/${item.id}`); checked++;
    assert.equal(renderToStaticMarkup(React.createElement(Component, { diagram: current })), renderToStaticMarkup(React.createElement(Previous, { diagram: prior })), `${module.id}/${item.id}: old rendered markup`);
  }
  assert.equal(checked, 904); assert.equal(diagrams.getLessonDiagram(addition.courseId, 'other-lesson'), null);
  const css = fs.readFileSync(path.join(root, 'styles/LearningMedia.module.css'), 'utf8').replaceAll('\r\n', '\n');
  const priorCss = execFileSync('git', ['show', `${baseline}:styles/LearningMedia.module.css`], { cwd: root, encoding: 'utf8' }).replaceAll('\r\n', '\n');
  assert.equal(css, priorCss + '.lessonDiagram.comparison .steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n@media (max-width: 600px) { .lessonDiagram.comparison .steps { grid-template-columns: minmax(0, 1fr); } }\n');
});

test('Real course/print readers present full new teaching and card answers before the final source area, with the precise lesson date', () => {
  let cursor = 0;
  const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? course.lessons.length - 1 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
  const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${addition.courseId}#lesson-${addition.lessonId}` }) },
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
    '../hooks/useCourseProgress': { __esModule: true, default: () => ({}) }, './CourseProgressNotice': { __esModule: true, default: () => null } })('components/LearningCourse.js').default;
  const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: tools.getFlashcardLessonSummary(addition.courseId) })), boundary = html.indexOf('<details id="quellen"');
  assert.ok(boundary > 0); assert.ok(!html.slice(boundary).split('>')[0].includes('open'));
  for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, boundary).includes(paragraph));
  for (const step of lesson.diagram.steps) assert.ok(html.slice(0, boundary).includes(step.title) && html.slice(0, boundary).includes(step.text));
  for (const url of addition.urls) assert.ok(!html.slice(0, boundary).includes(url) && html.slice(boundary).includes(url));
  assert.match(html.slice(boundary), /25\. November 2026/);
  const deck = tools.getFlashcardExport({ courseId: addition.courseId, lessonId: addition.lessonId, invalid: false });
  const Print = createLoader({ 'next/router': { useRouter: () => ({ isReady: true, query: {} }) },
    '../../components/useFlashcardDeck': { __esModule: true, default: () => ({ ...deck, incomplete: false }) },
    '../../components/LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    '../../components/PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} } })('pages/lernen/lernkarten-drucken.js').default;
  const print = renderToStaticMarkup(React.createElement(Print)), appendix = print.indexOf('id="lernkarten-quellen"'); assert.ok(appendix > 0);
  for (const card of addedCards) assert.ok(print.indexOf(card.answer) < appendix && print.indexOf(card.explanation) < appendix);
  assert.match(print, /Stand der Ausgangslektion: 25\.11\.2026/); assert.ok(addition.urls.every(url => print.slice(appendix).includes(url)));
});

test('A synthetic offline pack retains the complete comparison and dates without a schema change, and its actual reader renders both full text columns', () => {
  process.env.JL_SESSION_SECRET = 'isolated-red-deer-flehmen-offline-fixture';
  const now = Date.parse('2026-11-25T12:00:00Z');
  const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [addition.courseId], sounds: false }, { email: 'flehmen-fixture@example.invalid', paidUntil: '2026-11-27T12:00:00Z' }, now);
  assert.equal(load('lib/offline-learning.js').validateOfflinePack(pack, now), true);
  const saved = pack.courses[0].lessons.find(item => item.id === addition.lessonId);
  assert.deepEqual(saved, lesson); assert.equal(pack.courses[0].reviewedOn, '2026-10-04'); assert.equal(saved.reviewedOn, addition.date);
  const filename = path.join(root, 'components/OfflineLearning.js'), source = fs.readFileSync(filename, 'utf8') + '\nexport { OfflineCourse };';
  const code = local('next/dist/build/swc').transformSync(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } }).code;
  let cursor = 0;
  const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? course.lessons.length - 1 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
  const childLoad = createLoader({ react: hooks }), module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => id === 'react' ? hooks : id.endsWith('.module.css') ? { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) } : id.startsWith('.') ? childLoad(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
  const html = renderToStaticMarkup(React.createElement(module.exports.OfflineCourse, { course: pack.courses[0], expiresAt: pack.expiresAt, onExpired() {} }));
  for (const paragraph of lesson.paragraphs) assert.ok(html.includes(paragraph));
  for (const step of lesson.diagram.steps) assert.ok(html.includes(step.title) && html.includes(step.text));
  assert.match(html, /<ul class="steps"/); assert.ok(html.indexOf(lesson.diagram.title) < html.indexOf('Quellen und Prüfstand'));
  assert.ok(addition.urls.every(url => html.includes(url)));
});

test('The strict named appendix helper rejects unrelated additions, source/date/evidence drift and old-field modifications remain detectable', () => {
  for (const mutate of [
    item => item.lessons.push({ id: 'unapproved-extra' }),
    item => { item.lessons.at(-1).reviewedOn = '2026-10-04'; },
    item => item.questions.push({ id: 'unrelated', lessonId: 'other' }),
    item => { item.sources.at(-1).url = 'https://example.invalid/'; },
    item => { item.sources.at(-1).lessonIds = ['rot-brunft']; },
    item => { item.lessons.at(-1).evidence[0].sources = item.sources.slice(-3); },
  ]) { const changed = structuredClone(course); mutate(changed); assert.throws(() => stripRedDeerFlehmenCourse(changed)); }
  const changed = structuredClone(course); changed.lessons[0].paragraphs[0] += ' unapproved';
  assert.notDeepEqual(stripRedDeerFlehmenCourse(changed), before.getLearningModule(addition.courseId));
  const changedCard = structuredClone(cards); changedCard.find(card => card.id === newCardIds[0]).reviewedOn = '2026-10-04';
  assert.throws(() => stripRedDeerFlehmenCards(changedCard));
});
