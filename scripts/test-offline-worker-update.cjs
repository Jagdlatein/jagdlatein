// Isolated actual prepareOfflineCache code in a fresh VM. Timers, worker,
// DOM, ports and storage are doubles; no browser profile or network is used.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const swc = local('next/dist/build/swc'), dependencies = createLoader();
const newPhoto = '/lernen/pruefungswissen-2026-11-01/blaesshuhn-schwimmlappen.jpg';
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

function fixture({ historical = false, update, noUpdate = false } = {}) {
  const posts = [], channels = [], storageCalls = [], registerCalls = [], timers = new Map(), workers = [];
  let timerId = 0, updateCalls = 0, queries = 0;
  const makeWorker = (name, state = 'activated') => {
    const listeners = new Set();
    const worker = { name, state, listeners, added: 0, removed: 0, reply: { ok: true }, postError: null,
      addEventListener(type, fn) { assert.equal(type, 'statechange'); listeners.add(fn); this.added++; },
      removeEventListener(type, fn) { assert.equal(type, 'statechange'); listeners.delete(fn); this.removed++; },
      transition(next) { this.state = next; for (const fn of [...listeners]) fn(); },
      postMessage(message, transfer) {
        posts.push({ worker: name, message, transfer });
        if (this.postError) throw this.postError;
        if (this.reply !== null) transfer[0].reply(this.reply);
      },
    };
    workers.push(worker); return worker;
  };
  const active = makeWorker('old-active');
  const registration = { active, installing: null, waiting: null };
  if (!noUpdate) registration.update = () => { updateCalls++; return update ? update(registration) : Promise.resolve(registration); };
  class Channel {
    constructor() {
      this.port1 = { onmessage: null, closed: false, close() { this.closed = true; } };
      this.port2 = { closed: false, close() { this.closed = true; }, reply: data => { if (!this.port1.closed) this.port1.onmessage?.({ data }); } };
      channels.push(this);
    }
  }
  const forbiddenStorage = name => () => { storageCalls.push(name); throw new Error('Prepare must not modify saved pack/storage directly'); };
  const context = vm.createContext({ URL, navigator: { serviceWorker: { async register(url, options) { registerCalls.push({ url, options }); return registration; } } },
    location: { origin: 'https://jagdlatein.test', href: 'https://jagdlatein.test/lernen/offline-rucksack' },
    document: { querySelectorAll(selector) { queries++; assert.equal(selector, 'script[src],link[rel="stylesheet"][href]'); return [
      { src: 'https://jagdlatein.test/_next/static/chunks/current.js' },
      { href: 'https://jagdlatein.test/_next/static/css/current.css' },
      { src: 'https://other.test/_next/static/chunks/foreign.js' },
      { src: 'https://jagdlatein.test/api/private' },
      { src: 'https://jagdlatein.test/_next/static/chunks/current.js' },
    ]; } },
    MessageChannel: Channel,
    setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    caches: { open: forbiddenStorage('cache.open'), delete: forbiddenStorage('cache.delete') },
    indexedDB: { open: forbiddenStorage('indexedDB.open') },
  });
  const filename = path.join(root, 'lib/offline-learning.js');
  const source = historical ? execFileSync('git', ['show', '6cb07b1600990c94793b78e65e06db0365ac1115:lib/offline-learning.js'], { cwd: root, encoding: 'utf8' }) : fs.readFileSync(filename, 'utf8');
  const { code } = swc.transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  const module = { exports: {} };
  vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(id => id.startsWith('.')
    ? dependencies(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)) : local(id), module, module.exports);
  return { posts, channels, storageCalls, registerCalls, timers, active, registration, makeWorker,
    get updateCalls() { return updateCalls; }, get queries() { return queries; },
    start(media = [newPhoto, newPhoto]) { return module.exports.prepareOfflineCache(media).then(() => ({ ok: true }), error => ({ error })); },
    async flush() { for (let i = 0; i < 12; i++) await Promise.resolve(); },
    fire(delay) { const entry = [...timers].find(([, timer]) => timer.delay === delay); assert.ok(entry, 'Pending timeout ' + delay); timers.delete(entry[0]); entry[1].fn(); },
    assertNoEarlySideEffects() { assert.equal(posts.length, 0); assert.equal(channels.length, 0); assert.equal(this.queries, 0); assert.deepEqual(storageCalls, []); },
  };
}
function cleanBeforePrepare(f) {
  f.assertNoEarlySideEffects(); assert.equal(f.timers.size, 0);
}

test('Historical Git 6cb selects the old active worker and can reject a new photo despite an installing replacement', async () => {
  const f = fixture({ historical: true });
  f.active.reply = { ok: false, message: 'The old worker does not allow the new photograph' };
  f.registration.installing = f.makeWorker('new-installing', 'installing');
  const outcome = await f.start();
  assert.match(outcome.error?.message || '', /old worker/);
  assert.equal(f.updateCalls, 0); assert.deepEqual(f.posts.map(post => post.worker), ['old-active']);
  assert.equal(f.registration.installing.listeners.size, 0); assert.equal(f.channels[0].port1.closed, true);
});

test('An update check completes before selecting the new installing worker, and only it receives PREPARE after activation', async () => {
  const gate = deferred(), f = fixture({ update: () => gate.promise }), outcome = f.start();
  await f.flush(); assert.equal(f.updateCalls, 1); f.assertNoEarlySideEffects();
  const replacement = f.makeWorker('new-installing', 'installing'); f.registration.installing = replacement;
  f.registration.waiting = f.makeWorker('older-waiting', 'activated');
  gate.resolve(f.registration); await f.flush();
  f.assertNoEarlySideEffects(); assert.equal(replacement.listeners.size, 1); assert.equal(f.active.listeners.size, 0);
  replacement.transition('activating'); await f.flush(); assert.equal(f.posts.length, 0);
  replacement.transition('activated'); assert.deepEqual(await outcome, { ok: true });
  assert.deepEqual(f.posts.map(post => post.worker), ['new-installing']);
  assert.deepEqual(JSON.parse(JSON.stringify(f.posts[0].message)), { type: 'PREPARE', assets: ['/_next/static/chunks/current.js', '/_next/static/css/current.css', newPhoto] });
  assert.equal(f.posts[0].transfer.length, 1); assert.equal(f.posts[0].transfer[0], f.channels[0].port2);
  assert.equal(replacement.listeners.size, 0); assert.equal(f.channels[0].port1.closed, true); assert.equal(f.timers.size, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(f.registerCalls)), [{ url: '/lernen/offline-sw.js', options: { scope: '/lernen/' } }]);
  assert.deepEqual(f.storageCalls, []);
});

test('A waiting replacement takes precedence over old active and waits for its own activation', async () => {
  const f = fixture(), waiting = f.makeWorker('new-waiting', 'installed'); f.registration.waiting = waiting;
  const outcome = f.start(); await f.flush(); f.assertNoEarlySideEffects(); assert.equal(waiting.listeners.size, 1);
  waiting.transition('activated'); assert.deepEqual(await outcome, { ok: true });
  assert.deepEqual(f.posts.map(post => post.worker), ['new-waiting']); assert.equal(f.timers.size, 0); assert.equal(waiting.listeners.size, 0);
});

test('A first installation with no active worker completes update and activation before PREPARE', async () => {
  const f = fixture(), installing = f.makeWorker('first-installation', 'installing');
  f.registration.active = null; f.registration.installing = installing;
  const outcome = f.start(); await f.flush();
  assert.equal(f.updateCalls, 1); f.assertNoEarlySideEffects(); assert.equal(installing.listeners.size, 1);
  installing.transition('activated'); assert.deepEqual(await outcome, { ok: true });
  assert.deepEqual(f.posts.map(post => post.worker), ['first-installation']);
  assert.equal(installing.listeners.size, 0); assert.equal(f.channels[0].port1.closed, true); assert.equal(f.timers.size, 0);
  assert.deepEqual(f.storageCalls, []);
});

test('An existing active worker remains usable when no replacement exists, including an older registration without update()', async () => {
  for (const noUpdate of [false, true]) {
    const f = fixture({ noUpdate });
    assert.deepEqual(await f.start(), { ok: true });
    assert.equal(f.updateCalls, noUpdate ? 0 : 1); assert.deepEqual(f.posts.map(post => post.worker), ['old-active']);
    assert.equal(f.channels[0].port1.closed, true); assert.equal(f.timers.size, 0); assert.deepEqual(f.storageCalls, []);
  }
});

test('A rejected or synchronously thrown update cannot fall back to the old worker or touch cache/pack storage', async () => {
  for (const synchronous of [false, true]) {
    const failure = new Error('isolated update failure');
    const f = fixture({ update: () => { if (synchronous) throw failure; return Promise.reject(failure); } });
    const outcome = await f.start(); assert.equal(outcome.error, failure); assert.equal(f.updateCalls, 1); cleanBeforePrepare(f);
  }
});

test('A hanging update times out, and either late fulfillment or late rejection starts no PREPARE', async () => {
  for (const rejectLater of [false, true]) {
    const gate = deferred(), f = fixture({ update: () => gate.promise }), outcome = f.start();
    f.registration.installing = f.makeWorker('new-installing', 'activated');
    await f.flush(); assert.equal(f.updateCalls, 1); f.assertNoEarlySideEffects();
    f.fire(20000); const result = await outcome; assert.match(result.error?.message || '', /Aktualisierung dauert zu lange/);
    if (rejectLater) gate.reject(new Error('late isolated rejection')); else gate.resolve(f.registration);
    await f.flush(); cleanBeforePrepare(f); assert.equal(f.registration.installing.listeners.size, 0);
  }
});

test('An already redundant replacement rejects immediately and a replacement becoming redundant cleans its listener', async () => {
  for (const initial of ['redundant', 'installing']) {
    const f = fixture(), replacement = f.makeWorker('failed-new-worker', initial); f.registration.installing = replacement;
    const outcome = f.start(); await f.flush();
    if (initial === 'installing') { assert.equal(replacement.listeners.size, 1); replacement.transition('redundant'); }
    const result = await outcome; assert.match(result.error?.message || '', /nicht aktualisiert/);
    assert.equal(replacement.listeners.size, 0); cleanBeforePrepare(f);
  }
});

test('Activation timeout revokes its listener and never sends PREPARE even if the worker activates later', async () => {
  const f = fixture(), replacement = f.makeWorker('slow-new-worker', 'installing'); f.registration.installing = replacement;
  const outcome = f.start(); await f.flush(); assert.equal(replacement.listeners.size, 1);
  f.fire(20000); const result = await outcome; assert.match(result.error?.message || '', /startet zu langsam/);
  assert.equal(replacement.listeners.size, 0); replacement.transition('activated'); await f.flush(); cleanBeforePrepare(f);
});

test('Message reply rejection and download timeout close the client port and clear the relevant timer', async () => {
  for (const timeout of [false, true]) {
    const f = fixture(); f.active.reply = null; const outcome = f.start(); await f.flush();
    assert.equal(f.posts.length, 1); assert.equal(f.channels.length, 1); assert.equal(f.channels[0].port1.closed, false);
    if (timeout) f.fire(90000); else f.channels[0].port2.reply({ ok: false, message: 'isolated cache preparation rejected' });
    const result = await outcome; assert.match(result.error?.message || '', timeout ? /Download dauert zu lange/ : /preparation rejected/);
    assert.equal(f.channels[0].port1.closed, true); assert.equal(f.timers.size, 0);
    f.channels[0].port2.reply({ ok: true }); await f.flush(); assert.equal(f.posts.length, 1); assert.deepEqual(f.storageCalls, []);
  }
});

test('A synchronous postMessage failure closes both untransferred ports and clears its download timer immediately', async () => {
  const f = fixture(), failure = new Error('isolated postMessage failure'); f.active.postError = failure;
  const result = await f.start(); assert.equal(result.error, failure); assert.equal(f.channels.length, 1);
  assert.equal(f.channels[0].port1.closed, true); assert.equal(f.channels[0].port2.closed, true);
  assert.equal(f.timers.size, 0); assert.deepEqual(f.storageCalls, []);
});
