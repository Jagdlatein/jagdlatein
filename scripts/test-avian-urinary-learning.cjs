const { practiceKnowledgeBaselineFixture } = require('./helpers/practice-knowledge-additions-oct29.cjs');
// Narrow preservation/integration checks; not scientific certification.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createLoader: createPracticeProjectLoader, root, local } = require('./helpers/project-module.cjs');
const createLoader = overrides => createPracticeProjectLoader(practiceKnowledgeBaselineFixture(overrides));
const { courseId, lessonId, questionIds, sourceURLs, stripAvianUrinaryAddition,
  stripAvianUrinaryDataset, isAvianUrinaryCard, avianUrinaryBaselineFixture } = require('./helpers/avian-urinary-addition-oct29.cjs');
// The concurrently authorized mast appendix has its own exact positive tests.
const { stripSeedMastAddition, isSeedMastCard } = require('./helpers/seed-mast-addition-oct29.cjs');
const revision = '25807fe';
const swc = local('next/dist/build/swc');
function historicalLoader() {
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative), gitPath = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(gitPath && !gitPath.startsWith('../') && !path.isAbsolute(gitPath));
    if (cache.has(gitPath)) return cache.get(gitPath).exports;
    const source = execFileSync('git', ['show', `${revision}:${gitPath}`], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
    const mod = { exports: {} }; cache.set(gitPath, mod);
    if (gitPath.endsWith('.json')) { mod.exports = JSON.parse(source.replace(/^\uFEFF/, '')); return mod.exports; }
    const { code } = swc.transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.endsWith('.module.css') ? { __esModule: true, default: {} }
      : id.startsWith('.') ? load(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), mod, mod.exports);
    return mod.exports;
  }
  return load;
}
const load = createLoader(), oldLoad = historicalLoader();
const curriculum = load('lib/learning-curriculum.js'), previous = oldLoad('lib/learning-curriculum.js');
const raw = require('../data/learning-expansion-biology-2026-10-16.json');
const course = curriculum.getLearningModule(courseId), lesson = course.lessons.at(-1);
const cards = load('lib/learning-flashcards.js').getFlashcards(), oldCards = oldLoad('lib/learning-flashcards.js').getFlashcards();

test('The complete original biology dataset and all198 old courses retain content, field order and dates against actual HEAD25807fe', () => {
  assert.equal(JSON.stringify(stripAvianUrinaryDataset(raw)), JSON.stringify(oldLoad('data/learning-expansion-biology-2026-10-16.json')));
  assert.equal(JSON.stringify(curriculum.learningModules.map(stripAvianUrinaryAddition).map(stripSeedMastAddition)), JSON.stringify(previous.learningModules));
  assert.equal(JSON.stringify(createLoader(avianUrinaryBaselineFixture())('lib/learning-curriculum.js').learningModules.map(stripSeedMastAddition)), JSON.stringify(previous.learningModules));
  assert.deepEqual(previous.learningCounts, { modules: 198, lessons: 869, questions: 2739 });
  const ownModules = curriculum.learningModules.map(stripSeedMastAddition);
  assert.deepEqual({ modules: ownModules.length, lessons: ownModules.reduce((n, module) => n + module.lessons.length, 0), questions: ownModules.reduce((n, module) => n + module.questions.length, 0) }, { modules: 198, lessons: 870, questions: 2741 });
  assert.equal(raw.reviewedOn, '2026-10-16'); assert.equal(course.reviewedOn, '2026-10-16');
  const foreign = fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'));
  assert.equal(createHash('sha256').update(foreign).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('All1747 old cards and116 starters retain exact contents and order; only two own standalone cards are added', () => {
  const ownCards = cards.filter(card => !isSeedMastCard(card));
  assert.equal(oldCards.length, 1747); assert.equal(ownCards.length, 1749);
  assert.equal(JSON.stringify(ownCards.filter(card => !isAvianUrinaryCard(card))), JSON.stringify(oldCards));
  assert.equal(JSON.stringify(cards.slice(0, 116)), JSON.stringify(oldCards.slice(0, 116)));
  const questions = course.questions.filter(question => question.lessonId === lessonId);
  assert.deepEqual(questions.map(question => question.id), questionIds.map(id => `${courseId}-${id}`));
  assert.equal(cards.filter(isAvianUrinaryCard).length, 2);
  for (const question of questions) {
    assert.equal(curriculum.learningQuestions.filter(item => item.q === question.q).length, 1);
    const card = cards.find(item => item.id === `flash-${question.id}`);
    assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(answer => question.correct.includes(answer.id)).text);
    assert.equal(card.explanation, question.explain); assert.equal(card.reviewedOn, '2026-10-29');
    assert.equal(card.sourceScope, 'lesson'); assert.deepEqual(card.sources.map(source => source.url), [sourceURLs[0], sourceURLs[3], sourceURLs[1], sourceURLs[2]]);
    assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lessonId}`); assert.equal(card.options, undefined);
  }
});

test('The162-word seventh lesson names the chicken model and anatomical limits with two exact independent source pairs', () => {
  assert.equal(course.lessons.length, 7); assert.equal(course.questions.length, 37); assert.equal(course.sources.length, 17);
  assert.equal(lesson.id, lessonId); assert.equal(lesson.title, 'Harnwege'); assert.equal(lesson.reviewedOn, '2026-10-29');
  assert.equal(lesson.paragraphs.join(' ').split(/\s+/).length, 162); assert.equal(lesson.flashcardExpansion, true);
  assert.equal(lesson.image, undefined); assert.equal(lesson.diagram, undefined);
  const text = lesson.paragraphs.join(' ');
  assert.match(text, /Am Huhn/); assert.match(text, /Von jeder Niere führt ein Harnleiter/);
  assert.match(text, /Eine Harnblase liegt auf diesem Weg beim Huhn nicht dazwischen/);
  assert.match(text, /Darm, die Harnleiter und der Fortpflanzungstrakt/);
  assert.match(text, /keine in jedem Detail gleiche Organisation sämtlicher Wildvögel/);
  assert.match(text, /weder die chemische Zusammensetzung.*noch den Gesundheitszustand/);
  assert.match(text, /Eigene Denkübung/); assert.doesNotMatch(text, /\d|Harnsäure|Harnstoff|Milliliter|Prozent|sammle|berühre|präpariere/);
  assert.deepEqual(lesson.evidence.map(claim => claim.sources.map(source => source.url)), [[sourceURLs[0], sourceURLs[3]], [sourceURLs[1], sourceURLs[2]]]);
  assert.deepEqual(course.sources.slice(-4).map(source => source.url), sourceURLs);
  for (const source of course.sources.slice(-4)) { assert.equal(source.checkedOn, '2026-10-29'); assert.deepEqual(source.lessonIds, [lessonId]); }
});

test('The existing topic tree, real course route, text search and three country quiz pools expose the precise lesson without another category', () => {
  assert.equal(load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId).categorySlug, 'wildkunde');
  const page = load('pages/kurse/[slug].js');
  assert.equal(JSON.stringify(page.getStaticPaths()), JSON.stringify(oldLoad('pages/kurse/[slug].js').getStaticPaths()));
  const props = page.getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.at(-1), lesson); assert.equal(props.flashcards.lessons[lessonId], 2);
  const found = load('lib/learning-search.js').searchLearning({ query: 'Harnleiter Kloake', category: 'wildkunde', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
  assert.equal(found.href, `/kurse/${courseId}#lesson-${lessonId}`);
  const bank = load('data/questions-full.js').QUESTIONS, { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const country of ['DE', 'AT', 'CH']) for (const question of course.questions.filter(item => item.lessonId === lessonId)) {
    assert.ok(quizLearningPool(bank, { country, topic: 'Wildkunde' }).some(item => item.id === question.id));
  }
});

test('A real expiring offline pack retains full old content, the new anatomical explanation and distinct date roles', () => {
  const oldSecret = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-avian-urinary-oct29';
  try {
    const now = Date.parse('2026-10-29T12:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'synthetic@example.invalid', paidUntil: '2026-10-31T12:00:00Z' }, now);
    const { validateOfflinePack } = load('lib/offline-learning.js');
    assert.equal(validateOfflinePack(pack, now), true); assert.equal(validateOfflinePack(pack, pack.expiresAt), false);
    assert.deepEqual(pack.courses[0].lessons, course.lessons); assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-16'); assert.equal(pack.courses[0].lessons.at(-1).reviewedOn, '2026-10-29');
  } finally { if (oldSecret === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = oldSecret; }
});

test('The actual reader shows all162 words before the final closed sources and gives only the added lesson its29October date', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server'); let cursor = 0;
  const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? 6 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
  const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ asPath: `/kurse/${courseId}#lesson-${lessonId}` }) },
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
    '../hooks/useCourseProgress': () => ({}), './CourseProgressNotice': { __esModule: true, default: () => null },
  })('components/LearningCourse.js').default;
  const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: load('lib/learning-flashcards.js').getFlashcardLessonSummary(courseId) }));
  const start = html.indexOf('<details id="quellen"'); assert.ok(start > 0);
  for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, start).includes(paragraph));
  for (const url of sourceURLs) assert.ok(html.slice(start).includes(url));
  assert.ok(!html.slice(start).split('>')[0].includes('open')); assert.match(html.slice(start), /29\. Oktober 2026/);
  assert.doesNotMatch(html.slice(start), /16\. Oktober 2026/);
});
