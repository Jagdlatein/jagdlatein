// Real React DOM and the production visible-return helper. Every request,
// response body and clock is an isolated double: no accounts, SMTP or network.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { local, root, createLoader } = require('./helpers/project-module.cjs');
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const flush = async () => { for (let i = 0; i < 32; i++) await Promise.resolve(); };
const reply = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const notification = (recipient = 'operator@example.invalid') => ({ configured: true, recipient, pendingCount: 1, sentCount: 0 });
const member = (email = 'learner@example.invalid', environment = 'Production') => ({ id: email, email, provider: 'paypal', environment, stage: 'trial', renewal: true, accessUntil: '2026-12-01T00:00:00Z', verifiedAt: '2026-11-27T06:00:00Z' });
const payload = (items = [member()], extra = {}) => ({ items, hasMore: false, offset: 0, limit: 25, windowLimit: 200, windowLimited: false, olderRecordsAvailable: false, asOf: '2026-11-27T06:00:00Z', notifications: notification(), ...extra });
const sent = (recipient = 'operator@example.invalid') => ({ notifications: { ...notification(recipient), pendingCount: 0, sentCount: 1 }, delivery: { processed: 1, sent: 1, retry: 0 } });

async function fixture(t, { ui = false, sandbox = false, beforePassive } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><input id="outside"><div id="root"></div></body></html>', { url: 'https://jagdlatein.test/admin/testabos', pretendToBeVisual: true });
  const saved = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  let time = 1000, timerId = 0, value, disposed = false, currentProps = { testEnvironment: sandbox };
  const now = Date.now; Date.now = () => time;
  const calls = [], timers = new Map(), scrolls = [], listeners = [];
  dom.window.scrollTo = (...args) => scrolls.push(args);
  for (const surface of [dom.window, dom.window.document]) {
    const add = surface.addEventListener.bind(surface);
    surface.addEventListener = (name, handler, ...rest) => { listeners.push({ surface, name, handler }); return add(name, handler, ...rest); };
  }
  const fetch = (url, options = {}) => { const pending = deferred(); calls.push({ url, options, ...pending }); return pending.promise; };
  const filename = path.join(root, 'pages/admin/testabos.js');
  const module = { exports: {} };
  const { code } = local('next/dist/build/swc').transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  new Function('require', 'module', 'exports', 'fetch', 'setTimeout', 'clearTimeout', code)(id => {
    if (id === 'next/link') return { __esModule: true, default: ({ children, ...rest }) => React.createElement('a', rest, children) };
    if (id.endsWith('/AccountLayout')) return { __esModule: true, default: ({ children }) => React.createElement('main', {}, children) };
    if (id.endsWith('/account-access')) return { getPaidPageProps: async () => ({ props: {} }) };
    if (id.endsWith('/test-environment')) return { isPayPalSandboxTestEnvironment: () => sandbox };
    if (id.endsWith('/visible-return')) return createLoader()('lib/visible-return.js');
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    return local(id);
  }, module, module.exports, fetch, (fn, delay) => { timers.set(++timerId, { fn, dueAt: time + delay, delay }); return timerId; }, id => timers.delete(id));
  const Component = ui ? module.exports.default : function Probe(props) {
    value = module.exports.useTrialOverview(props.testEnvironment);
    React.useLayoutEffect(() => { beforePassive?.(props, value); }, [props.testEnvironment]);
    return React.createElement('div', {}, value.data ? value.data.items.map(item => item.email).join(',') : 'empty');
  };
  const reactRoot = local('react-dom/client').createRoot(dom.window.document.getElementById('root'));
  const act = action => React.act(async () => { action?.(); await flush(); });
  const render = () => act(() => reactRoot.render(React.createElement(Component, currentProps)));
  const unmount = async () => { if (!disposed) { await act(() => reactRoot.unmount()); disposed = true; } };
  const advance = async (elapsed = 0) => act(() => {
    time += elapsed;
    for (const [id, timer] of [...timers]) if (timer.dueAt <= time) { timers.delete(id); timer.fn(); }
  });
  function returnEvents() {
    dom.window.dispatchEvent(new dom.window.Event('blur'));
    Object.defineProperty(dom.window.document, 'visibilityState', { configurable: true, value: 'hidden' });
    dom.window.document.dispatchEvent(new dom.window.Event('visibilitychange'));
    Object.defineProperty(dom.window.document, 'visibilityState', { configurable: true, value: 'visible' });
    dom.window.document.dispatchEvent(new dom.window.Event('visibilitychange'));
    dom.window.dispatchEvent(new dom.window.Event('focus'));
    dom.window.dispatchEvent(new dom.window.PageTransitionEvent('pageshow', { persisted: true }));
  }
  t.after(async () => { await unmount(); Date.now = now; dom.window.close(); for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  await render();
  return { dom, calls, timers, scrolls, listeners, act, advance, render, unmount, returnEvents, module,
    get current() { return value; },
    text() { return dom.window.document.body.textContent; },
    async returnVisible() { await act(returnEvents); },
    async renderProps(next) { currentProps = { ...currentProps, ...next }; await render(); },
    async respond(index, body = payload(), status = 200) { await act(() => calls[index].resolve(reply(body, status))); },
    async call(name, ...args) { let task; await act(() => { task = value[name](...args); }); return { task }; },
  };
}

test('SSR is private and neutral; initial rendering or pending GET cannot send notification mail', async t => {
  const h = await fixture(t); const before = h.current.checkNotifications;
  const html = local('react-dom/server').renderToStaticMarkup(React.createElement(h.module.exports.default));
  assert.match(html, /Aktive Abos werden geladen/); assert.doesNotMatch(html, /learner@example|operator@example/);
  assert.equal(h.calls.length, 0);
  await h.act(() => before()); assert.equal(h.calls.length, 0);
  await h.advance(); assert.equal(h.calls.length, 1); await h.call('checkNotifications'); assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].options.method, undefined); assert.equal(h.calls[0].options.cache, 'no-store'); assert.equal(h.calls[0].options.credentials, 'same-origin');
  await h.respond(0); assert.equal(h.current.data.items[0].email, 'learner@example.invalid'); assert.equal(h.current.loading, false);
  assert.equal(h.calls.length, 1); assert.equal(h.timers.size, 0);
});

test('Visible return removes rows and recipient, blocks held mail immediately, deduplicates events and leaves focus/scroll alone', async t => {
  const h = await fixture(t, { ui: true }); await h.advance(); await h.respond(0);
  const button = [...h.dom.window.document.querySelectorAll('button')].find(node => node.textContent === 'Benachrichtigungen prüfen');
  const oldMail = button[Object.keys(button).find(key => key.startsWith('__reactProps$'))].onClick;
  const outside = h.dom.window.document.getElementById('outside'); outside.focus();
  const focus = h.dom.window.document.activeElement;
  await h.act(() => { h.returnEvents(); oldMail(); });
  assert.doesNotMatch(h.text(), /learner@example|operator@example/); assert.equal(h.calls.length, 1);
  assert.equal([...h.timers.values()].filter(timer => timer.delay === 0).length, 1);
  assert.equal(h.dom.window.document.activeElement, focus); assert.equal(h.scrolls.length, 0);
  await h.advance(); assert.equal(h.calls.length, 2); assert.equal(h.calls[1].options.method, undefined);
  await h.respond(1, { code: 'FORBIDDEN' }, 403); assert.doesNotMatch(h.text(), /learner@example|operator@example/);
  assert.match(h.text(), /nur für das bestehende Betreiberkonto/); await h.act(() => oldMail()); assert.equal(h.calls.length, 2);
});

test('A return supersedes even an initial pending GET; its late fetch result cannot restore private rows', async t => {
  const h = await fixture(t); await h.advance(); const oldMail = h.current.checkNotifications;
  await h.act(() => { h.returnEvents(); oldMail(); }); assert.equal(h.calls[0].options.signal.aborted, true);
  await h.advance(); assert.equal(h.calls.length, 2); await h.respond(1, payload([member('current@example.invalid')]));
  await h.respond(0, payload([member('former@example.invalid')]));
  assert.equal(h.current.data.items[0].email, 'current@example.invalid'); assert.equal(h.current.error, null);
  assert.equal(h.calls.length, 2); assert.equal(h.timers.size, 0);
});

test('A return invalidates a stalled old GET json body; late success or failure never changes the newer read', async t => {
  const h = await fixture(t); await h.advance(); const json = deferred();
  await h.act(() => h.calls[0].resolve({ ok: true, status: 200, json: () => json.promise }));
  await h.returnVisible(); await h.advance(); await h.respond(1, payload([member('new@example.invalid')]));
  await h.act(() => json.reject(new Error('late old body')));
  assert.equal(h.current.data.items[0].email, 'new@example.invalid'); assert.equal(h.current.error, null); assert.equal(h.current.loading, false);
});

test('A pending search retains exact raw query, offset and sandbox selection across one fresh visible-return GET', async t => {
  const h = await fixture(t); await h.advance(); await h.respond(0);
  await h.call('chooseEnvironment', 'sandbox'); await h.advance(); await h.respond(1, payload([member('test@example.invalid', 'Sandbox')], { hasMore: true }));
  await h.call('search', '  TEST@EXAMPLE.INVALID  '); await h.advance(300); await h.respond(2, payload([member('test@example.invalid', 'Sandbox')], { hasMore: true }));
  await h.call('next'); await h.advance(300); assert.equal(h.current.offset, 25);
  await h.returnVisible(); assert.equal(h.calls[3].options.signal.aborted, true); assert.equal(h.current.data, null); assert.equal(h.current.notifications, null);
  await h.advance(); assert.equal(h.calls.length, 5);
  const params = new URL(h.calls[4].url, 'https://local.invalid').searchParams;
  assert.deepEqual(Object.fromEntries(params), { environment: 'sandbox', q: 'test@example.invalid', offset: '25', limit: '25' });
  assert.equal(h.current.query, '  TEST@EXAMPLE.INVALID  '); assert.equal(h.current.environment, 'sandbox'); assert.equal(h.current.offset, 25);
  await h.respond(4, payload([member('test@example.invalid', 'Sandbox')], { offset: 25 })); assert.equal(h.current.data.offset, 25);
});

test('Incomplete search stays an edit; return rechecks permission without displaying unfiltered replacement rows', async t => {
  const h = await fixture(t); await h.advance(); await h.respond(0); await h.call('search', 'TEST@');
  await h.advance(300); assert.equal(h.calls.length, 1); assert.equal(h.current.notifications, null);
  await h.returnVisible(); await h.advance(); assert.equal(h.calls.length, 2);
  await h.respond(1); assert.equal(h.current.query, 'TEST@'); assert.equal(h.current.incompleteSearch, true); assert.equal(h.current.data, null);
  assert.equal(h.calls[1].options.method, undefined); assert.equal(new URL(h.calls[1].url, 'https://local.invalid').searchParams.get('q'), '');
});

test('A held action from before the return stays revoked after a fresh positive GET, while the current manual mail still works', async t => {
  const h = await fixture(t); await h.advance(); await h.respond(0); const old = h.current;
  await h.returnVisible(); await h.advance(); await h.respond(1);
  await h.act(() => { old.checkNotifications(); old.reload(); old.search('former@example.invalid'); old.chooseEnvironment('sandbox'); old.next(); old.previous(); });
  assert.equal(h.calls.length, 2); assert.equal(h.current.query, ''); assert.equal(h.current.environment, 'live');
  const { task } = await h.call('checkNotifications'); await h.call('checkNotifications'); assert.equal(h.calls.length, 3);
  assert.equal(h.calls[2].options.method, 'POST'); assert.equal(h.calls[2].options.body, '{}'); assert.deepEqual(h.calls[2].options.headers, { 'Content-Type': 'application/json' });
  await h.respond(2, sent()); await task; assert.equal(h.current.mailPending, false); assert.match(h.current.mailMessage, /1 E-Mails versendet/);
});

test('Return cancels an old mail body; its completion/finally cannot release a new manual mail ticket', async t => {
  const h = await fixture(t); await h.advance(); await h.respond(0);
  const first = await h.call('checkNotifications'); const json = deferred();
  await h.act(() => h.calls[1].resolve({ ok: true, status: 200, json: () => json.promise }));
  await h.returnVisible(); assert.equal(h.calls[1].options.signal.aborted, true); assert.equal(h.current.mailPending, false); assert.equal(h.current.notifications, null);
  await h.call('checkNotifications'); assert.equal(h.calls.length, 2);
  await h.advance(); await h.respond(2, payload([member('fresh@example.invalid')], { notifications: notification('fresh-operator@example.invalid') }));
  const second = await h.call('checkNotifications'); assert.equal(h.calls.length, 4); assert.equal(h.current.mailPending, true);
  await h.act(() => json.resolve(sent('old-operator@example.invalid'))); await first.task;
  assert.equal(h.current.mailPending, true); assert.equal(h.current.notifications.recipient, 'fresh-operator@example.invalid'); assert.equal(h.current.mailMessage, '');
  await h.call('checkNotifications'); assert.equal(h.calls.length, 4);
  await h.respond(3, sent('fresh-operator@example.invalid')); await second.task; assert.equal(h.current.mailPending, false); assert.match(h.current.mailMessage, /1 E-Mails versendet/);
});

test('Return during mail fetch blocks its late403 from clearing a newer confirmed overview', async t => {
  const h = await fixture(t); await h.advance(); await h.respond(0); const old = await h.call('checkNotifications');
  await h.returnVisible(); await h.advance(); await h.respond(2, payload([member('fresh@example.invalid')]));
  await h.respond(1, { code: 'FORBIDDEN' }, 403); await old.task;
  assert.equal(h.current.data.items[0].email, 'fresh@example.invalid'); assert.equal(h.current.error, null); assert.equal(h.current.mailPending, false);
});

test('Filter A-B-A revokes earlier handlers and mail even when the raw filter becomes identical again', async t => {
  const h = await fixture(t); await h.advance(); await h.respond(0); const old = h.current;
  await h.call('search', 'one@example.invalid'); await h.call('search', ''); await h.advance(); await h.respond(1);
  await h.act(() => { old.checkNotifications(); old.reload(); }); assert.equal(h.calls.length, 2);
  const task = await h.call('checkNotifications'); assert.equal(h.calls.length, 3); await h.respond(2, sent()); await task.task;
});

for (const eventName of ['jagdlatein-account-deleted', 'jagdlatein-logout']) {
  test(`${eventName} synchronously revokes rows, recipient, pending reads and all held controls`, async t => {
    const h = await fixture(t); await h.advance(); await h.respond(0); const old = h.current;
    await h.call('reload'); await h.advance(); const pending = h.current;
    await h.act(() => { h.dom.window.dispatchEvent(new h.dom.window.Event(eventName)); old.checkNotifications(); pending.checkNotifications(); pending.reload(); h.returnEvents(); });
    assert.equal(h.calls.length, 2); assert.equal(h.calls[1].options.signal.aborted, true); assert.equal(h.current.data, null); assert.equal(h.current.notifications, null); assert.equal(h.current.error.status, 401);
    await h.respond(1); assert.equal(h.current.data, null); assert.equal(h.current.error.status, 401); assert.equal(h.timers.size, 0);
  });
}

test('Logout cancels in-flight notification mail; late old success leaves its recipient and message cleared', async t => {
  const h = await fixture(t); await h.advance(); await h.respond(0); const { task } = await h.call('checkNotifications');
  await h.act(() => h.dom.window.dispatchEvent(new h.dom.window.Event('jagdlatein-logout')));
  assert.equal(h.calls[1].options.signal.aborted, true); await h.respond(1, sent()); await task;
  assert.equal(h.current.notifications, null); assert.equal(h.current.mailMessage, ''); assert.equal(h.current.mailPending, false); assert.equal(h.current.error.status, 401);
});

test('An actual403 header denies immediately without waiting for or reading an unauthorized JSON body', async t => {
  const h = await fixture(t); await h.advance(); let jsonReads = 0;
  await h.act(() => h.calls[0].resolve({ ok: false, status: 403, json: () => { jsonReads++; return new Promise(() => {}); } }));
  assert.equal(jsonReads, 0); assert.equal(h.current.loading, false); assert.equal(h.current.error.status, 403); assert.equal(h.timers.size, 0);
});

test('A manual mail401 header revokes all private state without reading a stalled unauthorized body', async t => {
  const h = await fixture(t); await h.advance(); await h.respond(0); const { task } = await h.call('checkNotifications'); let jsonReads = 0;
  await h.act(() => h.calls[1].resolve({ ok: false, status: 401, json: () => { jsonReads++; return new Promise(() => {}); } })); await task;
  assert.equal(jsonReads, 0); assert.equal(h.current.error.status, 401); assert.equal(h.current.data, null); assert.equal(h.current.notifications, null); assert.equal(h.current.mailPending, false); assert.equal(h.timers.size, 0);
});

test('A prop lifetime change blocks old actions in the layout phase before passive cleanup and enforces Sandbox', async t => {
  let old, attempts = 0;
  const h = await fixture(t, { beforePassive(props, current) { if (props.testEnvironment && old) { attempts++; old.checkNotifications(); old.chooseEnvironment('live'); current.checkNotifications(); } } });
  await h.advance(); await h.respond(0); old = h.current;
  await h.renderProps({ testEnvironment: true }); assert.equal(attempts, 1); assert.equal(h.calls.length, 1); assert.equal(h.current.data, null); assert.equal(h.current.notifications, null);
  await h.advance(); assert.equal(h.calls.length, 2); assert.equal(new URL(h.calls[1].url, 'https://local.invalid').searchParams.get('environment'), 'sandbox');
  await h.respond(1, payload([member('test@example.invalid', 'Sandbox')])); await h.act(() => old.checkNotifications()); assert.equal(h.calls.length, 2); assert.equal(h.current.data.items[0].environment, 'Sandbox');
});

test('Unmount revokes old handlers, retained visible-return listeners, timers and a stalled GET body', async t => {
  const h = await fixture(t); await h.advance(); const json = deferred();
  await h.act(() => h.calls[0].resolve({ ok: true, status: 200, json: () => json.promise }));
  const old = h.current, retained = h.listeners.filter(entry => ['focus', 'pageshow', 'visibilitychange', 'jagdlatein-logout'].includes(entry.name));
  await h.unmount(); assert.equal(h.calls[0].options.signal.aborted, true); assert.equal(h.timers.size, 0);
  await h.act(() => { old.checkNotifications(); old.reload(); old.search('one@example.invalid'); old.chooseEnvironment('sandbox'); old.next(); old.previous(); for (const entry of retained) entry.handler({ persisted: true }); json.resolve(payload()); });
  assert.equal(h.calls.length, 1); assert.equal(h.timers.size, 0);
});

test('Retained listeners from a disposed lifetime cannot revoke or reload a later A-B-A Sandbox lifetime', async t => {
  const h = await fixture(t); await h.advance(); await h.respond(0);
  const retained = h.listeners.filter(entry => ['focus', 'pageshow', 'visibilitychange', 'jagdlatein-logout', 'jagdlatein-account-deleted'].includes(entry.name));
  await h.renderProps({ testEnvironment: true }); await h.advance(); await h.respond(1, payload([member('test@example.invalid', 'Sandbox')]));
  await h.renderProps({ testEnvironment: false }); await h.advance(); await h.respond(2, payload([member('current@example.invalid', 'Sandbox')]));
  await h.act(() => { for (const entry of retained) entry.handler({ persisted: true }); });
  assert.equal(h.current.error, null); assert.equal(h.current.data.items[0].email, 'current@example.invalid'); assert.equal(h.calls.length, 3); assert.equal(h.timers.size, 0);
});

test('Unmount aborts mail even if fetch ignores cancellation; old catch/finally cannot send or commit again', async t => {
  const h = await fixture(t); await h.advance(); await h.respond(0); const old = h.current; const { task } = await h.call('checkNotifications');
  await h.unmount(); assert.equal(h.calls[1].options.signal.aborted, true); await h.act(() => { old.checkNotifications(); h.calls[1].reject(new Error('late old request')); }); await task;
  assert.equal(h.calls.length, 2); assert.equal(h.timers.size, 0);
});

test('Another visible return after the dedup window creates exactly one fresh GET, with no automatic POST', async t => {
  const h = await fixture(t); await h.advance(); await h.respond(0); await h.returnVisible(); await h.advance(); await h.respond(1);
  await h.advance(600); await h.returnVisible(); await h.advance(); assert.equal(h.calls.length, 3); assert.ok(h.calls.every(call => call.options.method === undefined));
  await h.respond(2); assert.equal(h.current.loading, false);
});

test('A missing mail configuration, GET failure or malformed fresh result never enables a captured notification action', async t => {
  const h = await fixture(t); await h.advance(); await h.respond(0, payload([], { notifications: { configured: false } }));
  await h.call('checkNotifications'); assert.equal(h.calls.length, 1);
  await h.call('reload'); await h.advance(); await h.respond(1, {}, 503); await h.call('checkNotifications'); assert.equal(h.calls.length, 2);
  await h.call('reload'); await h.advance(); await h.respond(2, payload([member()], { offset: 25 })); await h.call('checkNotifications');
  assert.equal(h.current.error.code, 'INVALID_RESPONSE'); assert.equal(h.current.notifications, null); assert.equal(h.calls.length, 3);
});
