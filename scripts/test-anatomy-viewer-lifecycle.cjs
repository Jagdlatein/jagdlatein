// Isolated React lifetimes, inert model-viewer/Script doubles and synthetic URLs.
// No browser, graphics driver, model download, user files or network is involved.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { anatomyModels: models, anatomyQuestions: questions } = createLoader()('lib/anatomy-explorer.js');
const defaultOrbit = '45deg 75deg 110%';

function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join('');
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
function nodes(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => nodes(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function fixture(t, { query = {} } = {}) {
  const oldWindow = global.window;
  const slots = [], effects = [], cleanups = new Map(), allViewers = [], focuses = [];
  const viewers = new Map(), refs = new Set(), timers = new Map();
  let cursor = 0, dirty = false, tree, disposed = false, stateWrites = 0, writesAfterDispose = 0, timerId = 0;
  let registered = false, lastScript;
  const pathname = '/lernen/anatomie';
  function pathFor(nextQuery) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(nextQuery)) for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
    return pathname + (params.size ? '?' + params : '');
  }
  global.window = {
    customElements: { get: name => registered && name === 'model-viewer' ? function InertModelViewer() {} : undefined },
    location: { pathname, search: '', hash: '', href: '' },
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame(callback) { callback(); return 1; }, cancelAnimationFrame() {},
  };
  const router = {
    isReady: true, pathname, query: {}, asPath: '',
    async push(href) { commit(href.query || {}); return true; },
    async replace(href) { commit(href.query || {}); return true; },
  };
  function commit(nextQuery) {
    router.query = { ...nextQuery }; router.asPath = pathFor(nextQuery);
    const url = new URL(router.asPath, 'https://jagdlatein.test');
    Object.assign(global.window.location, { search: url.search, href: url.href });
  }
  commit(query);
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, input => {
        stateWrites++;
        if (disposed) { writesAfterDispose++; return; }
        const value = typeof input === 'function' ? input(slots[index].value) : input;
        dirty ||= !Object.is(value, slots[index].value); slots[index].value = value;
      }];
    },
    useRef(initial) { const index = cursor++; if (!slots[index]) slots[index] = { current: initial }; return slots[index]; },
    useEffect(callback, dependencies) {
      const index = cursor++, previous = slots[index];
      if (!previous || !dependencies || !previous.dependencies || dependencies.length !== previous.dependencies.length || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
        slots[index] = { dependencies }; effects.push({ index, callback });
      }
    },
    useMemo(callback, dependencies) {
      const index = cursor++, previous = slots[index];
      if (!previous || !dependencies || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) slots[index] = { dependencies, value: callback() };
      return slots[index].value;
    },
    useCallback(callback, dependencies) { return hooks.useMemo(() => callback, dependencies); },
  };
  hooks.useLayoutEffect = hooks.useEffect;
  function ScriptDouble() {}
  const Component = createLoader({
    react: hooks,
    'next/router': { useRouter: () => router },
    'next/script': { __esModule: true, default: ScriptDouble },
    './DigestiveLearning': { __esModule: true, default: () => null },
    './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children), closePageMenu() {}, openPageMenu() {} },
  })('components/AnatomyExplorer.js').default;
  function newViewer(key) {
    const value = {
      key, loaded: false, cameraOrbit: '', lastOrbitProp: undefined, listeners: new Map(), removed: [], framingCalls: 0, jumpCalls: 0, orbitReads: 0,
      framing: Promise.resolve(), complete: Promise.resolve(),
      updateFraming() { this.framingCalls++; return this.framing; },
      get updateComplete() { return this.complete; },
      jumpCameraToGoal() { this.jumpCalls++; },
      getCameraOrbit() { this.orbitReads++; return { theta: 1, phi: 1, radius: 2 }; },
      addEventListener(name, callback) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(callback); },
      removeEventListener(name, callback) { this.removed.push({ name, callback }); this.listeners.get(name)?.delete(callback); },
    };
    allViewers.push(value); return value;
  }
  function attachRefs() {
    const attached = new Set(), liveKeys = new Set();
    for (const node of nodes(tree, node => node.props?.ref && typeof node.props.ref === 'object')) {
      const ref = node.props.ref; attached.add(ref);
      if (node.type === 'model-viewer') {
        const key = node.key || node.props.src; liveKeys.add(key);
        if (!viewers.has(key)) viewers.set(key, newViewer(key));
        const value = viewers.get(key);
        // React updates an unchanged property only when its prop actually changes.
        if (value.lastOrbitProp !== node.props['camera-orbit']) {
          value.cameraOrbit = node.props['camera-orbit']; value.lastOrbitProp = node.props['camera-orbit'];
        }
        ref.current = value;
      } else ref.current = { focus() { focuses.push(node.props.id || node.props['aria-label']); }, scrollIntoView() {} };
    }
    for (const ref of refs) if (!attached.has(ref)) ref.current = null;
    refs.clear(); for (const ref of attached) refs.add(ref);
    for (const key of viewers.keys()) if (!liveKeys.has(key)) viewers.delete(key);
  }
  function flushEffects() {
    while (effects.length) {
      const { index, callback } = effects.shift(); cleanups.get(index)?.();
      const cleanup = callback();
      if (typeof cleanup === 'function') cleanups.set(index, cleanup); else cleanups.delete(index);
    }
  }
  function render({ runEffects = true } = {}) {
    assert.equal(disposed, false, 'Never render an unmounted AnatomyExplorer');
    let passes = 0;
    do {
      assert.ok(passes++ < 15, 'Anatomy state/effects must settle');
      cursor = 0; dirty = false; tree = Component(); attachRefs();
      const currentScript = nodes(tree, node => node.type === ScriptDouble)[0];
      if (currentScript) lastScript = currentScript;
      if (runEffects) flushEffects();
    } while (dirty);
    return tree;
  }
  function dispose() {
    if (disposed) return;
    for (const cleanup of cleanups.values()) cleanup();
    for (const ref of refs) ref.current = null;
    disposed = true;
  }
  function find(predicate) { return nodes(tree, predicate)[0]; }
  function button(label) {
    const value = find(node => node.type === 'button' && text(node).trim() === label);
    assert.ok(value, `Missing button: ${label}`); return value;
  }
  const viewer = () => find(node => node.type === 'model-viewer')?.props.ref.current;
  // Successful registration unmounts Script; retain its detached handlers only
  // for the explicit stale-callback assertions below.
  const script = () => find(node => node.type === ScriptDouble) || lastScript;
  const quiz = () => find(node => node.type === 'details' && text(node.props.children[0]).startsWith('Wissen zum Modell'));
  async function fireLoad(value = viewer()) {
    assert.ok(value, 'Missing inert viewer'); value.loaded = true;
    const handler = [...(value.listeners.get('load') || [])][0]; assert.ok(handler, 'Missing load handler');
    await handler(); render();
  }
  t.after(() => { dispose(); if (oldWindow === undefined) delete global.window; else global.window = oldWindow; });
  render();
  return {
    render, dispose, find, button, viewer, script, quiz, fireLoad, allViewers, focuses,
    body: () => text(tree),
    click(label) { const value = button(label); assert.ok(!value.props.disabled); value.props.onClick(); render(); },
    async select(id) { await find(node => node.props?.id === 'anatomy-entry-select').props.onChange({ target: { value: id } }); render(); },
    route(nextQuery, options) { commit(nextQuery); render(options); },
    async enable() { this.click('3D-Ansicht öffnen'); registered = true; script().props.onReady(); render(); },
    failViewer() { for (const callback of viewer().listeners.get('error') || []) callback(); render(); },
    toggle(open) { assert.ok(quiz()); quiz().props.onToggle({ currentTarget: { open } }); render(); },
    get stateWrites() { return stateWrites; }, get writesAfterDispose() { return writesAfterDispose; },
  };
}

test('Loading preserves the current selected structure camera instead of restoring the default orbit', async t => {
  const f = fixture(t), feature = models[0].features[2];
  f.click(feature.title); await f.enable();
  assert.equal(f.viewer().cameraOrbit, feature.orbit);
  await f.fireLoad();
  assert.equal(f.viewer().cameraOrbit, feature.orbit);
  assert.ok(f.body().includes(feature.explanation));
});

test('A structure chosen while updateFraming waits is still the current camera when load completes', async t => {
  const f = fixture(t); await f.enable();
  const value = f.viewer(), framing = deferred(), feature = models[0].features[1]; value.framing = framing.promise;
  value.loaded = true;
  const pending = [...value.listeners.get('load')][0]();
  f.click(feature.title); framing.resolve(); await pending; f.render();
  assert.equal(value.cameraOrbit, feature.orbit); assert.ok(f.body().includes(feature.explanation));
});

test('Retained feature, rotate and reset controls cannot affect a different model or revive after A–B–A', async t => {
  const f = fixture(t); await f.enable(); await f.fireLoad();
  const oldFeature = f.button(models[0].features[2].title).props.onClick;
  const oldRotate = f.button('Nach links drehen').props.onClick, oldReset = f.button('Ansicht zurücksetzen').props.onClick;
  for (const id of [models[1].id, models[0].id]) {
    await f.select(id); await f.fireLoad();
    f.click(models.find(model => model.id === id).features[0].title);
    const value = f.viewer(), before = f.stateWrites, orbit = value.cameraOrbit, reads = value.orbitReads;
    oldFeature(); oldRotate(); oldReset(); f.render();
    assert.equal(f.stateWrites, before); assert.equal(value.orbitReads, reads); assert.equal(value.cameraOrbit, orbit);
  }
});

test('Retained script callbacks cannot write after a committed origin change with the same model', async t => {
  const f = fixture(t); await f.enable(); await f.fireLoad();
  const { onReady, onLoad, onError } = f.script().props;
  f.route({ eintrag: models[0].id, quelle: 'different-origin' });
  const before = f.stateWrites;
  onReady?.(); onLoad?.(); onError?.(); f.render();
  assert.equal(f.stateWrites, before);
});

test('The framing continuation rejects a changed origin even for the same model before passive cleanup runs', async t => {
  const f = fixture(t); await f.enable();
  const value = f.viewer(), framing = deferred(); value.framing = framing.promise;
  value.loaded = true;
  const pending = [...value.listeners.get('load')][0]();
  f.route({ eintrag: models[0].id, quelle: 'changed-during-framing' }, { runEffects: false });
  const before = f.stateWrites, oldOrbit = value.cameraOrbit, jumps = value.jumpCalls;
  framing.resolve(); await pending;
  assert.equal(f.stateWrites, before); assert.equal(value.cameraOrbit, oldOrbit); assert.equal(value.jumpCalls, jumps);
  f.render();
});

test('A rejected old updateComplete cannot replace the current status before origin cleanup runs', async t => {
  const f = fixture(t); await f.enable();
  const value = f.viewer(), complete = deferred(); value.complete = complete.promise; value.loaded = true;
  const pending = [...value.listeners.get('load')][0]();
  await Promise.resolve();
  f.route({ eintrag: models[0].id, quelle: 'changed-before-viewer-error' }, { runEffects: false });
  const before = f.stateWrites;
  complete.reject(new Error('Synthetic failure from a departed load')); await pending;
  assert.equal(f.stateWrites, before);
  f.render();
});

test('The updateComplete continuation cannot jump a departed viewer or mark a replacement model loaded', async t => {
  const f = fixture(t); await f.enable();
  const value = f.viewer(), complete = deferred(); value.complete = complete.promise;
  value.loaded = true;
  const pending = [...value.listeners.get('load')][0]();
  await Promise.resolve();
  f.route({ eintrag: models[1].id }, { runEffects: false });
  const before = f.stateWrites, jumps = value.jumpCalls;
  complete.resolve(); await pending;
  assert.equal(value.jumpCalls, jumps); assert.equal(f.stateWrites, before);
  f.render();
});

test('Captured-element cleanup removes old listeners while the replacement viewer keeps its own listeners', async t => {
  const f = fixture(t); await f.enable(); const previous = f.viewer();
  const oldLoad = [...previous.listeners.get('load')][0], oldError = [...previous.listeners.get('error')][0];
  await f.select(models[1].id); const current = f.viewer();
  assert.notEqual(previous, current);
  assert.equal(previous.listeners.get('load').size, 0); assert.equal(previous.listeners.get('error').size, 0);
  assert.ok(previous.removed.some(item => item.name === 'load' && item.callback === oldLoad));
  assert.ok(previous.removed.some(item => item.name === 'error' && item.callback === oldError));
  assert.equal(current.listeners.get('load').size, 1); assert.equal(current.listeners.get('error').size, 1);
  const before = f.stateWrites, framings = previous.framingCalls;
  await oldLoad(); oldError(); f.render();
  assert.equal(previous.framingCalls, framings); assert.equal(f.stateWrites, before);
  await f.fireLoad(current); assert.match(f.body(), /Mit einem Finger ziehen/);
});

test('A previous retry and script error cannot affect a later successful attempt', async t => {
  const f = fixture(t); await f.enable();
  const oldScript = f.script().props;
  f.failViewer();
  const oldRetry = f.button('Laden erneut vorbereiten').props.onClick;
  f.click('Laden erneut vorbereiten'); await f.enable(); await f.fireLoad();
  const before = f.stateWrites;
  oldRetry(); oldScript.onReady?.(); oldScript.onLoad?.(); oldScript.onError?.(); f.render();
  assert.equal(f.stateWrites, before); assert.match(f.body(), /Mit einem Finger ziehen/);
});

test('A retry from an earlier error cannot disable a viewer that has since loaded in the same attempt', async t => {
  const f = fixture(t); await f.enable();
  f.failViewer();
  const oldRetry = f.button('Laden erneut vorbereiten').props.onClick;
  await f.fireLoad(); const before = f.stateWrites, current = f.viewer();
  oldRetry(); f.render();
  assert.equal(f.stateWrites, before); assert.equal(f.viewer(), current);
  assert.match(f.body(), /Mit einem Finger ziehen/);
});

test('A native error invalidates pending framing and a later resolution cannot overwrite its failure status', async t => {
  const f = fixture(t); await f.enable();
  const value = f.viewer(), framing = deferred(); value.framing = framing.promise; value.loaded = true;
  const pending = [...value.listeners.get('load')][0]();
  [...value.listeners.get('error')][0](); f.render();
  const before = f.stateWrites, jumps = value.jumpCalls;
  framing.resolve(); await pending; f.render();
  assert.equal(f.stateWrites, before); assert.equal(value.jumpCalls, jumps);
  assert.match(f.body(), /konnte nicht geladen werden/);
});

test('Only the newest of two load callbacks may finish framing the current viewer', async t => {
  const f = fixture(t); await f.enable();
  const value = f.viewer(), first = deferred(), second = deferred(), load = [...value.listeners.get('load')][0];
  value.loaded = true; value.framing = first.promise; const older = load();
  value.framing = second.promise; const newer = load();
  second.resolve(); await newer; f.render();
  assert.match(f.body(), /Mit einem Finger ziehen/);
  const before = f.stateWrites, jumps = value.jumpCalls;
  first.resolve(); await older; f.render();
  assert.equal(f.stateWrites, before); assert.equal(value.jumpCalls, jumps);
});

test('A retained Open cannot enable the viewer after leaving its original model', async t => {
  const f = fixture(t), open = f.button('3D-Ansicht öffnen').props.onClick;
  await f.select(models[1].id); const before = f.stateWrites;
  open(); f.render();
  assert.equal(f.stateWrites, before); assert.equal(f.viewer(), undefined);
  f.click('3D-Ansicht öffnen'); assert.ok(f.script());
});

for (const action of ['Open', 'Retry']) {
  test(`Unmount blocks a retained ${action} before any state write`, async t => {
    const f = fixture(t);
    if (action === 'Retry') { await f.enable(); f.failViewer(); }
    const handler = f.button(action === 'Retry' ? 'Laden erneut vorbereiten' : '3D-Ansicht öffnen').props.onClick;
    f.dispose(); const before = f.stateWrites;
    handler();
    assert.equal(f.stateWrites, before); assert.equal(f.writesAfterDispose, 0);
  });
}

test('Unmount blocks retained model controls, Script callbacks and captured native events before state or viewer work', async t => {
  const f = fixture(t); await f.enable(); await f.fireLoad();
  const value = f.viewer(), feature = f.button(models[0].features[1].title).props.onClick;
  const rotate = f.button('Nach links drehen').props.onClick, reset = f.button('Ansicht zurücksetzen').props.onClick, script = f.script().props;
  const load = [...value.listeners.get('load')][0], error = [...value.listeners.get('error')][0];
  f.dispose(); const before = f.stateWrites, framings = value.framingCalls, reads = value.orbitReads;
  feature(); rotate(); reset(); script.onReady?.(); script.onLoad?.(); script.onError?.(); await load(); error();
  assert.equal(f.stateWrites, before); assert.equal(f.writesAfterDispose, 0);
  assert.equal(value.framingCalls, framings); assert.equal(value.orbitReads, reads);
});

test('A deferred viewer error after unmount is discarded and its captured listeners remain detached', async t => {
  const f = fixture(t); await f.enable();
  const value = f.viewer(), framing = deferred(); value.framing = framing.promise;
  value.loaded = true;
  const pending = [...value.listeners.get('load')][0]();
  f.dispose(); const before = f.stateWrites;
  framing.reject(new Error('Synthetic delayed framing failure')); await pending;
  assert.equal(f.stateWrites, before); assert.equal(f.writesAfterDispose, 0);
  assert.equal(value.listeners.get('load').size, 0); assert.equal(value.listeners.get('error').size, 0);
});

test('Every authored model-specific quiz still locks its first choice, guards rapid Next and can repeat its own two questions', async t => {
  const f = fixture(t); let visited = 0;
  assert.equal(questions.length, 6);
  for (const model of models) {
    await f.select(model.id); f.toggle(true);
    const pool = questions.filter(question => question.modelId === model.id); assert.equal(pool.length, 2);
    for (const [index, question] of pool.entries()) {
      assert.ok(f.body().includes(question.question));
      const correct = f.button(question.choices[question.answer]).props.onClick;
      const wrongIndex = (question.answer + 1) % question.choices.length, wrong = f.button(question.choices[wrongIndex]).props.onClick;
      wrong(); correct(); wrong(); f.render();
      assert.ok(f.body().includes(question.explanation)); assert.match(f.body(), /0 richtig/); visited++;
      if (index === 0) {
        const next = f.button('Nächste Frage').props.onClick;
        next(); next(); f.render(); assert.match(f.body(), /Frage 2 von 2/);
      }
    }
    assert.match(f.body(), /Runde abgeschlossen: 0 von 2 richtig/);
    const repeat = f.button('Diese Fragen wiederholen').props.onClick;
    repeat(); repeat(); f.render(); assert.match(f.body(), /Frage 1 von 2.*0 beantwortet/);
    const staleAnswer = f.button(pool[0].choices[pool[0].answer]).props.onClick;
    f.toggle(false); staleAnswer(); f.render(); f.toggle(true);
    assert.match(f.body(), /0 beantwortet · 0 richtig/);
  }
  assert.equal(visited, 6);
});

for (const action of ['Answer', 'Toggle', 'Next', 'Repeat']) {
  test(`Unmount blocks the current valid quiz ${action} before any state write`, t => {
    const f = fixture(t), pool = questions.filter(question => question.modelId === models[0].id);
    f.toggle(true);
    let handler;
    if (action === 'Answer') handler = f.button(pool[0].choices[pool[0].answer]).props.onClick;
    if (action === 'Toggle') handler = f.quiz().props.onToggle;
    if (['Next', 'Repeat'].includes(action)) {
      f.click(pool[0].choices[pool[0].answer]);
      if (action === 'Next') handler = f.button('Nächste Frage').props.onClick;
      else {
        f.click('Nächste Frage'); f.click(pool[1].choices[pool[1].answer]);
        handler = f.button('Diese Fragen wiederholen').props.onClick;
      }
    }
    f.dispose(); const before = f.stateWrites;
    handler({ currentTarget: { open: false } });
    assert.equal(f.stateWrites, before); assert.equal(f.writesAfterDispose, 0);
  });
}
