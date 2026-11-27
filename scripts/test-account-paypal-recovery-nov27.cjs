// Canonical Page/API + unchanged production
// currentAccountPayPalCheckout/accessFromSubscriptions, isolated DOM and I/O.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { local, createLoader, root: repo } = require('./helpers/project-module.cjs');
const prepared = repo; // Read the actual canonical Page/API modules, no workspace overlay.
const React = local('react'), { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM);
const email = 'synthetic-buyer@example.invalid', generation = '11111111-1111-4111-8111-111111111111', other = '22222222-2222-4222-8222-222222222222';
const session = { email, accountGeneration: generation }, id = 'I-SYNTHETIC123';
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const flush = async () => { for (let i = 0; i < 32; i++) await Promise.resolve(); };
const identity = { accountKey: generation, accountEmail: email };
const status = (value = 'APPROVED', extra = {}) => ({ subscriptionId: id, status: value, activated: false, accessType: 'none', trialUntil: null, ...identity, ...extra });
const auth = (extra = {}) => ({ loggedIn: true, email, paid: false, admin: false, ...extra });
const row = (value = 'APPROVED', extra = {}) => ({ subscription_id: id, account_email: email, account_generation: generation, account_deleted_at: null, status: value, ...extra });
const fail = (code = 503) => Object.assign(new Error('Synthetic controlled failure'), { status: code });

function overlayLoader(overrides = {}, { fetch = () => { throw Error('No request double'); }, setTimeout: later = global.setTimeout, clearTimeout: clear = global.clearTimeout } = {}) {
  const cache = new Map();
  function load(relative) {
    const canonical = path.resolve(repo, relative), key = path.relative(repo, canonical).replaceAll('\\', '/');
    if (Object.hasOwn(overrides, key)) return overrides[key];
    if (cache.has(key)) return cache.get(key).exports;
    const filename = ['pages/konto.js', 'pages/hilfe.js', 'app/api/apple/context/route.js', 'app/api/paypal/checkout-status/route.js'].includes(key) ? path.join(prepared, key) : canonical;
    if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
    const module = { exports: {} }; cache.set(key, module);
    const { code } = local('next/dist/build/swc').transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', 'fetch', 'setTimeout', 'clearTimeout', code)(name => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      if (name.startsWith('.')) return load(path.resolve(path.dirname(canonical), path.extname(name) ? name : `${name}.js`));
      return local(name);
    }, module, module.exports, fetch, later, clear);
    return module.exports;
  }
  return load;
}

const actualAccess = createLoader({ '@supabase/supabase-js': { createClient() { throw Error('No database client'); } }, '../app/api/paypal/webhook/_base': { paypalBase() { throw Error('No provider'); }, paypalRequest() { throw Error('No provider'); } } })('lib/subscription-access.js');
function api(options = {}) {
  const state = { provider: 0, current: 0, resolves: 0, ledger: 0, creates: 0, valid: true };
  const before = options.before || { paid: false, paidUntil: null, accessType: 'none', trialUntil: null, source: 'none', status: options.stored || 'APPROVED' };
  const database = { from(table) {
    if (table === 'userprofile') return { select() { return this; }, ilike() { return this; }, async maybeSingle() { return { data: { email, account_generation: generation, is_premium: options.legacy === true, is_admin: options.admin === true }, error: null }; } };
    assert.equal(table, 'paypal_subscriptions'); state.ledger++;
    const trace = { filters: [] }; state.trace = trace;
    return { select() { return this; }, eq(key, value) { trace.filters.push([key, value]); return this; }, in(key, values) { trace.statuses = values; return this; }, async limit(value) { trace.limit = value; return { data: options.rows ?? (options.empty ? [] : [row(options.stored)]), error: options.databaseError || null }; } };
  }, async rpc() { state.creates++; throw Error('Recovery must never create/reserve/cancel a contract'); } };
  const common = {
    requireSameOriginJson(req) { if (req.headers.get('origin') !== new URL(req.url).origin) throw fail(403); if (req.headers.get('content-type') !== 'application/json') throw fail(415); },
    requireAccountSession() { if (options.unsigned) throw fail(401); return session; },
    getAccountDatabase: () => database,
    async requireCurrentAccount() { state.current++; if (!state.valid || options.invalidCurrentAt === state.current) throw fail(401); },
    accountJson: (value, code = 200) => Response.json(value, { status: code, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } }),
    accountErrorResponse: error => Response.json({ error: 'Unavailable' }, { status: error.status || 503 }),
    accountUnavailable: () => fail(), sessionRenewalRequired: () => fail(401),
  };
  class AppleSubscriptionError extends Error {}
  const load = overlayLoader({
    'lib/account-session.js': { isAccountGenerationEnabled: () => true },
    'lib/course-progress-server.js': common,
    'lib/paypal-checkout-settings.js': { paypalCheckoutSettings: () => ({}) },
    'lib/paypal-plan-pricing.js': {},
    'app/api/paypal/webhook/_base.js': { paypalRequest() { state.creates++; throw Error('No direct provider operation'); } },
    'lib/subscription-access.js': {
      validSubscriptionId: actualAccess.validSubscriptionId,
      accessFromSubscriptions: actualAccess.accessFromSubscriptions,
      async refreshVerifiedSubscription(value, context) { state.provider++; assert.equal(value, id); assert.equal(context.database, database); assert.deepEqual(context.expectedAccount, session); if (options.providerError) throw fail(); if (options.waitProvider) await options.waitProvider.promise; if (options.invalidateAfterProvider) state.valid = false; return Object.hasOwn(options, 'fresh') ? options.fresh : row(options.freshStatus || 'ACTIVE'); },
      async resolveSubscriptionAccess() { state.resolves++; if (state.resolves > 1 && options.resolveError) throw fail(); if (state.resolves > 1 && options.invalidateAfterResolve) state.valid = false; return state.resolves > 1 ? options.after || before : before; },
    },
    'lib/apple-subscriptions.js': { AppleSubscriptionError, appleSubscriptionConfig: () => options.disabled ? null : { environment: 'Production', productIds: ['de.jagdlatein.premium.monthly'] }, createAppleApiClient: () => ({}), ensureAppleAccountToken: async () => other, appleErrorResponse: () => Response.json({}, { status: 503 }) },
    'lib/apple-review-policy.js': { appleReviewPolicy: () => ({}) },
  });
  return { state,
    async checkout({ key, body = '{}', origin = 'https://jagdlatein.test', contentType = 'application/json' } = {}) {
      const headers = { origin, 'content-type': contentType }; if (key !== undefined) headers['X-Jagdlatein-Account-Key'] = key;
      return load('app/api/paypal/checkout-status/route.js').POST(new Request('https://jagdlatein.test/api/paypal/checkout-status', { method: 'POST', headers, body }));
    },
    apple: () => load('app/api/apple/context/route.js').GET(new Request('https://jagdlatein.test/api/apple/context')),
  };
}

test('Bound checkout caller gets only its signed generation/email after fresh real-helper verification; no-header caller keeps exact prior body', async () => {
  for (const key of [undefined, generation]) {
    const h = api(); const response = await h.checkout({ key }); assert.equal(response.status, 200); const data = await response.json();
    assert.deepEqual(data, { subscriptionId: id, status: 'ACTIVE', activated: false, accessType: 'none', trialUntil: null, ...(key ? identity : {}) });
    assert.equal(h.state.current, key ? 2 : 1); assert.equal(h.state.provider, 1); assert.equal(h.state.creates, 0); assert.equal(h.state.trace.limit, 2);
    assert.deepEqual(h.state.trace.filters, [['account_email', email], ['account_generation', generation]]); assert.equal(response.headers.get('cache-control'), 'private, no-store');
  }
});

test('Present malformed, empty, foreign or joined AccountKey header gets409 before provider or ledger lookup', async () => {
  for (const key of ['', 'invalid', other, generation + ',' + generation]) { const h = api(); assert.equal((await h.checkout({ key })).status, 409); assert.equal(h.state.provider, 0); assert.equal(h.state.ledger, 0); }
});

test('Both caller forms retain same-origin, JSON{}, current-account and unsigned failures without any creation operation', async () => {
  for (const key of [undefined, generation]) {
    for (const body of ['null', '[]', '{"subscriptionId":"I-ATTACKER123"}', '{"price":1}', 'broken']) { const h = api(); assert.equal((await h.checkout({ key, body })).status, 400); assert.equal(h.state.provider, 0); }
    assert.equal((await api().checkout({ key, origin: 'https://foreign.invalid' })).status, 403);
    assert.equal((await api().checkout({ key, contentType: 'text/plain' })).status, 415);
    assert.equal((await api({ unsigned: true }).checkout({ key })).status, 401);
  }
});

test('A bound recovery response rechecks current generation after providerawait and cannot echo a removed owner', async () => {
  const waitProvider = deferred(), h = api({ waitProvider }); const result = h.checkout({ key: generation }); await flush();
  assert.equal(h.state.provider, 1); h.state.valid = false; waitProvider.resolve(); const response = await result; assert.equal(response.status, 401); assert.equal((await response.json()).accountKey, undefined);
});

test('Apple guard follows all24 stored/fresh real-helper outcomes; pending and terminal statuses are not blanket-blocked', async () => {
  for (const stored of ['APPROVAL_PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED']) for (const freshStatus of ['APPROVAL_PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED']) {
    const h = api({ stored, freshStatus }); const response = await h.apple(); assert.equal(response.status, 200); const value = await response.json();
    assert.equal(value.paid, false); assert.equal(value.purchaseAllowed, !['APPROVED', 'ACTIVE', 'SUSPENDED'].includes(freshStatus)); assert.equal(h.state.provider, 1); assert.equal(h.state.current, 2); assert.equal(h.state.creates, 0);
  }
});

test('No own PayPal agreement allows an unpaid Apple offer without a provider read', async () => {
  const h = api({ empty: true }); const response = await h.apple(); assert.equal(response.status, 200); assert.equal((await response.json()).purchaseAllowed, true); assert.equal(h.state.provider, 0); assert.equal(h.state.current, 2);
});

test('A fresh funded agreement re-resolves combined paid/type/provider; paid is never forged to express a blocker', async () => {
  for (const freshStatus of ['ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED']) {
    const h = api({ fresh: row(freshStatus, { paid_until: '2027-01-01T00:00:00Z' }), after: { paid: true, accessType: 'paid', source: 'paypal' } });
    const response = await h.apple(); assert.equal(response.status, 200); const value = await response.json(); assert.equal(value.paid, true); assert.equal(value.accessType, 'paid'); assert.equal(value.accessProvider, 'paypal'); assert.equal(value.purchaseAllowed, false); assert.equal(h.state.resolves, 2);
  }
  for (const options of [{}, { resolveError: true }]) { const f = api({ fresh: row('ACTIVE', { paid_until: '2027-01-01T00:00:00Z' }), ...options }); assert.equal((await f.apple()).status, 503); }
});

test('Expired Apple status cannot hide an open PayPal agreement; paid/admin/legacy/courtesy accounts do not run a new eligibility checkout', async () => {
  const hidden = api({ before: { paid: false, accessType: 'none', source: 'apple', status: 'EXPIRED' }, freshStatus: 'SUSPENDED' }); const response = await hidden.apple(); assert.equal((await response.json()).purchaseAllowed, false); assert.equal(hidden.state.provider, 1);
  for (const kind of ['paid', 'legacy', 'courtesy', 'trial']) { const h = api({ before: { paid: true, accessType: kind, source: kind === 'courtesy' ? 'manual_grant' : 'paypal' } }); const value = await (await h.apple()).json(); assert.equal(value.paid, true); assert.equal(value.purchaseAllowed, false); assert.equal(h.state.ledger, 0); }
  const admin = api({ admin: true }); const value = await (await admin.apple()).json(); assert.equal(value.paid, true); assert.equal(value.accessProvider, 'admin'); assert.equal(admin.state.ledger, 0);
});

test('Ambiguous/foreign/deleted ledgers, provider errors and missing fresh bindings never enable an Apple offer', async () => {
  for (const options of [{ rows: [row(), row()] }, { rows: [row('APPROVED', { account_email: 'foreign@example.invalid' })] }, { rows: [row('APPROVED', { account_generation: other })] }, { rows: [row('APPROVED', { account_deleted_at: '2026-11-27T00:00:00Z' })] }, { databaseError: { code: 'synthetic' } }, { providerError: true }, { fresh: null }, { fresh: row('UNKNOWN') }, { fresh: row('ACTIVE', { account_generation: other }) }]) {
    const h = api(options), response = await h.apple(); assert.equal(response.status, 503); assert.notEqual((await response.json()).purchaseAllowed, true); assert.equal(h.state.creates, 0);
  }
});

test('A generation deleted during Apple providerawait is denied by the final current-account check', async () => {
  const h = api({ invalidateAfterProvider: true }); assert.equal((await h.apple()).status, 401); assert.equal(h.state.current, 2);
  const after = api({ fresh: row('ACTIVE', { paid_until: '2027-01-01T00:00:00Z' }), after: { paid: true, accessType: 'paid', source: 'paypal' }, invalidateAfterResolve: true });
  assert.equal((await after.apple()).status, 401); assert.equal(after.state.current, 2);
});

test('Disabled Apple configuration stays disabled without any account/provider eligibility read', async () => {
  const h = api({ disabled: true }); assert.deepEqual(await (await h.apple()).json(), { enabled: false }); assert.equal(h.state.current, 0); assert.equal(h.state.provider, 0); assert.equal(h.state.ledger, 0);
});

async function uiFixture(t, { page = false, statusValue = 'APPROVED', beforePassive } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://jagdlatein.test/konto', pretendToBeVisual: true }), saved = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) { saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value }); }
  let timerId = 0, reloads = 0, disposed = false, externalCurrent = true;
  const timers = new Map(), calls = [];
  let account = { email, accountKey: generation, paid: false, admin: false, accessProvider: 'none', accessType: 'none', subscriptionStatus: statusValue, paypalManagementUrl: 'https://www.paypal.com/myaccount/autopay/' };
  let props = { accountKey: generation, accountEmail: email, onReload: () => reloads++, isCurrent: () => externalCurrent };
  const fetch = (url, options = {}) => { if (url === '/api/account/delete') return Promise.resolve(Response.json({ enabled: false })); const wait = deferred(); calls.push({ url, options, ...wait }); return wait.promise; };
  const noComponent = { __esModule: true, default: () => null };
  const load = overlayLoader({
    'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
    'components/AccountLayout.js': { __esModule: true, default: ({ children }) => React.createElement('main', {}, children), AccountError: () => null, ProgressError: () => null },
    'hooks/useAccountOverview.js': { __esModule: true, default: () => ({ account, progress: [], accountError: null, progressError: null, loading: false, progressLoading: false, reload: () => reloads++ }) },
    'components/ExamProfileSummary.js': noComponent, 'components/WebPushPreferences.js': noComponent, 'components/NativePushPreferences.js': noComponent, 'components/UsagePreferences.js': noComponent,
  }, { fetch, setTimeout(fn, delay) { timers.set(++timerId, { fn, delay }); return timerId; }, clearTimeout: id => timers.delete(id) });
  const module = load('pages/konto.js'), Component = page ? module.default : module.PayPalCheckoutRecovery;
  function Wrapper() { React.useLayoutEffect(() => beforePassive?.()); return React.createElement(Component, props); }
  const root = local('react-dom/client').createRoot(dom.window.document.getElementById('root'));
  const act = action => React.act(async () => { action?.(); await flush(); }), render = () => act(() => root.render(React.createElement(Wrapper)));
  const button = () => [...dom.window.document.querySelectorAll('button')].find(node => /Vorhandenes Abo prüfen|Abo wird geprüft/.test(node.textContent));
  const clickHandler = () => { const node = button(); assert.ok(node); return node[Object.keys(node).find(key => key.startsWith('__reactProps$'))].onClick; };
  const unmount = async () => { if (!disposed) { await act(() => root.unmount()); disposed = true; } };
  t.after(async () => { await unmount(); dom.window.close(); for (const [key, value] of saved) if (value) Object.defineProperty(globalThis, key, value); else delete globalThis[key]; });
  await render();
  return { calls, timers, dom, act, render, unmount, button, clickHandler, get reloads() { return reloads; }, text: () => dom.window.document.body.textContent,
    async click() { let task; await act(() => { task = clickHandler()(); }); return { task }; },
    async respond(index, body, code = 200) { await act(() => calls[index].resolve(Response.json(body, { status: code }))); },
    async raw(index, response) { await act(() => calls[index].resolve(response)); },
    async changeProps(next) { props = { ...props, ...next }; await render(); },
    async changeAccount(next) { account = { ...account, ...next }; await render(); },
    retireOwner() { externalCurrent = false; },
    async timeout() { const entry = [...timers][0]; assert.ok(entry); timers.delete(entry[0]); await act(entry[1].fn); },
  };
}

test('Actual account page uses a local button for the three existing PayPal states, with no/preise recovery link or dialog', async t => {
  const h = await uiFixture(t, { page: true });
  for (const value of ['APPROVED', 'ACTIVE', 'SUSPENDED']) { await h.changeAccount({ subscriptionStatus: value }); assert.ok(h.button()); assert.equal(h.dom.window.document.querySelectorAll('a[href="/preise"]').length, 0); assert.equal(h.dom.window.document.querySelectorAll('dialog,iframe').length, 0); }
  assert.equal(h.calls.length, 0); await h.changeAccount({ subscriptionStatus: 'EXPIRED' }); assert.equal(h.button(), undefined); assert.ok(h.dom.window.document.querySelector('a[href="/preise"]'));
});

test('Explicit recovery sends one bound JSON{} status POST, then auth/status, then account reload; duplicate click cannot buy or duplicate', async t => {
  const h = await uiFixture(t); assert.equal(h.calls.length, 0); const first = await h.click(); await h.click(); assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].url, '/api/paypal/checkout-status'); assert.equal(h.calls[0].options.body, '{}'); assert.equal(h.calls[0].options.method, 'POST'); assert.equal(h.calls[0].options.headers['X-Jagdlatein-Account-Key'], generation);
  assert.equal(h.calls[0].options.credentials, 'same-origin'); assert.equal(h.calls[0].options.cache, 'no-store');
  await h.respond(0, status()); assert.equal(h.calls.length, 2); assert.equal(h.calls[1].url, '/api/auth/status'); assert.equal(h.calls[1].options.method, undefined);
  await h.respond(1, auth()); await first.task; assert.equal(h.reloads, 1); assert.equal(h.button().disabled, false); assert.equal(h.timers.size, 0);
  assert.ok(h.calls.every(call => !/create|confirm|capture|transactions/.test(call.url)));
});

test('Response identity mismatch retires the old button before auth/status and waits for fresh account ownership', async t => {
  const h = await uiFixture(t); const old = h.clickHandler(); const result = await h.click(); await h.respond(0, status('ACTIVE', { accountKey: other })); await result.task;
  assert.equal(h.calls.length, 1); assert.equal(h.reloads, 1); assert.equal(h.button().disabled, true); assert.match(h.text(), /Anmeldung hat sich geändert/);
  await h.act(() => old()); assert.equal(h.calls.length, 1);
});

test('A known409 or auth identity conflict clears pending and blocks old retries; no stale auth result announces access', async t => {
  const h = await uiFixture(t); const first = await h.click(); await h.respond(0, { error: 'Account changed' }, 409); await first.task;
  assert.equal(h.calls.length, 1); assert.equal(h.button().disabled, true); assert.equal(h.timers.size, 0);
  await h.changeProps({ accountKey: other }); const second = await h.click(); await h.respond(1, status('ACTIVE', { accountKey: other })); await h.respond(2, auth({ email: 'other@example.invalid', paid: true })); await second.task;
  assert.doesNotMatch(h.text(), /Zugang ist bestätigt/); assert.equal(h.button().disabled, true); assert.equal(h.reloads, 2);
});

test('Paused/funded and negative outcomes never invent a trial, price or second subscription', async t => {
  const h = await uiFixture(t); const first = await h.click(); await h.respond(0, status('SUSPENDED')); await h.respond(1, auth()); await first.task; assert.match(h.text(), /weiter pausiert/); assert.doesNotMatch(h.text(), /10 €|3 Tage|kostenlos/);
  const second = await h.click(); await h.respond(2, status('ACTIVE', { activated: true })); await h.respond(3, auth({ paid: true })); await second.task; assert.match(h.text(), /Zugang ist bestätigt/); assert.equal(h.reloads, 2);
});

test('Malformed, failed or timed-out status responses permit a controlled retry and never start auth or a new agreement', async t => {
  const h = await uiFixture(t);
  for (const [body, code] of [[{}, 200], [status('UNKNOWN'), 200], [{ error: 'Provider unavailable' }, 503]]) { const index = h.calls.length, attempt = await h.click(); await h.respond(index, body, code); await attempt.task; assert.equal(h.button().disabled, false); assert.equal(h.reloads, 0); }
  const index = h.calls.length, attempt = await h.click(); await h.timeout(); await attempt.task;
  assert.equal(h.calls[index].options.signal.aborted, true); assert.equal(h.button().disabled, false); assert.equal(h.timers.size, 0); assert.ok(h.calls.every(call => call.url === '/api/paypal/checkout-status'));
});

test('A stalled JSON body is bounded; its late success cannot trigger auth/status or overwrite a newer attempt', async t => {
  const h = await uiFixture(t), json = deferred(); const first = await h.click(); await h.raw(0, { ok: true, status: 200, json: () => json.promise });
  await h.timeout(); await first.task; const second = await h.click(); assert.equal(h.calls.length, 2); assert.equal(h.button().disabled, true);
  await h.act(() => json.resolve(status())); assert.equal(h.calls.length, 2); assert.equal(h.button().disabled, true);
  await h.respond(1, status()); await h.respond(2, auth()); await second.task; assert.equal(h.reloads, 1);
});

test('Held actions and pending fetches are invalidated by a new generation before passive cleanup', async t => {
  let old, invoke = false;
  const h = await uiFixture(t, { beforePassive() { if (invoke) old(); } }); old = h.clickHandler(); const first = await h.click();
  invoke = true; await h.changeProps({ accountKey: other }); invoke = false; assert.equal(h.calls.length, 1); assert.equal(h.calls[0].options.signal.aborted, true);
  await h.respond(0, status()); await first.task; assert.equal(h.calls.length, 1); assert.equal(h.reloads, 0);
  const second = await h.click(); await h.respond(1, status('SUSPENDED', { accountKey: other })); await h.respond(2, auth()); await second.task; assert.equal(h.reloads, 1);
});

test('A parent account replacement blocks its old page CTA before effects, including same-email recreated generation', async t => {
  const h = await uiFixture(t, { page: true }); const old = h.clickHandler();
  await h.changeAccount({ accountKey: other }); await h.act(() => old()); assert.equal(h.calls.length, 0);
  await h.changeAccount({ paid: true }); await h.act(() => old()); assert.equal(h.calls.length, 0); assert.equal(h.button(), undefined);
});

test('Unmount at status or auth boundary aborts the request and prevents late body, reload or held handler actions', async t => {
  const h = await uiFixture(t), first = await h.click(); const old = h.clickHandler(); await h.respond(0, status()); assert.equal(h.calls.length, 2);
  await h.unmount(); assert.equal(h.calls[1].options.signal.aborted, true); await h.act(() => old()); await h.respond(1, auth({ paid: true })); await first.task;
  assert.equal(h.calls.length, 2); assert.equal(h.reloads, 0); assert.equal(h.timers.size, 0);
});

test('A superseded auth finally cannot release a new owner request or apply its former account result', async t => {
  const h = await uiFixture(t), first = await h.click(); await h.respond(0, status());
  await h.changeProps({ accountKey: other }); const second = await h.click(); assert.equal(h.calls.length, 3); assert.equal(h.button().disabled, true);
  await h.respond(1, auth({ paid: true })); await first.task; assert.equal(h.button().disabled, true); assert.equal(h.reloads, 0);
  await h.respond(2, status('ACTIVE', { accountKey: other })); await h.respond(3, auth()); await second.task; assert.equal(h.reloads, 1); assert.equal(h.button().disabled, false);
});
