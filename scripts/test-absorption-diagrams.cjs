// Scope and preservation of two original anatomy reading aids.
const test = require('node:test'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const load = createLoader(), React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const { getLessonDiagram } = load('lib/lesson-diagrams.js');
const { learningModules, getLearningModule } = load('lib/learning-curriculum.js');
const targets = [
  ['wissen-ausbau-biologie-verdauungsvergleich-2026', 'zotten-mikrovilli'],
  ['wissen-pruefung-bodenwasser-wurzelraum-2026', 'wurzelhaare'],
];
const isNew = (course, lesson) => targets.some(([a,b]) => a === course && b === lesson);

test('Animal and plant diagrams distinguish organ, tissue or cell levels without invented size, timing or species data', () => {
  const animal = getLessonDiagram(...targets[0]), plant = getLessonDiagram(...targets[1]);
  assert.deepEqual(animal.steps.map(item => item.title), ['Darmzotte', 'Aufnahmezelle', 'Mikrovilli']);
  assert.match(animal.note, /Säuger-Dünndarm.*kein maßstäblicher Vergleich und kein zeitlicher Ablauf/);
  assert.match(animal.steps[0].text, /Dünndarmschleimhaut.*Epithelzellen/);
  assert.match(animal.steps[2].text, /Vorsprünge.*Aufnahmezelle.*Oberfläche/);
  assert.deepEqual(plant.steps.map(item => item.title), ['Wurzel', 'Rhizodermiszelle', 'Wurzelhaar']);
  assert.match(plant.note, /jungen Wurzel mit Wurzelhaaren/);
  assert.match(plant.steps[0].text, /mehrzelliges Pflanzenorgan/);
  assert.match(plant.steps[2].text, /Ausstülpung derselben Zelle.*kein eigenes Wurzelorgan/);
  for (const diagram of [animal, plant]) assert.doesNotMatch(JSON.stringify(diagram), /\d|Prozent|Mikrometer|Diagnose|Therapie|Filtergarantie/);
  assert.equal(getLessonDiagram(targets[0][0], 'resorption'), null);
  assert.equal(getLessonDiagram(targets[1][0], 'endodermis'), null);
});

test('Both actual lesson objects and the existing renderer show the complete diagrams without borrowed imagery or another window', () => {
  const Diagram = load('components/LessonDiagram.js').default;
  for (const [courseId, lessonId] of targets) {
    const lesson = getLearningModule(courseId).lessons.find(item => item.id === lessonId);
    assert.ok(lesson); assert.deepEqual(lesson.diagram, getLessonDiagram(courseId, lessonId));
    const html = renderToStaticMarkup(React.createElement(Diagram, { diagram: lesson.diagram }));
    for (const text of [lesson.diagram.title, lesson.diagram.note, ...lesson.diagram.steps.flatMap(item => [item.title,item.text])]) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /<img|<video|<dialog|<details|https?:\/\//);
  }
});

test('Every diagram that existed at e6b1d55 remains exactly the same', () => {
  const source = execFileSync('git', ['show', 'e6b1d550d550e14a5571fa4caf43284758fe0c37:lib/lesson-diagrams.js'], { cwd: root, encoding: 'utf8' });
  const { code } = local('next/dist/build/swc').transformSync(source, { filename: 'lesson-diagrams.js', jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  const prior = { exports: {} }; new Function('module','exports',code)(prior,prior.exports);
  for (const course of learningModules) for (const lesson of course.lessons) {
    if (isNew(course.id,lesson.id)) continue;
    if (course.id === 'wissen-vertiefung-wild-alpine-winterstrategien' && lesson.id === 'aufwaermphasen') continue;
    if (course.id === 'wissen-ausbau-waldverjuengung-verbiss' && lesson.id === 'stockausschlag-wurzelbrut') continue;
    assert.deepEqual(getLessonDiagram(course.id,lesson.id), prior.exports.getLessonDiagram(course.id,lesson.id), `${course.id}/${lesson.id}`);
  }
});

test('A synthetic expiring offline pack keeps both diagrams and their exact lesson evidence and dates', () => {
  const before = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-absorption-diagram-test-only';
  try {
    const now = Date.parse('2026-11-08T12:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds: targets.map(item => item[0]), sounds: false }, { email: 'diagram-fixture@example.invalid', paidUntil: '2026-11-10T12:00:00Z' }, now);
    const validate = load('lib/offline-learning.js').validateOfflinePack;
    assert.equal(validate(pack,now),true); assert.equal(validate(pack,pack.expiresAt),false);
    for (const [courseId,lessonId] of targets) {
      const course = getLearningModule(courseId), lesson = course.lessons.find(item => item.id === lessonId);
      const storedCourse = pack.courses.find(item => item.id === courseId), stored = storedCourse.lessons.find(item => item.id === lessonId);
      assert.deepEqual(stored.diagram,lesson.diagram); assert.deepEqual(stored.evidence,lesson.evidence);
      assert.equal(stored.reviewedOn,'2026-11-08'); assert.equal(storedCourse.reviewedOn,course.reviewedOn);
    }
  } finally { if (before === undefined) delete process.env.JL_SESSION_SECRET; else process.env.JL_SESSION_SECRET = before; }
});
