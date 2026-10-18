const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const fs = require('node:fs');
const path = require('node:path');
function loadOffline(overrides, expose = false) {
  if (!expose) return createLoader(overrides)('components/OfflineLearning.js');
  const filename = path.join(__dirname, '../components/OfflineLearning.js');
  const source = fs.readFileSync(filename, 'utf8') + '\nexport { OfflineCourse };';
  const { code } = local('next/dist/build/swc').transformSync(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} }, load = createLoader(overrides);
  new Function('require', 'module', 'exports', code)(id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    return id.startsWith('.') ? load(path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')) : local(id);
  }, mod, mod.exports);
  return mod.exports;
}

const text = node => node == null || typeof node === 'boolean' ? '' : Array.isArray(node) ? node.map(text).join('') : typeof node === 'object' ? text(node.props?.children) : String(node);
function all(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => all(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...all(node.props?.children, predicate)];
}
const field = (tree, label) => all(tree, n => n.type === 'label' && text(n).startsWith(label))[0]?.props.children.find(n => n?.type === 'select');

function engine() {
  const slots = []; let cursor = 0, pending = [], changed = false;
  return {
    hooks: { ...React,
      useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, next => { const value = typeof next === 'function' ? next(slots[i].value) : next; if (value !== slots[i].value) changed = true; slots[i].value = value; }]; },
      useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
      useEffect(callback, deps) { const i = cursor++, old = slots[i]; if (!old || deps.some((v, j) => v !== old.deps[j])) { slots[i] = { deps, cleanup: old?.cleanup }; pending.push(() => { slots[i].cleanup?.(); slots[i].cleanup = callback(); }); } },
    },
    render(fn) { cursor = 0; changed = false; return fn(); },
    flush() { const queue = pending; pending = []; queue.forEach(fn => fn()); },
    changed: () => changed,
    dispose() { slots.forEach(slot => slot.cleanup?.()); },
  };
}

function fixture() {
  process.env.JL_SESSION_SECRET = 'test-offline-reader-fixture';
  return createLoader()('lib/offline-learning-server.js').createOfflinePack({ courseIds: ['wissen-gams-steinbock'], sounds: true }, { email: 'reader@example.invalid', paidUntil: new Date(Date.now() + 3600000).toISOString() });
}

function setup(pack = fixture()) {
  const e = engine(), listeners = new Map(), timers = new Set();
  const keys = ['window', 'navigator', 'document', 'setInterval', 'clearInterval', 'fetch'];
  const saved = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const events = { addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); }, removeEventListener(name, fn) { listeners.get(name)?.delete(fn); } };
  let identity = { ok: true, json: async () => ({ accountKey: pack.accountKey }) }, removals = 0;
  const globals = { window: { ...events, isSecureContext: false }, navigator: { onLine: false }, document: { ...events, querySelector: () => null }, setInterval(fn) { timers.add(fn); return fn; }, clearInterval(fn) { timers.delete(fn); }, fetch: async () => identity };
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  const library = createLoader()('lib/offline-learning.js');
  const Component = createLoader({ react: e.hooks,
    './LearningToolLayout': { __esModule: true, default: ({ children }) => children },
    '../lib/offline-learning': { ...library, async readOfflinePack() { return { pack, retiredPhotoPaths: [], expired: false }; }, async clearOfflineLearning() { removals++; } },
  })('components/OfflineLearning.js').default;
  let tree;
  const render = () => { tree = e.render(() => Component({ courses: pack.courses })); };
  return {
    pack, get tree() { return tree; }, get removals() { return removals; }, render,
    async settle() { for (let i = 0; i < 5; i++) { e.flush(); await new Promise(resolve => setImmediate(resolve)); if (e.changed()) render(); } },
    choose(label, value) { const select = field(tree, label); assert.ok(select, label); select.props.onChange({ target: { value } }); render(); },
    emit(name) { for (const fn of listeners.get(name) || []) fn(); render(); },
    tick() { [...timers].forEach(fn => fn()); render(); },
    revoke() { identity = { status: 401, ok: false }; global.navigator.onLine = true; this.emit('online'); },
    cleanup() { e.dispose(); for (const [key, descriptor] of Object.entries(saved)) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]; },
  };
}

test('Saved reader starts with one course and switches explicitly to one photo or original sound', async () => {
  const s = setup();
  try {
    s.render(); await s.settle();
    assert.equal(field(s.tree, 'Ansicht').props.value, 'lernen');
    assert.equal(all(s.tree, n => n.type?.name === 'OfflineCourse').length, 1);
    assert.equal(all(s.tree, n => n.type?.name === 'OfflinePhoto' || n.type === 'audio').length, 0);
    s.choose('Ansicht', 'fotos');
    assert.equal(all(s.tree, n => n.type?.name === 'OfflineCourse' || n.type?.name === 'OfflinePhoto').length, 0);
    for (const photo of s.pack.photos) {
      s.choose('Foto auswählen', photo.src);
      const photos = all(s.tree, n => n.type?.name === 'OfflinePhoto');
      assert.equal(photos.length, 1); assert.equal(photos[0].props.photo, photo);
    }
    s.choose('Ansicht', 'stimmen');
    assert.equal(all(s.tree, n => n.type === 'audio' || n.type?.name === 'OfflinePhoto').length, 0);
    for (const id of ['gams', 'murmeltier']) {
      const sound = s.pack.sounds.find(item => item.id === id); assert.ok(sound);
      s.choose('Stimme auswählen', id);
      const audio = all(s.tree, n => n.type === 'audio');
      assert.equal(audio.length, 1); assert.equal(audio[0].props.src, sound.src);
      assert.equal(audio[0].props.preload, 'none'); assert.notEqual(audio[0].props.autoPlay, true);
      assert.ok(text(s.tree).includes(sound.explanation));
      const other = s.pack.sounds.find(item => item.id === (id === 'gams' ? 'murmeltier' : 'gams'));
      assert.ok(!text(s.tree).includes(other.explanation));
      const html = renderToStaticMarkup(s.tree);
      assert.ok(html.includes(sound.licenseUrl));
      assert.ok(html.includes(sound.sourceUrl.replaceAll('&', '&amp;')));
      assert.ok(html.includes(sound.recording.replaceAll('&', '&amp;')));
      assert.ok(html.includes(sound.modifications.replaceAll('&', '&amp;')));
    }
    s.choose('Ansicht', 'lernen');
    assert.equal(all(s.tree, n => n.type === 'audio' || n.type?.name === 'OfflinePhoto').length, 0);
  } finally { s.cleanup(); }
});

test('Unknown selections cannot replace a chosen item; expiry removes all saved reader views', async () => {
  const s = setup();
  try {
    s.render(); await s.settle(); s.choose('Ansicht', 'stimmen'); s.choose('Stimme auswählen', 'gams');
    s.choose('Stimme auswählen', 'not-a-recording');
    assert.equal(field(s.tree, 'Stimme auswählen').props.value, 'gams');
    s.choose('Ansicht', 'wrong-view'); assert.equal(field(s.tree, 'Ansicht').props.value, 'stimmen');
    s.pack.expiresAt = Date.now() - 1;
    s.choose('Ansicht', 'fotos');
    assert.equal(field(s.tree, 'Ansicht'), undefined);
    assert.equal(all(s.tree, n => n.type === 'audio' || n.type?.name === 'OfflineCourse' || n.type?.name === 'OfflinePhoto').length, 0);
    assert.match(text(s.tree), /gespeicherte Zugang ist abgelaufen/);
    assert.equal(s.removals, 0, 'Expiry does not delete user downloads');
  } finally { s.cleanup(); }
});

test('Periodic expiry and online account revocation still clear a selected media view', async () => {
  for (const reason of ['expiry', 'identity']) {
    const s = setup();
    try {
      s.render(); await s.settle(); s.choose('Ansicht', 'stimmen'); s.choose('Stimme auswählen', 'gams');
      if (reason === 'expiry') { s.pack.expiresAt = Date.now() - 1; s.tick(); }
      else { s.revoke(); await s.settle(); }
      assert.equal(field(s.tree, 'Ansicht'), undefined);
      assert.equal(all(s.tree, n => n.type === 'audio').length, 0);
      assert.equal(s.removals, reason === 'identity' ? 1 : 0);
    } finally { s.cleanup(); }
  }
});

test('One offline lesson retains its diagram and evidence; course quiz is optional and initially closed', () => {
  const e = engine(); const load = createLoader({ react: e.hooks });
  const { OfflineCourse } = loadOffline({ react: e.hooks }, true);
  const course = load('lib/learning-curriculum.js').getLearningModule('wissen-ausbau-koerperfunktion-kreislauf-2026');
  const render = () => e.render(() => OfflineCourse({ course, expiresAt: Date.now() + 60000, onExpired: () => assert.fail('Live course expired') }));
  let tree = render();
  const quiz = all(tree, n => n.type === 'details' && text(n).startsWith('Offline-Wissenscheck zum Kurs'))[0];
  assert.ok(quiz); assert.notEqual(quiz.props.open, true);
  assert.ok(text(tree).includes(course.lessons[0].paragraphs[0]));
  assert.ok(!text(tree).includes(course.lessons[1].paragraphs[0]));
  assert.equal(all(tree, n => n.type?.name === 'LessonDiagram')[0].props.diagram, course.lessons[0].diagram);
  assert.equal(all(tree, n => n.type?.name === 'LessonEvidence')[0].props.lesson, course.lessons[0]);
  field(tree, 'Lektion').props.onChange({ target: { value: '1' } }); tree = render();
  assert.ok(text(tree).includes(course.lessons[1].paragraphs[0]));
  assert.ok(!text(tree).includes(course.lessons[0].paragraphs[0]));
  assert.equal(all(tree, n => n.type?.name === 'LessonDiagram')[0].props.diagram, course.lessons[1].diagram);
  assert.equal(all(tree, n => n.type?.name === 'LessonEvidence')[0].props.lesson, course.lessons[1]);
  e.dispose();
});
