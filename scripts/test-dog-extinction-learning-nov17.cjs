// A narrow content/source/link regression; not a complete curriculum certification.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { courseId, shortLessonId, lessonId, sourceKeys, sourceURLs, curriculumQuestionIds,
  stripDogExtinctionAddition, isDogExtinctionCard, dogExtinctionBaselineFixture } = require('./helpers/dog-extinction-addition-nov17.cjs');
const revision = 'a0b078b800c5eafd2a31fa5c6a95c0ee3718132c';
function historicalDogLoader() {
  const cache = new Map();
  function load(relative) {
    if (cache.has(relative)) return cache.get(relative).exports;
    const source = execFileSync('git', ['show', `${revision}:${relative}`], { cwd: root, encoding: 'utf8' });
    const module = { exports: {} }; cache.set(relative, module);
    const { code } = local('next/dist/build/swc').transformSync(source, { filename: path.join(root, relative), disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.startsWith('.')
      ? load(path.posix.normalize(path.posix.join(path.posix.dirname(relative), `${id}.js`))) : local(id), module, module.exports);
    return module.exports;
  }
  return load;
}
const load = createLoader(), historical = historicalDogLoader();
const currentDog = load('lib/learning-dog-depth.js'), previousDog = historical('lib/learning-dog-depth.js');
const baseline = createLoader({ './learning-dog-depth': previousDog });
const curriculum = load('lib/learning-curriculum.js'), course = curriculum.getLearningModule(courseId);
const lesson = course.lessons.find(item => item.id === lessonId), text = lesson.paragraphs.join(' ');
const cards = load('lib/learning-flashcards.js').getFlashcards(), additions = cards.filter(isDogExtinctionCard);
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');

test('The existing five dog courses and every older field including course.sourceReview are exact after the named tail appendix is removed', () => {
  assert.deepEqual(currentDog.dogDepthModules.map(stripDogExtinctionAddition), previousDog.dogDepthModules);
  const before = previousDog.dogDepthModules.find(item => item.id === courseId), current = currentDog.dogDepthModules.find(item => item.id === courseId);
  assert.equal(before.lessons.length, 10); assert.equal(before.questions.length, 20);
  assert.equal(current.lessons.length, 11); assert.equal(current.questions.length, 22);
  assert.deepEqual(current.lessons.slice(0, -1), before.lessons);
  assert.deepEqual(current.questions.slice(0, -2), before.questions);
  assert.deepEqual(current.sources.slice(0, -3), before.sources);
  assert.deepEqual(current.sourceReview, before.sourceReview);
  assert.equal(current.reviewedOn, '2026-10-12');
  const refs = load('lib/dog-depth-independent-sources.js'), oldRefs = historical('lib/dog-depth-independent-sources.js');
  assert.deepEqual(refs.dogDepthSourceReview, oldRefs.dogDepthSourceReview);
  assert.deepEqual(Object.fromEntries(Object.entries(refs.dogDepthIndependentSources).filter(([id]) => !sourceKeys.includes(id))), oldRefs.dogDepthIndependentSources);
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'))).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('The full current curriculum and all older cards retain exact objects and order, including the 116 starter cards', () => {
  const before = baseline('lib/learning-curriculum.js').learningModules;
  assert.deepEqual(curriculum.learningModules.map(stripDogExtinctionAddition), before);
  const oldCards = baseline('lib/learning-flashcards.js').getFlashcards();
  assert.equal(cards.length, oldCards.length + 2);
  assert.deepEqual(cards.filter(card => !isDogExtinctionCard(card)), oldCards);
  assert.deepEqual(cards.slice(0, 116), oldCards.slice(0, 116));
  assert.deepEqual(createLoader(dogExtinctionBaselineFixture())('lib/learning-curriculum.js').learningModules, before);
});

test('The complete new explanation distinguishes operant extinction, possible spontaneous recovery and a written case without a dog exercise', () => {
  assert.equal(lesson.title, 'Extinktion und spätere Rückkehr');
  assert.ok(text.split(/\s+/).length >= 170 && text.split(/\s+/).length <= 240);
  assert.match(text, /Operante Extinktion.*bisher.*Verstärkung ausbleibt/);
  assert.match(text, /Beziehung zwischen Handlung und Konsequenz/); assert.match(text, /unterscheidet.*Habituation/);
  assert.match(text, /kein dauerhaftes Vergessen/); assert.match(text, /spontane Erholung/);
  assert.match(text, /erwachsenen Haushunden/); assert.match(text, /weder jeden Hund noch jagdliche Arbeit/);
  assert.match(text, /Eigener schriftlicher Prüfungsfall/); assert.match(text, /keine Anleitung zur Verstärkungsentziehung am Hund/);
  assert.match(text, /Angst, Schmerz, Aggression und Bedürfnisse.*weder ausgelöst noch ignoriert/);
  assert.doesNotMatch(text, /\d|Minuten|Stunden|Prozent|Heilung|Schock|Extinktionsburst|garantiert/);
  assert.ok(lesson.takeaway && lesson.exercise); assert.match(lesson.exercise, /ohne Versuch am Hund/);
  assert.equal(lesson.reviewedOn, '2026-11-17'); assert.equal(lesson.flashcardExpansion, true);
});

test('Three actually read sources have explicit distinct roles; only the new lesson owns its dated review and two multi-source claims', () => {
  const refs = load('lib/dog-depth-independent-sources.js');
  assert.deepEqual(lesson.sourceReview, refs.dogExtinctionSourceReview);
  assert.equal(lesson.sourceReview.lesson, shortLessonId); assert.equal(lesson.sourceReview.checkedOn, '2026-11-17');
  assert.deepEqual(lesson.sourceReview.sourceIds, sourceKeys);
  assert.deepEqual(sourceKeys.map(id => refs.dogDepthIndependentSources[id].url), sourceURLs);
  for (const id of sourceKeys) {
    const source = refs.dogDepthIndependentSources[id];
    assert.equal(source.checkedOn, '2026-11-17'); assert.deepEqual(source.lessonIds, [lessonId]);
    assert.ok(source.organization && source.scope.length > 150);
  }
  assert.match(refs.dogDepthIndependentSources.extinctionBentosela.scope, /Studie 1.*2\.2\.3\/2\.2\.4/);
  assert.match(refs.dogDepthIndependentSources.extinctionBentosela.scope, /nur zwischen erstem und zweitem/);
  assert.match(refs.dogDepthIndependentSources.extinctionBouton.scope, /keine unabhängige Hunde-Replikation/);
  assert.match(refs.dogDepthIndependentSources.extinctionMsd.scope, /Dieselbe Publikation wie learningProcessesMsd/);
  assert.match(refs.dogDepthIndependentSources.extinctionMsd.scope, /nicht als Beleg für operante Extinktionserholung/);
  assert.equal(lesson.evidence.length, 2);
  assert.deepEqual(lesson.evidence.map(claim => claim.sources.map(source => source.url)), [[sourceURLs[0], sourceURLs[2], sourceURLs[1]], [sourceURLs[0], sourceURLs[1]]]);
  assert.ok(lesson.evidence.every(claim => new Set(claim.sources.map(source => source.organization)).size >= 2));
  for (const old of course.lessons.slice(0, -1)) assert.ok(!old.evidence?.some(claim => claim.sources.some(source => sourceURLs.includes(source.url))));
});

test('Two standalone four-answer questions become two dated cards and join the existing DACH quiz and short review pools', () => {
  const questions = course.questions.filter(item => item.lessonId === lessonId);
  assert.deepEqual(questions.map(item => item.id), curriculumQuestionIds); assert.equal(additions.length, 2);
  const shortPool = load('lib/daily-review-pool.js').getDailyReviewPool();
  for (const question of questions) {
    assert.equal(question.answers.length, 4); assert.equal(new Set(question.answers.map(answer => answer.text)).size, 4);
    assert.equal(question.correct.length, 1); assert.deepEqual(question.countries, ['DE', 'AT', 'CH']);
    assert.ok(question.explain.length > 100); assert.ok(question.id.length <= 159);
    const card = additions.find(item => item.id === `flash-${question.id}`);
    assert.ok(card); assert.equal(card.question, question.q); assert.equal(card.explanation, question.explain);
    assert.equal(card.answer, question.answers.find(answer => question.correct.includes(answer.id)).text);
    assert.equal(card.reviewedOn, '2026-11-17'); assert.equal(card.sourceScope, 'lesson');
    assert.deepEqual(card.sources.map(source => source.url), [sourceURLs[0], sourceURLs[2], sourceURLs[1]]);
    assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lessonId}`);
    const short = shortPool.find(item => item.id === question.id); assert.ok(short);
    assert.equal(short.href, card.courseHref); assert.deepEqual(short.correct, question.correct);
    for (const country of ['DE', 'AT', 'CH']) assert.ok(curriculum.learningQuestions.some(item => item.id === question.id && item.countries.includes(country)));
  }
});

test('Existing category and full-text search lead to the actual single course and new lesson without a new route', () => {
  assert.equal(curriculum.learningModules.filter(item => item.id === courseId).length, 1);
  assert.equal(load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId).categorySlug, 'hundewesen');
  for (const query of ['Extinktion', 'spontane Erholung']) {
    const result = load('lib/learning-search.js').searchLearning({ query, category: 'hundewesen' }).results.find(item => item.href === `/kurse/${courseId}#lesson-${lessonId}`);
    assert.ok(result, query); assert.equal(result.lessonTitle, lesson.title);
  }
  const page = load('pages/kurse/[slug].js');
  assert.deepEqual(page.getStaticPaths(), baseline('pages/kurse/[slug].js').getStaticPaths());
  const props = page.getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module.lessons.at(-1), lesson);
  assert.equal(props.flashcards.lessons[lessonId], 2);
  const oldSummary = baseline('lib/learning-flashcards.js').getFlashcardLessonSummary(courseId);
  assert.equal(props.flashcards.total, oldSummary.total + 2);
  const { [lessonId]: appended, ...olderLessons } = props.flashcards.lessons;
  assert.deepEqual(olderLessons, oldSummary.lessons);
});

test('Actual offline packs and printed cards preserve new texts, dates and final source directories', () => {
  const savedSecret = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'unit-test-dog-extinction-not-a-credential';
  try {
    const now = Date.parse('2026-11-17T12:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false },
      { email: 'extinction@example.invalid', paidUntil: '2026-11-20T12:00:00Z' }, now);
    assert.equal(load('lib/offline-learning.js').validateOfflinePack(pack, now), true);
    assert.deepEqual(JSON.parse(JSON.stringify(pack)).courses[0], course);
    assert.equal(pack.courses[0].lessons.at(-1).reviewedOn, '2026-11-17');
  } finally { if (savedSecret === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = savedSecret; }
  const Evidence = load('components/LessonEvidence.js').default;
  const html = renderToStaticMarkup(React.createElement(Evidence, { lesson, reviewedOn: course.reviewedOn, embedded: true }));
  assert.match(html, /17\. November 2026/); assert.doesNotMatch(html, /12\. Oktober 2026/);
  const Print = createLoader({
    'next/router': { useRouter: () => ({ query: {}, isReady: true }) },
    '../../components/LearningToolLayout': { __esModule: true, default: ({ children }) => children },
    '../../components/PageMenu': { __esModule: true, default: () => null, closePageMenu() {} },
    '../../components/useFlashcardDeck': { __esModule: true, default: props => ({ ...props, incomplete: false, loading: false }) },
  })('pages/lernen/lernkarten-drucken.js').default;
  const printed = renderToStaticMarkup(React.createElement(Print, { cards: additions, categories: [{ id: 'hundewesen', title: 'Hundewesen', count: 2 }] }));
  for (const card of additions) {
    assert.ok(printed.includes(card.question) && printed.includes(card.answer));
    assert.ok(printed.indexOf('<h2 id="lernkarten-quellen">Quellenverzeichnis</h2>') > printed.indexOf(card.answer));
  }
  for (const source of sourceURLs) assert.ok(printed.includes(source));
  assert.match(printed, /17\.11\.2026/);
});
