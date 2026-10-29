const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { courseId, lessonId, questionIds, sourceURLs, stripSeedMastAddition,
  isSeedMastCard, seedMastBaselineFixture } = require('./helpers/seed-mast-addition-oct29.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const swc = local('next/dist/build/swc');
const load = createLoader();
const rawModules = load('lib/learning-expansion-nature.js').natureExpansionModules;
const raw = rawModules.find(item => item.id === courseId);
const curriculum = load('lib/learning-curriculum.js');
const course = curriculum.getLearningModule(courseId);
const lesson = course.lessons.find(item => item.id === lessonId);
const cards = load('lib/learning-flashcards.js').getFlashcards();
const newCards = cards.filter(isSeedMastCard);
const filename = path.join(root, 'lib/learning-expansion-nature.js');
const originalSource = execFileSync('git', ['show', '25807fe9fd4fb4faab01c58b1b78b2bb1d96e4d0:lib/learning-expansion-nature.js'], { cwd: root, encoding: 'utf8' });
const { code: originalCode } = swc.transformSync(originalSource, { filename,
  jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
const original = { exports: {} };
new Function('require', 'module', 'exports', originalCode)(local, original, original.exports);
// All unrelated concurrent files are identical on both sides; only this exact
// source module is restored from the release HEAD for positive comparisons.
const baseline = createLoader({ './learning-expansion-nature': original.exports });
const Evidence = load('components/LessonEvidence.js').default;
const evidenceHtml = (item, date) => renderToStaticMarkup(React.createElement(Evidence, { lesson: item, reviewedOn: date, embedded: true }));

test('Exactly one tail lesson, two questions and two scoped sources extend the complete historical nature source module', () => {
  const old = original.exports.natureExpansionModules.find(item => item.id === courseId);
  assert.equal(old.lessons.length, 6); assert.equal(old.questions.length, 12); assert.equal(old.sources.length, 6);
  assert.equal(raw.lessons.length, 7); assert.equal(raw.questions.length, 14); assert.equal(raw.sources.length, 8);
  assert.equal(raw.lessons.at(-1).id, lessonId);
  assert.deepEqual(raw.lessons.slice(0, 6), old.lessons);
  assert.deepEqual(raw.questions.slice(0, 12), old.questions);
  assert.deepEqual(raw.sources.slice(0, 6), old.sources);
  assert.deepEqual(rawModules.map(stripSeedMastAddition), original.exports.natureExpansionModules);
  assert.equal(Object.hasOwn(raw, 'reviewedOn'), false);
  assert.equal(course.reviewedOn, '2026-10-04');
  assert.ok(course.lessons.slice(0, 6).every(item => !Object.hasOwn(item, 'reviewedOn')));
});

test('All old prepared courses, rotated question fields and every previous card remain exact and ordered, including116 starters', () => {
  const oldCourses = baseline('lib/learning-curriculum.js').learningModules;
  assert.deepEqual(curriculum.learningModules.map(stripSeedMastAddition), oldCourses);
  const oldCards = baseline('lib/learning-flashcards.js').getFlashcards();
  assert.equal(cards.length, oldCards.length + 2);
  assert.deepEqual(cards.filter(card => !isSeedMastCard(card)), oldCards);
  assert.deepEqual(cards.slice(0, 116), oldCards.slice(0, 116));
  assert.deepEqual(createLoader(seedMastBaselineFixture())('lib/learning-curriculum.js').learningModules, oldCourses);
  const foreign = fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'));
  assert.equal(createHash('sha256').update(foreign).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
});

test('The167-word lesson teaches temporal irregularity and possible within-species spatial synchrony with precise roles and direct limits', () => {
  const text = lesson.paragraphs.join(' ');
  assert.equal(lesson.title, 'Samenmast'); assert.equal(text.split(/\s+/).length, 167);
  assert.match(text, /Rotbuche/); assert.match(text, /keinem festen Kalenderabstand/);
  assert.match(text, /innerhalb derselben Baumart räumlich synchronisiert/);
  assert.match(text, /innerhalb eines Bestandes und auch über größere Gebiete/);
  assert.match(text, /nicht überall gleich stark/); assert.match(text, /verschiedene Baumarten immer gemeinsam/);
  assert.match(text, /Eigener Papierfall/); assert.match(text, /keine Vorhersage/);
  assert.match(text, /von Keimung und erfolgreicher Verjüngung getrennt/);
  assert.doesNotMatch(text, /\d|NAO|Nordatlant|Zecken|Abschuss|Fütterung|Prozent|Kilogramm|alle zwei/);
  assert.equal(lesson.reviewedOn, '2026-10-29'); assert.equal(lesson.flashcardExpansion, true);
  assert.equal(lesson.evidence.length, 2);
  for (const claim of lesson.evidence) assert.deepEqual(claim.sources.map(source => source.url), sourceURLs);
  assert.deepEqual(raw.sources.slice(6).map(source => source.url), sourceURLs);
  for (const source of raw.sources.slice(6)) {
    assert.equal(source.checkedOn, '2026-10-29'); assert.deepEqual(source.lessonIds, [lessonId]);
    assert.ok(source.organization.length > 20 && source.supports.includes('gelesen'));
  }
  assert.match(raw.sources[6].supports, /Institutioneller Forschungsbericht.*keine neue eigene Messung.*Forschungsarbeit/);
  assert.doesNotMatch(raw.sources[6].supports, /Experiment/);
  assert.match(raw.sources[7].supports, /Eigenständig verfasste Fachübersicht neben WSL/);
});

test('Two independent standalone questions generate exactly two dated cards with the same answer, explanation, sources and existing lesson anchor', () => {
  const questions = course.questions.filter(question => question.lessonId === lessonId);
  assert.equal(questions.length, 2); assert.equal(newCards.length, 2);
  for (let index = 0; index < questions.length; index++) {
    const question = questions[index], card = newCards.find(item => item.question === question.q);
    assert.equal(question.id, `${courseId}-${questionIds[index]}`);
    assert.deepEqual(question.countries, ['DE', 'AT', 'CH']);
    assert.equal(question.correct.length, 1); assert.equal(new Set(question.answers.map(answer => answer.text)).size, 4);
    assert.ok(card); assert.equal(card.answer, question.answers.find(answer => question.correct.includes(answer.id)).text);
    assert.equal(card.explanation, question.explain); assert.equal(card.reviewedOn, '2026-10-29');
    assert.equal(card.sourceScope, 'lesson'); assert.deepEqual(card.sources.map(source => source.url), sourceURLs);
    assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lessonId}`); assert.equal(card.options, undefined);
    for (const country of ['DE', 'AT', 'CH']) assert.ok(curriculum.learningQuestions.some(item => item.id === question.id && item.countries.includes(country)));
  }
  assert.match(evidenceHtml(lesson, course.reviewedOn), /29\. Oktober 2026/);
  assert.doesNotMatch(evidenceHtml(lesson, course.reviewedOn), /4\. Oktober 2026/);
});

test('Existing category, actual full-text search and static course delivery expose the exact lesson and both cards without a new course', () => {
  assert.equal(curriculum.learningModules.filter(item => item.id === courseId).length, 1);
  assert.equal(load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId).categorySlug, 'wald-pflanzen');
  const found = load('lib/learning-search.js').searchLearning({ query: 'Samenmast', category: 'wald-pflanzen' }).results.find(item => item.href === `/kurse/${courseId}#lesson-${lessonId}`);
  assert.ok(found); assert.equal(found.lessonTitle, lesson.title);
  const props = load('pages/kurse/[slug].js').getStaticProps({ params: { slug: courseId } }).props;
  assert.deepEqual(props.module, course); assert.equal(props.flashcards.lessons[lessonId], 2);
});

test('Fresh and restored offline packs preserve the full lesson and both date roles without a new schema or manufactured legacy dates', () => {
  const oldSecret = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'seed-mast-unit-test-not-a-credential';
  try {
    const now = Date.parse('2026-10-29T12:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'seed-mast@example.invalid', paidUntil: '2026-11-01T12:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(pack.version, 1); assert.equal(validate(pack, now), true);
    const saved = JSON.parse(JSON.stringify(pack)); assert.deepEqual(saved.courses[0], course);
    assert.equal(saved.courses[0].reviewedOn, '2026-10-04'); assert.equal(saved.courses[0].lessons.at(-1).reviewedOn, '2026-10-29');
    const undated = structuredClone(saved); delete undated.courses[0].reviewedOn;
    for (const item of undated.courses[0].lessons) delete item.reviewedOn;
    assert.equal(validate(undated, now), true);
    assert.match(evidenceHtml(undated.courses[0].lessons.at(-1), undefined), /Quellenzuordnung der Ausgangslektion/);
    assert.equal(validate(pack, pack.expiresAt), false);
  } finally { if (oldSecret === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = oldSecret; }
});

function readerHtml(relative, name, props) {
  let stateIndex = 0;
  const hooks = { ...React, useState(initial) { return [stateIndex++ === 1 ? 6 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; } };
  const file = path.join(root, relative), router = { isReady: false, query: {}, asPath: `/kurse/${courseId}` };
  const loader = createLoader({ react: hooks, 'next/router': { useRouter: () => router } });
  const { code } = swc.transformSync(fs.readFileSync(file, 'utf8') + `\nexport { ${name} };`, { filename: file,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => id === 'react' ? hooks : id === 'next/router' ? { useRouter: () => router }
    : id.endsWith('.module.css') ? { __esModule: true, default: {} } : id.startsWith('.') ? loader(path.resolve(path.dirname(file), path.extname(id) ? id : `${id}.js`)) : local(id), mod, mod.exports);
  return renderToStaticMarkup(React.createElement(mod.exports[name], props));
}

test('Actual online and offline readers show the complete lesson before closed final sources with its own true review date', () => {
  const online = readerHtml('components/LearningCourse.js', 'LearningContent', { module: course, flashcards: newCards });
  const offline = readerHtml('components/OfflineLearning.js', 'OfflineCourse', { course, expiresAt: Date.now() + 60000, onExpired() {} });
  for (const [html, label] of [[online, 'Alle Quellen dieses Themenbereichs'], [offline, 'Quellen und Prüfstand']]) {
    for (const paragraph of lesson.paragraphs) assert.ok(html.includes(paragraph));
    assert.ok(html.indexOf(label) > html.indexOf(lesson.paragraphs.at(-1)));
    const details = html.match(new RegExp(`<details([^>]*)><summary>${label}<\\/summary>`));
    assert.ok(details); assert.doesNotMatch(details[1], /\bopen\b/);
    for (const url of sourceURLs) assert.ok(html.includes(url));
    assert.match(html, /29\. Oktober 2026/);
  }
});

test('Actual print output contains both complete new cards and places the source directory after their answers', () => {
  const Print = createLoader({
    'next/router': { useRouter: () => ({ query: {}, isReady: true }) },
    '../../components/LearningToolLayout': { __esModule: true, default: ({ children }) => children },
    '../../components/PageMenu': { __esModule: true, default: () => null, closePageMenu() {} },
    '../../components/useFlashcardDeck': { __esModule: true, default: props => ({ ...props, incomplete: false, loading: false }) },
  })('pages/lernen/lernkarten-drucken.js').default;
  const html = renderToStaticMarkup(React.createElement(Print, { cards: newCards, categories: [{ id: 'wald-pflanzen', title: 'Wald & Pflanzen', count: 2 }] }));
  for (const card of newCards) {
    assert.ok(html.includes(card.question) && html.includes(card.answer));
    assert.ok(html.indexOf('<h2 id="lernkarten-quellen">Quellenverzeichnis</h2>') > html.indexOf(card.answer));
  }
  assert.match(html, /29\.10\.2026/); for (const url of sourceURLs) assert.ok(html.includes(url));
});
