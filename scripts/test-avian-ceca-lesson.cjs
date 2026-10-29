// Narrow editorial/preservation/integration checks, not scientific certification.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const swc = local('next/dist/build/swc');
const revision = '9f16930e3008fe7892fd3cc5fec76de61daff2fb';
const courseId = 'wissen-ausbau-biologie-verdauungsvergleich-2026';
const lessonId = 'vogelblinddaerme';
const questionId = `${courseId}-${lessonId}-funktion`;
const sourceURLs = [
  'https://poultry.extension.org/articles/poultry-anatomy/avian-digestive-system/',
  'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0213503',
];
function historicalLoader() {
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative), gitPath = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(gitPath && !gitPath.startsWith('../') && !path.isAbsolute(gitPath));
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = execFileSync('git', ['show', `${revision}:${gitPath}`], { cwd: root, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 });
    const module = { exports: {} }; cache.set(filename, module);
    if (gitPath.endsWith('.json')) { module.exports = JSON.parse(source.replace(/^\uFEFF/, '')); return module.exports; }
    const { code } = swc.transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.endsWith('.module.css')
      ? { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) }
      : id.startsWith('.') ? load(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
    return module.exports;
  }
  return load;
}
const load = createLoader(), old = historicalLoader();
const raw = load('data/learning-expansion-biology-2026-10-16.json');
const beforeRaw = old('data/learning-expansion-biology-2026-10-16.json');
const curriculum = load('lib/learning-curriculum.js');
const course = curriculum.getLearningModule(courseId), lesson = course.lessons.at(-1);
const cards = load('lib/learning-flashcards.js').getFlashcards();
function withoutAddition(module) {
  if (module.id !== courseId) return module;
  return { ...module, lessons: module.lessons.filter(item => item.id !== lessonId),
    questions: module.questions.filter(item => item.lessonId !== lessonId),
    sources: module.sources.filter(item => !(item.lessonIds?.length === 1 && item.lessonIds[0] === lessonId)) };
}
const isNewCard = card => card.moduleId === courseId && card.lessonId === lessonId;

test('Only the exact tail lesson, one question, two scoped sources and one evidence record extend the real biology baseline', () => {
  const previous = beforeRaw.modules.find(item => item.id === courseId), current = raw.modules.find(item => item.id === courseId);
  assert.equal(previous.lessons.length, 6); assert.equal(previous.questions.length, 36); assert.equal(previous.sources.length, 18);
  assert.equal(current.lessons.length, 7); assert.equal(current.questions.length, 37); assert.equal(current.sources.length, 20);
  assert.deepEqual(current.lessons.slice(0, 6), previous.lessons);
  assert.deepEqual(current.questions.slice(0, 36), previous.questions);
  assert.deepEqual(current.sources.slice(0, 18), previous.sources);
  const restored = { ...raw, modules: raw.modules.map(withoutAddition),
    evidence: raw.evidence.filter(item => !(item.moduleId === courseId && item.lessonId === lessonId)) };
  assert.equal(JSON.stringify(restored), JSON.stringify(beforeRaw));
  assert.equal(raw.reviewedOn, '2026-10-16'); assert.equal(course.reviewedOn, '2026-10-16');
  const foreign = fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'));
  assert.equal(createHash('sha256').update(foreign).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('All198 previous full courses and rotated question fields remain exact and ordered against9f16930', () => {
  const previous = old('lib/learning-curriculum.js');
  assert.deepEqual(previous.learningCounts, { modules: 198, lessons: 873, questions: 2747 });
  assert.deepEqual(curriculum.learningCounts, { modules: 198, lessons: 874, questions: 2748 });
  assert.deepEqual(curriculum.learningModules.map(withoutAddition), previous.learningModules);
  assert.deepEqual(curriculum.learningQuestions.filter(item => item.id !== questionId), previous.learningQuestions);
  assert.equal(curriculum.learningModules.filter(item => item.id === courseId).length, 1);
});

test('All1755 previous complete cards and116 starter objects retain content and order; exactly one own card is added', () => {
  const previous = old('lib/learning-flashcards.js').getFlashcards();
  assert.equal(previous.length, 1755); assert.equal(cards.length, 1756);
  // The concurrent central photo corrections do not affect these previous
  // complete card records; no broad image-field exclusion is necessary.
  assert.deepEqual(cards.filter(card => !isNewCard(card)), previous);
  assert.deepEqual(cards.slice(0, 116), previous.slice(0, 116));
  assert.deepEqual(cards.filter(isNewCard).map(card => card.id), [`flash-${questionId}`]);
});

test('The158-word explanation distinguishes morphology, microbial processing and genetic evidence with visible limits', () => {
  assert.equal(lesson.id, lessonId); assert.equal(lesson.title, 'Blinddärme');
  assert.equal(lesson.reviewedOn, '2026-10-29'); assert.equal(lesson.flashcardExpansion, true);
  const text = lesson.paragraphs.join(' '); assert.equal(text.split(/\s+/).length, 158);
  assert.match(text, /Beim Huhn.*Übergang zwischen Dünn- und Dickdarm zwei Blinddärme/);
  assert.match(text, /seitlich abzweigende Darmtaschen.*blind geschlossenen Ende/);
  assert.match(text, /Mikroorganismen.*pflanzliche Nahrungsbestandteile durch Gärung/);
  assert.match(text, /etwas anderes als das mechanische Zerkleinern und Durchmischen im Muskelmagen/);
  assert.match(text, /Alpenschneehühner.*paarige Blinddärme/);
  assert.match(text, /genetisches Funktionspotenzial/); assert.match(text, /vorhandenes Gen ist noch keine Messung/);
  assert.match(text, /weder Energieanteile noch Aussagen über DACH-Populationen/);
  assert.match(text, /keine einheitliche Blinddarmgröße oder Gärleistung sämtlicher Vogelarten/);
  assert.match(text, /äußere Vogelaufnahme zeigt diese inneren Vorgänge nicht/);
  assert.doesNotMatch(text, /\d|Wasser|Urat|Harnsäure|Prozent|Millimeter|Fütter|Behandel|Vitamin/);
  assert.equal(lesson.image, undefined); assert.equal(lesson.diagram, undefined);
  assert.match(lesson.exercise, /^Eigene Papierübung:/);
  const sources = course.sources.slice(-2);
  assert.deepEqual(sources.map(source => source.url), sourceURLs);
  for (const source of sources) { assert.deepEqual(source.lessonIds, [lessonId]); assert.equal(source.checkedOn, '2026-10-29'); }
  assert.equal(lesson.evidence.length, 2);
  for (const evidence of lesson.evidence) assert.deepEqual(evidence.sources.map(source => source.url), sourceURLs);
  assert.match(sources[1].supports, /11\. März 2019/); assert.match(sources[1].supports, /keine experimentelle Wiederholung/);
});

test('One independent standalone question becomes one dated complete card and enters the existing common DACH learning pool', () => {
  const selected = course.questions.filter(question => question.lessonId === lessonId);
  assert.deepEqual(selected.map(question => question.id), [questionId]);
  const question = selected[0], card = cards.find(isNewCard);
  assert.equal(curriculum.learningQuestions.filter(item => item.q === question.q).length, 1);
  assert.equal(new Set(question.answers.map(answer => answer.text)).size, 4);
  assert.deepEqual(question.countries, ['DE', 'AT', 'CH']); assert.equal(question.topic, 'Wildkunde');
  assert.equal(question.q, 'Wie unterscheiden sich beim Huhn Muskelmagen und Blinddärme in der Nahrungsverarbeitung?');
  assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(answer => question.correct.includes(answer.id)).text);
  assert.equal(card.explanation, question.explain); assert.equal(card.reviewedOn, '2026-10-29'); assert.equal(card.sourceScope, 'lesson');
  assert.deepEqual(card.sources.map(source => source.url), sourceURLs);
  assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lessonId}`); assert.equal(card.options, undefined);
  const bank = load('data/questions-full.js').QUESTIONS, previous = old('data/questions-full.js').QUESTIONS;
  assert.deepEqual(bank.filter(item => item.id !== questionId), previous);
  const { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const country of ['DE', 'AT', 'CH']) assert.ok(quizLearningPool(bank, { country, topic: 'Wildkunde' }).some(item => item.id === questionId));
});

test('The same category, course route, lesson search and SSG payload deliver the full appendix without pretending a photograph shows it', () => {
  const location = load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);
  assert.equal(location.categorySlug, 'wildkunde'); assert.equal(location.groupId, 'organe-stoffwechsel');
  const result = load('lib/learning-search.js').searchLearning({ query: 'Vogelblinddärme', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
  // The heading is intentionally the short menu keyword, not an extra course.
  const direct = load('lib/learning-search.js').searchLearning({ query: 'Cäca', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
  assert.ok(result || direct); assert.equal((result || direct).href, `/kurse/${courseId}#lesson-${lessonId}`);
  const page = load('pages/kurse/[slug].js'), beforePage = old('pages/kurse/[slug].js');
  assert.deepEqual(page.getStaticPaths(), beforePage.getStaticPaths());
  const props = page.getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.at(-1), lesson); assert.equal(props.flashcards.lessons[lessonId], 1);
  assert.equal(props.lessonPhotos[lessonId], undefined);
});

test('The actual course reader shows all explanation and limits before its closed final source area with the lesson date', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server'); let cursor = 0;
  const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? 6 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
  const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ asPath: `/kurse/${courseId}#lesson-${lessonId}`, isReady: true }) },
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
    '../hooks/useCourseProgress': () => ({}), './CourseProgressNotice': { __esModule: true, default: () => null } })('components/LearningCourse.js').default;
  const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: load('lib/learning-flashcards.js').getFlashcardLessonSummary(courseId) }));
  const boundary = html.indexOf('<details id="quellen"'); assert.ok(boundary > 0);
  for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, boundary).includes(paragraph));
  for (const url of sourceURLs) { assert.ok(!html.slice(0, boundary).includes(url)); assert.ok(html.slice(boundary).includes(url)); }
  assert.match(html, /Lektion 7 von 7/); assert.match(html.slice(boundary), /29\. Oktober 2026/);
  assert.doesNotMatch(html.slice(boundary), /16\. Oktober 2026/);
  assert.ok(!html.slice(boundary).split('>')[0].includes('open'));
});

test('Saved offline courses preserve the complete explanation, own question, evidence and distinct old/new review dates without extending access', () => {
  const previousSecret = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-avian-ceca-offline';
  try {
    const now = Date.parse('2026-10-29T12:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'synthetic@example.invalid', paidUntil: '2026-10-31T12:00:00Z' }, now);
    const { validateOfflinePack } = load('lib/offline-learning.js');
    assert.equal(validateOfflinePack(pack, now), true); assert.equal(validateOfflinePack(pack, pack.expiresAt), false);
    assert.deepEqual(pack.courses[0].lessons, course.lessons); assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-16'); assert.equal(pack.courses[0].lessons.at(-1).reviewedOn, '2026-10-29');
    assert.deepEqual(pack.courses[0].lessons.at(-1).evidence, lesson.evidence);
  } finally { if (previousSecret === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = previousSecret; }
});
