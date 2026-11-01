// Narrow preservation/integration checks. Original-source reading is separate;
// these tests are not a biological certification or visual-device test.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const revision = 'a6adad695442ba0a90c638cba2e2c80e0e5758ab';
const courseId = 'wissen-ausbau-biologie-vogelkoerper-2026', lessonId = 'nickhaut';
const questionId = `${courseId}-${lessonId}-oberflaechenfunktion`;
const urls = ['https://www.mdpi.com/2076-2615/13/23/3656', 'https://bmcvetres.biomedcentral.com/articles/10.1186/s12917-025-04677-0'];

function historicalLoader() {
  const cache = new Map(), swc = local('next/dist/build/swc');
  function historic(relative) {
    const filename = path.resolve(root, relative), repositoryPath = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(repositoryPath && !repositoryPath.startsWith('../') && !path.isAbsolute(repositoryPath));
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = execFileSync('git', ['show', `${revision}:${repositoryPath}`], { cwd: root, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 });
    const module = { exports: {} }; cache.set(filename, module);
    if (filename.endsWith('.json')) { module.exports = JSON.parse(source.replace(/^\uFEFF/, '')); return module.exports; }
    const { code } = swc.transformSync(source, { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.endsWith('.module.css')
      ? { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) }
      : id.startsWith('.') ? historic(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
    return module.exports;
  }
  return historic;
}
const load = createLoader(), old = historicalLoader();
const raw = load('data/learning-expansion-biology-2026-10-16.json'), beforeRaw = old('data/learning-expansion-biology-2026-10-16.json');
const curriculum = load('lib/learning-curriculum.js'), course = curriculum.getLearningModule(courseId);
const lesson = course.lessons.find(item => item.id === lessonId), cards = load('lib/learning-flashcards.js').getFlashcards();
const isNewCard = card => card.moduleId === courseId && card.lessonId === lessonId;
const strip = module => module.id !== courseId ? module : { ...module,
  lessons: module.lessons.filter(item => item.id !== lessonId), questions: module.questions.filter(item => item.lessonId !== lessonId),
  sources: module.sources.filter(item => !(item.lessonIds?.length === 1 && item.lessonIds[0] === lessonId)) };

test('Only one tail lesson/question, two scoped sources and one evidence record extend the exact real baseline', () => {
  const current = raw.modules.find(item => item.id === courseId), previous = beforeRaw.modules.find(item => item.id === courseId);
  assert.equal(previous.lessons.length, 7); assert.equal(previous.questions.length, 37); assert.equal(previous.sources.length, 17);
  assert.equal(current.lessons.length, 8); assert.equal(current.questions.length, 38); assert.equal(current.sources.length, 19);
  assert.deepEqual(current.lessons.slice(0, 7), previous.lessons);
  assert.deepEqual(current.questions.slice(0, 37), previous.questions);
  assert.deepEqual(current.sources.slice(0, 17), previous.sources);
  const restored = { ...raw, modules: raw.modules.map(strip), evidence: raw.evidence.filter(item => !(item.moduleId === courseId && item.lessonId === lessonId)) };
  assert.equal(JSON.stringify(restored), JSON.stringify(beforeRaw));
  assert.equal(raw.reviewedOn, '2026-10-16'); assert.equal(course.reviewedOn, '2026-10-16');
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('All198 old full courses/questions and1756 old cards including116 starters remain exact and ordered', () => {
  const previous = old('lib/learning-curriculum.js'), oldCards = old('lib/learning-flashcards.js').getFlashcards();
  assert.deepEqual(previous.learningCounts, { modules: 198, lessons: 874, questions: 2748 });
  assert.deepEqual(curriculum.learningCounts, { modules: 198, lessons: 875, questions: 2749 });
  assert.deepEqual(curriculum.learningModules.map(strip), previous.learningModules);
  assert.deepEqual(curriculum.learningQuestions.filter(item => item.id !== questionId), previous.learningQuestions);
  assert.equal(oldCards.length, 1756); assert.equal(cards.length, 1757);
  assert.deepEqual(cards.filter(card => !isNewCard(card)), oldCards);
  assert.deepEqual(cards.slice(0, 116), oldCards.slice(0, 116));
  assert.deepEqual(cards.filter(isNewCard).map(card => card.id), [`flash-${questionId}`]);
});

test('The114-word explanation separates third lid, surface function and variation without invented measurements or visible proof', () => {
  assert.equal(course.lessons.at(-1), lesson); assert.equal(lesson.title, 'Nickhaut');
  assert.equal(lesson.reviewedOn, '2026-11-01'); assert.equal(lesson.flashcardExpansion, true);
  const text = lesson.paragraphs.join(' '); assert.equal(text.split(/\s+/).length, 114);
  assert.match(text, /bewegliches drittes Lid/); assert.match(text, /von Ober- und Unterlid zu unterscheiden/);
  assert.match(text, /inneren zum äußeren Augenwinkel über die Hornhaut/);
  assert.match(text, /Verteilung des Tränenfilms.*Entfernen kleiner Fremdpartikel/);
  assert.doesNotMatch(text, /Video-Beobachtungsstudie|Originalarbeit|Tränenfilmmessung/);
  assert.match(text, /nicht bei jeder Art gleich durchsichtig/);
  assert.match(text, /kurzer Film aus größerer Entfernung.*nicht erkennbar/);
  assert.doesNotMatch(text, /\d|Millimeter|Prozent|Sekunde|Kontaktlinse|Tauchtiefe|Behandlung|Therapie/);
  assert.equal(lesson.image, undefined); assert.equal(lesson.diagram, undefined);
  const added = course.sources.slice(-2);
  assert.deepEqual(added.map(item => item.url), urls);
  assert.ok(added.every(source => source.checkedOn === '2026-11-01' && JSON.stringify(source.lessonIds) === '["nickhaut"]'));
  assert.equal(lesson.evidence.length, 3);
  assert.ok(lesson.evidence.some(item => /fachliche Funktionsdeutung.*nicht als gemeinsame wiederholte Tränenfilmmessung/.test(item.claim)));
  assert.ok(lesson.evidence.every(item => JSON.stringify(item.sources.map(source => source.url)) === JSON.stringify(urls)));
  for (const previous of course.lessons.slice(0, -1)) assert.ok(previous.evidence.every(item => item.sources.every(source => !urls.includes(source.url))));
});

test('One explained own question becomes one dated standalone card and enters the shared DACH quiz without changing old bank entries', () => {
  const selected = course.questions.filter(item => item.lessonId === lessonId);
  assert.deepEqual(selected.map(item => item.id), [questionId]);
  const question = selected[0], card = cards.find(isNewCard);
  assert.equal(new Set(question.answers.map(item => item.text)).size, 4);
  assert.equal(question.correct.length, 1); assert.deepEqual(question.countries, ['DE', 'AT', 'CH']);
  assert.equal(card.question, question.q); assert.equal(card.answer, question.answers.find(item => question.correct.includes(item.id)).text);
  assert.equal(card.explanation, question.explain); assert.equal(card.reviewedOn, '2026-11-01'); assert.equal(card.sourceScope, 'lesson');
  assert.deepEqual(card.sources.map(item => item.url), urls); assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lessonId}`);
  const bank = load('data/questions-full.js').QUESTIONS, beforeBank = old('data/questions-full.js').QUESTIONS;
  assert.deepEqual(bank.filter(item => item.id !== questionId), beforeBank);
  const { quizLearningPool } = load('lib/quiz-learning-scope.js');
  for (const country of ['DE', 'AT', 'CH']) assert.ok(quizLearningPool(bank, { country, topic: 'Wildkunde' }).some(item => item.id === questionId));
  const exported = load('lib/learning-flashcards.js').getFlashcardExport({ courseId, lessonId });
  assert.deepEqual(exported.cards, [card]); assert.equal(exported.selection.returnHref, card.courseHref);
  const print = load('pages/lernen/lernkarten-drucken.js').getPrintSourceIndex([card]);
  assert.deepEqual(print.sourceList.map(item => item.url), urls);
});

test('Existing course route, topic and exact lesson search expose the appendix without new guides or a false anatomy photo', () => {
  const location = load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);
  assert.deepEqual(location, old('lib/learning-topic-tree.js').getLearningTopicLocation(courseId));
  const result = load('lib/learning-search.js').searchLearning({ query: 'Nickhaut', type: 'course' }).results.find(item => item.id === `course:${courseId}`);
  assert.ok(result); assert.equal(result.href, `/kurse/${courseId}#lesson-${lessonId}`);
  const page = load('pages/kurse/[slug].js'); assert.deepEqual(page.getStaticPaths(), old('pages/kurse/[slug].js').getStaticPaths());
  const props = page.getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.at(-1), lesson); assert.equal(props.flashcards.lessons[lessonId], 1);
  assert.equal(props.lessonPhotos[lessonId], undefined);
  const guides = load('lib/wildlife-learning-guide.js'), oldGuides = old('lib/wildlife-learning-guide.js');
  assert.deepEqual(guides.wildlifeGuideTargets, oldGuides.wildlifeGuideTargets);
  const slugs = Object.keys(load('lib/european-wildlife-discovery.js').europeanWildlifeBySlug);
  assert.equal(slugs.length, 114);
  for (const slug of slugs) {
    const expected = oldGuides.getWildlifeLearningGuide(slug).map(target => target.moduleId === courseId
      ? { ...target, flashcardCount: target.flashcardCount + 1 } : target);
    assert.deepEqual(guides.getWildlifeLearningGuide(slug), expected, slug);
  }
});

test('The actual reader places the complete lesson and limits before a closed final source panel with the new lesson date', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server'); let cursor = 0;
  const hooks = { ...React, useState(initial) { return [cursor++ === 1 ? 7 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; }, useEffect() {} };
  const Course = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ asPath: `/kurse/${courseId}#lesson-${lessonId}`, isReady: true }) },
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {} },
    '../hooks/useCourseProgress': () => ({}), './CourseProgressNotice': { __esModule: true, default: () => null } })('components/LearningCourse.js').default;
  const html = renderToStaticMarkup(React.createElement(Course, { module: course, flashcards: load('lib/learning-flashcards.js').getFlashcardLessonSummary(courseId) }));
  const boundary = html.indexOf('<details id="quellen"'); assert.ok(boundary > 0);
  for (const paragraph of lesson.paragraphs) assert.ok(html.slice(0, boundary).includes(paragraph));
  for (const url of urls) { assert.ok(!html.slice(0, boundary).includes(url)); assert.ok(html.slice(boundary).includes(url)); }
  assert.match(html, /Lektion 8 von 8/); assert.match(html.slice(boundary), /1\. November 2026/);
  assert.doesNotMatch(html.slice(boundary), /16\. Oktober 2026/);
  assert.ok(!html.slice(boundary).split('>')[0].includes('open'));
});

test('Saved offline courses keep the full new lesson, evidence and question while preserving old dates and access expiry', () => {
  const previousSecret = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-avian-nictitating-offline';
  try {
    const now = Date.parse('2026-11-01T08:30:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'synthetic@example.invalid', paidUntil: '2026-11-03T08:30:00Z' }, now);
    const { validateOfflinePack } = load('lib/offline-learning.js');
    assert.equal(validateOfflinePack(pack, now), true); assert.equal(validateOfflinePack(pack, pack.expiresAt), false);
    assert.deepEqual(pack.courses[0].lessons, course.lessons); assert.deepEqual(pack.courses[0].questions, course.questions);
    assert.equal(pack.courses[0].reviewedOn, '2026-10-16'); assert.equal(pack.courses[0].lessons.at(-1).reviewedOn, '2026-11-01');
    assert.deepEqual(pack.courses[0].lessons.at(-1).evidence, lesson.evidence);
  } finally { if (previousSecret === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = previousSecret; }
});
