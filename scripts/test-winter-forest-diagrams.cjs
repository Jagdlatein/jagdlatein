// Integration checks for two original, explicitly bounded reading aids.
const test = require('node:test'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const load = createLoader(), React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const { getLessonDiagram } = load('lib/lesson-diagrams.js');
const { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const targets = [
  ['wissen-vertiefung-wild-alpine-winterstrategien', 'aufwaermphasen'],
  ['wissen-ausbau-waldverjuengung-verbiss', 'stockausschlag-wurzelbrut'],
];
const isNew = (course, lesson) => targets.some(([a,b]) => a === course && b === lesson);

test('Both actual lesson readers receive their complete original schematic and visible interpretation limits', () => {
  const Diagram = load('components/LessonDiagram.js').default;
  for (const [courseId, lessonId] of targets) {
    const lesson = getLearningModule(courseId).lessons.find(item => item.id === lessonId);
    assert.ok(lesson, `${courseId}/${lessonId}`);
    assert.deepEqual(lesson.diagram, getLessonDiagram(courseId, lessonId));
    assert.ok(lesson.diagram);
    const html = renderToStaticMarkup(React.createElement(Diagram, { diagram: lesson.diagram }));
    for (const text of [lesson.diagram.title, lesson.diagram.note, ...lesson.diagram.steps.flatMap(item => [item.title, item.text])]) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /<img|<video|<dialog|<details|https?:\/\//);
    assert.doesNotMatch(JSON.stringify(lesson.diagram), /\d|Prozent|Temperaturmessung|garantiert/);
  }
  const winter = getLessonDiagram(...targets[0]), forest = getLessonDiagram(...targets[1]);
  assert.match(winter.note, /Alpenmurmeltier.*wiederholen.*keine gemessene Temperaturkurve/);
  assert.match(winter.steps.at(-1).text, /vorübergehend.*zum Winterschlaf/);
  assert.match(forest.note, /Herkunftsschema.*Kein zeitlicher Ablauf/);
  assert.deepEqual(forest.steps.map(step => step.title), ['Sämling', 'Stockausschlag', 'Wurzelbrut']);
});

test('Every existing diagram is preserved exactly against the published d5bb4f0 module', () => {
  const source = execFileSync('git', ['show', 'd5bb4f0cebe387c6875eea9f0e40071c84ef3b8b:lib/lesson-diagrams.js'], { cwd: root, encoding: 'utf8' });
  const { code } = local('next/dist/build/swc').transformSync(source, { filename: 'lesson-diagrams.js', jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  const prior = { exports: {} }; new Function('module', 'exports', code)(prior, prior.exports);
  let existingCount = 0;
  for (const course of learningModules) for (const lesson of course.lessons) {
    const before = prior.exports.getLessonDiagram(course.id, lesson.id);
    if (isNew(course.id, lesson.id)) { assert.equal(before, null); continue; }
    if (before) existingCount++;
    assert.deepEqual(getLessonDiagram(course.id, lesson.id), before, `${course.id}/${lesson.id}`);
  }
  assert.equal(existingCount, 9);
});

test('An isolated offline pack includes both schematics, full lessons and exact evidence without changing its access expiry', () => {
  const before = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-winter-forest-diagram-test';
  try {
    const now = Date.parse('2026-11-08T15:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: targets.map(item => item[0]), sounds: false }, { email: 'diagram-check@example.invalid', paidUntil: '2026-11-10T15:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(validate(pack, now), true); assert.equal(validate(pack, pack.expiresAt), false);
    for (const [courseId, lessonId] of targets) {
      const course = getLearningModule(courseId), lesson = course.lessons.find(item => item.id === lessonId);
      const storedCourse = pack.courses.find(item => item.id === courseId), stored = storedCourse.lessons.find(item => item.id === lessonId);
      assert.deepEqual(stored.paragraphs, lesson.paragraphs); assert.deepEqual(stored.diagram, lesson.diagram); assert.deepEqual(stored.evidence, lesson.evidence);
      assert.equal(stored.reviewedOn, '2026-11-08'); assert.equal(storedCourse.reviewedOn, course.reviewedOn);
    }
  } finally { if (before === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = before; }
});
