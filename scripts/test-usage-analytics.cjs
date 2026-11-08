// All accounts, storage, requests, DOM controls and clocks here are isolated
// doubles. No real accounts, browser data, private fields or network are read.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const React = local('react');
const pure = createLoader()('lib/usage-analytics.js');
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const V1 = '2026-11-08T12:34:56.123456+00:00';
const V2 = '2026-11-08T12:34:56.123457+00:00';
const body = () => ({ batchId: A, events: [{ page: 'wildjahr', event: 'page_view', count: 1 }] });
const reply = (value, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => value });
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const settle = async () => { for (let i = 0; i < 16; i++) await Promise.resolve(); };

function globals(t, { native = false, storageDenied = false, writeDenied = false, optedIn = false, dnt = false, gpc = false } = {}) {
  const before = Object.fromEntries(['window', 'document', 'fetch', 'setTimeout', 'clearTimeout'].map(k => [k, global[k]]));
  const timers = new Map(), calls = [], cleanup = [], storage = new Map([['cookie-consent', 'accepted']]), windowListeners = new Map(), documentListeners = new Map();
  let timerId = 0, uuid = 0, response = { enabled: optedIn, accountKey: A, consentVersion: V1 }, next = [];
  global.setTimeout = (fn, delay) => { const id = ++timerId; timers.set(id, { fn, delay }); return id; };
  global.clearTimeout = id => timers.delete(id);
  function on(map, name, fn) { if (!map.has(name)) map.set(name, new Set()); map.get(name).add(fn); }
  const fire = (map, name, event = {}) => { for (const fn of [...(map.get(name) || [])]) fn({ type: name, ...event }); };
  global.window = {
    navigator: { userAgent: 'Synthetic Chrome/130 Safari/537.36', doNotTrack: dnt ? '1' : '0', globalPrivacyControl: gpc },
    ...(native ? { Capacitor: { isNativePlatform: () => true } } : {}),
    crypto: { randomUUID: () => `33333333-3333-4333-8333-${String(++uuid).padStart(12, '0')}` },
    localStorage: { getItem(key) { if (storageDenied) throw Error('Synthetic storage denial'); return storage.get(key) ?? null; }, setItem(key, value) { if (writeDenied) throw Error('Synthetic write denial'); storage.set(key, value); } },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    addEventListener: (name, fn) => on(windowListeners, name, fn), removeEventListener: (name, fn) => windowListeners.get(name)?.delete(fn),
    dispatchEvent: event => fire(windowListeners, event.type, event),
  };
  global.document = { addEventListener: (name, fn) => on(documentListeners, name, fn), removeEventListener: (name, fn) => documentListeners.get(name)?.delete(fn) };
  global.fetch = (url, options = {}) => {
    calls.push({ url, options });
    if (next.length) return next.shift()(url, options);
    return Promise.resolve(reply(url === '/api/usage-events' ? { recorded: true } : response));
  };
  t.after(() => { for (const callback of cleanup) callback(); for (const [key, value] of Object.entries(before)) if (value === undefined) delete global[key]; else global[key] = value; });
  return {
    calls, storage, timers, windowListeners, documentListeners, cleanup,
    queue: fn => next.push(fn), response: value => { response = value; },
    fireWindow: (name, event) => fire(windowListeners, name, event), fireDocument: (name, event) => fire(documentListeners, name, event),
    runTimers() { for (const [id, timer] of [...timers]) if (timers.delete(id)) timer.fn(); },
    get win() { return global.window; },
  };
}

function hookRenderer(Component, hooksContext) {
  const slots = [], cleanups = new Map(); let pending = [], cursor = 0, dirty = false, disposed = false, writesAfterDispose = 0, tree, props;
  const hooks = {
    ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, input => { if (disposed) { writesAfterDispose++; return; } const value = typeof input === 'function' ? input(slots[i].value) : input; dirty ||= !Object.is(value, slots[i].value); slots[i].value = value; }]; },
    useRef(initial) { const i = cursor++; return slots[i] || (slots[i] = { current: initial }); },
    useEffect(callback, deps) { const i = cursor++, previous = slots[i]; if (!previous || deps.some((v, k) => !Object.is(v, previous.deps[k]))) { slots[i] = { deps }; pending.push({ i, callback }); } },
  };
  const draw = input => { props = input || props; cursor = 0; dirty = false; hooksContext.current = hooks; tree = Component(props); hooksContext.current = null; return tree; };
  const effects = () => { const work = pending; pending = []; for (const { i, callback } of work) { cleanups.get(i)?.(); const cleanup = callback(); if (typeof cleanup === 'function') cleanups.set(i, cleanup); else cleanups.delete(i); } };
  const render = input => { draw(input); let rounds = 0; do { assert.ok(rounds++ < 15); effects(); if (!dirty) break; draw(); } while (true); return tree; };
  return { render, draw, effects, get tree() { return tree; }, get writesAfterDispose() { return writesAfterDispose; }, dispose() { if (!disposed) { for (const fn of cleanups.values()) fn(); disposed = true; } } };
}
function componentFixture(t, options) {
  const g = globals(t, options), context = { current: null };
  const hookProxy = { ...React, ...Object.fromEntries(['useState', 'useRef', 'useEffect'].map(name => [name, (...args) => context.current[name](...args)])) };
  const load = createLoader({ react: hookProxy });
  const store = load('lib/usage-analytics.js').usagePreferenceClient;
  const prefs = hookRenderer(load('components/UsagePreferences.js').default, context);
  const tracker = hookRenderer(load('components/UsageTelemetry.js').default, context);
  g.cleanup.push(() => { prefs.dispose(); tracker.dispose(); store.stop(); });
  return { ...g, store, prefs, tracker };
}
function nodes(node, predicate) { if (Array.isArray(node)) return node.flatMap(n => nodes(n, predicate)); if (!node || typeof node !== 'object') return []; return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)]; }
function text(node) { if (node == null || typeof node === 'boolean') return ''; if (Array.isArray(node)) return node.map(text).join(''); return typeof node === 'object' ? text(node.props?.children) : String(node); }
const checkbox = renderer => nodes(renderer.tree, n => n.type === 'input' && n.props.type === 'checkbox')[0];
function target(tagName, isPrivate = false) {
  const control = { tagName, disabled: false, getAttribute: () => null };
  control.closest = selector => selector === 'a,button,summary' ? control : isPrivate ? {} : null;
  Object.defineProperties(control, { textContent: { get() { throw Error('Never read text'); } }, id: { get() { throw Error('Never read identifiers'); } }, href: { get() { throw Error('Never read URLs'); } }, value: { get() { throw Error('Never read values'); } } });
  return control;
}

test('The fixed page catalog excludes account, search, auth, admin, payment and query/hash details', () => {
  assert.deepEqual(Object.keys(pure.USAGE_PAGES), ['lernen', 'wildkunde', 'wildjahr', 'kurse', 'quiz', 'lernkarten', 'videos', 'werkzeuge', 'jagdrecht', 'community', 'fotohelfer', 'online_kurse']);
  for (const [path, key] of [['/lernen', 'lernen'], ['/lernen/wildjahr', 'wildjahr'], ['/wildkunde/reh', 'wildkunde'], ['/kurse/[id]', 'kurse'], ['/jagdrecht/ch', 'jagdrecht'], ['/lernen/jagdhund-videos', 'videos'], ['/lernen/hundetraining-tagebuch', 'werkzeuge'], ['/online-kurse', 'online_kurse'], ['/quiz-app/run', 'quiz']]) assert.equal(pure.usagePageForPath(path), key, path);
  for (const path of ['/konto', '/admin', '/api/usage-events', '/suche', '/login', '/preise', '/kasse', '/quiz-app/username', '/community/new', '/wildkunde/reh?email=private', '/lernen#wild', '//lernen', '/lernen\n', null]) assert.equal(pure.usagePageForPath(path), null, String(path));
});
test('Event schema only accepts unique allowlisted rows and bounded integers, never arbitrary properties', () => {
  assert.deepEqual(pure.validateUsageBatch(body()), body());
  for (const input of [null, {}, { ...body(), email: 'synthetic@example.invalid' }, { ...body(), batchId: 'not-a-uuid' }, { ...body(), events: [] }, { ...body(), events: [...body().events, ...body().events] }]) assert.throws(() => pure.validateUsageBatch(input));
  for (const row of [{ page: 'konto', event: 'page_view', count: 1 }, { page: 'wildjahr', event: 'search_text', count: 1 }, { ...body().events[0], text: 'private' }, ...[0, -1, 21, 1.5, '1', null].map(count => ({ ...body().events[0], count }))]) assert.throws(() => pure.validateUsageBatch({ ...body(), events: [row] }));
});
test('Consent timestamp tokens preserve PostgreSQL microseconds instead of rounding through Date', () => {
  assert.equal(pure.validUsageConsentVersion(V1), true); assert.equal(pure.validUsageConsentVersion(null), true);
  for (const token of [undefined, '', 1, 'now()', '2026-11-08', '2026-11-08T12:34:56.1234567Z']) assert.equal(pure.validUsageConsentVersion(token), false);
});
for (const options of [{ native: true }, { dnt: true }, { gpc: true }, { storageDenied: true }]) test(`Browser/privacy gate is fail closed: ${Object.keys(options)[0]}`, t => {
  const f = globals(t, options); assert.equal(pure.usageBrowserAllowed(f.win) && pure.usagePrivacyAllows(f.win), false);
});
test('Native bridge failures, Android WebView and known iOS native markers are excluded; ordinary PWA is allowed', t => {
  const f = globals(t); assert.equal(pure.usageBrowserAllowed(f.win), true);
  f.win.navigator.standalone = true; assert.equal(pure.usageBrowserAllowed(f.win), true);
  f.win.Capacitor = { isNativePlatform() { throw Error('Synthetic bridge error'); } }; assert.equal(pure.usageBrowserAllowed(f.win), false);
  delete f.win.Capacitor; f.win.navigator.userAgent = 'Android wv'; assert.equal(pure.usageBrowserAllowed(f.win), false);
  f.win.navigator.userAgent = 'iPhone AppleWebKit/605.1.15'; f.win.navigator.standalone = false; assert.equal(pure.usageBrowserAllowed(f.win), false);
});
test('Old cookie acceptance never opts in; only a current authoritative GET can enable', async t => {
  const f = globals(t), client = pure.createUsagePreferenceClient();
  assert.equal(client.getSnapshot().enabled, false); await client.load(); assert.equal(client.getSnapshot().enabled, false);
  f.response({ enabled: true, accountKey: A, consentVersion: V1 }); await client.load();
  assert.equal(client.getSnapshot().enabled, true); assert.equal(client.getSnapshot().consentVersion, V1);
  assert.deepEqual(f.calls.map(c => c.url), ['/api/account/usage-preference', '/api/account/usage-preference']);
});
test('Superseded and unmounted preference responses cannot replace the current account scope', async t => {
  const f = globals(t), old = deferred(), client = pure.createUsagePreferenceClient(); let live = true;
  f.queue(() => old.promise); const first = client.load({ isCurrent: () => live }); await settle();
  f.response({ enabled: true, accountKey: B, consentVersion: V2 }); await client.load(); live = false;
  old.resolve(reply({ enabled: true, accountKey: A, consentVersion: V1 })); await first;
  assert.equal(client.getSnapshot().accountKey, B); assert.equal(client.getSnapshot().consentVersion, V2);
  const revision = client.getSnapshot().revision; await client.setEnabled(false, { accountKey: A, revision, isCurrent: () => false }); assert.equal(f.calls.length, 2);
});
test('Opt-out blocks synchronously and stays off after a failed write; retry is explicit and version-bound', async t => {
  const f = globals(t, { optedIn: true }), client = pure.createUsagePreferenceClient(); await client.load();
  const before = client.getSnapshot(), failure = deferred(); f.queue(() => failure.promise);
  const saving = client.setEnabled(false, { accountKey: A, revision: before.revision });
  assert.equal(client.getSnapshot().enabled, false); assert.equal(f.storage.get(pure.USAGE_LOCAL_PREFERENCE), 'off');
  await settle(); assert.deepEqual(JSON.parse(f.calls.at(-1).options.body), { enabled: false, accountKey: A, expectedRevision: V1 });
  failure.resolve(reply({}, 503)); await saving;
  assert.equal(client.getSnapshot().enabled, false); assert.equal(client.getSnapshot().pendingEnabled, false);
  const number = f.calls.length; await settle(); assert.equal(f.calls.length, number, 'No automatic retries');
  f.response({ enabled: false, accountKey: A, consentVersion: V2 }); const state = client.getSnapshot(); await client.setEnabled(false, { accountKey: A, revision: state.revision });
  assert.equal(client.getSnapshot().error, null); assert.equal(client.getSnapshot().consentVersion, V2);
});
test('A stale enable conflict remains off, drops the old desired state and requires a fresh GET', async t => {
  const f = globals(t), client = pure.createUsagePreferenceClient(); await client.load(); const state = client.getSnapshot();
  f.queue(() => Promise.resolve(reply({}, 409))); await client.setEnabled(true, { accountKey: A, revision: state.revision });
  assert.equal(client.getSnapshot().known, false); assert.equal(client.getSnapshot().enabled, false); assert.equal(client.getSnapshot().pendingEnabled, null);
  assert.equal(f.calls.filter(c => c.options.method === 'PUT').length, 1);
});
test('Local persistence failures cannot enable telemetry after a successful server opt-in', async t => {
  const f = globals(t, { writeDenied: true }), client = pure.createUsagePreferenceClient(); await client.load();
  f.response({ enabled: true, accountKey: A, consentVersion: V2 }); const state = client.getSnapshot(); await client.setEnabled(true, { accountKey: A, revision: state.revision });
  assert.equal(client.getSnapshot().enabled, false); assert.equal(client.getSnapshot().error, 503);
});
test('A lost opt-in response stays locally off across a later server-true GET until explicit confirmation', async t => {
  const f = globals(t), client = pure.createUsagePreferenceClient(); await client.load(); const before = client.getSnapshot();
  f.queue(() => new Promise(() => {})); const enabling = client.setEnabled(true, { accountKey: A, revision: before.revision }); await settle(); f.runTimers(); await enabling;
  assert.equal(f.storage.get(pure.USAGE_LOCAL_PREFERENCE), 'off'); assert.equal(client.getSnapshot().enabled, false);
  f.response({ enabled: true, accountKey: A, consentVersion: V2 }); await client.load(); assert.equal(client.getSnapshot().serverEnabled, true); assert.equal(client.getSnapshot().enabled, false);
  const current = client.getSnapshot(); await client.setEnabled(true, { accountKey: A, revision: current.revision }); assert.equal(client.getSnapshot().enabled, true); assert.equal(f.storage.get(pure.USAGE_LOCAL_PREFERENCE), 'on');
});
for (const phase of ['fetch', 'json']) test(`An unresponsive preference ${phase} is bounded and cannot late-enable`, async t => {
  const f = globals(t), wait = deferred(), client = pure.createUsagePreferenceClient();
  f.queue(() => phase === 'fetch' ? wait.promise : Promise.resolve({ ok: true, status: 200, json: () => wait.promise }));
  const loading = client.load(); await settle(); assert.equal(client.getSnapshot().loading, true);
  f.runTimers(); await loading; assert.equal(client.getSnapshot().loading, false); assert.equal(client.getSnapshot().enabled, false); assert.equal(client.getSnapshot().error, 503);
  wait.resolve(phase === 'fetch' ? reply({ enabled: true, accountKey: A, consentVersion: V1 }) : { enabled: true, accountKey: A, consentVersion: V1 }); await settle();
  assert.equal(client.getSnapshot().enabled, false); assert.equal(f.timers.size, 0);
});
test('Owner cleanup cannot cancel a newer component request', async t => {
  const f = globals(t), client = pure.createUsagePreferenceClient(), oldOwner = {}, currentOwner = {}, wait = deferred();
  await client.load({ owner: oldOwner }); f.queue(() => wait.promise); const current = client.load({ owner: currentOwner }); await settle();
  const signal = f.calls.at(-1).options.signal; client.stop({ owner: oldOwner }); assert.equal(signal.aborted, false);
  wait.resolve(reply({ enabled: true, accountKey: A, consentVersion: V1 })); await current; assert.equal(client.getSnapshot().enabled, true);
  client.stop({ owner: currentOwner }); assert.equal(client.getSnapshot().enabled, false); assert.equal(f.timers.size, 0);
});
test('Konto preferences GET survives the excluded tracker mounted afterwards', async t => {
  const f = componentFixture(t, { optedIn: true }), account = { email: 'synthetic@example.invalid' };
  f.prefs.render({ account }); f.tracker.render({ pathname: '/konto' }); await settle(); f.prefs.render();
  assert.equal(f.calls.length, 1); assert.equal(f.calls[0].options.signal.aborted, false); assert.equal(checkbox(f.prefs).props.disabled, false); assert.equal(checkbox(f.prefs).props.checked, true);
});
test('Preferences native UI describes website-only consent while native telemetry never auto-reads or sends', async t => {
  const f = componentFixture(t, { native: true, optedIn: true }); f.tracker.render({ pathname: '/lernen' }); await settle(); assert.equal(f.calls.length, 0);
  f.prefs.render({ account: { email: 'synthetic@example.invalid' } }); await settle(); f.prefs.render();
  assert.match(text(f.prefs.tree), /diese App sendet dafür keine Klickereignisse/); assert.equal(f.calls.length, 1); assert.equal(f.calls[0].url, '/api/account/usage-preference');
});
test('The initial preferences HTML is stable for hydration with DNT or local opt-out; guards still act immediately', t => {
  const f = componentFixture(t, { dnt: true }); f.storage.set(pure.USAGE_LOCAL_PREFERENCE, 'off');
  f.prefs.draw({ account: { email: 'synthetic@example.invalid' } }); assert.doesNotMatch(text(f.prefs.tree), /Browser-Datenschutzeinstellungen werden beachtet/);
  f.prefs.effects(); f.prefs.render(); assert.match(text(f.prefs.tree), /Browser-Datenschutzeinstellungen werden beachtet/);
  f.tracker.render({ pathname: '/lernen' }); assert.equal(f.calls.filter(c => c.url === '/api/usage-events').length, 0);
});
test('Retained preference handlers and replies cannot write after account replacement or unmount', async t => {
  const f = componentFixture(t), account = { email: 'synthetic-a@example.invalid' }; f.prefs.render({ account }); await settle(); f.prefs.render();
  const old = checkbox(f.prefs).props.onChange; const calls = f.calls.length;
  f.prefs.draw({ account: { email: 'synthetic-b@example.invalid' } }); old({ target: { checked: true } }); assert.equal(f.calls.length, calls);
  f.prefs.effects(); await settle(); f.prefs.render(); const current = checkbox(f.prefs).props.onChange;
  f.prefs.dispose(); current({ target: { checked: true } }); await settle(); assert.equal(f.calls.filter(c => c.options.method === 'PUT').length, 0); assert.equal(f.prefs.writesAfterDispose, 0);
});
test('A tracker sends only fixed labels and counts; form controls and text/IDs/hrefs are never inspected', async t => {
  const f = componentFixture(t, { optedIn: true }); f.tracker.render({ pathname: '/lernen/wildjahr' }); await settle();
  for (const tag of ['A', 'BUTTON', 'SUMMARY']) f.fireDocument('click', { isTrusted: true, target: target(tag) });
  f.fireDocument('click', { isTrusted: true, target: target('BUTTON', true) });
  f.fireDocument('click', { isTrusted: false, target: target('BUTTON') });
  f.fireDocument('play', { isTrusted: true, target: target('VIDEO') });
  f.fireWindow('pagehide'); await settle(); const post = f.calls.find(c => c.url === '/api/usage-events'); assert.ok(post);
  const sent = JSON.parse(post.options.body); assert.deepEqual(Object.keys(sent), ['batchId', 'events']); assert.equal(pure.validateUsageBatch(sent).events.length, 5);
  assert.deepEqual(sent.events.map(r => r.event), ['page_view', 'navigation', 'action', 'expand', 'video_play']); assert.ok(sent.events.every(r => r.page === 'wildjahr' && r.count === 1));
  assert.equal(post.options.keepalive, true); assert.equal(post.options.credentials, 'same-origin');
});
test('Click bursts clamp at 20 and failed batches are dropped without retry', async t => {
  const f = componentFixture(t, { optedIn: true }); f.tracker.render({ pathname: '/lernen' }); await settle();
  for (let i = 0; i < 100; i++) f.fireDocument('click', { isTrusted: true, target: target('BUTTON') });
  f.queue(() => Promise.reject(Error('Synthetic offline'))); f.fireWindow('pagehide'); await settle();
  assert.equal(JSON.parse(f.calls.at(-1).options.body).events.find(r => r.event === 'action').count, 20);
  f.runTimers(); await settle(); f.fireWindow('pagehide'); assert.equal(f.calls.filter(c => c.url === '/api/usage-events').length, 1);
});
test('Opt-out synchronously discards queued events and aborts in-flight telemetry', async t => {
  const f = componentFixture(t, { optedIn: true }); f.tracker.render({ pathname: '/lernen' }); await settle();
  const waiting = deferred(); f.queue(() => waiting.promise); f.fireWindow('pagehide'); await settle();
  const signal = f.calls.at(-1).options.signal; f.fireDocument('click', { isTrusted: true, target: target('BUTTON') }); f.store.blockLocally(); assert.equal(signal.aborted, true);
  f.fireWindow('pagehide'); f.runTimers(); await settle(); assert.equal(f.calls.filter(c => c.url === '/api/usage-events').length, 1);
  waiting.resolve(reply({ recorded: true })); await settle(); assert.equal(f.store.getSnapshot().enabled, false);
});
test('Old tracker handlers are inert before effect cleanup after navigation and after unmount', async t => {
  const f = componentFixture(t, { optedIn: true }); f.tracker.render({ pathname: '/lernen' }); await settle();
  const oldClick = [...f.documentListeners.get('click')][0], oldFlush = [...f.windowListeners.get('pagehide')][0];
  f.tracker.draw({ pathname: '/konto' }); oldClick({ isTrusted: true, target: target('BUTTON') }); oldFlush(); assert.equal(f.calls.filter(c => c.url === '/api/usage-events').length, 0);
  f.tracker.effects(); f.tracker.dispose(); oldClick({ isTrusted: true, target: target('BUTTON') }); oldFlush(); await settle(); assert.equal(f.calls.filter(c => c.url === '/api/usage-events').length, 0); assert.equal(f.timers.size, 0);
});
test('Tracker cleanup cannot abort a newly mounted preferences GET', async t => {
  const f = componentFixture(t, { optedIn: true }); f.tracker.render({ pathname: '/lernen' }); await settle();
  const pending = deferred(); f.queue(() => pending.promise); f.prefs.render({ account: { email: 'synthetic@example.invalid' } }); await settle();
  const signal = f.calls.at(-1).options.signal; f.tracker.dispose(); assert.equal(signal.aborted, false);
  pending.resolve(reply({ enabled: false, accountKey: A, consentVersion: V2 })); await settle(); f.prefs.render(); assert.equal(checkbox(f.prefs).props.disabled, false);
});
for (const event of ['jagdlatein-logout', 'jagdlatein-account-deleted']) test(`${event} cancels telemetry immediately`, async t => {
  const f = componentFixture(t, { optedIn: true }); f.tracker.render({ pathname: '/lernen' }); await settle(); f.fireWindow(event); f.fireWindow('pagehide'); await settle();
  assert.equal(f.store.getSnapshot().enabled, false); assert.equal(f.calls.filter(c => c.url === '/api/usage-events').length, 0);
});

function apiFixture({ optedIn = false, rpcError = null, deletedAfterRpc = false } = {}) {
  const session = { email: 'synthetic@example.invalid', accountGeneration: A }, calls = [];
  let row = { email: session.email, account_generation: A, usage_analytics_opt_in: optedIn, usage_analytics_changed_at: V1 }, rpcDone = false;
  const database = {
    from(table) { assert.equal(table, 'userprofile'); return { select(columns) { assert.equal(columns, 'email,account_generation,usage_analytics_opt_in,usage_analytics_changed_at'); return this; }, ilike(column, email) { assert.equal(column, 'email'); assert.equal(email, session.email); return this; }, async maybeSingle() { return { data: row ? { ...row } : null, error: null }; } }; },
    async rpc(name, args) { calls.push({ name, args }); rpcDone = true; if (rpcError) return { error: rpcError }; if (name === 'set_usage_analytics_preference') { row.usage_analytics_opt_in = args.p_enabled; row.usage_analytics_changed_at = V2; return { data: { enabled: args.p_enabled } }; } return { data: { recorded: optedIn } }; },
  };
  const load = createLoader({ './course-progress-server': { requireAccountSession: () => session, getAccountDatabase: (_, actor) => { assert.equal(actor, session); return database; }, requireCurrentAccount: async () => { if (deletedAfterRpc && rpcDone) throw Object.assign(Error('Synthetic deletion'), { status: 401 }); } } });
  return { calls, session, database, load, setRow: value => { row = value; }, pref: load('app/api/account/usage-preference/route.js'), events: load('app/api/usage-events/route.js'), server: load('lib/usage-analytics-server.js') };
}
function request(path, payload, { method = 'POST', origin = 'https://jagdlatein.test', headers = {}, raw = null } = {}) {
  return new Request('https://jagdlatein.test' + path, { method, headers: { 'content-type': 'application/json', ...(origin === null ? {} : { origin }), ...headers }, ...(method === 'GET' ? {} : { body: raw === null ? JSON.stringify(payload) : raw }) });
}
test('Both APIs have explicit method guards and cache/robots safety headers', async () => {
  const f = apiFixture();
  for (const [handler, allow] of [[f.events.GET, 'POST'], [f.events.PUT, 'POST'], [f.pref.POST, 'GET, PUT']]) { const r = await handler(new Request('https://jagdlatein.test')); assert.equal(r.status, 405); assert.equal(r.headers.get('allow'), allow); assert.match(r.headers.get('cache-control'), /no-store/); assert.equal(r.headers.get('x-robots-tag'), 'noindex, nofollow'); }
});
test('Preference API returns no email or profile data and uses exact actor/current version on PUT', async () => {
  const f = apiFixture(); let r = await f.pref.GET(request('/api/account/usage-preference', null, { method: 'GET' })); assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { enabled: false, accountKey: A, consentVersion: V1 });
  r = await f.pref.PUT(request('/api/account/usage-preference', { enabled: true, accountKey: A, expectedRevision: V1 })); assert.equal(r.status, 200);
  assert.deepEqual(f.calls[0], { name: 'set_usage_analytics_preference', args: { p_email: 'synthetic@example.invalid', p_account_generation: A, p_enabled: true, p_expected_changed_at: V1 } });
  assert.deepEqual(await r.json(), { enabled: true, accountKey: A, consentVersion: V2 });
});
test('Preference API rejects old-account, missing-version and arbitrary properties before RPC', async () => {
  const f = apiFixture(); for (const payload of [{ enabled: true, accountKey: B, expectedRevision: V1 }, { enabled: true, accountKey: A }, { enabled: true, accountKey: A, expectedRevision: V1, note: 'private' }, { enabled: true, accountKey: A, expectedRevision: 'now()' }]) assert.equal((await f.pref.PUT(request('/api/account/usage-preference', payload))).status, 400);
  assert.equal(f.calls.length, 0);
});
test('Cross-origin/missing-origin/same-site and non-JSON ingestion are rejected before RPC', async () => {
  const f = apiFixture(); for (const options of [{ origin: null }, { origin: 'https://evil.test' }, { origin: 'https://jagdlatein.test/path' }, { headers: { 'sec-fetch-site': 'same-site' } }, { headers: { 'content-type': 'text/plain' } }]) assert.ok([403, 415].includes((await f.events.POST(request('/api/usage-events', body(), options))).status));
  assert.equal(f.calls.length, 0);
});
test('Ingestion strips no extra data silently: only strict fixed counters reach the RPC', async () => {
  const f = apiFixture({ optedIn: true }); const r = await f.events.POST(request('/api/usage-events', body())); assert.equal(r.status, 200); assert.deepEqual(await r.json(), { recorded: true });
  assert.deepEqual(f.calls[0].args, { p_email: 'synthetic@example.invalid', p_account_generation: A, p_batch_id: A, p_events: body().events });
  const bad = { ...body(), query: 'private' }; assert.equal((await f.events.POST(request('/api/usage-events', bad))).status, 400); assert.equal(f.calls.length, 1);
});
test('DNT and GPC request headers suppress writes even for a handcrafted opt-in request', async () => {
  const f = apiFixture({ optedIn: true }); for (const headers of [{ dnt: '1' }, { 'sec-gpc': '1' }]) { const r = await f.events.POST(request('/api/usage-events', body(), { headers })); assert.equal(r.status, 200); assert.deepEqual(await r.json(), { recorded: false }); }
  assert.equal(f.calls.length, 0);
});
test('RPC errors are sanitized and post-RPC account deletion cannot return a successful scope', async () => {
  const f = apiFixture({ rpcError: { message: 'SQL secret internal diagnostic', details: 'synthetic private' } }); const r = await f.events.POST(request('/api/usage-events', body())); assert.equal(r.status, 503); assert.doesNotMatch(JSON.stringify(await r.json()), /secret|diagnostic|private/);
  const deleted = apiFixture({ optedIn: true, deletedAfterRpc: true }); assert.equal((await deleted.events.POST(request('/api/usage-events', body()))).status, 401);
});
test('Actual UTF-8 byte cap and fatal decoding reject oversized or malformed streamed bodies', async () => {
  const f = apiFixture(); for (const raw of [' '.repeat(4097), new Uint8Array([0xff, 0xfe])]) { const r = await f.events.POST(request('/api/usage-events', null, { raw })); assert.equal(r.status, typeof raw === 'string' ? 413 : 400); }
  const spoof = request('/api/usage-events', null, { raw: ' '.repeat(4097), headers: { 'content-length': '1' } }); assert.equal((await f.events.POST(spoof)).status, 413); assert.equal(f.calls.length, 0);
});
test('An authenticated slow body is canceled at the deadline, with no RPC or indefinite read', async t => {
  const g = globals(t), f = apiFixture(); let canceled = 0, released = 0;
  const slow = { headers: new Headers(), body: { getReader: () => ({ read: () => new Promise(() => {}), cancel() { canceled++; return new Promise(() => {}); }, releaseLock() { released++; } }) } };
  const reading = f.server.readUsageBody(slow); await settle(); g.runTimers(); await assert.rejects(reading, e => e.status === 408); assert.equal(canceled, 1); assert.equal(released, 1); assert.equal(g.timers.size, 0);
});
test('A real stalled ReadableStream reports the deadline even when cancel completes its pending read', async t => {
  const g = globals(t), f = apiFixture(); let canceled = 0;
  const stream = new ReadableStream({ cancel() { canceled++; } });
  const reading = f.server.readUsageBody({ headers: new Headers(), body: stream }); await settle(); g.runTimers();
  await assert.rejects(reading, error => error.status === 408); assert.equal(canceled, 1); assert.equal(g.timers.size, 0);
});
test('Migration uses the exact shared catalog, no account FKs, fixed retention and service-only RPC signatures', () => {
  const sql = fs.readFileSync(require('node:path').join(root, 'supabase/migrations/20261108120000_usage_analytics.sql'), 'utf8');
  for (const key of [...Object.keys(pure.USAGE_PAGES), ...pure.USAGE_EVENTS]) assert.ok(sql.includes(`'${key}'`));
  assert.doesNotMatch(sql, /REFERENCES\s+(?:public\.)?userprofile/i); assert.match(sql, /FOR NO KEY UPDATE/); assert.match(sql, /previous_at IS DISTINCT FROM p_expected_changed_at/); assert.match(sql, /interval '1 microsecond'/); assert.match(sql, /today-399/); assert.match(sql, /interval '48 hours'/); assert.match(sql, /Europe\/Zurich/);
  assert.match(sql, /set_usage_analytics_preference\(text,uuid,boolean,timestamptz\)/); assert.match(sql, /TO service_role/);
});
