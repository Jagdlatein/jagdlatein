// Real React DOM, effects and unmounts. Fetches, timers and downloads are
// isolated doubles; no account, analytics, storage, SMTP or provider is used.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { local, root, createLoader } = require('./helpers/project-module.cjs');
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const client = createLoader()('lib/admin-overview-client.js');
const flush = async () => { for (let i = 0; i < 24; i++) await Promise.resolve(); };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const props = node => node[Object.keys(node).find(key => key.startsWith('__reactProps$'))];
const expected = call => Object.fromEntries(new URL(call.url, 'https://example.invalid').searchParams);
const section = (id = 'usage', extra = {}) => ({ id, title: 'Nutzung', status: 'ready', note: 'Nur bestätigte Tageswerte; fehlende Werte sind keine Null.', metrics: [{ key: 'views', label: 'Seitenaufrufe', value: 12, format: 'count' }], columns: [], rows: [], ...extra });
const payload = (filters, sections = [section()], extra = {}) => ({ schemaVersion: 1, asOf: '2026-11-08T12:00:00.000Z', period: { from: filters.from, to: filters.to, timeZone: 'Europe/Zurich' }, environment: filters.environment === 'sandbox' ? 'Sandbox' : 'Production', sections, ...extra });
const reply = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, headers: { get: () => null }, json: async () => body });

async function fixture(t, { ui = false, sandbox = false } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://jagdlatein.de/admin' });
  const saved = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const calls = [], timers = new Map(), downloads = [], revoked = [], scrolls = [];
  let timerId = 0, hookValue, currentProps = { testEnvironment: sandbox }, disposed = false;
  dom.window.scrollTo = options => scrolls.push(options);
  const createUrl = URL.createObjectURL, revokeUrl = URL.revokeObjectURL;
  URL.createObjectURL = blob => { const url = `blob:isolated-overview-${downloads.length}`; downloads.push({ blob, url }); return url; };
  URL.revokeObjectURL = url => revoked.push(url);
  dom.window.HTMLAnchorElement.prototype.click = function () { if (this.download) downloads.at(-1).filename = this.download; };
  const fetch = (url, options) => { const pending = deferred(); calls.push({ url, options, ...pending }); return pending.promise; };
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const { code } = local('next/dist/build/swc').transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', 'fetch', 'setTimeout', 'clearTimeout', code)(id => {
      if (id === 'next/link') return { __esModule: true, default: ({ children, ...rest }) => React.createElement('a', rest, children) };
      if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`));
      return local(id);
    }, module, module.exports, fetch, (fn, delay) => { timers.set(++timerId, { fn, delay }); return timerId; }, id => timers.delete(id));
    return module.exports;
  }
  const Hook = load('hooks/useAdminOverview.js').default;
  const Component = ui ? load('components/AdminOverview.js').default : function Probe({ testEnvironment }) { hookValue = Hook(testEnvironment); return React.createElement('div', null, hookValue.data ? 'confirmed' : 'empty'); };
  const reactRoot = local('react-dom/client').createRoot(dom.window.document.getElementById('root'));
  const act = action => React.act(async () => { action?.(); await flush(); });
  const render = () => act(() => reactRoot.render(React.createElement(Component, currentProps)));
  const unmount = async () => { if (!disposed) { await React.act(async () => reactRoot.unmount()); disposed = true; } };
  t.after(async () => { await unmount(); URL.createObjectURL = createUrl; URL.revokeObjectURL = revokeUrl; dom.window.close(); for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  await render();
  return { dom, calls, timers, downloads, revoked, scrolls, load, render, unmount, act, get current() { return hookValue; },
    async renderProps(value) { currentProps = { ...currentProps, ...value }; await render(); },
    async respond(index, body, status = 200) { await act(() => calls[index].resolve(reply(body || payload(expected(calls[index])), status))); },
    async choose(days) { await act(() => hookValue.choosePreset(days)); },
    async call(name, ...args) { let task; await act(() => { task = hookValue[name](...args); }); return { task }; },
    async click(label) { const button = [...dom.window.document.querySelectorAll('button')].find(node => node.textContent === label); assert.ok(button, label); await act(() => props(button).onClick?.()); },
    async change(input, value) { await act(() => props(input).onChange({ target: { value } })); },
    async timeout(delay = 18000) { const pair = [...timers].find(([, value]) => value.delay === delay); assert.ok(pair, 'Pending deadline'); timers.delete(pair[0]); await act(pair[1].fn); },
  };
}

test('SSR is neutral and deterministic: no fetch, browser access or private snapshot during render', () => {
  const Component = createLoader({ 'next/link': { __esModule: true, default: 'a' } })('components/AdminOverview.js').default;
  const html = local('react-dom/server').renderToStaticMarkup(React.createElement(Component));
  assert.match(html, /Gesamtübersicht/); assert.match(html, /Auswertung wird geladen/);
  assert.match(html, /type="date"[^>]*value=""/); assert.doesNotMatch(html, /<dialog|<iframe|@example|Seitenaufrufe/);
  assert.equal((html.match(/<h2\b/g) || []).length, 1); assert.equal((html.match(/type="submit"/g) || []).length, 1);
});

test('The mounted initial GET is private, bounded and echoed; it sends no mutation and settles loading', async t => {
  const h = await fixture(t); assert.equal(h.calls.length, 1); const f = expected(h.calls[0]);
  assert.equal(client.validOverviewPeriod(f), true); assert.equal((Date.parse(f.to) - Date.parse(f.from)) / 86400000, 29);
  assert.equal(h.calls[0].options.credentials, 'same-origin'); assert.equal(h.calls[0].options.cache, 'no-store'); assert.equal(h.calls[0].options.method, undefined);
  await h.respond(0); assert.equal(h.current.loading, false); assert.equal(h.current.data.sections[0].metrics[0].value, 12); assert.equal(h.current.canExport, true); assert.equal(h.timers.size, 0);
});

test('Manual date editing clears old values and CSV immediately but fetches only after Apply', async t => {
  const h = await fixture(t); await h.respond(0); const oldExport = h.current.currentSnapshot; const oldReload = h.current.reload;
  await h.call('change', 'from', expected(h.calls[0]).to); assert.equal(h.calls.length, 1); assert.equal(h.current.data, null); assert.equal(h.current.canExport, false); assert.equal(oldExport(), null); assert.equal(oldReload(), false);
  await h.call('apply'); assert.equal(h.calls.length, 2); assert.equal(expected(h.calls[1]).from, expected(h.calls[1]).to); await h.respond(1);
  assert.equal(h.current.canExport, true);
});

test('Invalid and reversed calendar dates never fetch; valid leap dates and max366-day periods are checked', async t => {
  assert.equal(client.validOverviewDay('2026-02-29'), false); assert.equal(client.validOverviewDay('2028-02-29'), true);
  assert.equal(client.validOverviewPeriod({ from: '2028-01-01', to: '2028-12-31', environment: 'live' }), true);
  assert.equal(client.validOverviewPeriod({ from: '2028-01-01', to: '2029-01-01', environment: 'live' }), false);
  const h = await fixture(t); await h.respond(0); await h.call('change', 'from', '2026-02-30'); await h.call('apply');
  assert.equal(h.calls.length, 1); assert.match(h.current.validation, /366 Tagen/); assert.equal(h.current.data, null);
});

test('A-B-A requests have distinct tickets; aborted late success/error cannot replace the current snapshot', async t => {
  const h = await fixture(t); await h.respond(0); await h.choose(7); const stale = h.current.currentSnapshot; await h.choose(30);
  assert.equal(h.calls[1].options.signal.aborted, true); await h.respond(2, payload(expected(h.calls[2]), [section('usage', { metrics: [{ key: 'views', label: 'Neu', value: 37, format: 'count' }] })]));
  await h.respond(1); assert.equal(h.current.data.sections[0].metrics[0].value, 37); assert.equal(stale(), null);
  assert.equal(h.current.currentSnapshot().id, 3);
});

test('Wrong period or environment echoes and oversized/unsafe rows become errors, never private cached values', async t => {
  const h = await fixture(t); const wrong = payload(expected(h.calls[0])); wrong.period.from = '2000-01-01'; await h.respond(0, wrong);
  assert.equal(h.current.data, null); assert.equal(h.current.error.code, 'INVALID_RESPONSE'); await h.call('reload');
  await h.respond(1, payload(expected(h.calls[1]), [], { environment: 'Sandbox' })); assert.equal(h.current.error.code, 'INVALID_RESPONSE'); assert.equal(h.current.canExport, false);
  const f = { from: '2026-11-01', to: '2026-11-08', environment: 'live' };
  const bad = [payload(f, [section('usage', { rows: Array.from({ length: 31 }, () => ({})) })]), payload(f, [section('usage', { columns: [{ key: 'email', label: 'E-Mail', format: 'text' }], rows: [{ email: 'private@example.invalid' }] })]), payload(f, [section('usage', { metrics: [{ key: 'bad', label: 'Anzahl', value: -1, format: 'count' }] })])];
  for (const data of bad) assert.equal(client.validAdminOverview(data, f), false);
});

test('Sandbox prop locks live selection, clears old props before reloading, and rejects mixed-environment data', async t => {
  const h = await fixture(t, { sandbox: true }); assert.equal(expected(h.calls[0]).environment, 'sandbox'); await h.respond(0);
  assert.equal(h.current.change('environment', 'live'), false); assert.equal(h.calls.length, 1);
  await h.renderProps({ testEnvironment: false }); assert.equal(h.current.data, null); assert.equal(expected(h.calls[1]).environment, 'live'); await h.respond(1);
  assert.equal(h.current.data.environment, 'Production');
});

test('Timeout covers a stalled JSON body, aborts it and releases the page for an explicit retry', async t => {
  const h = await fixture(t); const body = deferred(); await h.act(() => h.calls[0].resolve({ ok: true, status: 200, json: () => body.promise }));
  await h.timeout(); assert.equal(h.current.loading, false); assert.equal(h.current.error.code, 'REQUEST_TIMEOUT'); assert.equal(h.calls[0].options.signal.aborted, true);
  body.resolve(payload(expected(h.calls[0]))); await h.act(); assert.equal(h.current.data, null);
  await h.call('reload'); await h.respond(1); assert.equal(h.current.canExport, true);
});

test('403 removes the current snapshot, blocks old actions and does not wait for an error JSON body', async t => {
  const h = await fixture(t); await h.respond(0); const old = h.current;
  await h.call('reload'); await h.act(() => h.calls[1].resolve({ ok: false, status: 403, json: () => new Promise(() => {}) }));
  assert.equal(h.current.data, null); assert.equal(h.current.loading, false); assert.equal(h.current.denied, true); assert.equal(h.current.canExport, false); assert.equal(old.currentSnapshot(), null); assert.equal(old.reload(), false); assert.equal(h.current.reload(), false);
});

test('401 clears every overview section and requires reauthentication instead of an automatic retry', async t => {
  const h = await fixture(t, { ui: true }); await h.respond(0); await h.click('Aktualisieren'); await h.respond(1, {}, 401);
  assert.match(h.dom.window.document.body.textContent, /Anmeldung ist abgelaufen/);
  assert.equal(h.dom.window.document.querySelector('a[href="/login?reauth=1&next=%2Fadmin"]').textContent, 'Erneut anmelden');
  assert.equal(h.dom.window.document.querySelector('#admin-usage'), null);
  assert.equal([...h.dom.window.document.querySelectorAll('button')].find(node => node.textContent === 'CSV').disabled, true);
  assert.equal(h.calls.length, 2);
});

test('A real account deletion/logout event aborts pending work and cannot be undone by its late reply', async t => {
  const h = await fixture(t); await h.respond(0); await h.call('reload'); const before = h.calls.length;
  await h.act(() => h.dom.window.dispatchEvent(new h.dom.window.Event('jagdlatein-account-deleted')));
  assert.equal(h.current.data, null); assert.equal(h.current.error.status, 401); assert.equal(h.calls[1].options.signal.aborted, true);
  await h.respond(1); assert.equal(h.current.data, null); assert.equal(h.current.choosePreset(7), false); assert.equal(h.calls.length, before);
});

test('Real unmount cleans the request/timer/listeners and retained handlers cannot fetch or export', async t => {
  const h = await fixture(t); const stale = h.current; await h.unmount();
  assert.equal(h.calls[0].options.signal.aborted, true); assert.equal(stale.reload(), false); assert.equal(stale.apply(), false); assert.equal(stale.choosePreset(7), false); assert.equal(stale.currentSnapshot(), null);
  assert.equal(h.timers.size, 0, 'Unmount clears the deadline even when the transport does not settle');
  await h.respond(0); assert.equal(h.calls.length, 1); assert.equal(h.timers.size, 0);
});

test('A visible return clears the old snapshot and rechecks access once without applying a draft or stealing focus', async t => {
  const h = await fixture(t); await h.respond(0);
  Object.defineProperty(h.dom.window.document, 'visibilityState', { configurable: true, value: 'hidden' });
  await h.act(() => h.dom.window.document.dispatchEvent(new h.dom.window.Event('visibilitychange')));
  Object.defineProperty(h.dom.window.document, 'visibilityState', { configurable: true, value: 'visible' });
  await h.act(() => h.dom.window.document.dispatchEvent(new h.dom.window.Event('visibilitychange')));
  assert.equal(h.calls.length, 2); assert.equal(h.current.data, null); assert.equal(h.current.canExport, false);
  await h.act(() => h.dom.window.dispatchEvent(new h.dom.window.PageTransitionEvent('pageshow', { persisted: true })));
  assert.equal(h.calls.length, 2); await h.respond(1, {}, 403); assert.equal(h.current.denied, true); assert.equal(h.scrolls.length, 0);
});

test('Accepted active selection focuses the result heading and scrolls top once; initial, failed and refresh reads do not', async t => {
  const h = await fixture(t, { ui: true }); await h.respond(0); assert.equal(h.scrolls.length, 0);
  const input = h.dom.window.document.querySelector('input[type=date]'); input.focus(); await h.click('7 Tage'); assert.equal(h.scrolls.length, 0); await h.respond(1);
  assert.equal(h.dom.window.document.activeElement.id, 'admin-overview-title'); assert.deepEqual(h.scrolls, [{ left: 0, top: 0, behavior: 'instant' }]);
  input.focus(); await h.click('Aktualisieren'); await h.respond(2); assert.equal(h.dom.window.document.activeElement, input); assert.equal(h.scrolls.length, 1);
  await h.click('90 Tage'); await h.respond(3, {}, 503); assert.equal(h.scrolls.length, 1); assert.match(h.dom.window.document.body.textContent, /nicht erreichbar/);
});

test('Unknown sections render dashes, currency decimals stay exact, and charts have a complete table fallback', async t => {
  const h = await fixture(t, { ui: true }); const f = expected(h.calls[0]);
  const money = section('payments', { title: 'Zahlungen', note: 'Beträge je Währung. Keine Auszahlungs- oder Gewinngarantie.', metrics: [], columns: [{ key: 'kind', label: 'Art', format: 'text' }, { key: 'amount', label: 'Bestätigt', format: 'amount' }], rows: [{ kind: 'Zahlung', amount: '10.005', currency: 'CHF' }, { kind: 'Erstattung', amount: '2.50', currency: 'EUR' }] });
  await h.respond(0, payload(f, [section('accounts', { status: 'not_recorded', metrics: [{ key: 'count', label: 'Unbekannt', value: 999, format: 'count' }] }), money, section('usage', { series: [{ date: f.from, value: 0 }, { date: f.to, value: null }], seriesLabel: 'Seitenaufrufe pro Tag' }), section('subscriptions')]));
  const html = h.dom.window.document.body.textContent; assert.doesNotMatch(html, /999/); assert.match(html, /Noch nicht erfasst/); assert.match(html, /10\.005 CHF/); assert.match(html, /2\.50 EUR/);
  assert.ok(h.dom.window.document.querySelector('svg[role=img]')); assert.equal(h.dom.window.document.querySelectorAll('figure details tbody tr').length, 2); assert.match(h.dom.window.document.querySelector('figure details').textContent, /—/);
  assert.equal(h.dom.window.document.querySelectorAll('dialog,iframe').length, 0);
  assert.equal(h.dom.window.document.querySelector('a[href="/admin/testabos"]').textContent, 'Aktive Testabos ansehen');
});

test('CSV is BOM/semicolon/CRLF, formula-safe and exact; stale filter and denied handlers cannot download', async t => {
  const f = { from: '2026-11-01', to: '2026-11-08', environment: 'live' };
  const data = payload(f, [section('payments', { title: '=FORMULA', note: 'Zeile eins\r\n"zwei"', metrics: [], columns: [{ key: 'label', label: 'Art', format: 'text' }, { key: 'amount', label: 'Betrag', format: 'amount' }], rows: [{ label: '@unsafe', amount: '10.005', currency: 'CHF' }] })]);
  const csv = client.adminOverviewCsv(data, f); assert.ok(csv.startsWith('\uFEFF')); assert.match(csv, /"'\=FORMULA"/); assert.match(csv, /"'@unsafe"/); assert.match(csv, /"10\.005";"CHF"/); assert.match(csv, /Zeile eins\r\n""zwei""/); assert.ok(csv.endsWith('\r\n'));
  const h = await fixture(t, { ui: true }); await h.respond(0); const button = [...h.dom.window.document.querySelectorAll('button')].find(node => node.textContent === 'CSV'); const staleClick = props(button).onClick;
  await h.click('CSV'); assert.equal(h.downloads.length, 1); assert.match(h.downloads[0].filename, /Jagdlatein-Auswertung-.*-live\.csv/); assert.equal(Buffer.from(await h.downloads[0].blob.arrayBuffer()).subarray(0, 3).toString('hex'), 'efbbbf');
  await h.change(h.dom.window.document.querySelector('input[type=date]'), '2026-01-01'); await h.act(staleClick); assert.equal(h.downloads.length, 1);
  await h.unmount(); assert.equal(h.revoked.length, 1); assert.equal(h.timers.size, 0);
});

test('Swiss presets cross DST/year boundaries by civil dates without inventing366-day periods', () => {
  assert.deepEqual(client.overviewPreset(7, 'live', Date.parse('2026-12-31T23:30:00Z')), { from: '2026-12-26', to: '2027-01-01', environment: 'live' });
  assert.deepEqual(client.overviewPreset(7, 'sandbox', Date.parse('2026-10-25T00:30:00Z')), { from: '2026-10-19', to: '2026-10-25', environment: 'sandbox' });
  assert.equal(client.overviewPreset(366), null); assert.equal(client.overviewPreset(30, 'invalid'), null);
});

test('Future dates stop before fetch with a clear choice error; input maximum follows Swiss rather than UTC today', async t => {
  t.mock.method(Date, 'now', () => Date.parse('2026-12-31T23:30:00Z'));
  const h = await fixture(t, { ui: true }); await h.respond(0);
  const inputs = h.dom.window.document.querySelectorAll('input[type=date]');
  assert.equal(inputs[1].max, '2027-01-01'); assert.equal(inputs[0].max, '2027-01-01');
  await h.change(inputs[1], '2027-01-02');
  await h.act(() => props(h.dom.window.document.querySelector('form')).onSubmit({ preventDefault() {} }));
  assert.equal(h.calls.length, 1); assert.match(h.dom.window.document.body.textContent, /Enddatum.*heutigen Tag in der Schweiz/);
  assert.equal(h.dom.window.document.querySelector('#admin-usage'), null);
});

test('The accepted server30-digit amount stays exact and an existing currency column occurs only once in CSV', () => {
  const f = { from: '2026-11-01', to: '2026-11-08', environment: 'live' };
  const amount = '123456789012345678901234567890.123456';
  const data = payload(f, [section('payments', { title: 'Zahlungen', metrics: [], columns: [{ key: 'currency', label: 'Währung', format: 'text' }, { key: 'amount', label: 'Betrag', format: 'amount' }], rows: [{ currency: 'CHF', amount }] })]);
  assert.equal(client.validAdminOverview(data, f), true);
  const csv = client.adminOverviewCsv(data, f); assert.equal((csv.match(/"Währung"/g) || []).length, 1); assert.ok(csv.includes(amount));
  data.sections[0].rows[0].amount = '1' + amount; assert.equal(client.validAdminOverview(data, f), false);
});

test('An actual populated server-rendered chart has scalar accessible titles without React title warnings', t => {
  const f = { from: '2026-11-01', to: '2026-11-08', environment: 'live' };
  const data = payload(f, [section('usage', { series: [{ date: '2026-11-01', value: 3 }] })]);
  const warnings = []; t.mock.method(console, 'error', (...args) => warnings.push(args));
  const Component = createLoader({ '../hooks/useAdminOverview': { __esModule: true, default: () => ({ draft: f, today: '2026-11-08', data, initialized: true, preset: '7', loading: false, canExport: true }) }, 'next/link': { __esModule: true, default: 'a' } })('components/AdminOverview.js').default;
  const html = local('react-dom/server').renderToStaticMarkup(React.createElement(Component));
  assert.match(html, /<title>01\.11\.2026: 3<\/title>/); assert.equal(warnings.length, 0);
});
