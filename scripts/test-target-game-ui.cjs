// Actual component, isolated hooks and synthetic input. No browser, storage,
// accounts, timers, network or production results are accessed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const React = pr('react');
const swc = pr('next/dist/build/swc');

function text(node) {
  return node == null || typeof node === 'boolean' ? '' : Array.isArray(node) ? node.map(text).join('')
    : typeof node === 'object' ? text(node.props?.children) : String(node);
}
function nodes(node, predicate) {
  return Array.isArray(node) ? node.flatMap(child => nodes(child, predicate)) : !node || typeof node !== 'object' ? []
    : [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
}
function load(relative, hooks, cache = new Map()) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    if (id === 'react') return hooks;
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.endsWith('/AppIcon')) return { __esModule: true, default: () => null };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), `${id}.js`)), hooks, cache);
    return pr(id);
  }, mod, mod.exports);
  cache.set(filename, mod.exports);
  return mod.exports;
}
function setup(rect = { left: 50, top: 100, width: 1000, height: 600 }) {
  let cursor = 0, changed = false, effects = [], tree, focused = 0;
  const slots = [];
  const hooks = { ...React,
    useState(initial) { const i = cursor++; slots[i] ||= { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, value => { const next = typeof value === 'function' ? value(slots[i].value) : value;
        changed ||= !Object.is(next, slots[i].value); slots[i].value = next; }]; },
    useReducer(reducer, arg, init) { const i = cursor++; slots[i] ||= { value: init ? init(arg) : arg };
      return [slots[i].value, action => { const next = reducer(slots[i].value, action);
        changed ||= !Object.is(next, slots[i].value); slots[i].value = next; }]; },
    useRef(initial) { const i = cursor++; slots[i] ||= { value: { current: initial } }; return slots[i].value; },
    useId() { cursor++; return ':synthetic-game:'; },
    useEffect(callback, deps) { const i = cursor++, previous = slots[i];
      if (!previous || deps.some((value, index) => !Object.is(value, previous.deps?.[index]))) {
        slots[i] = { deps, cleanup: previous?.cleanup };
        effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = callback(); });
      }
    },
  };
  const Component = load('components/TargetGame.js', hooks).default;
  const boardObject = { focus() { focused++; } };
  function commit() {
    for (let pass = 0; pass < 30; pass++) {
      cursor = 0; changed = false; tree = Component();
      for (const node of nodes(tree, node => node.props?.ref)) {
        if (node.type === 'svg') node.props.ref.current = { getBoundingClientRect: () => rect };
        if (node.props.role === 'button') node.props.ref.current = boardObject;
      }
      const pending = effects; effects = []; pending.forEach(effect => effect());
      if (!changed && !effects.length) return;
    }
    throw new Error('Component failed to settle');
  }
  commit();
  return {
    commit, get tree() { return tree; }, get focused() { return focused; }, get boardObject() { return boardObject; },
    text: () => text(tree),
    board: () => nodes(tree, node => node.props?.role === 'button')[0],
    target: () => nodes(tree, node => node.props?.['data-game-target'])[0],
    button(label) { const button = nodes(tree, node => node.type === 'button' && text(node).includes(label))[0]; assert.ok(button, label); return button; },
    start() { this.button('Runde starten').props.onClick(); commit(); return this; },
    centerClick(extra = {}) { const target = this.target(); const event = { detail: 1,
      clientX: rect.left + Number(target.props['data-x']) * rect.width,
      clientY: rect.top + Number(target.props['data-y']) * rect.height, ...extra };
      this.board().props.onClick(event); commit(); return this; },
    key(key, extra = {}) { let prevented = false; const event = { key, target: boardObject, currentTarget: boardObject,
      preventDefault() { prevented = true; }, ...extra };
      this.board().props.onKeyDown(event); commit(); return prevented; },
    mode(mode) { const select = nodes(tree, node => node.type === 'select')[0]; select.props.onChange({ target: { value: mode } }); commit(); },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
  };
}

test('The initial screen has a visible vector board, two modes and exactly one start action', () => {
  const s = setup();
  assert.match(s.text(), /Zehn Schüsse/);
  assert.match(s.text(), /Bildschirmspiel auf abstrakten Scheiben; Punkte sind Spielwerte/);
  assert.equal(nodes(s.tree, node => node.type === 'button').length, 1);
  assert.equal(nodes(s.tree, node => node.type === 'option').length, 2);
  assert.equal(nodes(s.tree, node => node.type === 'svg')[0].props.viewBox, '0 0 1000 600');
  assert.equal(s.board().props['aria-disabled'], true);
  s.centerClick(); assert.match(s.text(), /Wähle deine Spielart und starte/);
  assert.equal(s.focused, 0);
  s.start(); assert.equal(s.focused, 1); assert.equal(s.board().props.tabIndex, 0);
  assert.equal(nodes(s.tree, node => node.type === 'select')[0].props.disabled, true);
});

test('Rendered coordinates award the center at multiple display sizes, and only a manual restart begins another round', () => {
  for (const width of [300, 720, 1000]) {
    const s = setup({ left: 35, top: 280, width, height: width * .6 }).start();
    for (let index = 0; index < 10; index++) s.centerClick();
    assert.match(s.text(), /100 von 100 Punkten/); assert.match(s.text(), /10 von 10 Schüssen/);
    assert.equal(s.board().props['aria-disabled'], true);
    s.centerClick(); assert.match(s.text(), /100 von 100 Punkten/);
    assert.equal(nodes(s.tree, node => node.type === 'button').length, 1);
    s.button('Neue Runde').props.onClick(); s.commit();
    assert.match(s.text(), /Deine Runde läuft/); assert.match(s.board().props['aria-label'], /Schuss 1 von 10\. 0 Punkte/);
  }
});

test('Old handlers, double clicks, drag gestures, scroll cancellation and off-board clicks cannot consume an extra shot', () => {
  const s = setup().start(); const oldBoard = s.board();
  oldBoard.props.onClick({ detail: 1, clientX: 550, clientY: 400 });
  oldBoard.props.onClick({ detail: 1, clientX: 550, clientY: 400 }); s.commit();
  assert.match(s.board().props['aria-label'], /Schuss 2 von 10\. 10 Punkte/);
  s.centerClick({ detail: 2 }); assert.match(s.board().props['aria-label'], /Schuss 2 von 10/);
  s.centerClick({ clientX: -200 }); assert.match(s.board().props['aria-label'], /Schuss 2 von 10/);
  s.board().props.onPointerDown({ clientX: 550, clientY: 400, pointerId: 1 });
  s.board().props.onPointerMove({ clientX: 550, clientY: 450, pointerId: 1 });
  s.centerClick(); assert.match(s.board().props['aria-label'], /Schuss 2 von 10/);
  s.board().props.onPointerCancel(); s.centerClick(); assert.match(s.board().props['aria-label'], /Schuss 2 von 10/);
  s.board().props.onPointerDown({ clientX: 550, clientY: 400, pointerId: 2 });
  s.centerClick(); assert.match(s.board().props['aria-label'], /Schuss 3 von 10/);
  s.unmount(); const stale = s.board(); stale.props.onClick({ detail: 1, clientX: 550, clientY: 400 }); s.commit();
  assert.match(s.board().props['aria-label'], /Schuss 3 von 10/);
});

test('Keyboard shots require the focused board, reject held fire and allow arrow aim without document listeners', () => {
  const s = setup().start();
  assert.equal(s.key(' ', { target: {} }), false); assert.match(s.board().props['aria-label'], /Schuss 1 von 10/);
  assert.equal(s.key(' ', { repeat: true }), true); assert.match(s.board().props['aria-label'], /Schuss 1 von 10/);
  assert.equal(s.key('ArrowRight'), true); assert.match(s.board().props['aria-label'], /Schuss 1 von 10/);
  assert.equal(s.key('ArrowLeft'), true);
  assert.equal(s.key('Enter'), true); assert.match(s.board().props['aria-label'], /Schuss 2 von 10\. 10 Punkte/);
  assert.equal(s.key('Escape'), false);
  const source = fs.readFileSync(path.join(root, 'components/TargetGame.js'), 'utf8');
  assert.doesNotMatch(source, /addEventListener|setInterval|setTimeout|fetch\(|localStorage|sessionStorage/);
  const css = fs.readFileSync(path.join(root, 'styles/TargetGame.module.css'), 'utf8');
  assert.match(css, /touch-action: pan-y/); assert.doesNotMatch(css, /animation:|transition:/);
});

test('The changing-position mode moves only after accepted shots, with clear local score feedback', () => {
  const s = setup(); s.mode('wechsel'); s.start();
  const before = s.target().props.transform;
  s.key('ArrowRight'); assert.equal(s.target().props.transform, before);
  s.centerClick(); assert.notEqual(s.target().props.transform, before);
  assert.match(s.text(), /\+10 Punkte/); assert.match(s.text(), /Noch 9 Schüsse/);
  assert.match(s.text(), /Die Position wechselt erst nach jedem Schuss/);
  s.centerClick({ clientX: 55, clientY: 105 }); assert.match(s.text(), /Außerhalb der Scheibe/);
  assert.match(s.board().props['aria-label'], /Schuss 3 von 10\. 10 Punkte/);
});
