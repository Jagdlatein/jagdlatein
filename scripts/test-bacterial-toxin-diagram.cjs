// Original reading aid: scope, actual renderer and unchanged older diagrams.
const test = require('node:test'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const load = createLoader(), React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const { getLessonDiagram } = load('lib/lesson-diagrams.js');
const { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const courseId = 'wissen-ausbau-revierpraxis-lebensmittelbakterien-2026', lessonId = 'vorgebildete-toxine';
const course = getLearningModule(courseId), lesson = course.lessons.find(item => item.id === lessonId);

test('Only the exact new toxin lesson receives the original S.aureus comparison with its immediate food-safety limit', () => {
  const diagram = getLessonDiagram(courseId, lessonId);
  assert.deepEqual(lesson.diagram, diagram);
  assert.equal(diagram.steps.length, 3);
  assert.match(diagram.note, /Eigenes Begriffsschema.*Staphylococcus aureus/);
  assert.match(diagram.note, /keine Kochschritte.*Kein Nachweis der Genusstauglichkeit/);
  assert.match(diagram.steps[1].text, /kein lebender Keim und vermehrt sich nicht/);
  assert.match(diagram.steps[2].text, /diese Enterotoxine nicht zuverlässig/);
  assert.doesNotMatch(JSON.stringify(diagram), /\d|Minuten|Stunden|Grad|Prozent|steril|alle Toxine/i);
  assert.equal(getLessonDiagram(courseId, 'bakteriensporen'), null);
  assert.equal(getLessonDiagram('other-course', lessonId), null);
});

test('The actual schematic renderer presents all comparisons and the boundary as text without a borrowed or fictitious photo', () => {
  const Diagram = load('components/LessonDiagram.js').default;
  const html = renderToStaticMarkup(React.createElement(Diagram, { diagram: lesson.diagram }));
  assert.ok(html.includes(lesson.diagram.title)); assert.ok(html.includes(lesson.diagram.note));
  for (const step of lesson.diagram.steps) { assert.ok(html.includes(step.title)); assert.ok(html.includes(step.text)); }
  assert.doesNotMatch(html, /<img|<video|<dialog|<details|https?:\/\//);
});

test('Every pre-existing course lesson retains its exact old diagram and unrelated lessons gain no illustration', () => {
  const oldSource = execFileSync('git', ['show', '0d9e2f5f161800455808996c1ace0ef56951bdf5:lib/lesson-diagrams.js'], { cwd: root, encoding: 'utf8' });
  const { code } = local('next/dist/build/swc').transformSync(oldSource, { filename: 'lesson-diagrams.js', jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  const prior = { exports: {} }; new Function('module', 'exports', code)(prior, prior.exports);
  for (const item of learningModules) for (const part of item.lessons) {
    if (item.id === courseId && part.id === lessonId) continue;
    if (item.id === 'wissen-lebensraeume-biotopverbund' && part.id === 'biotop-biozoenose') continue;
    if (item.id === 'wissen-ausbau-biologie-verdauungsvergleich-2026' && part.id === 'zotten-mikrovilli') continue;
    if (item.id === 'wissen-pruefung-bodenwasser-wurzelraum-2026' && part.id === 'wurzelhaare') continue;
    assert.deepEqual(getLessonDiagram(item.id, part.id), prior.exports.getLessonDiagram(item.id, part.id), `${item.id}/${part.id}`);
  }
});

test('An isolated expiring offline pack preserves the same original comparison and lesson-specific evidence', () => {
  const previous = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-toxin-diagram-test-only';
  try {
    const now = Date.parse('2026-11-08T12:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: [courseId], sounds: false }, { email: 'diagram-fixture@example.invalid', paidUntil: '2026-11-10T12:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(validate(pack, now), true); assert.equal(validate(pack, pack.expiresAt), false);
    const saved = pack.courses[0].lessons.find(item => item.id === lessonId);
    assert.deepEqual(saved.diagram, lesson.diagram); assert.deepEqual(saved.evidence, lesson.evidence);
    assert.equal(saved.reviewedOn, '2026-11-08'); assert.equal(pack.courses[0].reviewedOn, '2026-10-17');
  } finally { if (previous === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = previous; }
});
