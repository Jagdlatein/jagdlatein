const { fishLateralLineBaselineFixture } = require('./helpers/fish-lateral-line-addition.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { stripFeatherGrowthAddition, isFeatherGrowthEvidence, isFeatherGrowthCard } = require('./helpers/learning-additions-oct27.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const swc = local('next/dist/build/swc');
const load = createLoader(fishLateralLineBaselineFixture());
const revision = '6860695';
const datasetPath = 'data/learning-expansion-wildlife-dogs-2026-10-16.json';
const courseId = 'wissen-ausbau-hund-ruhe-schlaf-2026';
const lessonId = 'lernen-behalten';
const primary = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5292958/';
const review = 'https://www.frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2021.646022/full';
const cardId = `flash-${courseId}-lernen-behalten-q1`;
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8').replace(/^\uFEFF/, ''));
const gitRead = relative => execFileSync('git', ['show', `${revision}:${relative}`], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });

// Concurrent approved biology content is the same fixture on both sides. The
// unrelated foreign afternoon file is never edited and is pinned by its hash.
const fixtures = new Map([
  ['data/learning-expansion-afternoon-2026-10-16.json', readJson('data/learning-expansion-afternoon-2026-10-16.json')],
  ['data/learning-expansion-biology-2026-10-16.json', readJson('data/learning-expansion-biology-2026-10-16.json')],
]);
function baselineLoader() {
  const cache = new Map();
  return function read(relative) {
    const normalized = relative.replaceAll('\\', '/');
    if (cache.has(normalized)) return cache.get(normalized).exports;
    const mod = { exports: {} }; cache.set(normalized, mod);
    if (fixtures.has(normalized)) { mod.exports = fixtures.get(normalized); return mod.exports; }
    const source = gitRead(normalized);
    if (normalized.endsWith('.json')) { mod.exports = JSON.parse(source.replace(/^\uFEFF/, '')); return mod.exports; }
    const { code } = swc.transformSync(source, { filename: path.join(root, normalized), disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.startsWith('.')
      ? read(path.posix.normalize(path.posix.join(path.posix.dirname(normalized), path.posix.extname(id) ? id : `${id}.js`))) : local(id), mod, mod.exports);
    return mod.exports;
  };
}
const before = baselineLoader();
const raw = readJson(datasetPath);
const originalRaw = JSON.parse(gitRead(datasetPath));
const rawCourse = raw.modules.find(item => item.id === courseId);
const originalCourse = originalRaw.modules.find(item => item.id === courseId);
const curriculum = load('lib/learning-curriculum.js');
const course = curriculum.getLearningModule(courseId);
const lesson = course.lessons.find(item => item.id === lessonId);
const cards = load('lib/learning-flashcards.js').getFlashcards();
const card = cards.find(item => item.id === cardId);
const Evidence = load('components/LessonEvidence.js').default;
const evidenceHtml = (current, date) => renderToStaticMarkup(React.createElement(Evidence, { lesson: current, reviewedOn: date, embedded: true }));

test('Only one appended sleep lesson, question, evidence record and two sources change the exact raw dataset', () => {
  assert.equal(originalCourse.lessons.length, 4); assert.equal(originalCourse.questions.length, 16); assert.equal(originalCourse.sources.length, 5);
  assert.equal(rawCourse.lessons.length, 5); assert.equal(rawCourse.questions.length, 17); assert.equal(rawCourse.sources.length, 7);
  assert.deepEqual(rawCourse.lessons.slice(0, 4), originalCourse.lessons);
  assert.deepEqual(rawCourse.questions.slice(0, 16), originalCourse.questions);
  assert.deepEqual(rawCourse.sources.slice(0, 5), originalCourse.sources);
  assert.equal(rawCourse.lessons.at(-1).id, lessonId);
  assert.deepEqual(rawCourse.sources.slice(5).map(item => item.url), [primary, review]);
  const restored = structuredClone(raw);
  restored.modules = restored.modules.map(stripFeatherGrowthAddition);
  restored.evidence = restored.evidence.filter(item => !isFeatherGrowthEvidence(item));
  const target = restored.modules.find(item => item.id === courseId);
  target.lessons.pop(); target.questions.pop(); target.sources.splice(-2);
  assert.equal(restored.evidence.at(-1).moduleId, courseId); assert.equal(restored.evidence.pop().lessonId, lessonId);
  assert.deepEqual(restored, originalRaw);
});

test('The foreign afternoon content stays untouched; the exact independently owned crop-milk appendix is isolated', () => {
  const foreign = fs.readFileSync(path.join(root, 'data/learning-expansion-afternoon-2026-10-16.json'));
  assert.equal(createHash('sha256').update(foreign).digest('hex'), '23e6e8fc8fd6c3e1b5ad115b92036b901d0dc3613332d4edd0deb0c283a607c9');
  const relative = 'data/learning-expansion-biology-2026-10-16.json';
  const current = structuredClone(fixtures.get(relative)), original = JSON.parse(gitRead(relative));
  const target = current.modules.find(item => item.id === 'wissen-ausbau-biologie-verdauungsvergleich-2026');
  if (target.lessons.at(-1).id === 'kropfmilch') {
    assert.equal(target.lessons.pop().id, 'kropfmilch');
    assert.deepEqual(target.questions.splice(-2).map(item => item.id), ['kropfmilch-zellherkunft', 'kropfmilch-beide-eltern']);
    assert.equal(target.sources.splice(-4).length, 4);
    assert.equal(current.evidence.pop().lessonId, 'kropfmilch');
  }
  assert.deepEqual(current, original);
});

test('All previous prepared course objects and every previous card remain exact and in order', () => {
  const oldModules = before('lib/learning-curriculum.js').learningModules;
  assert.equal(curriculum.learningModules.length, oldModules.length);
  const restored = curriculum.learningModules.map(stripFeatherGrowthAddition).map(item => {
    if (item.id !== courseId) return item;
    return { ...item, lessons: item.lessons.slice(0, -1), questions: item.questions.slice(0, -1), sources: item.sources.slice(0, -2) };
  });
  assert.deepEqual(restored, oldModules);
  const oldCards = before('lib/learning-flashcards.js').getFlashcards();
  assert.equal(cards.filter(item => !isFeatherGrowthCard(item)).length, oldCards.length + 1);
  assert.deepEqual(cards.filter(item => item.id !== cardId && !isFeatherGrowthCard(item)), oldCards);
  assert.deepEqual(cards.slice(0, 116), oldCards.slice(0, 116));
});

test('The complete new lesson teaches acquisition versus later retrieval with its actual null result and visible limits', () => {
  const text = lesson.paragraphs.join(' ');
  assert.ok(text.split(/\s+/).length >= 140 && text.split(/\s+/).length <= 170);
  assert.match(text, /später noch abrufbar/); assert.match(text, /keine nachweisbare Verbesserung gegenüber ihrem Ausgangstest/);
  assert.match(text, /fachliche Interpretation, keine unabhängige Wiederholung/);
  assert.match(text, /optimale Schlafdauer.*fester Trainingsplan.*nicht/);
  assert.doesNotMatch(text, /\d|Prozent|Minuten|Stunden|Park|Auto|Schlafentzug|EEG-Wert/);
  assert.equal(course.reviewedOn, '2026-10-16'); assert.equal(lesson.reviewedOn, '2026-10-27');
  assert.equal(lesson.evidence.length, 2);
  for (const claim of lesson.evidence) assert.deepEqual(claim.sources.map(item => item.url), [primary, review]);
  const record = raw.evidence.find(item => item.moduleId === courseId && item.lessonId === lessonId);
  assert.match(record.claims[1].sourceRoles[review], /keine zweite Datenerhebung.*Replikation/);
  for (const old of course.lessons.slice(0, -1)) assert.ok(old.evidence.every(claim => claim.sources.every(source => ![primary, review].includes(source.url))));
});

test('Exactly one meaningful affirmative question yields one correctly sourced dated card and the existing deep link', () => {
  const questions = course.questions.filter(item => item.lessonId === lessonId);
  assert.equal(questions.length, 1); assert.equal(cards.filter(item => item.moduleId === courseId && item.lessonId === lessonId).length, 1);
  const [question] = questions, [answer] = question.answers.filter(item => question.correct.includes(item.id));
  assert.equal(answer.text, 'Ob die gelernte Verknüpfung nach einem zeitlichen Abstand noch abrufbar ist.');
  assert.equal(card.question, question.q); assert.equal(card.answer, answer.text); assert.equal(card.explanation, question.explain);
  assert.equal(card.reviewedOn, '2026-10-27'); assert.equal(card.sourceScope, 'lesson');
  assert.deepEqual(card.sources.map(item => item.url), [primary, review]); assert.equal(card.options, undefined);
  assert.equal(card.courseHref, `/kurse/${courseId}#lesson-${lessonId}`);
  assert.match(evidenceHtml(lesson, course.reviewedOn), /27\. Oktober 2026/);
  assert.doesNotMatch(evidenceHtml(lesson, course.reviewedOn), /16\. Oktober 2026/);
});

test('The existing course category and actual text search discover the new full lesson without a duplicate course', () => {
  assert.equal(curriculum.learningModules.filter(item => item.id === courseId).length, 1);
  const location = load('lib/learning-topic-tree.js').getLearningTopicLocation(courseId);
  assert.equal(location.categorySlug, 'hundewesen');
  for (const query of ['Gedächtniskonsolidierung', 'späteres Behalten']) {
    const result = load('lib/learning-search.js').searchLearning({ query, category: 'hundewesen' });
    const found = result.results.find(item => item.href === card.courseHref);
    assert.ok(found, query); assert.equal(found.lessonTitle, lesson.title);
  }
});

test('Real offline packs and JSON restoration retain the new full lesson, scoped evidence and date without changing the schema', () => {
  const oldSecret = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'unit-test-retention-not-a-credential';
  try {
    const now = Date.parse('2026-10-27T12:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'retention@example.invalid', paidUntil: '2026-10-29T12:00:00Z' }, now);
    const valid = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(pack.version, 1); assert.equal(valid(pack, now), true);
    const saved = JSON.parse(JSON.stringify(pack));
    assert.deepEqual(saved.courses[0], course); assert.deepEqual(saved.courses[0].lessons.at(-1), lesson);
    assert.match(evidenceHtml(saved.courses[0].lessons.at(-1), saved.courses[0].reviewedOn), /27\. Oktober 2026/);
    const undated = structuredClone(saved); delete undated.courses[0].reviewedOn;
    for (const item of undated.courses[0].lessons) delete item.reviewedOn;
    assert.equal(valid(undated, now), true);
    assert.match(evidenceHtml(undated.courses[0].lessons.at(-1), undefined), /Quellenzuordnung der Ausgangslektion/);
    assert.equal(valid(pack, pack.expiresAt), false);
  } finally { if (oldSecret === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = oldSecret; }
});

function readerHtml(relative, name, props) {
  let stateIndex = 0;
  const hooks = { ...React, useState(initial) { return [stateIndex++ === 1 ? 4 : typeof initial === 'function' ? initial() : initial, () => {}]; }, useRef(initial) { return { current: initial }; } };
  const filename = path.join(root, relative);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8') + `\nexport { ${name} };`, { filename,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} }, loader = createLoader({ react: hooks, 'next/router': { useRouter: () => ({ isReady: false, query: {}, asPath: `/kurse/${courseId}` }) } });
  new Function('require', 'module', 'exports', code)(id => id === 'react' ? hooks : id === 'next/router' ? { useRouter: () => ({ isReady: false, query: {}, asPath: `/kurse/${courseId}` }) }
    : id.endsWith('.module.css') ? { __esModule: true, default: {} } : id.startsWith('.') ? loader(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), mod, mod.exports);
  return renderToStaticMarkup(React.createElement(mod.exports[name], props));
}

test('The actual online and offline readers render the full lesson before their closed final evidence sections', () => {
  const online = readerHtml('components/LearningCourse.js', 'LearningContent', { module: course, flashcards: [card] });
  const offline = readerHtml('components/OfflineLearning.js', 'OfflineCourse', { course, expiresAt: Date.now() + 60000, onExpired() {} });
  for (const [html, label] of [[online, 'Alle Quellen dieses Themenbereichs'], [offline, 'Quellen und Prüfstand']]) {
    for (const paragraph of lesson.paragraphs) assert.ok(html.includes(paragraph));
    assert.ok(html.indexOf(label) > html.indexOf(lesson.paragraphs.at(-1)));
    const sourceDetails = html.match(new RegExp(`<details([^>]*)><summary>${label}<\\/summary>`));
    assert.ok(sourceDetails); assert.doesNotMatch(sourceDetails[1], /\bopen\b/);
    assert.ok(html.includes(primary) && html.includes(review)); assert.match(html, /27\. Oktober 2026/);
  }
});

test('The actual print pipeline preserves the new question, answer, date and final source directory', () => {
  const Print = createLoader({
    'next/router': { useRouter: () => ({ query: {}, isReady: true }) },
    '../../components/LearningToolLayout': { __esModule: true, default: ({ children }) => children },
    '../../components/PageMenu': { __esModule: true, default: () => null, closePageMenu() {} },
    '../../components/useFlashcardDeck': { __esModule: true, default: props => ({ ...props, incomplete: false, loading: false }) },
  })('pages/lernen/lernkarten-drucken.js').default;
  const html = renderToStaticMarkup(React.createElement(Print, { cards: [card], categories: [{ id: 'hundewesen', title: 'Hundewesen', count: 1 }] }));
  assert.ok(html.includes(card.question) && html.includes(card.answer));
  assert.match(html, /27\.10\.2026/); assert.ok(html.indexOf('Quellenverzeichnis') > html.indexOf(card.answer));
  assert.ok(card.sources.every(source => html.includes(source.url)));
});
