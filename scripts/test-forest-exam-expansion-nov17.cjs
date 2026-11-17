// Existing-course additions: positive preservation plus real course/quiz/card/search exports.
// Passing checks do not replace the documented original-source and peer reading.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { cases, stripForestExamCourse, stripForestExamDataset, forestExamBaselineFixture } = require('./helpers/forest-exam-additions-nov17.cjs');
const baseline = 'b9ed55f832c73b5cb7805759ed0b0809267e7e20';
const load = createLoader(), curriculum = load('lib/learning-curriculum.js'), flashcards = load('lib/learning-flashcards.js');
const cards = flashcards.getFlashcards();
function old(relative) {
  const source = execFileSync('git', ['show', `${baseline}:${relative}`], { cwd: root, encoding: 'utf8', maxBuffer: 20000000 });
  if (relative.endsWith('.json')) return JSON.parse(source);
  const module = { exports: {} }, { code } = local('next/dist/build/swc').transformSync(source, { filename: path.join(root, relative), jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  new Function('require', 'module', 'exports', code)(local, module, module.exports); return module.exports;
}
const oldNature = old('lib/learning-expansion-nature.js'), oldHabitat = old('data/learning-expansion-habitat-depth-2026-10-17.json');
const beforeLoad = createLoader({ './learning-expansion-nature': oldNature, '../data/learning-expansion-habitat-depth-2026-10-17.json': oldHabitat });
const beforeCurriculum = beforeLoad('lib/learning-curriculum.js');
const fullIds = cases.flatMap(item => item.questionIds.map(id => `${item.courseId}-${id}`));

test('Only the exact two lesson/question/source appendices differ from the complete published nature and habitat source objects', () => {
  const rawNature = load('lib/learning-expansion-nature.js').natureExpansionModules;
  assert.deepEqual(rawNature.map(stripForestExamCourse), oldNature.natureExpansionModules);
  const rawHabitat = JSON.parse(fs.readFileSync(path.join(root, 'data/learning-expansion-habitat-depth-2026-10-17.json'), 'utf8'));
  assert.deepEqual(stripForestExamDataset(rawHabitat), oldHabitat);
  assert.equal(rawHabitat.reviewedOn, '2026-10-17');
  const before = beforeCurriculum.learningModules;
  assert.deepEqual(curriculum.learningModules.map(stripForestExamCourse), before);
  assert.deepEqual(createLoader(forestExamBaselineFixture())('lib/learning-curriculum.js').learningModules, before);
  assert.equal(curriculum.learningCounts.modules, beforeCurriculum.learningCounts.modules);
  assert.equal(curriculum.learningCounts.lessons, beforeCurriculum.learningCounts.lessons + 2);
  assert.equal(curriculum.learningCounts.questions, beforeCurriculum.learningCounts.questions + 4);
});

test('All old cards including the116 starter objects retain exact content and relative order; four actual new cards have precise source and date scope', () => {
  const beforeCards = beforeLoad('lib/learning-flashcards.js').getFlashcards();
  const newCards = cards.filter(card => fullIds.some(id => card.id === `flash-${id}`));
  assert.equal(newCards.length, 4); assert.equal(cards.length, beforeCards.length + 4);
  assert.deepEqual(cards.filter(card => !newCards.includes(card)), beforeCards);
  assert.deepEqual(cards.slice(0, 116), beforeCards.slice(0, 116));
  for (const item of cases) {
    const course = curriculum.getLearningModule(item.courseId), lesson = course.lessons.at(-1);
    assert.equal(lesson.id, item.lessonId); assert.equal(lesson.reviewedOn, '2026-11-17'); assert.equal(lesson.flashcardExpansion, true);
    assert.equal(course.reviewedOn, beforeCurriculum.getLearningModule(item.courseId).reviewedOn);
    for (const questionId of item.questionIds) {
      const question = course.questions.find(question => question.id === `${item.courseId}-${questionId}`), card = newCards.find(card => card.id === `flash-${question.id}`);
      assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(answer => question.correct.includes(answer.id)).text); assert.equal(card.explanation, question.explain);
      assert.equal(card.reviewedOn, '2026-11-17'); assert.equal(card.sourceScope, 'lesson'); assert.equal(card.courseHref, `/kurse/${item.courseId}#lesson-${item.lessonId}`);
      assert.deepEqual(card.sources.map(source => source.url), item.urls);
    }
  }
});

test('New questions keep four unique choices and enter each DACH quiz pool exactly once with the existing subject', () => {
  const all = load('data/questions-full.js').QUESTIONS, { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const item of cases) for (const id of item.questionIds) {
    const course = curriculum.getLearningModule(item.courseId), question = course.questions.find(question => question.id === `${item.courseId}-${id}`);
    assert.equal(question.answers.length, 4); assert.equal(new Set(question.answers.map(answer => answer.text)).size, 4); assert.equal(question.correct.length, 1);
    assert.equal(curriculum.learningQuestions.filter(candidate => candidate.q === question.q).length, 1);
    assert.ok(question.answers.some(answer => question.correct.includes(answer.id))); assert.ok(question.explain.length > 100);
    assert.equal(question.lessonId, item.lessonId); assert.deepEqual(question.countries, ['DE','AT','CH']);
    for (const country of ['DE','AT','CH']) assert.equal(quizLearningPool(all, { country, topic: course.topic }).filter(candidate => candidate.id === question.id).length, 1);
  }
});

test('Both original course categories, direct readers and shared search lead to the new lessons without leaking answer keys', () => {
  const coursePage = load('pages/kurse/[slug].js'), search = load('lib/learning-search.js');
  const locations = load('lib/learning-topic-tree.js');
  cases.forEach((item, index) => {
    const course = curriculum.getLearningModule(item.courseId), props = coursePage.getStaticProps({ params: { slug: item.courseId } }).props;
    assert.deepEqual(props.module.lessons.at(-1), course.lessons.at(-1));
    assert.ok(locations.getLearningTopicLocation(item.courseId));
    const result = search.searchLearning({ query: index === 0 ? 'Hähersaat' : 'Buchdrucker Brutbild', type: 'course' }).results.find(result => result.id === `course:${item.courseId}`);
    assert.ok(result, item.courseId); assert.equal(result.href, `/kurse/${item.courseId}#lesson-${item.lessonId}`);
    assert.equal(Object.hasOwn(result, 'answer'), false); assert.equal(Object.hasOwn(result, 'correct'), false);
    const deck = flashcards.getFlashcardExport({ courseId: item.courseId, lessonId: item.lessonId, invalid: false }, { withChoices: true });
    assert.equal(deck.cards.length, 2); assert.ok(deck.cards.every(card => card.lessonId === item.lessonId && card.choices.length === 4));
  });
});

test('The full new explanation and important limits precede the closed final source appendix in both actual course renderers', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  for (const item of cases) {
    const course = curriculum.getLearningModule(item.courseId), lesson = course.lessons.at(-1); let cursor = 0;
    const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? course.lessons.length - 1 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
    const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: `/kurse/${item.courseId}#lesson-${item.lessonId}` }) },
      './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
      './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
      '../hooks/useCourseProgress': { __esModule: true, default: () => ({}) }, './CourseProgressNotice': { __esModule: true, default: () => null } })('components/LearningCourse.js').default;
    const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: flashcards.getFlashcardLessonSummary(item.courseId) }));
    const boundary = html.indexOf('<details id="quellen"'); assert.ok(boundary > 0);
    for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, boundary).includes(paragraph));
    assert.ok(item.urls.every(url => !html.slice(0, boundary).includes(url) && html.slice(boundary).includes(url)));
    assert.ok(!html.slice(boundary).split('>')[0].includes('open')); assert.match(html.slice(boundary), /17\. November 2026/);
  }
});

test('The exact-lesson card API keeps both new four-choice decks private and inherited lesson dates intact', async () => {
  const denied = createLoader({ '../../../../lib/account-access': { getSignedAccountAccess: async () => null } })('app/api/lernen/lernkarten/route.js');
  const allowed = createLoader({ '../../../../lib/account-access': { getSignedAccountAccess: async () => ({ paid: true }) } })('app/api/lernen/lernkarten/route.js');
  for (const item of cases) {
    const url = `https://jagdlatein.test/api/lernen/lernkarten?kurs=${item.courseId}&lektion=${item.lessonId}&choices=1`;
    const blocked = await denied.GET(new Request(url)); assert.equal(blocked.status, 401); assert.doesNotMatch(await blocked.text(), /Hähersaat|Buchdrucker/);
    const response = await allowed.GET(new Request(url)); assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.equal(response.headers.get('vary'), 'Cookie');
    const deck = load('lib/flashcard-payload.js').unpackFlashcards(await response.json());
    assert.equal(deck.cards.length, 2); assert.ok(deck.cards.every(card => card.reviewedOn === '2026-11-17' && card.lessonId === item.lessonId && card.choices.length === 4));
  }
});
