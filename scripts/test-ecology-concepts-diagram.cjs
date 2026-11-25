// This historical snapshot projects only the separately tested Nov25 fish-gill appendix.
const { fishGillDiagramBaseline } = require('./helpers/fish-gill-addition-nov25.cjs');
// An original reading aid, not a photo or a claim of full exam coverage.
const test = require('node:test'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { assertDiagramHistory, laterPublished } = require('./helpers/lesson-diagram-history-nov25.cjs');
const { redDeerFlehmenDiagramBaseline } = require('./helpers/red-deer-flehmen-addition-nov25.cjs');
const load = createLoader(), React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const getLessonDiagram = fishGillDiagramBaseline(redDeerFlehmenDiagramBaseline(load('lib/lesson-diagrams.js').getLessonDiagram));
const { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const courseId = 'wissen-lebensraeume-biotopverbund', lessonId = 'biotop-biozoenose';

test('The concept comparison keeps living community and habitat distinct and shows their interaction together', () => {
  const diagram = getLessonDiagram(courseId, lessonId);
  assert.ok(diagram); assert.equal(diagram.steps.length, 3);
  assert.deepEqual(diagram.steps.map(step => step.title), ['Biotop', 'Biozönose', 'Ökosystem']);
  assert.match(diagram.note, /Eigenes Begriffsschema, keine räumliche Aufteilung/);
  assert.match(diagram.steps[0].text, /Lebensraum einer Lebensgemeinschaft/);
  assert.match(diagram.steps[1].text, /Lebewesen verschiedener Arten/);
  assert.match(diagram.steps[2].text, /unbelebte Umwelt.*Wechselwirkungen/);
  assert.equal(getLessonDiagram(courseId, 'habitat-nische'), null);
  assert.equal(getLessonDiagram('unknown-course', lessonId), null);
  assert.doesNotMatch(JSON.stringify(diagram), /\d|Schutzgebiet|Mindestgröße|Abschuss|Maßstab/);
});

test('The actual lesson and renderer present the original comparison openly without another window or borrowed image', () => {
  const lesson = getLearningModule(courseId).lessons.find(item => item.id === lessonId);
  assert.ok(lesson); assert.deepEqual(lesson.diagram, getLessonDiagram(courseId, lessonId));
  const Diagram = load('components/LessonDiagram.js').default;
  const html = renderToStaticMarkup(React.createElement(Diagram, { diagram: lesson.diagram }));
  for (const text of [lesson.diagram.title, lesson.diagram.note, ...lesson.diagram.steps.flatMap(step => [step.title, step.text])]) assert.ok(html.includes(text));
  assert.doesNotMatch(html, /<img|<video|<dialog|<details|https?:\/\//);
});

test('Every diagram that existed at 98fc900 retains its complete original value', () => {
  const oldSource = execFileSync('git', ['show', '98fc900a6825bfa1c1c7f3520814eb954e4498f5:lib/lesson-diagrams.js'], { cwd: root, encoding: 'utf8' });
  const { code } = local('next/dist/build/swc').transformSync(oldSource, { filename: 'lesson-diagrams.js', jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  const prior = { exports: {} }; new Function('module', 'exports', code)(prior, prior.exports);
  const seen = new Set();
  for (const item of learningModules) for (const lesson of item.lessons) {
    const kind = assertDiagramHistory('ecology', prior.exports.getLessonDiagram, getLessonDiagram, item.id, lesson.id);
    if (kind === 'published-addition') seen.add(`${item.id}/${lesson.id}`);
  }
  assert.deepEqual([...seen].sort(), [...laterPublished.ecology].sort());
});

test('A synthetic expiring offline pack preserves the comparison and its exact lesson evidence', () => {
  const previous = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-ecology-diagram-test-only';
  try {
    const now = Date.parse('2026-11-08T12:00:00Z'), course = getLearningModule(courseId);
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'diagram-fixture@example.invalid', paidUntil: '2026-11-10T12:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(validate(pack, now), true); assert.equal(validate(pack, pack.expiresAt), false);
    const lesson = course.lessons.find(item => item.id === lessonId), saved = pack.courses[0].lessons.find(item => item.id === lessonId);
    assert.deepEqual(saved.diagram, lesson.diagram); assert.deepEqual(saved.evidence, lesson.evidence);
    assert.equal(saved.reviewedOn, '2026-11-08'); assert.equal(pack.courses[0].reviewedOn, course.reviewedOn);
  } finally { if (previous === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = previous; }
});
