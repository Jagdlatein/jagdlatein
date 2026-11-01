// Isolated real RAM store. No account, browser storage or network is accessed.
const test = require('node:test'), assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222';
const CH = { country: 'CH', region: 'ZH' }, AT = { country: 'AT', region: 'NOE' };
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
function fixture(t, { server = false } = {}) {
  const descriptors = new Map(), calls = [], timers = new Map(); let timerId = 0, storageReads = 0, disposed = false;
  const values = { fetch: (url, options) => { const task = deferred(); calls.push({ url, options, ...task }); return task.promise; },
    setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; }, clearTimeout: id => timers.delete(id) };
  if (!server) values.window = { get localStorage() { storageReads++; throw new Error('Local preferences are forbidden here'); }, get sessionStorage() { storageReads++; throw new Error('Session preferences are forbidden here'); } };
  else values.window = undefined;
  for (const [key, value] of Object.entries(values)) { descriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value }); }
  const api = createLoader()('lib/account-exam-profile-client.js');
  function dispose() { if (disposed) return; disposed = true; api.resetAccountExamProfile(); timers.clear(); for (const [key, desc] of descriptors) { if (desc) Object.defineProperty(globalThis, key, desc); else delete globalThis[key]; } }
  t.after(dispose);
  function respond(index, profile = null, accountKey = A, status = 200) { calls[index].resolve(Response.json({ profile, accountKey }, { status })); }
  return { api, calls, timers, respond, dispose, get snapshot() { return api.getAccountExamSnapshot(); }, get storageReads() { return storageReads; },
    async ready(profile = null, accountKey = A) { const task = api.loadAccountExamProfile(); respond(calls.length - 1, profile, accountKey); assert.equal(await task, true); },
    timeout() { const entries = [...timers]; assert.equal(entries.length, 1); assert.equal(entries[0][1].delay, 18000); entries[0][1].callback(); },
  };
}

test('Server snapshot is stable, empty and immutable; SSR cannot fetch or read a device target', async t => {
  const s = fixture(t, { server: true }); const initial = s.api.getServerAccountExamSnapshot();
  assert.equal(initial, s.api.getServerAccountExamSnapshot()); assert.equal(Object.isFrozen(initial), true);
  assert.equal(initial.phase, 'idle'); assert.equal(initial.ready, false); assert.equal(initial.profile, null);
  assert.equal(await s.api.loadAccountExamProfile(), false); assert.equal(await s.api.saveAccountExamProfile(CH), false);
  assert.equal(s.calls.length, 0); assert.equal(s.storageReads, 0);
});

test('GET is a same-origin no-store account request, and repeated loads neither duplicate it nor use local preferences', async t => {
  const s = fixture(t), task = s.api.loadAccountExamProfile();
  assert.equal(s.snapshot.phase, 'loading'); assert.equal(s.snapshot.ready, false); assert.equal(s.snapshot.profile, null);
  assert.equal(await s.api.loadAccountExamProfile(), false); assert.equal(s.calls.length, 1);
  assert.equal(s.calls[0].url, '/api/account/exam-profile'); assert.equal(s.calls[0].options.cache, 'no-store'); assert.equal(s.calls[0].options.credentials, 'same-origin');
  assert.equal(s.calls[0].options.method, undefined); assert.equal(s.calls[0].options.body, undefined);
  s.respond(0, CH); assert.equal(await task, true); assert.deepEqual(s.snapshot.profile, CH); assert.equal(s.snapshot.accountKey, A);
  assert.equal(s.snapshot.persistence, 'account'); assert.equal(await s.api.loadAccountExamProfile(), true); assert.equal(s.calls.length, 1);
  assert.equal(s.storageReads, 0); assert.equal(s.timers.size, 0);
});

test('An absent server target remains absent and invalid local values can never fill it', async t => {
  const s = fixture(t); await s.ready(); assert.equal(s.snapshot.ready, true); assert.equal(s.snapshot.profile, null);
  for (const value of [null, {}, [], { country: 'CH', region: 'BY' }, { country: '__proto__', region: 'ZH' }]) assert.equal(await s.api.saveAccountExamProfile(value), false);
  assert.equal(s.calls.length, 1); assert.equal(s.snapshot.clearProfile(), false); assert.equal(s.storageReads, 0);
});

test('Missing or malformed account envelopes fail closed, including missing profile and mismatched country/region', async t => {
  const invalid = [{ profile: CH }, { accountKey: A }, { profile: CH, accountKey: 'not-an-account' }, { profile: { country: 'CH', region: 'BY' }, accountKey: A }, { profile: [], accountKey: A }];
  for (const body of invalid) {
    const s = fixture(t), task = s.api.loadAccountExamProfile(); s.calls[0].resolve(Response.json(body));
    assert.equal(await task, false); assert.equal(s.snapshot.phase, 'error'); assert.equal(s.snapshot.profile, null); assert.equal(s.snapshot.accountKey, null); assert.equal(s.snapshot.ready, false); s.dispose();
  }
});

test('Only the confirmed PUT commits a profile, with the exact account header and no draft or personal fields', async t => {
  const s = fixture(t); await s.ready();
  const task = s.api.saveAccountExamProfile({ ...AT, email: 'synthetic@example.invalid', notes: 'Do not persist', next: '/konto' });
  assert.equal(s.snapshot.profile, null); assert.equal(s.snapshot.saving, true); assert.equal(s.snapshot.ready, true);
  const request = s.calls[1]; assert.equal(request.options.method, 'PUT'); assert.equal(request.options.headers['X-Jagdlatein-Exam-Account'], A);
  assert.equal(request.options.headers['Content-Type'], 'application/json'); assert.equal(request.options.credentials, 'same-origin');
  assert.deepEqual(JSON.parse(request.options.body), AT); assert.doesNotMatch(request.options.body, /email|notes|next/);
  assert.equal(await s.api.saveAccountExamProfile(CH), false); assert.equal(s.calls.length, 2);
  s.respond(1, AT); assert.equal(await task, true); assert.deepEqual(s.snapshot.profile, AT); assert.equal(s.snapshot.saving, false); assert.equal(s.timers.size, 0);
});

test('A failed PUT preserves the last confirmed target and is retryable without an optimistic replacement', async t => {
  const s = fixture(t); await s.ready(CH); const task = s.api.saveAccountExamProfile(AT);
  assert.deepEqual(s.snapshot.profile, CH); s.calls[1].resolve(Response.json({ message: 'Synthetic unavailable' }, { status: 503 }));
  assert.equal(await task, false); assert.equal(s.snapshot.ready, true); assert.deepEqual(s.snapshot.profile, CH); assert.equal(s.snapshot.saving, false); assert.match(s.snapshot.error, /nicht bestätigt/);
  const retry = s.api.saveAccountExamProfile(AT); s.respond(2, AT); assert.equal(await retry, true); assert.deepEqual(s.snapshot.profile, AT);
});

test('Transport and JSON parse failures close their timeout and expose no server-supplied private error text', async t => {
  for (const mode of ['transport', 'json']) {
    const s = fixture(t), task = s.api.loadAccountExamProfile();
    if (mode === 'transport') s.calls[0].reject(new Error('Synthetic private detail'));
    else s.calls[0].resolve({ ok: true, status: 200, json() { throw new Error('Synthetic private detail'); } });
    assert.equal(await task, false); assert.equal(s.snapshot.phase, 'error'); assert.equal(s.snapshot.ready, false); assert.equal(s.timers.size, 0); assert.doesNotMatch(s.snapshot.error, /Synthetic private detail/); s.dispose();
  }
});

test('GET 401 and PUT 401/409 discard the former account target instead of reusing a device fallback', async t => {
  for (const status of [401, 409]) {
    const s = fixture(t); await s.ready(CH); const task = s.api.saveAccountExamProfile(AT);
    s.calls[1].resolve(Response.json({ message: 'Synthetic changed session' }, { status })); assert.equal(await task, false);
    assert.equal(s.snapshot.phase, 'signed-out'); assert.equal(s.snapshot.ready, false); assert.equal(s.snapshot.profile, null); assert.equal(s.snapshot.accountKey, null); assert.equal(s.snapshot.saving, false);
    assert.equal(await s.api.saveAccountExamProfile(AT), false); s.dispose();
  }
  const s = fixture(t), task = s.api.loadAccountExamProfile(); s.calls[0].resolve(Response.json({ message: 'Synthetic expired' }, { status: 401 }));
  assert.equal(await task, false); assert.equal(s.snapshot.phase, 'signed-out'); assert.equal(s.snapshot.profile, null);
});

test('A PUT success envelope for another account or another target is a session conflict, never an accepted save', async t => {
  for (const [profile, key] of [[AT, B], [CH, A], [null, A]]) {
    const s = fixture(t); await s.ready(); const task = s.api.saveAccountExamProfile(AT); s.respond(1, profile, key);
    assert.equal(await task, false); assert.equal(s.snapshot.phase, 'signed-out'); assert.equal(s.snapshot.profile, null); assert.equal(s.snapshot.accountKey, null); s.dispose();
  }
});

test('A forced account reload aborts the pending PUT; its late success cannot overwrite the new account', async t => {
  const s = fixture(t); await s.ready(CH); const old = s.api.saveAccountExamProfile(AT);
  const next = s.api.loadAccountExamProfile({ force: true }); assert.equal(s.calls[1].options.signal.aborted, true);
  assert.equal(s.snapshot.profile, null); assert.equal(s.snapshot.accountKey, null); s.respond(2, null, B); assert.equal(await next, true);
  s.respond(1, AT, A); assert.equal(await old, false); assert.equal(s.snapshot.accountKey, B); assert.equal(s.snapshot.profile, null); assert.equal(s.snapshot.ready, true);
});

test('Superseded GET success and failure cannot release or corrupt the current load, including A-B-A generations', async t => {
  const s = fixture(t), first = s.api.loadAccountExamProfile(), second = s.api.loadAccountExamProfile({ force: true });
  assert.equal(s.calls[0].options.signal.aborted, true); s.respond(0, CH, A); assert.equal(await first, false); assert.equal(s.snapshot.phase, 'loading');
  const third = s.api.loadAccountExamProfile({ force: true }); assert.equal(s.calls[1].options.signal.aborted, true);
  s.calls[1].reject(new Error('Old B failed')); assert.equal(await second, false); assert.equal(s.snapshot.phase, 'loading');
  s.respond(2, AT, A); assert.equal(await third, true); assert.deepEqual(s.snapshot.profile, AT); assert.equal(s.snapshot.accountKey, A);
});

test('Reset invalidates pending load and save immediately; an ignored abort and late result cannot revive either', async t => {
  for (const action of ['load', 'save']) {
    const s = fixture(t); if (action === 'save') await s.ready(CH);
    const task = action === 'load' ? s.api.loadAccountExamProfile() : s.api.saveAccountExamProfile(AT), index = s.calls.length - 1;
    s.api.resetAccountExamProfile(); assert.equal(s.calls[index].options.signal.aborted, true); s.respond(index, AT);
    assert.equal(await task, false); assert.equal(s.snapshot.phase, 'signed-out'); assert.equal(s.snapshot.profile, null); assert.equal(s.snapshot.saving, false); s.dispose();
  }
});

test('A GET timeout aborts transport, closes readiness and ignores a response arriving after the deadline', async t => {
  const s = fixture(t), task = s.api.loadAccountExamProfile(); s.timeout(); assert.equal(await task, false);
  assert.equal(s.calls[0].options.signal.aborted, true); assert.equal(s.snapshot.phase, 'error'); assert.equal(s.snapshot.profile, null); assert.equal(s.timers.size, 0);
  s.respond(0, CH); await Promise.resolve(); await Promise.resolve(); assert.equal(s.snapshot.phase, 'error'); assert.equal(s.snapshot.profile, null);
  const retry = s.api.loadAccountExamProfile({ force: true }); s.respond(1, AT); assert.equal(await retry, true);
});

test('A PUT timeout keeps the confirmed target, permits retry and ignores late timed-out success', async t => {
  const s = fixture(t); await s.ready(CH); const task = s.api.saveAccountExamProfile(AT); s.timeout();
  assert.equal(await task, false); assert.deepEqual(s.snapshot.profile, CH); assert.equal(s.snapshot.saving, false); assert.equal(s.calls[1].options.signal.aborted, true);
  const retry = s.api.saveAccountExamProfile(CH); s.respond(1, AT); await Promise.resolve(); assert.deepEqual(s.snapshot.profile, CH);
  s.respond(2, CH); assert.equal(await retry, true); assert.deepEqual(s.snapshot.profile, CH); assert.equal(s.timers.size, 0);
});

test('Subscriptions detach idempotently, and equal confirmed profiles retain identity without changing the stable SSR snapshot', async t => {
  const s = fixture(t), server = s.api.getServerAccountExamSnapshot(); let mounted = 0, detached = 0;
  const off = s.api.subscribeAccountExamProfile(() => mounted++), offOld = s.api.subscribeAccountExamProfile(() => detached++);
  await s.ready(CH); const profile = s.snapshot.profile, oldCalls = detached; offOld(); offOld();
  const save = s.api.saveAccountExamProfile(CH); s.respond(1, CH); assert.equal(await save, true);
  assert.equal(s.snapshot.profile, profile); assert.equal(detached, oldCalls); assert.ok(mounted > oldCalls);
  assert.equal(s.api.getServerAccountExamSnapshot(), server); assert.equal(server.profile, null); off();
});
