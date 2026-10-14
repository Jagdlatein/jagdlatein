const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const filename = path.join(root, 'pages/admin/testabos.js');
const { code } = pr('next/dist/build/swc').transformSync(fs.readFileSync(filename, 'utf8'), {
  filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' },
});
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const notifications = { configured: true, recipient: 'operator@example.invalid', enabledSince: '2026-10-14T10:00:00Z', pendingCount: 0, sentCount: 1 };
const item = (email = 'member@example.invalid', environment = 'Production') => ({ id: email, email, provider: 'paypal', environment, stage: 'trial', renewal: true, trialStartedAt: '2026-10-14T10:00:00Z', trialUntil: '2026-10-17T10:00:00Z', accessUntil: '2026-10-17T10:00:00Z', firstRegularAt: null, verifiedAt: '2026-10-14T10:00:00Z' });
const body = (items = [item()], extra = {}) => ({ items, hasMore: false, offset: 0, limit: 25, windowLimit: 200, windowLimited: false, olderRecordsAvailable: false, asOf: '2026-10-14T10:00:00Z', notifications, ...extra });

function harness(fetch, { sandbox = false, serverResult = { props: {} } } = {}) {
  const states = [], refs = [], effects = [], calls = [], timers = new Map(), guards = [];
  let cursor = 0, refCursor = 0, effectCursor = 0, sequence = 0, now = 0, pending = [];
  const react = {
    useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial;
      return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
    useRef(initial) { const i = refCursor++; return refs[i] || (refs[i] = { current: initial }); },
    useEffect(fn, deps) { const i = effectCursor++, previous = effects[i];
      if (!previous || deps.some((value, index) => !Object.is(value, previous.deps[index]))) pending.push(() => { previous?.cleanup?.(); effects[i] = { deps, cleanup: fn() }; }); },
  };
  const mod = { exports: {} };
  const jsx = (type, props) => ({ type, props: props || {} });
  new Function('require', 'module', 'exports', 'fetch', 'setTimeout', 'clearTimeout', code)(
    id => id === 'react' ? react : id === 'react/jsx-runtime' ? { jsx, jsxs: jsx, Fragment: 'fragment' }
      : id === 'next/link' ? { default: 'a' }
      : id.endsWith('/AccountLayout') ? { default: ({ children }) => children }
      : id.endsWith('/account-access') ? { getPaidPageProps: async (ctx, opts) => { guards.push([ctx, opts]); return serverResult; } }
      : id.endsWith('/test-environment') ? { isPayPalSandboxTestEnvironment: () => sandbox }
      : id.endsWith('.css') ? {} : pr(id), mod, mod.exports,
    (...args) => { calls.push(args); return fetch(...args); },
    (fn, delay) => { timers.set(++sequence, { fn, dueAt: now + delay }); return sequence; },
    id => timers.delete(id),
  );
  return {
    exports: mod.exports, states, calls, timers, guards,
    render(page = false) { cursor = 0; refCursor = 0; effectCursor = 0; pending = [];
      const result = page ? mod.exports.default({ testEnvironment: sandbox }) : mod.exports.useTrialOverview(sandbox);
      pending.forEach(fn => fn()); return result; },
    unmount() { effects.forEach(effect => effect?.cleanup?.()); },
    advance(elapsed = 0) { now += elapsed; for (const [id, timer] of [...timers]) if (timer.dueAt <= now) { timers.delete(id); timer.fn(); } },
  };
}

function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join(' ');
  if (typeof node !== 'object') return String(node);
  if (typeof node.type === 'function') return text(node.type(node.props));
  return text(node.props?.children);
}

test('The private page uses the existing admin-only access guard, preserves redirects and exposes no secrets', async () => {
  const context = { req: {}, res: {}, resolvedUrl: '/admin/testabos' };
  const live = harness(() => {}, {});
  assert.deepEqual(await live.exports.getServerSideProps(context), { props: { testEnvironment: false } });
  assert.deepEqual(live.guards, [[context, { adminOnly: true }]]);
  const sandbox = harness(() => {}, { sandbox: true });
  assert.deepEqual(await sandbox.exports.getServerSideProps(context), { props: { testEnvironment: true } });
  const denied = { redirect: { destination: '/konto', permanent: false } };
  const blocked = harness(() => {}, { serverResult: denied });
  assert.equal(await blocked.exports.getServerSideProps(context), denied);
});

test('Partial email queries do not create failed API calls; complete email is normalized and debounced', async () => {
  const h = harness(() => Promise.resolve(response(body())));
  h.render(); h.advance(); await flush(); assert.equal(h.calls.length, 1);
  h.render().search('MEMBER@'); h.render(); h.advance(300); await flush();
  assert.equal(h.render().incompleteSearch, true); assert.equal(h.render().data, null); assert.equal(h.calls.length, 1);
  h.render().search('  MEMBER@EXAMPLE.INVALID  '); h.render(); h.advance(299); await flush();
  assert.equal(h.calls.length, 1); h.advance(1); await flush();
  const params = new URL(h.calls[1][0], 'https://local.invalid').searchParams;
  assert.equal(params.get('q'), 'member@example.invalid'); assert.equal(params.get('environment'), 'live');
  assert.equal(h.render().data.items[0].email, 'member@example.invalid');
  assert.equal(h.calls[1][1].credentials, 'same-origin'); assert.equal(h.calls[1][1].cache, 'no-store'); h.unmount();
});

test('A former search cannot replace the current results even if its aborted request resolves late', async () => {
  const old = deferred(); let requests = 0;
  const h = harness(() => ++requests === 1 ? old.promise : Promise.resolve(response(body([item('current@example.invalid')]))));
  h.render(); h.advance(); await flush();
  h.render().search('current@example.invalid'); h.render(); h.advance(300); await flush();
  assert.equal(h.calls[0][1].signal.aborted, true);
  assert.equal(h.render().data.items[0].email, 'current@example.invalid');
  old.resolve(response(body([item('former@example.invalid')]))); await flush();
  assert.equal(h.render().data.items[0].email, 'current@example.invalid'); h.unmount();
});

test('Changing environment immediately removes former customer rows and rejects a mixed-environment response', async () => {
  const next = deferred(); let requests = 0;
  const h = harness(() => ++requests === 1 ? Promise.resolve(response(body())) : next.promise);
  h.render(); h.advance(); await flush(); assert.equal(h.render().data.items.length, 1);
  h.render().chooseEnvironment('sandbox'); h.render(); assert.equal(h.render().data, null);
  h.advance(); await flush(); assert.equal(new URL(h.calls[1][0], 'https://local.invalid').searchParams.get('environment'), 'sandbox');
  next.resolve(response(body())); await flush();
  assert.equal(h.render().data, null); assert.equal(h.render().error.code, 'INVALID_RESPONSE'); h.unmount();
});

test('The isolated sandbox starts on test data and cannot select live data', async () => {
  const h = harness(() => Promise.resolve(response(body([item('test@example.invalid', 'Sandbox')]))), { sandbox: true });
  assert.equal(h.render().environment, 'sandbox'); h.advance(); await flush();
  h.render().chooseEnvironment('live'); assert.equal(h.render().environment, 'sandbox');
  assert.equal(h.render().data.items[0].environment, 'Sandbox'); assert.equal(h.calls.length, 1); h.unmount();
});

test('Timeout includes a stalled JSON body and exits loading with a retryable error', async () => {
  const pending = deferred();
  const h = harness(() => Promise.resolve({ ok: true, status: 200, json: () => pending.promise }));
  h.render(); h.advance(); await flush(); h.advance(18000); await flush();
  assert.equal(h.render().loading, false); assert.equal(h.render().error.code, 'REQUEST_TIMEOUT');
  assert.equal(h.calls[0][1].signal.aborted, true); assert.equal(h.timers.size, 0);
  pending.resolve(body()); await flush(); assert.equal(h.render().data, null); h.unmount();
});

test('Unmount silently aborts loading and removes its timer without committing a late response', async () => {
  const pending = deferred(); const h = harness(() => pending.promise);
  h.render(); h.advance(); await flush(); const snapshot = [...h.states];
  h.unmount(); assert.equal(h.calls[0][1].signal.aborted, true);
  pending.resolve(response(body())); await flush(); assert.deepEqual(h.states, snapshot); assert.equal(h.timers.size, 0);
});

test('Authentication failure removes customer data and email status rather than showing cached private rows', async () => {
  let requests = 0;
  const h = harness(() => Promise.resolve(response(++requests === 1 ? body() : { code: 'FORBIDDEN' }, requests === 1 ? 200 : 403)));
  h.render(); h.advance(); await flush(); assert.equal(h.render().notifications.configured, true);
  h.render().reload(); h.render(); h.advance(); await flush();
  const result = h.render(); assert.equal(result.data, null); assert.equal(result.notifications, null); assert.equal(result.error.status, 403);
  const rendered = text(h.render(true)); assert.match(rendered, /nur für das bestehende Betreiberkonto/); assert.doesNotMatch(rendered, /operator@example|member@example|E-Mail bei neuen/); h.unmount();
});

test('Email check posts only empty JSON, prevents duplicate requests and does not replace the overview on a mail failure', async () => {
  const mail = deferred();
  const h = harness((url, opts) => opts.method === 'POST' ? mail.promise : Promise.resolve(response(body())));
  h.render(); h.advance(); await flush(); const shown = h.render().data;
  const first = h.render().checkNotifications(); const second = h.render().checkNotifications();
  assert.equal(h.calls.length, 2); assert.equal(h.calls[1][0], '/api/admin/trials'); assert.equal(h.calls[1][1].body, '{}');
  assert.deepEqual(h.calls[1][1].headers, { 'Content-Type': 'application/json' });
  mail.resolve(response({ code: 'SMTP_UNAVAILABLE' }, 503)); await first; await second; await flush();
  assert.equal(h.render().data, shown); assert.equal(h.render().mailPending, false); assert.match(h.render().mailMessage, /E-Mail-Prüfung konnte nicht/); h.unmount();
});

test('A mail access denial invalidates an overlapping overview request and all private displayed data', async () => {
  const overview = deferred();
  const h = harness((url, opts) => opts.method === 'POST' ? Promise.resolve(response({ code: 'FORBIDDEN' }, 403)) : overview.promise);
  h.render(); h.advance(); await flush(); await h.render().checkNotifications(); await flush();
  assert.equal(h.calls[0][1].signal.aborted, true); assert.equal(h.render().error.status, 403);
  overview.resolve(response(body())); await flush();
  assert.equal(h.render().data, null); assert.equal(h.render().error.status, 403); assert.equal(h.render().notifications, null); h.unmount();
});

test('The mail check gets enough time for the bounded SMTP retry and still exits on a stalled body', async () => {
  const pending = deferred();
  const h = harness((url, options) => options.method === 'POST'
    ? Promise.resolve({ ok: true, status: 200, json: () => pending.promise }) : Promise.resolve(response(body())));
  h.render(); h.advance(); await flush(); const check = h.render().checkNotifications(); await flush();
  h.advance(18000); await flush(); assert.equal(h.render().mailPending, true);
  h.advance(27000); await check; await flush(); assert.equal(h.render().mailPending, false);
  assert.equal(h.calls[1][1].signal.aborted, true); assert.match(h.render().mailMessage, /E-Mail-Prüfung konnte nicht/);
  assert.equal(h.render().data.items.length, 1); h.unmount();
});

test('Paging follows server hasMore, resets on searches and refuses arbitrary environment choices', async () => {
  const h = harness(url => { const offset = Number(new URL(url, 'https://local.invalid').searchParams.get('offset')); return Promise.resolve(response(body([item()], { offset, hasMore: offset === 0 }))); });
  h.render(); h.advance(); await flush(); h.render().next(); h.render(); h.advance(); await flush();
  assert.equal(h.render().offset, 25); assert.equal(h.render().data.hasMore, false);
  h.render().next(); assert.equal(h.render().offset, 25);
  h.render().previous(); h.render(); assert.equal(h.render().offset, 0);
  h.render().search('new@example.invalid'); h.render(); assert.equal(h.render().offset, 0);
  h.render().chooseEnvironment('//outside.invalid'); assert.equal(h.render().environment, 'live'); h.unmount();
});

test('Missing mail configuration is independent of the overview, which never invents prices or a regular payment', async () => {
  const h = harness(() => Promise.resolve(response(body([item()], { notifications: { configured: false } }))));
  h.render(); h.advance(); await flush();
  const rendered = text(h.render(true));
  assert.match(rendered, /member@example.invalid/); assert.match(rendered, /E-Mail-Versand ist noch nicht vollständig eingerichtet/);
  assert.match(rendered, /Noch nicht bestätigt/); assert.doesNotMatch(rendered, /EUR|CHF|USD/);
  assert.equal(h.exports.overviewDate('invalid'), 'Noch nicht bestätigt');
  assert.match(h.exports.overviewDate('2026-10-14T10:00:00Z'), /12:00/); h.unmount();
});

test('Malformed or oversized provider payloads cannot become a displayed customer overview', () => {
  const h = harness(() => {});
  for (const malformed of [null, {}, body([null]), body([item()], { limit: 100 }), body(Array.from({ length: 26 }, () => item())), body([{ ...item(), stage: 'guess' }])]) assert.equal(h.exports.validTrialOverview(malformed), false);
  assert.equal(h.exports.validTrialOverview(body()), true);
});

test('A bounded result window is labelled without inventing a global customer count', async () => {
  const h = harness(() => Promise.resolve(response(body([item()], { windowLimited: true, olderRecordsAvailable: true }))));
  h.render(); h.advance(); await flush(); const rendered = text(h.render(true));
  assert.match(rendered, /bis zu\s+200\s+aktuelle Abos begrenzt/); assert.match(rendered, /Ältere Einträge können fehlen/);
  assert.doesNotMatch(rendered, /insgesamt 200|200 Kunden/); h.unmount();
});

test('The account entry is available only for the existing admin account', () => {
  const accountFile = path.join(root, 'pages/konto.js');
  const transformed = pr('next/dist/build/swc').transformSync(fs.readFileSync(accountFile, 'utf8'), {
    filename: accountFile, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' },
  });
  for (const admin of [true, false]) {
    const mod = { exports: {} }, jsx = (type, props) => ({ type, props: props || {} });
    new Function('require', 'module', 'exports', transformed.code)(id =>
      id === 'react' ? { useEffect() {}, useRef: value => ({ current: value }), useState: value => [value, () => {}] }
      : id === 'react/jsx-runtime' ? { jsx, jsxs: jsx, Fragment: 'fragment' }
      : id === 'next/link' ? { default: 'a' }
      : id.endsWith('/AccountLayout') ? { default: ({ children }) => children }
      : id.endsWith('/useAccountOverview') ? () => ({ account: { email: 'operator@example.invalid', paid: true, admin }, progress: [], loading: false })
      : id.endsWith('/course-catalog') ? { courses: [] }
      : {}, mod, mod.exports);
    const rendered = text(mod.exports.default());
    assert.equal(rendered.includes('Testabos und Abos'), admin);
  }
});
