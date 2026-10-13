const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const filename = path.join(root, 'hooks/useAccountOverview.js');
const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), {
  filename, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' },
});
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const account = email => ({ email, paid: true, admin: false, accessProvider: 'apple' });
const flush = async () => { for (let i = 0; i < 16; i++) await Promise.resolve(); };

function harness(fetch) {
  const states = [], effects = [], calls = [], timers = new Map();
  let cursor = 0, effectCursor = 0, sequence = 0, now = 0;
  let pending = [];
  const react = {
    useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial;
      return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
    useCallback(fn) { return fn; },
    useEffect(fn, deps) { const i = effectCursor++, previous = effects[i];
      if (!previous || deps.some((value, index) => !Object.is(value, previous.deps[index]))) {
        pending.push(() => { previous?.cleanup?.(); effects[i] = { deps, cleanup: fn() }; });
      }
    },
  };
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'fetch', 'setTimeout', 'clearTimeout', code)(
    id => id === 'react' ? react : pr(id), mod, mod.exports,
    (...args) => { calls.push(args); return fetch(...args); },
    (fn, delay) => { timers.set(++sequence, { fn, dueAt: now + delay }); return sequence; },
    id => timers.delete(id),
  );
  const render = () => { cursor = 0; effectCursor = 0; pending = [];
    const result = mod.exports.default(); pending.forEach(fn => fn()); return result; };
  return { states, calls, timers, render,
    unmount: () => effects.forEach(effect => effect?.cleanup?.()),
    advance: elapsed => { now += elapsed; for (const [id, timer] of [...timers]) {
      if (timer.dueAt <= now) { timers.delete(id); timer.fn(); }
    } },
  };
}

test('A stalled account request exits loading, offers a retry, and ignores its late result', async () => {
  const old = deferred();
  let attempts = 0;
  const h = harness(url => url === '/api/account'
    ? ++attempts === 1 ? old.promise : Promise.resolve(response({ account: account('new@example.invalid') }))
    : Promise.resolve(response({ progress: [] })));
  assert.equal(h.render().loading, true);
  h.advance(18000); await flush();
  const failed = h.render();
  assert.equal(failed.loading, false); assert.equal(failed.progressLoading, false);
  assert.equal(failed.account, null); assert.equal(failed.accountError.code, 'REQUEST_TIMEOUT');
  assert.equal(failed.accountError.status, 504); assert.equal(h.calls[0][1].signal.aborted, true);
  assert.equal(h.calls.length, 1); assert.equal(h.timers.size, 0);
  failed.reload(); h.render(); await flush();
  assert.equal(h.render().account.email, 'new@example.invalid'); assert.equal(h.render().accountError, null);
  old.resolve(response({ account: account('old@example.invalid') })); await flush();
  assert.equal(h.render().account.email, 'new@example.invalid');
  h.unmount(); assert.equal(h.timers.size, 0);
});

test('Progress gets its own full deadline and preserves an already loaded account after timeout', async () => {
  const initial = deferred(), progress = deferred();
  const h = harness(url => url === '/api/account' ? initial.promise : progress.promise);
  h.render(); h.advance(17000);
  initial.resolve(response({ account: account('member@example.invalid') })); await flush();
  assert.equal(h.render().loading, false); assert.equal(h.render().progressLoading, true);
  h.advance(1000); await flush();
  assert.equal(h.render().progressError, null, 'Progress must not inherit the almost-expired account deadline.');
  h.advance(17000); await flush();
  const result = h.render();
  assert.equal(result.account.email, 'member@example.invalid'); assert.equal(result.accountError, null);
  assert.equal(result.progressLoading, false); assert.equal(result.progressError.code, 'REQUEST_TIMEOUT');
  assert.deepEqual(result.progress, []); assert.equal(h.calls[1][1].signal.aborted, true);
  progress.resolve(response({ progress: [{ course_id: 'late-course' }] })); await flush();
  assert.deepEqual(h.render().progress, []);
  h.unmount(); assert.equal(h.timers.size, 0);
});

test('The response body is bounded too, so a stalled JSON body cannot trap account loading', async () => {
  const body = deferred();
  const h = harness(() => Promise.resolve({ ok: true, status: 200, json: () => body.promise }));
  h.render(); await flush(); h.advance(18000); await flush();
  assert.equal(h.render().loading, false); assert.equal(h.render().accountError.code, 'REQUEST_TIMEOUT');
  assert.equal(h.calls[0][1].signal.aborted, true);
  body.resolve({ account: account('late@example.invalid') }); await flush();
  assert.equal(h.render().account, null);
  h.unmount(); assert.equal(h.timers.size, 0);
});

test('Leaving the page aborts the request silently and removes its timeout', async () => {
  const pending = deferred();
  const h = harness(() => pending.promise);
  h.render(); const snapshot = [...h.states];
  h.unmount(); await flush();
  assert.equal(h.calls[0][1].signal.aborted, true); assert.equal(h.timers.size, 0);
  assert.deepEqual(h.states, snapshot);
  pending.resolve(response({ account: account('late@example.invalid') })); await flush();
  assert.deepEqual(h.states, snapshot);
});

test('Reload cancels former progress and a late result cannot replace the new overview', async () => {
  const oldProgress = deferred();
  let accounts = 0, progresses = 0;
  const h = harness(url => url === '/api/account'
    ? Promise.resolve(response({ account: account(++accounts === 1 ? 'old@example.invalid' : 'new@example.invalid') }))
    : ++progresses === 1 ? oldProgress.promise : Promise.resolve(response({ progress: [{ course_id: 'current-course' }] })));
  h.render(); await flush();
  assert.equal(h.render().progressLoading, true);
  h.render().reload(); h.render(); await flush();
  assert.equal(h.calls[1][1].signal.aborted, true);
  assert.equal(h.render().account.email, 'new@example.invalid');
  assert.deepEqual(h.render().progress, [{ course_id: 'current-course' }]);
  oldProgress.resolve(response({ progress: [{ course_id: 'former-course' }] })); await flush();
  assert.deepEqual(h.render().progress, [{ course_id: 'current-course' }]);
  assert.equal(h.render().progressError, null);
  h.unmount(); assert.equal(h.timers.size, 0);
});

test('Authentication failures retain their renewal status and do not load course progress', async () => {
  const h = harness(() => Promise.resolve(response({ code: 'ACCOUNT_SESSION_REQUIRED' }, 401)));
  h.render(); await flush();
  const result = h.render();
  assert.equal(result.accountError.status, 401); assert.equal(result.accountError.code, 'ACCOUNT_SESSION_REQUIRED');
  assert.equal(result.loading, false); assert.equal(result.progressLoading, false); assert.equal(h.calls.length, 1);
  h.unmount(); assert.equal(h.timers.size, 0);
});

test('Malformed account and progress payloads become retryable errors instead of invalid rendered state', async () => {
  for (const body of [null, {}, { account: { email: 'member@example.invalid', paid: 'true', admin: false } }]) {
    const h = harness(() => Promise.resolve(response(body)));
    h.render(); await flush();
    assert.equal(h.render().account, null); assert.ok(h.render().accountError); assert.equal(h.render().loading, false);
    assert.equal(h.calls.length, 1); h.unmount();
  }
  for (const progress of [null, {}, [null], [['nested']]]) {
    const h = harness(url => Promise.resolve(response(url === '/api/account'
      ? { account: account('member@example.invalid') } : { progress })));
    h.render(); await flush();
    assert.equal(h.render().account.email, 'member@example.invalid'); assert.ok(h.render().progressError);
    assert.deepEqual(h.render().progress, []); assert.equal(h.render().progressLoading, false);
    h.unmount(); assert.equal(h.timers.size, 0);
  }
});
