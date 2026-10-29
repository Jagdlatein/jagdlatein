// Current package checks. The complete historical 198-course/1747-card object
// preservation comparison is carried by test-avian-urinary-learning.cjs.
// This file reads only small historical guide/category/oral projections.
const test = require('node:test'), assert = require('node:assert/strict');
const path = require('node:path'), { execFileSync } = require('node:child_process');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const urinary = require('./helpers/avian-urinary-addition-oct29.cjs');
const mast = require('./helpers/seed-mast-addition-oct29.cjs');
const swc = local('next/dist/build/swc');
function historicalProjectionLoader() {
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative), gitPath = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(gitPath && !gitPath.startsWith('../') && !path.isAbsolute(gitPath));
    assert.notEqual(gitPath, 'lib/learning-curriculum.js', 'the full old dataset is already positively compared by the urinary suite');
    if (cache.has(gitPath)) return cache.get(gitPath).exports;
    const source = execFileSync('git', ['show', `25807fe:${gitPath}`], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
    const mod = { exports: {} }; cache.set(gitPath, mod);
    if (gitPath.endsWith('.json')) { mod.exports = JSON.parse(source.replace(/^\uFEFF/, '')); return mod.exports; }
    const { code } = swc.transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? load(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), mod, mod.exports);
    return mod.exports;
  }
  return load;
}
const load = createLoader(), historical = historicalProjectionLoader();
const curriculum = load('lib/learning-curriculum.js'), modules = curriculum.learningModules;
const cards = load('lib/learning-flashcards.js').getFlashcards();
const isNewCard = card => urinary.isAvianUrinaryCard(card) || mast.isSeedMastCard(card);
const selections = [urinary, mast].map(item => ({ courseId: item.courseId, lessonId: item.lessonId, questionIds: item.questionIds }));
function nodes(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => nodes(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
}

test('The linked package has exactly two appended lessons and four new question/card pairs, preserving the historical counts and starter membership', () => {
  assert.deepEqual(curriculum.learningCounts, { modules: 198, lessons: 871, questions: 2743 });
  assert.equal(cards.length, 1751);
  const stripped = modules.map(urinary.stripAvianUrinaryAddition).map(mast.stripSeedMastAddition);
  assert.deepEqual({ modules: stripped.length, lessons: stripped.reduce((n, module) => n + module.lessons.length, 0), questions: stripped.reduce((n, module) => n + module.questions.length, 0) }, { modules: 198, lessons: 869, questions: 2739 });
  assert.equal(cards.filter(card => !isNewCard(card)).length, 1747);
  assert.ok(cards.slice(0, 116).every(card => !isNewCard(card)));
  const expectedIds = selections.flatMap(({ courseId, questionIds }) => questionIds.map(id => `${courseId}-${id}`));
  const questions = curriculum.learningQuestions.filter(question => expectedIds.includes(question.id));
  assert.equal(questions.length, 4); assert.equal(new Set(questions.map(question => question.q)).size, 4);
  assert.deepEqual(new Set(cards.filter(isNewCard).map(card => card.id)), new Set(expectedIds.map(id => `flash-${id}`)));
  for (const card of cards.filter(isNewCard)) {
    const question = questions.find(item => card.id === `flash-${item.id}`);
    assert.equal(card.reviewedOn, '2026-10-29'); assert.equal(card.sourceScope, 'lesson');
    assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(answer => question.correct.includes(answer.id)).text);
    assert.equal(card.courseHref, `/kurse/${card.moduleId}#lesson-${encodeURIComponent(card.lessonId)}`);
  }
});

test('All114 guide records retain exact fields and targets against HEAD25807fe, with only birdBody34→36', () => {
  const inventory = load('lib/european-wildlife-discovery.js').europeanWildlife;
  assert.equal(inventory.length, 114);
  assert.equal(JSON.stringify(inventory), JSON.stringify(historical('lib/european-wildlife-discovery.js').europeanWildlife));
  const before = historical('lib/wildlife-learning-guide.js'), after = load('lib/wildlife-learning-guide.js');
  assert.equal(JSON.stringify(after.wildlifeGuideTargets), JSON.stringify(before.wildlifeGuideTargets));
  let changes = 0;
  for (const { slug } of inventory) {
    const expected = before.getWildlifeLearningGuide(slug).map(target => {
      if (target.moduleId !== urinary.courseId) return target;
      assert.equal(target.scope, 'foundation'); assert.equal(target.flashcardCount, 34); changes++;
      return { ...target, flashcardCount: 36 };
    });
    assert.equal(JSON.stringify(after.getWildlifeLearningGuide(slug)), JSON.stringify(expected), slug);
  }
  assert.ok(changes > 0);
  assert.equal(load('lib/learning-flashcards.js').getFlashcardLessonSummary(urinary.courseId).total, 36);
});

test('The same categories and198 real course routes deliver both exact lesson targets and country quiz eligibility', () => {
  const categories = load('lib/learning-categories.js'), oldCategories = historical('lib/learning-categories.js');
  assert.equal(JSON.stringify(categories.learningCategories), JSON.stringify(oldCategories.learningCategories));
  assert.equal(JSON.stringify(categories.learningCategoryDetails), JSON.stringify(oldCategories.learningCategoryDetails));
  const page = load('pages/kurse/[slug].js');
  assert.deepEqual(page.getStaticPaths(), { paths: modules.map(module => ({ params: { slug: module.id } })), fallback: false });
  const bank = load('data/questions-full.js').QUESTIONS, { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const { courseId, lessonId } of selections) {
    const module = curriculum.getLearningModule(courseId), { props } = page.getStaticProps({ params: { slug: courseId } });
    assert.equal(props.module, module); assert.equal(props.flashcards.lessons[lessonId], 2);
    assert.ok(module.lessons.some(lesson => lesson.id === lessonId));
    for (const country of ['DE', 'AT', 'CH']) for (const question of module.questions.filter(item => item.lessonId === lessonId)) {
      assert.ok(quizLearningPool(bank, { country, topic: module.topic }).some(item => item.id === question.id));
    }
  }
});

test('All20 unchanged oral questions gain exactly20 reciprocal SSG rows; mixed wildlife/mini/glossary owners contribute each only once', () => {
  const questions = load('lib/oral-exam-trainer.js').oralExamQuestions;
  assert.equal(questions.length, 20);
  assert.equal(JSON.stringify(questions), JSON.stringify(historical('lib/oral-exam-trainer.js').oralExamQuestions));
  const project = load('lib/course-oral-exam-links-server.js').getCourseOralExamLinks;
  const page = load('pages/kurse/[slug].js'); let total = 0;
  const React = local('react'); let cursor = 0;
  function LowerMenu() { return null; }
  const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? 0 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
  const Owner = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: '/kurse/test' }) },
    '../hooks/useCourseProgress': () => ({}), './PageMenu': { __esModule: true, default: LowerMenu, closePageMenu() {} },
  })('components/LearningCourse.js').default;
  for (const module of modules) {
    const { props } = page.getStaticProps({ params: { slug: module.id } });
    const expected = questions.filter(question => question.course === module.id).map(question => ({ id: question.id, title: question.title, href: `/lernen/pruefungsgespraech?eintrag=${encodeURIComponent(question.id)}` }));
    assert.deepEqual(props.oralExamLinks, expected); assert.deepEqual(project(module), expected); total += expected.length;
    assert.equal(new Set(props.oralExamLinks.map(link => link.href)).size, expected.length);
    if (!expected.length) continue;
    cursor = 0;
    const owner = Owner(props), tree = owner.type(owner.props);
    const contributors = nodes(tree, node => node.type?.name === 'CourseOralExamLinks');
    assert.equal(contributors.length, 1); assert.equal(contributors[0].props.links, props.oralExamLinks);
    const menus = nodes(tree, node => node.type === LowerMenu);
    assert.equal(menus.flatMap(menu => nodes(menu.props.children, node => node.type?.name === 'CourseOralExamLinks')).length, 1);
    // The ordinary page forwarder receives all existing projections together.
    const forwarded = page.default(props).props;
    for (const key of ['wildlifeLinks', 'miniCourseLinks', 'glossaryLinks', 'oralExamLinks']) assert.equal(forwarded[key], props[key]);
  }
  assert.equal(total, 20);
});

test('Actual access middleware continues protecting both appended lesson routes and all20 reciprocal conversation destinations', async () => {
  const { NextRequest } = local('next/server');
  const { middleware } = createLoader({ './lib/account-session-edge': { JL_ACCOUNT_COOKIE: 'jl_account_session', readAccountSessionEdge: async () => null } })('middleware.js');
  const questions = load('lib/oral-exam-trainer.js').oralExamQuestions;
  const hrefs = [...selections.map(({ courseId, lessonId }) => `/kurse/${courseId}#lesson-${encodeURIComponent(lessonId)}`),
    ...questions.map(question => `/lernen/pruefungsgespraech?eintrag=${encodeURIComponent(question.id)}`)];
  for (const href of hrefs) {
    const request = new NextRequest(`https://jagdlatein.test${href}`), response = await middleware(request);
    assert.equal(response.status, 307);
    const target = new URL(response.headers.get('location'));
    assert.equal(target.pathname, '/preise'); assert.equal(target.searchParams.get('next'), `${request.nextUrl.pathname}${request.nextUrl.search}`);
    assert.notEqual(response.headers.get('x-middleware-next'), '1');
  }
});
