// This historical snapshot projects only the separately tested Nov25 fish-gill appendix.
const { fishGillDiagramBaseline } = require('./helpers/fish-gill-addition-nov25.cjs');
const test = require('node:test'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { woodpeckerFootBaselineFixture } = require('./helpers/woodpecker-foot-addition-nov25.cjs');
const { redDeerFlehmenDiagramBaseline } = require('./helpers/red-deer-flehmen-addition-nov25.cjs');
const load = createLoader(woodpeckerFootBaselineFixture());
const getLessonDiagram = fishGillDiagramBaseline(redDeerFlehmenDiagramBaseline(load('lib/lesson-diagrams.js').getLessonDiagram));
const courseId = 'wissen-ausbau-habitat-insektenentwicklung-2026', lessonId = 'tracheen-atmung';

test('The new lesson alone receives a bounded functional airway scheme, with ventilation and diffusion kept distinct', () => {
  const diagram = getLessonDiagram(courseId, lessonId);
  assert.ok(diagram); assert.deepEqual(diagram.steps.map(item => item.title), ['Stigma', 'Tracheennetz', 'Tracheolen', 'Gewebe']);
  assert.match(diagram.note, /landlebenden/); assert.match(diagram.note, /Keine massstäbliche/);
  assert.match(diagram.steps[1].text, /Ventilation kann/); assert.match(diagram.steps[3].text, /Diffusion/);
  assert.equal(getLessonDiagram(courseId, 'haeutung'), null); assert.equal(getLessonDiagram('other-course', lessonId), null);
  const course = load('lib/learning-curriculum.js').getLearningModule(courseId), lesson = course.lessons.find(item => item.id === lessonId);
  assert.deepEqual(lesson.diagram, diagram); assert.equal(lesson.reviewedOn, '2026-11-25'); assert.equal(course.reviewedOn, '2026-10-17');
  const saved = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-diagram-offline-fixture';
  try {
    const now = Date.parse('2026-11-25T08:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'diagram-fixture@example.invalid', paidUntil: '2026-11-27T08:00:00Z' }, now);
    assert.deepEqual(pack.courses[0].lessons.find(item => item.id === lessonId).diagram, diagram);
    assert.equal(load('lib/offline-learning.js').validateOfflinePack(pack, now), true);
  } finally { if (saved === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = saved; }
});

test('The real existing diagram renderer presents all four steps and the visible scope before any lesson sources', () => {
  const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
  const ui = createLoader({ 'next/image': { __esModule: true, default: props => React.createElement('img', props) } });
  const Component = ui('components/LessonDiagram.js').default, diagram = getLessonDiagram(courseId, lessonId);
  const html = renderToStaticMarkup(React.createElement(Component, { diagram }));
  assert.match(html, /Vom Stigma zum Gewebe/); assert.match(html, /landlebenden/); assert.equal((html.match(/<li/g) || []).length, 4);
  assert.ok(html.includes('Luftbewegung und Sauerstoffübertritt')); assert.doesNotMatch(html, /<iframe|<img|<video|https?:/);
});

test('All former lesson diagrams remain full-object identical to the current production baseline', () => {
  const source = execFileSync('git', ['show', '7b69962b0fee40db63096d512b852a4241c90fcb:lib/lesson-diagrams.js'], { cwd: root, encoding: 'utf8' });
  const module = { exports: {} }, code = local('next/dist/build/swc').transformSync(source, { filename: 'lesson-diagrams.js', jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } }).code;
  new Function('module', 'exports', code)(module, module.exports);
  for (const course of load('lib/learning-curriculum.js').learningModules) for (const lesson of course.lessons) {
    if (course.id === courseId && lesson.id === lessonId) continue;
    assert.deepEqual(getLessonDiagram(course.id, lesson.id), module.exports.getLessonDiagram(course.id, lesson.id), `${course.id}/${lesson.id}`);
  }
});
