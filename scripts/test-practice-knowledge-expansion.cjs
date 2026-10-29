// Compact current-package checks. The full historical 198-course/1751-card
// content/field-order comparison is in test-roe-antler-casting-learning.cjs.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const roe = require('./helpers/roe-antler-casting-addition-oct29.cjs');
const relations = require('./helpers/species-relations-addition-oct29.cjs');
const swc = local('next/dist/build/swc');
function historicalProjectionLoader() {
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative), gitPath = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(gitPath && !gitPath.startsWith('../') && !path.isAbsolute(gitPath));
    assert.notEqual(gitPath, 'lib/learning-curriculum.js', 'the complete old dataset is positively compared by the roe suite');
    if (cache.has(gitPath)) return cache.get(gitPath).exports;
    const source = execFileSync('git', ['show', `49b462f:${gitPath}`], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
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
const isNewCard = card => roe.isRoeAntlerCastingCard(card) || relations.isSpeciesRelationsCard(card);
const selections = [roe, relations].map(item => ({ courseId: item.courseId, lessonId: item.lessonId, questionIds: item.questionIds }));
function nodes(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => nodes(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
}

test('The current package contains198courses/873lessons/2747questions/1755cards and exactly four new own question/card pairs', () => {
  assert.deepEqual(curriculum.learningCounts, { modules: 198, lessons: 873, questions: 2747 });
  assert.equal(cards.length, 1755);
  const stripped = modules.map(roe.stripRoeAntlerCastingAddition).map(relations.stripSpeciesRelationsAddition);
  assert.deepEqual({ modules: stripped.length, lessons: stripped.reduce((n, module) => n + module.lessons.length, 0), questions: stripped.reduce((n, module) => n + module.questions.length, 0) }, { modules: 198, lessons: 871, questions: 2743 });
  assert.equal(cards.filter(card => !isNewCard(card)).length, 1751);
  assert.ok(cards.slice(0, 116).every(card => !isNewCard(card)));
  const expectedIds = selections.flatMap(({ courseId, questionIds }) => questionIds.map(id => `${courseId}-${id}`));
  const questions = curriculum.learningQuestions.filter(question => expectedIds.includes(question.id));
  assert.equal(questions.length, 4); assert.equal(new Set(questions.map(question => question.q)).size, 4);
  assert.deepEqual(new Set(cards.filter(isNewCard).map(card => card.id)), new Set(expectedIds.map(id => `flash-${id}`)));
  for (const card of cards.filter(isNewCard)) {
    const question = questions.find(item => card.id === `flash-${item.id}`);
    assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(answer => question.correct.includes(answer.id)).text);
    assert.equal(card.reviewedOn, '2026-10-29'); assert.equal(card.sourceScope, 'lesson');
    assert.equal(card.courseHref, `/kurse/${card.moduleId}#lesson-${encodeURIComponent(card.lessonId)}`);
  }
});

test('Every field and target of all114 guides equals actual49b462f, except the existing Rehwild course card count0→2', () => {
  const inventory = load('lib/european-wildlife-discovery.js').europeanWildlife;
  assert.equal(inventory.length, 114);
  assert.equal(JSON.stringify(inventory), JSON.stringify(historical('lib/european-wildlife-discovery.js').europeanWildlife));
  const before = historical('lib/wildlife-learning-guide.js'), after = load('lib/wildlife-learning-guide.js');
  assert.equal(JSON.stringify(after.wildlifeGuideTargets), JSON.stringify(before.wildlifeGuideTargets));
  let changed = 0;
  for (const { slug } of inventory) {
    const expected = before.getWildlifeLearningGuide(slug).map(target => {
      if (target.moduleId !== roe.courseId) return target;
      assert.equal(slug, 'rehwild'); assert.equal(target.scope, 'species'); assert.equal(target.flashcardCount, 0); changed++;
      return { ...target, flashcardCount: 2 };
    });
    assert.equal(JSON.stringify(after.getWildlifeLearningGuide(slug)), JSON.stringify(expected), slug);
  }
  assert.equal(changed, 1); assert.equal(after.getWildlifeLearningGuide('rehwild').length, 4);
  assert.equal(load('lib/learning-flashcards.js').getFlashcardLessonSummary(roe.courseId).total, 2);
});

test('The same categories and198 real course routes expose both exact new lesson anchors and their eligible country quiz pools', () => {
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
    assert.equal(load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId).categorySlug, 'wildkunde');
    for (const country of ['DE', 'AT', 'CH']) for (const question of module.questions.filter(item => item.lessonId === lessonId)) {
      assert.ok(quizLearningPool(bank, { country, topic: module.topic }).some(item => item.id === question.id));
    }
  }
});

test('Exactly20 authored practice reading links on2courses coexist once with20 oral and17 glossary links in real SSG and mixed owners', () => {
  const cases = load('lib/game-meat-cases.js').gameMeatCases, exercises = load('lib/dog-training-journal.js').dogTrainingExercises;
  const oral = load('lib/oral-exam-trainer.js').oralExamQuestions;
  for (const [file, key] of [['lib/game-meat-cases.js', 'gameMeatCases'], ['lib/dog-training-journal.js', 'dogTrainingExercises'], ['lib/oral-exam-trainer.js', 'oralExamQuestions']]) {
    assert.equal(JSON.stringify(load(file)[key]), JSON.stringify(historical(file)[key]));
  }
  assert.equal(cases.length, 10); assert.equal(exercises.length, 10); assert.equal(oral.length, 20);
  const inventory = [...cases.map(item => ({ ...item, linkId: `wildbret-${item.id}`, route: '/lernen/wildbret-fallwerkstatt' })),
    ...exercises.map(item => ({ ...item, linkId: `training-${item.id}`, route: '/lernen/hundetraining-tagebuch' }))];
  const adapters = [['wildlifeLinks', 'lib/course-wildlife-links-server.js', 'getCourseWildlifeLinks'], ['miniCourseLinks', 'lib/course-mini-links-server.js', 'getCourseMiniLinks'],
    ['glossaryLinks', 'lib/glossary-course-links-server.js', 'getCourseGlossaryLinks'], ['oralExamLinks', 'lib/course-oral-exam-links-server.js', 'getCourseOralExamLinks'],
    ['practiceLinks', 'lib/course-practice-links-server.js', 'getCoursePracticeLinks']];
  const page = load('pages/kurse/[slug].js'); let practiceTotal = 0, oralTotal = 0, glossaryTotal = 0, practiceCourses = 0;
  const React = local('react'); let cursor = 0; function LowerMenu() { return null; }
  const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? 0 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
  const Owner = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: true, asPath: '/kurse/test' }) },
    '../hooks/useCourseProgress': () => ({}), './PageMenu': { __esModule: true, default: LowerMenu, closePageMenu() {} },
  })('components/LearningCourse.js').default;
  for (const module of modules) {
    const { props } = page.getStaticProps({ params: { slug: module.id } });
    const expectedPractice = inventory.filter(item => item.course === module.id).map(item => ({ id: item.linkId, title: item.title, href: `${item.route}?eintrag=${encodeURIComponent(item.id)}` }));
    assert.deepEqual(props.practiceLinks, expectedPractice);
    assert.deepEqual(props.oralExamLinks, oral.filter(item => item.course === module.id).map(item => ({ id: item.id, title: item.title, href: `/lernen/pruefungsgespraech?eintrag=${encodeURIComponent(item.id)}` })));
    practiceTotal += props.practiceLinks.length; oralTotal += props.oralExamLinks.length; glossaryTotal += props.glossaryLinks.length;
    practiceCourses += props.practiceLinks.length > 0 ? 1 : 0;
    const forwarded = page.default(props).props;
    for (const [key, file, method] of adapters) { assert.deepEqual(props[key], load(file)[method](module)); assert.equal(forwarded[key], props[key]); }
    if (!props.practiceLinks.length && !props.oralExamLinks.length && !props.glossaryLinks.length) continue;
    cursor = 0; const owner = Owner(props), tree = owner.type(owner.props), menus = nodes(tree, node => node.type === LowerMenu);
    for (const [name, key] of [['CoursePracticeLinks', 'practiceLinks'], ['CourseOralExamLinks', 'oralExamLinks'], ['CourseGlossaryLinks', 'glossaryLinks']]) {
      const components = nodes(tree, node => node.type?.name === name);
      assert.equal(components.length, 1); assert.equal(components[0].props.links, props[key]);
      assert.equal(menus.flatMap(menu => nodes(menu.props.children, node => node.type?.name === name)).length, 1);
    }
  }
  assert.equal(practiceTotal, 20); assert.equal(practiceCourses, 2); assert.equal(oralTotal, 20); assert.equal(glossaryTotal, 17);
  const glossaryFile = 'lib/glossary-course-links-server.js';
  assert.equal(fs.readFileSync(path.join(root, glossaryFile), 'utf8').replaceAll('\r\n', '\n'), execFileSync('git', ['show', `49b462f:${glossaryFile}`], { cwd: root, encoding: 'utf8' }).replaceAll('\r\n', '\n'));
});

test('Actual access middleware protects both appended lesson routes and every projected practice/oral/glossary destination', async () => {
  const { NextRequest } = local('next/server');
  const { middleware } = createLoader({ './lib/account-session-edge': { JL_ACCOUNT_COOKIE: 'jl_account_session', readAccountSessionEdge: async () => null } })('middleware.js');
  const page = load('pages/kurse/[slug].js');
  const hrefs = [...selections.map(({ courseId, lessonId }) => `/kurse/${courseId}#lesson-${encodeURIComponent(lessonId)}`),
    ...modules.flatMap(module => { const { props } = page.getStaticProps({ params: { slug: module.id } }); return [...props.practiceLinks, ...props.oralExamLinks, ...props.glossaryLinks].map(link => link.href); })];
  assert.equal(hrefs.length, 59);
  for (const href of hrefs) {
    const request = new NextRequest(`https://jagdlatein.test${href}`), response = await middleware(request);
    assert.equal(response.status, 307);
    const destination = new URL(response.headers.get('location'));
    assert.equal(destination.pathname, '/preise'); assert.equal(destination.searchParams.get('next'), `${request.nextUrl.pathname}${request.nextUrl.search}`);
    assert.notEqual(response.headers.get('x-middleware-next'), '1');
  }
});
