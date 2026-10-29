const { linkedExamBaselineFixture } = require('./helpers/linked-exam-additions-oct29.cjs');
// Current package integration and preservation, not a scientific re-review of
// every course or species. The baseline reads actual repository files from Git.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createLoader: createLinkedProjectLoader, root, local } = require('./helpers/project-module.cjs');
const createLoader = overrides => createLinkedProjectLoader(linkedExamBaselineFixture(overrides));
const { additions, stripSensesAddition, isSensesCard } = require('./helpers/senses-learning-additions-oct29.cjs');
const { courseId: dogCourseId, lessonIds: dogLessonIds, stripDogLearningProcessesAddition, isDogLearningProcessesCard } = require('./helpers/dog-learning-processes-additions-oct29.cjs');
const { examKnowledgeBaselineFixture } = require('./helpers/exam-knowledge-additions-oct29.cjs');
const revision = '96eb237a9b9ccf2289f7a135c9b8886f18ff4f9e';
const swc = local('next/dist/build/swc');

function createHistoricalLoader() {
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative);
    const gitPath = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(gitPath && !gitPath.startsWith('../') && !path.isAbsolute(gitPath));
    if (cache.has(gitPath)) return cache.get(gitPath).exports;
    const source = execFileSync('git', ['show', `${revision}:${gitPath}`], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
    const module = { exports: {} }; cache.set(gitPath, module);
    if (gitPath.endsWith('.json')) {
      module.exports = JSON.parse(source.replace(/^\uFEFF/, ''));
      return module.exports;
    }
    const { code } = swc.transformSync(source, { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } },
      module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => {
      if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`));
      return local(id);
    }, module, module.exports);
    return module.exports;
  }
  return load;
}

const current = createLoader(), historical = createHistoricalLoader();
const live = current('lib/learning-curriculum.js'), old = historical('lib/learning-curriculum.js');
const liveCards = current('lib/learning-flashcards.js').getFlashcards();
const oldCards = historical('lib/learning-flashcards.js').getFlashcards();
const stripPackage = module => stripDogLearningProcessesAddition(stripSensesAddition(module));
const isNewCard = card => isSensesCard(card) || isDogLearningProcessesCard(card);
const lessonSelections = [...additions.map(({ courseId, lessonId }) => ({ courseId, lessonId })),
  ...dogLessonIds.map(lessonId => ({ courseId: dogCourseId, lessonId }))];
const newLesson = (courseId, lessonId) => lessonSelections.some(item => item.courseId === courseId && item.lessonId === lessonId);

test('The actual 198-course package has four new lessons and eight questions; every previous full object and field order equals HEAD 96eb237', () => {
  assert.deepEqual(old.learningCounts, { modules: 198, lessons: 865, questions: 2731 });
  assert.deepEqual(live.learningCounts, { modules: 198, lessons: 869, questions: 2739 });
  assert.equal(JSON.stringify(live.learningModules.map(stripPackage)), JSON.stringify(old.learningModules));
  assert.equal(JSON.stringify(createLoader(examKnowledgeBaselineFixture())('lib/learning-curriculum.js').learningModules), JSON.stringify(old.learningModules));
  for (const { courseId, lessonId } of lessonSelections) {
    const module = live.getLearningModule(courseId), lesson = module.lessons.find(item => item.id === lessonId);
    assert.ok(lesson); assert.equal(lesson.reviewedOn, '2026-10-29');
    assert.equal(module.questions.filter(question => question.lessonId === lessonId).length, 2);
  }
});

test('All 1739 historical card objects retain exact field/content/order and all 116 starters; exactly eight new questions make eight new cards', () => {
  assert.equal(oldCards.length, 1739); assert.equal(liveCards.length, 1747);
  assert.equal(JSON.stringify(liveCards.filter(card => !isNewCard(card))), JSON.stringify(oldCards));
  assert.equal(JSON.stringify(liveCards.slice(0, 116)), JSON.stringify(oldCards.slice(0, 116)));
  const oldIds = new Set(old.learningQuestions.map(question => question.id));
  const questions = live.learningQuestions.filter(question => !oldIds.has(question.id));
  const newCards = liveCards.filter(isNewCard);
  assert.equal(questions.length, 8); assert.equal(newCards.length, 8);
  assert.equal(new Set(questions.map(question => question.q)).size, 8);
  assert.equal(new Set(newCards.map(card => card.id)).size, 8);
  assert.deepEqual(new Set(newCards.map(card => card.id)), new Set(questions.map(question => `flash-${question.id}`)));
  for (const card of newCards) {
    assert.ok(newLesson(card.moduleId, card.lessonId));
    const question = questions.find(item => card.id === `flash-${item.id}`);
    assert.equal(card.question, question.q);
    assert.equal(card.answer, question.answers.find(answer => question.correct.includes(answer.id)).text);
    assert.equal(card.explanation, question.explain);
    assert.equal(card.reviewedOn, '2026-10-29'); assert.equal(card.sourceScope, 'lesson');
    assert.equal(card.courseHref, `/kurse/${card.moduleId}#lesson-${encodeURIComponent(card.lessonId)}`);
    assert.deepEqual(question.countries, ['DE', 'AT', 'CH']);
  }
});

test('All 114 portrait guide projections retain every target and field; only the existing bird foundation card count rises from 32 to 34', () => {
  const oldInventory = historical('lib/european-wildlife-discovery.js').europeanWildlife;
  const inventory = current('lib/european-wildlife-discovery.js').europeanWildlife;
  const before = historical('lib/wildlife-learning-guide.js'), after = current('lib/wildlife-learning-guide.js');
  assert.equal(inventory.length, 114); assert.equal(JSON.stringify(inventory), JSON.stringify(oldInventory));
  assert.equal(JSON.stringify(after.wildlifeGuideTargets), JSON.stringify(before.wildlifeGuideTargets));
  let changed = 0;
  for (const { slug } of inventory) {
    const previous = before.getWildlifeLearningGuide(slug);
    const expected = previous.map(target => {
      if (target.moduleId !== 'wissen-ausbau-biologie-vogelkoerper-2026') return target;
      assert.equal(target.scope, 'foundation'); assert.equal(target.flashcardCount, 32); changed++;
      return { ...target, flashcardCount: 34 };
    });
    const projected = after.getWildlifeLearningGuide(slug).map(target => {
      if (target.moduleId !== 'wissen-ausbau-biologie-vogelkoerper-2026') return target;
      assert.equal(target.flashcardCount, 36);
      return { ...target, flashcardCount: target.flashcardCount - 2 };
    });
    assert.equal(JSON.stringify(projected), JSON.stringify(expected), slug);
  }
  assert.ok(changed > 0);
  assert.equal(current('lib/learning-flashcards.js').getFlashcardLessonSummary('wissen-ausbau-biologie-vogelkoerper-2026').total, 34);
});

test('Production loaders expose the additions through the same categories, course routes and three country quiz pools', () => {
  const categoryModule = 'lib/learning-categories.js';
  for (const key of ['learningCategories', 'learningCategoryDetails']) {
    assert.equal(JSON.stringify(current(categoryModule)[key]), JSON.stringify(historical(categoryModule)[key]));
  }
  const page = current('pages/kurse/[slug].js');
  assert.equal(JSON.stringify(page.getStaticPaths()), JSON.stringify(historical('pages/kurse/[slug].js').getStaticPaths()));
  assert.equal(page.getStaticPaths().paths.length, 198);
  const bank = current('data/questions-full.js').QUESTIONS, { quizLearningPool } = current('lib/quiz-learning-scope.js');
  for (const { courseId, lessonId } of lessonSelections) {
    const module = live.getLearningModule(courseId);
    const props = page.getStaticProps({ params: { slug: courseId } }).props;
    assert.equal(props.module, module); assert.equal(props.flashcards.lessons[lessonId], 2);
    for (const country of ['DE', 'AT', 'CH']) {
      const ids = new Set(quizLearningPool(bank, { country, topic: module.topic }).map(question => question.id));
      for (const question of module.questions.filter(item => item.lessonId === lessonId)) assert.ok(ids.has(question.id));
    }
  }
});

test('The actual middleware still denies unsigned access to all three extended course routes and retains the intended return path', async () => {
  const { NextRequest } = local('next/server');
  const { middleware } = createLoader({ './lib/account-session-edge': {
    JL_ACCOUNT_COOKIE: 'jl_account_session', readAccountSessionEdge: async () => null,
  } })('middleware.js');
  for (const courseId of new Set(lessonSelections.map(item => item.courseId))) {
    const route = `/kurse/${courseId}?integration=oct29`;
    const response = await middleware(new NextRequest(`https://jagdlatein.test${route}`));
    assert.equal(response.status, 307);
    const target = new URL(response.headers.get('location'));
    assert.equal(target.pathname, '/preise'); assert.equal(target.searchParams.get('next'), route);
    assert.notEqual(response.headers.get('x-middleware-next'), '1');
  }
});
