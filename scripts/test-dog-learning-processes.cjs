const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const { courseId, lessonIds, sourceURLs, stripDogLearningProcessesAddition,
  isDogLearningProcessesCard, dogLearningProcessesBaselineFixture } = require('./helpers/dog-learning-processes-additions-oct29.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const swc = local('next/dist/build/swc');
const revision = '96eb237a9b9ccf2289f7a135c9b8886f18ff4f9e';
const load = createLoader();
const rawCourses = load('lib/learning-dog-depth.js').dogDepthModules;
const curriculum = load('lib/learning-curriculum.js');
const course = curriculum.getLearningModule(courseId);
const lessons = lessonIds.map(id => course.lessons.find(item => item.id === id));
const cards = load('lib/learning-flashcards.js').getFlashcards();
const newCards = cards.filter(isDogLearningProcessesCard);
const Evidence = load('components/LessonEvidence.js').default;
const evidenceHtml = (lesson, date) => renderToStaticMarkup(React.createElement(Evidence, { lesson, reviewedOn: date, embedded: true }));

function originalDogModules() {
  const cache = new Map();
  function read(relative) {
    if (cache.has(relative)) return cache.get(relative).exports;
    const source = execFileSync('git', ['show', `${revision}:${relative}`], { cwd: root, encoding: 'utf8' });
    const { code } = swc.transformSync(source, { filename: path.join(root, relative), disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
    const mod = { exports: {} }; cache.set(relative, mod);
    new Function('require', 'module', 'exports', code)(id => id.startsWith('.')
      ? read(path.posix.normalize(path.posix.join(path.posix.dirname(relative), `${id}.js`))) : local(id), mod, mod.exports);
    return mod.exports;
  }
  return read('lib/learning-dog-depth.js');
}
const original = originalDogModules();
const baseline = createLoader({ './learning-dog-depth': original });

test('Only two tail lessons and four own questions extend the existing dog course; all original fields and four other courses remain exact', () => {
  const old = original.dogDepthModules.find(item => item.id === courseId);
  const current = rawCourses.find(item => item.id === courseId);
  assert.equal(old.lessons.length, 8); assert.equal(old.questions.length, 16);
  assert.equal(current.lessons.length, 10); assert.equal(current.questions.length, 20);
  assert.deepEqual(current.lessons.slice(0, 8), old.lessons);
  assert.deepEqual(current.questions.slice(0, 16), old.questions);
  assert.deepEqual(current.sources.slice(0, old.sources.length), old.sources);
  assert.deepEqual(current.sources.slice(old.sources.length).map(source => source.url), sourceURLs);
  assert.deepEqual(rawCourses.map(stripDogLearningProcessesAddition), original.dogDepthModules);
  assert.equal(current.reviewedOn, '2026-10-12');
});

test('The actual curriculum and every previous card remain exact and ordered, including all starter cards', () => {
  const oldModules = baseline('lib/learning-curriculum.js').learningModules;
  assert.deepEqual(curriculum.learningModules.map(stripDogLearningProcessesAddition), oldModules);
  const oldCards = baseline('lib/learning-flashcards.js').getFlashcards();
  assert.equal(cards.length, oldCards.length + 4);
  assert.deepEqual(cards.filter(card => !isDogLearningProcessesCard(card)), oldCards);
  assert.deepEqual(cards.slice(0, 116), oldCards.slice(0, 116));
  const restored = createLoader(dogLearningProcessesBaselineFixture())('lib/learning-curriculum.js').learningModules;
  assert.deepEqual(restored, oldModules);
  const foreign = fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'));
  assert.equal(createHash('sha256').update(foreign).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('The complete habit lesson distinguishes direction, individual uncertainty and a safe written case without an exposure protocol', () => {
  const lesson = lessons[0], text = lesson.paragraphs.join(' ');
  assert.equal(lesson.title, 'Gewöhnung');
  assert.ok(text.split(/\s+/).length >= 150 && text.split(/\s+/).length <= 220);
  assert.match(text, /Habituation.*nachlässt/); assert.match(text, /Sensitivierung nimmt die Reaktion dagegen zu/);
  assert.match(text, /kein Versprechen/); assert.match(text, /keine individuelle Ursache oder Diagnose/);
  assert.match(text, /nur auf dem Papier/); assert.match(text, /keine.*Anleitung, Angst absichtlich auszulösen/);
  assert.doesNotMatch(text, /\d|Minuten|Dezibel|Therapieplan|Schock|Heilung/);
  assert.equal(lesson.reviewedOn, '2026-10-29'); assert.equal(lesson.flashcardExpansion, true);
  assert.equal(lesson.sourceReview.checkedOn, '2026-10-29');
  assert.deepEqual(lesson.evidence[0].sources.map(source => source.url), sourceURLs.slice(0, 2));
});

test('The complete association lesson separates events from action and consequence with two own written cases and scoped claim evidence', () => {
  const lesson = lessons[1], text = lesson.paragraphs.join(' ');
  assert.equal(lesson.title, 'Lernverknüpfungen');
  assert.ok(text.split(/\s+/).length >= 150 && text.split(/\s+/).length <= 220);
  assert.match(text, /klassischen Konditionierung.*Reizen beziehungsweise Ereignissen/);
  assert.match(text, /Operante Konditionierung.*Handlung und ihrer Konsequenz/);
  assert.match(text, /Verstärkung.*Zunahme der Verhaltenswahrscheinlichkeit/);
  assert.match(text, /Tonfolge/); assert.match(text, /vertraute Decke/); assert.match(text, /keine Trainingsrezepte/);
  assert.doesNotMatch(text, /\d|bewusst|unbewusst|Strafreiz|Elektro/);
  assert.deepEqual(lesson.evidence.map(claim => claim.sources.map(source => source.url)),
    [[sourceURLs[0], sourceURLs[2]], [sourceURLs[0], sourceURLs[3]]]);
  assert.equal(lesson.sourceReview.checkedOn, '2026-10-29');
  assert.equal(course.reviewedOn, '2026-10-12');
});

test('Four standalone questions preserve exact correct answers, explanations, actual country eligibility and scoped dated cards', () => {
  assert.equal(newCards.length, 4);
  for (const lesson of lessons) {
    const questions = course.questions.filter(item => item.lessonId === lesson.id);
    const expected = [...new Set(lesson.evidence.flatMap(claim => claim.sources.map(source => source.url)))];
    assert.equal(questions.length, 2);
    for (const question of questions) {
      assert.equal(question.correct.length, 1); assert.equal(new Set(question.answers.map(answer => answer.text)).size, 4);
      const correct = question.answers.find(answer => question.correct.includes(answer.id));
      assert.ok(correct.text.length > 25 && question.explain.length > 60);
      const card = newCards.find(item => item.question === question.q);
      assert.ok(card); assert.equal(card.answer, correct.text); assert.equal(card.explanation, question.explain);
      assert.equal(card.reviewedOn, '2026-10-29'); assert.equal(card.sourceScope, 'lesson');
      assert.deepEqual(card.sources.map(source => source.url), expected); assert.equal(card.options, undefined);
      assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lesson.id}`);
      assert.deepEqual(question.countries, ['DE', 'AT', 'CH']);
      for (const country of ['DE', 'AT', 'CH']) assert.ok(curriculum.learningQuestions.filter(item => item.countries.includes(country)).some(item => item.id === question.id));
    }
    assert.match(evidenceHtml(lesson, course.reviewedOn), /29\. Oktober 2026/);
    assert.doesNotMatch(evidenceHtml(lesson, course.reviewedOn), /12\. Oktober 2026/);
  }
  for (const old of course.lessons.slice(0, 8)) assert.ok(!old.evidence?.some(claim => claim.sources.some(source => sourceURLs.includes(source.url))));
});

test('The existing dog category and actual full-text search connect both new lessons without creating a duplicate course', () => {
  assert.equal(curriculum.learningModules.filter(item => item.id === courseId).length, 1);
  assert.equal(load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId).categorySlug, 'hundewesen');
  for (const [query, lesson] of [['Habituation', lessons[0]], ['klassische Konditionierung', lessons[1]]]) {
    const results = load('lib/learning-search.js').searchLearning({ query, category: 'hundewesen' }).results;
    const found = results.find(item => item.href === `/kurse/${courseId}#lesson-${lesson.id}`);
    assert.ok(found, query); assert.equal(found.lessonTitle, lesson.title);
  }
});

test('Real offline pack creation and restoration retain complete lessons, scoped sources and true lesson dates without a schema change', () => {
  const oldSecret = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'unit-test-dog-learning-not-a-credential';
  try {
    const now = Date.parse('2026-10-29T12:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false },
      { email: 'dog-learning@example.invalid', paidUntil: '2026-11-01T12:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(pack.version, 1); assert.equal(validate(pack, now), true);
    const saved = JSON.parse(JSON.stringify(pack)); assert.deepEqual(saved.courses[0], course);
    for (const lesson of saved.courses[0].lessons.slice(-2)) assert.match(evidenceHtml(lesson, saved.courses[0].reviewedOn), /29\. Oktober 2026/);
    const undated = structuredClone(saved); delete undated.courses[0].reviewedOn;
    for (const lesson of undated.courses[0].lessons) delete lesson.reviewedOn;
    assert.equal(validate(undated, now), true);
    for (const lesson of undated.courses[0].lessons.slice(-2)) assert.match(evidenceHtml(lesson, undefined), /Quellenzuordnung der Ausgangslektion/);
    assert.equal(validate(pack, pack.expiresAt), false);
  } finally { if (oldSecret === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = oldSecret; }
});

function readerHtml(relative, name, props, selected) {
  let stateIndex = 0;
  const hooks = { ...React, useState(initial) { return [stateIndex++ === 1 ? selected : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; } };
  const filename = path.join(root, relative);
  const router = { isReady: false, query: {}, asPath: `/kurse/${courseId}` };
  const loader = createLoader({ react: hooks, 'next/router': { useRouter: () => router } });
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8') + `\nexport { ${name} };`, { filename,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => id === 'react' ? hooks : id === 'next/router' ? { useRouter: () => router }
    : id.endsWith('.module.css') ? { __esModule: true, default: {} } : id.startsWith('.') ? loader(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), mod, mod.exports);
  return renderToStaticMarkup(React.createElement(mod.exports[name], props));
}

test('Actual online and offline readers place each entire lesson before the closed final source directory', () => {
  for (let index = 8; index < 10; index++) {
    const lesson = course.lessons[index];
    const online = readerHtml('components/LearningCourse.js', 'LearningContent', { module: course, flashcards: newCards }, index);
    const offline = readerHtml('components/OfflineLearning.js', 'OfflineCourse', { course, expiresAt: Date.now() + 60000, onExpired() {} }, index);
    for (const [html, label] of [[online, 'Alle Quellen dieses Themenbereichs'], [offline, 'Quellen und Prüfstand']]) {
      for (const paragraph of lesson.paragraphs) assert.ok(html.includes(paragraph));
      assert.ok(html.indexOf(label) > html.indexOf(lesson.paragraphs.at(-1)));
      const details = html.match(new RegExp(`<details([^>]*)><summary>${label}<\\/summary>`));
      assert.ok(details); assert.doesNotMatch(details[1], /\bopen\b/);
      assert.match(html, /29\. Oktober 2026/);
      for (const claim of lesson.evidence) for (const source of claim.sources) assert.ok(html.includes(source.url));
    }
  }
});

test('The actual print pipeline includes all new questions, answers, real dates and a final source directory', () => {
  const Print = createLoader({
    'next/router': { useRouter: () => ({ query: {}, isReady: true }) },
    '../../components/LearningToolLayout': { __esModule: true, default: ({ children }) => children },
    '../../components/PageMenu': { __esModule: true, default: () => null, closePageMenu() {} },
    '../../components/useFlashcardDeck': { __esModule: true, default: props => ({ ...props, incomplete: false, loading: false }) },
  })('pages/lernen/lernkarten-drucken.js').default;
  const html = renderToStaticMarkup(React.createElement(Print, { cards: newCards, categories: [{ id: 'hundewesen', title: 'Hundewesen', count: 4 }] }));
  for (const card of newCards) {
    assert.ok(html.includes(card.question) && html.includes(card.answer));
    assert.ok(html.indexOf('<h2 id="lernkarten-quellen">Quellenverzeichnis</h2>') > html.indexOf(card.answer));
    for (const source of card.sources) assert.ok(html.includes(source.url));
  }
  assert.match(html, /29\.10\.2026/);
});
