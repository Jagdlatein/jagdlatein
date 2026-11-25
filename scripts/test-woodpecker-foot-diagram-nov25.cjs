const test = require('node:test'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader(), { getLessonDiagram } = load('lib/lesson-diagrams.js');
const courseId = 'wissen-ausbau-biologie-vogelkoerper-2026', lessonId = 'spechtfuss-kletterhaltung';

test('Only the named lesson gains a bounded four-toed comparison, and every former diagram remains exactly preserved', () => {
  const diagram = getLessonDiagram(courseId, lessonId);
  assert.equal(diagram.type, 'woodpecker-foot'); assert.equal(diagram.steps.length, 4);
  assert.match(diagram.note, /ausdrücklich vierzehigen/); assert.match(diagram.note, /keine genaue Kletterhaltung/); assert.match(diagram.note, /keine Regel für sämtliche/);
  const source = execFileSync('git', ['show', 'f1926db0ab56f51fab3a5666dc36b65e756c29d7:lib/lesson-diagrams.js'], { cwd: root, encoding: 'utf8' });
  const prior = { exports: {} }, code = local('next/dist/build/swc').transformSync(source, { filename: 'lesson-diagrams.js', jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } }).code;
  new Function('module','exports',code)(prior,prior.exports);
  let oldLessons = 0;
  for (const course of load('lib/learning-curriculum.js').learningModules) for (const lesson of course.lessons) {
    if (course.id === courseId && lesson.id === lessonId) { assert.deepEqual(lesson.diagram, diagram); continue; }
    oldLessons++; assert.deepEqual(getLessonDiagram(course.id,lesson.id),prior.exports.getLessonDiagram(course.id,lesson.id),`${course.id}/${lesson.id}`);
  }
  assert.equal(oldLessons, 903); assert.equal(getLessonDiagram('unrelated',lessonId),null);
});

test('The actual lesson renderer shows an original accessible SVG and all functional limits without a foreign image or extra window', () => {
  const Component = load('components/LessonDiagram.js').default;
  const html = renderToStaticMarkup(React.createElement(Component, { diagram: getLessonDiagram(courseId,lessonId) }));
  assert.match(html, /<svg[^>]*role="img"/); assert.match(html, /zwei Zehen nach vorn und zwei nach hinten/);
  assert.match(html, /Beweglichkeit einblenden/); assert.match(html, /Abstrakte Zehensymbole/); assert.match(html, /keine vermessene Stellung/);
  assert.equal((html.match(/<li\b/g) || []).length,4); assert.equal((html.match(/type="checkbox"/g) || []).length,1);
  assert.doesNotMatch(html, /<img|<iframe|<video|<dialog|<details|https?:\/\//);
  for (const step of getLessonDiagram(courseId,lessonId).steps) assert.ok(html.includes(step.text));
});

test('A native checkbox reveals possible movement and can return to the ground pattern without navigation, storage or measurement claims', async () => {
  const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom');
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://diagram-fixture.invalid/lesson' });
  const saved = new Map(['window','document','navigator','IS_REACT_ACT_ENVIRONMENT'].map(key => [key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  for (const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,IS_REACT_ACT_ENVIRONMENT:true})) Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
  let ui; let writes = 0; dom.window.Storage.prototype.setItem = () => writes++;
  try {
    const { createRoot } = local('react-dom/client'); ui = createRoot(dom.window.document.getElementById('root'));
    await React.act(async () => ui.render(React.createElement(load('components/LessonDiagram.js').default,{diagram:getLessonDiagram(courseId,lessonId)})));
    const doc = dom.window.document, checkbox = doc.querySelector('input');
    assert.equal(checkbox.checked,false); assert.equal(doc.querySelectorAll('[stroke-dasharray]').length,0);
    await React.act(async () => checkbox.click());
    assert.equal(checkbox.checked,true); assert.equal(doc.querySelectorAll('[stroke-dasharray]').length,1);
    assert.match(doc.querySelector('svg').getAttribute('aria-label'),/mögliche Beweglichkeit.*keine genaue Kletterhaltung/);
    assert.match(doc.querySelector('[aria-live]').textContent,/momentane Haltung/);
    await React.act(async () => checkbox.click());
    assert.equal(checkbox.checked,false); assert.equal(doc.querySelectorAll('[stroke-dasharray]').length,0);
    assert.equal(writes,0); assert.equal(dom.window.location.href,'https://diagram-fixture.invalid/lesson');
  } finally { if(ui) await React.act(async()=>ui.unmount()); dom.window.close(); for(const [key,value] of saved) value ? Object.defineProperty(globalThis,key,value) : delete globalThis[key]; }
});

test('An isolated offline pack retains the complete new explanation and graphic fallback without changing course or access dates', () => {
  const before = process.env.JL_SESSION_SECRET; process.env.JL_SESSION_SECRET = 'isolated-woodpecker-diagram-offline-fixture';
  try {
    const now = Date.parse('2026-11-25T09:00:00Z');
    const pack = load('lib/offline-learning-server.js').createOfflinePack({ courseIds:[courseId], sounds:false },{email:'diagram-fixture@example.invalid',paidUntil:'2026-11-27T09:00:00Z'},now);
    const saved = pack.courses[0].lessons.find(lesson=>lesson.id===lessonId);
    assert.deepEqual(saved.diagram,getLessonDiagram(courseId,lessonId)); assert.equal(saved.diagram.steps.length,4);
    assert.equal(saved.reviewedOn,'2026-11-25'); assert.equal(pack.courses[0].reviewedOn,'2026-10-16');
    assert.equal(load('lib/offline-learning.js').validateOfflinePack(pack,now),true);
  } finally { if(before===undefined)delete process.env.JL_SESSION_SECRET;else process.env.JL_SESSION_SECRET=before; }
});
