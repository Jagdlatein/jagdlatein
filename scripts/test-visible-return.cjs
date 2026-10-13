const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const filename = path.join(root, 'lib/visible-return.js');
const { code } = pr('next/dist/build/swc').transformSync(fs.readFileSync(filename, 'utf8'), {
  filename, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' },
});
const mod = { exports: {} };
new Function('module', 'exports', code)(mod, mod.exports);
const { onVisibleReturn } = mod.exports;
function target() {
  const listeners = new Map();
  return { visibilityState: 'visible', listeners,
    addEventListener(name, fn) { const entries = listeners.get(name) || new Set(); entries.add(fn); listeners.set(name, entries); },
    removeEventListener(name, fn) { listeners.get(name)?.delete(fn); },
    emit(name, value = {}) { for (const fn of listeners.get(name) || []) fn(value); },
  };
}
function fixture() {
  const document = target(), window = target(), calls = [];
  let now = 1000;
  const stop = onVisibleReturn(() => calls.push(now), { document, window, now: () => now });
  return { document, window, calls, stop, advance: elapsed => { now += elapsed; } };
}
test('Initial pageshow and unrelated focus do not refresh; visible returns deduplicate focus/pageshow', () => {
  const ctx = fixture();
  ctx.window.emit('pageshow', { persisted: false }); ctx.window.emit('focus');
  assert.deepEqual(ctx.calls, []);
  ctx.window.emit('blur'); ctx.document.visibilityState = 'hidden'; ctx.document.emit('visibilitychange');
  assert.deepEqual(ctx.calls, []);
  ctx.document.visibilityState = 'visible'; ctx.document.emit('visibilitychange');
  ctx.window.emit('focus'); ctx.window.emit('pageshow', { persisted: true });
  assert.equal(ctx.calls.length, 1);
  ctx.advance(600); ctx.window.emit('blur'); ctx.window.emit('focus');
  assert.equal(ctx.calls.length, 2);
  ctx.stop();
});
test('BFCache restore refreshes once while visible; hidden restores wait for visible return', () => {
  const ctx = fixture();
  ctx.window.emit('pageshow', { persisted: true }); assert.equal(ctx.calls.length, 1);
  ctx.advance(600); ctx.document.visibilityState = 'hidden'; ctx.document.emit('visibilitychange');
  ctx.window.emit('pageshow', { persisted: true }); assert.equal(ctx.calls.length, 1);
  ctx.document.visibilityState = 'visible'; ctx.document.emit('visibilitychange');
  assert.equal(ctx.calls.length, 2); ctx.stop();
});
test('Disposal removes every listener and prevents a retained callback from refreshing', () => {
  const ctx = fixture(); const callback = [...ctx.window.listeners.get('pageshow')][0];
  ctx.stop(); callback({ persisted: true });
  assert.equal(ctx.calls.length, 0);
  for (const entries of [...ctx.document.listeners.values(), ...ctx.window.listeners.values()]) assert.equal(entries.size, 0);
  assert.doesNotThrow(() => onVisibleReturn(() => {}, { document: null, window: null })());
});
