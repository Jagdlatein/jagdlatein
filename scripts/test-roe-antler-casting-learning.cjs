// Positive historical comparisons and integration, not scientific certification.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process'), { createHash } = require('node:crypto');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const { courseId, lessonId, questionIds, sourceURLs, stripRoeAntlerCastingAddition,
  isRoeAntlerCastingCard, roeAntlerCastingBaselineFixture } = require('./helpers/roe-antler-casting-addition-oct29.cjs');
const { stripSpeciesRelationsAddition, isSpeciesRelationsCard } = require('./helpers/species-relations-addition-oct29.cjs');
const swc = local('next/dist/build/swc');
function historicalLoader() {
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative), gitPath = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(gitPath && !gitPath.startsWith('../') && !path.isAbsolute(gitPath));
    if (cache.has(gitPath)) return cache.get(gitPath).exports;
    const source = execFileSync('git', ['show', `49b462f:${gitPath}`], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
    const mod = { exports: {} }; cache.set(gitPath, mod);
    if (gitPath.endsWith('.json')) { mod.exports = JSON.parse(source.replace(/^\uFEFF/, '')); return mod.exports; }
    const { code } = swc.transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.endsWith('.module.css') ? { __esModule: true, default: {} }
      : id.startsWith('.') ? load(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), mod, mod.exports);
    return mod.exports;
  }
  return load;
}
const load = createLoader(), historical = historicalLoader();
const curriculum = load('lib/learning-curriculum.js'), previous = historical('lib/learning-curriculum.js');
const course = curriculum.getLearningModule(courseId), lesson = course.lessons.at(-1);
const cards = load('lib/learning-flashcards.js').getFlashcards(), oldCards = historical('lib/learning-flashcards.js').getFlashcards();

test('All198 old complete course objects and all1751 old cards retain content, field order and array order against actual49b462f', () => {
  assert.equal(JSON.stringify(load('lib/learning-wildlife.js').wildlifeModules.map(stripRoeAntlerCastingAddition)), JSON.stringify(historical('lib/learning-wildlife.js').wildlifeModules));
  assert.equal(JSON.stringify(curriculum.learningModules.map(stripRoeAntlerCastingAddition).map(stripSpeciesRelationsAddition)), JSON.stringify(previous.learningModules));
  assert.equal(JSON.stringify(createLoader(roeAntlerCastingBaselineFixture())('lib/learning-curriculum.js').learningModules.map(stripSpeciesRelationsAddition)), JSON.stringify(previous.learningModules));
  assert.deepEqual(previous.learningCounts, { modules: 198, lessons: 871, questions: 2743 });
  const ownModules = curriculum.learningModules.map(stripSpeciesRelationsAddition);
  assert.deepEqual({ modules: ownModules.length, lessons: ownModules.reduce((n, module) => n + module.lessons.length, 0), questions: ownModules.reduce((n, module) => n + module.questions.length, 0) }, { modules: 198, lessons: 872, questions: 2745 });
  const ownCards = cards.filter(card => !isSpeciesRelationsCard(card));
  assert.equal(oldCards.length, 1751); assert.equal(ownCards.length, 1753);
  assert.equal(JSON.stringify(ownCards.filter(card => !isRoeAntlerCastingCard(card))), JSON.stringify(oldCards));
  assert.equal(JSON.stringify(cards.slice(0, 116)), JSON.stringify(oldCards.slice(0, 116)));
  const foreign = fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'));
  assert.equal(createHash('sha256').update(foreign).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('The166-word fourth lesson teaches the concrete casting mechanism, not another generic osteoclast definition', () => {
  assert.equal(course.lessons.length, 4); assert.equal(course.questions.length, 10); assert.equal(course.sources.length, 6);
  assert.equal(course.reviewedOn, '2026-10-04');
  assert.equal(load('lib/learning-wildlife.js').wildlifeModules.find(item => item.id === courseId).reviewedOn, undefined);
  assert.equal(lesson.id, lessonId); assert.equal(lesson.title, 'Geweihabwurf'); assert.equal(lesson.reviewedOn, '2026-10-29');
  assert.equal(lesson.flashcardExpansion, true); assert.equal(lesson.paragraphs.join(' ').split(/\s+/).length, 166);
  const text = lesson.paragraphs.join(' ');
  assert.match(text, /In der Abwurfregion bauen Osteoklasten Knochen ab/);
  assert.match(text, /Hohlräume.*knöchernen Verbindungen werden geschwächt/);
  assert.match(text, /kein unveränderlicher Knochenblock/);
  assert.match(text, /vorwiegend freilebender Rehböcke/);
  assert.match(text, /Damhirsche mit experimentell vorgezogenem Abwurf/);
  assert.match(text, /nur der Originalabstract gelesen/);
  assert.match(text, /verschiedenen Bedingungen/); assert.match(text, /keine Eingriffe oder festen Fristen/);
  assert.match(text, /Eigene Papierübung/); assert.match(text, /Tierfoto zeigt diese Zellaktivität nicht unmittelbar/);
  assert.doesNotMatch(text, /\d|Testosteron|Kastration|Millimeter|Prozent|Fütterung|Mineralbedarf|Hormongabe/);
  assert.equal(lesson.image, undefined); assert.equal(lesson.diagram, undefined);
  assert.deepEqual(lesson.evidence[0].sources.map(source => source.url), sourceURLs);
  for (const source of course.sources.slice(-2)) { assert.deepEqual(source.lessonIds, [lessonId]); assert.equal(source.checkedOn, '2026-10-29'); }
});

test('Two distinct applied cases make two standalone cards without duplicating existing generic bone-cell or skin-loss questions', () => {
  const questions = course.questions.filter(question => question.lessonId === lessonId), selected = cards.filter(isRoeAntlerCastingCard);
  assert.deepEqual(questions.map(question => question.id), questionIds.map(id => `${courseId}-${id}`));
  assert.equal(selected.length, 2); assert.equal(new Set(questions.map(question => question.q)).size, 2);
  for (const question of questions) {
    assert.match(question.q, /(?:Lernschema|Schema)/);
    assert.doesNotMatch(question.q, /^Was (?:tun|machen|sind) Osteoklasten/);
    assert.equal(curriculum.learningQuestions.filter(item => item.q === question.q).length, 1);
    const card = selected.find(item => item.id === `flash-${question.id}`);
    assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(answer => question.correct.includes(answer.id)).text);
    assert.equal(card.explanation, question.explain); assert.equal(card.reviewedOn, '2026-10-29'); assert.equal(card.sourceScope, 'lesson');
    assert.deepEqual(card.sources.map(source => source.url), sourceURLs); assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lessonId}`);
    assert.equal(card.options, undefined);
  }
});

test('Existing category, real course delivery, precise search anchor and all3country quiz pools expose the added case', () => {
  assert.equal(load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId).categorySlug, 'wildkunde');
  const page = load('pages/kurse/[slug].js');
  assert.equal(JSON.stringify(page.getStaticPaths()), JSON.stringify(historical('pages/kurse/[slug].js').getStaticPaths()));
  const props = page.getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.at(-1), lesson); assert.equal(props.flashcards.lessons[lessonId], 2);
  const result = load('lib/learning-search.js').searchLearning({ query: 'Osteoklasten Rosenstock', category: 'wildkunde', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
  assert.equal(result.href, `/kurse/${courseId}#lesson-${lessonId}`);
  const bank = load('data/questions-full.js').QUESTIONS, { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const country of ['DE', 'AT', 'CH']) for (const question of course.questions.filter(item => item.lessonId === lessonId)) assert.ok(quizLearningPool(bank, { country, topic: 'Wildkunde' }).some(item => item.id === question.id));
});

test('Real offline packs retain old and new date roles, complete explanation, exact evidence and unchanged expiry', () => {
  const oldSecret = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-roe-antler-casting-oct29';
  try {
    const now = Date.parse('2026-10-29T12:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'synthetic@example.invalid', paidUntil: '2026-10-31T12:00:00Z' }, now);
    const { validateOfflinePack } = load('lib/offline-learning.js');
    assert.equal(validateOfflinePack(pack, now), true); assert.equal(validateOfflinePack(pack, pack.expiresAt), false);
    assert.deepEqual(pack.courses[0].lessons, course.lessons); assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-04'); assert.equal(pack.courses[0].lessons.at(-1).reviewedOn, '2026-10-29');
  } finally { if (oldSecret === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = oldSecret; }
});

test('The actual course reader shows the full fourth lesson before closed final sources and dates the actual lesson only', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server'); let cursor = 0;
  const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? 3 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
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
  assert.doesNotMatch(html.slice(start), /4\. Oktober 2026/);
});
