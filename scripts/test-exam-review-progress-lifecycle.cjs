// Real React/DOM lifecycle coverage. All storage and events below are synthetic.
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const { createLoader: createProjectLoader, local } = require('./helpers/project-module.cjs');
// The plan's reading focus uses a ready bare Next route; account readiness is still tested independently.
const createLoader = (overrides = {}) => createProjectLoader({ 'next/router': { useRouter: () => ({ isReady: true, query: {}, asPath: '/lernen/pruefungsplan' }) }, ...overrides });
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const load = createLoader();
const { packDailyReviewCatalog } = load('lib/daily-review-catalog.js');
const { REVIEW_STORAGE_KEY } = load('lib/daily-review.js');
const data = load('lib/exam-study-plan-server.js').getExamStudyPlanData();
const base = 1793500000000;
const catalogA = packDailyReviewCatalog([
  { id: 'lifecycle-one', category: 'wildkunde' }, { id: 'lifecycle-two', category: 'wildkunde' },
  { id: 'lifecycle-three', category: 'hundewesen' }, { id: 'lifecycle-four', category: 'hundewesen' },
]);
const catalogB = packDailyReviewCatalog([{ id: 'lifecycle-two', category: 'wildkunde' }]);
const entry = (streak, due) => ({ seen: 4, mistakes: 1, streak, lastSeen: base - 1000, due, lastEvent: 'isolated-test-event' });
const history = entries => JSON.stringify({ version: 1, entries });
const initialHistory = history({
  'lifecycle-one': entry(0, base - 10), 'lifecycle-two': entry(2, base + 120000),
  'lifecycle-three': entry(1, base - 5), 'removed-question': entry(0, base - 10),
  'regional-law-test': entry(0, base - 10),
});
const wrap = value => ({ __esModule: true, default: value });
function planLoader() {
  return createLoader({
    'next/link': ({ href, children, prefetch, ...props }) => React.createElement('a', { href, ...props }, children),
    './LearningToolLayout': wrap(({ children }) => React.createElement('main', null, children)),
    './PageMenu': { ...wrap(({ children }) => React.createElement('aside', null, children)), closePageMenu() {}, openPageMenu() {} },
    '../hooks/useSelectionPageStart': wrap(() => ({ focusSelection() {} })),
    '../lib/use-exam-profile': wrap(() => ({ profile: { country: 'CH', region: 'ZH' }, ready: true, persistence: 'device', saveProfile() { throw Error('Unexpected profile write'); }, clearProfile() { throw Error('Unexpected profile removal'); } })),
  });
}
const settle = async () => { for (let n = 0; n < 8; n++) await Promise.resolve(); };

async function fixture(t, { raw = initialHistory, strict = false, html = '' } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root">' + html + '</div></body></html>', { url: 'https://jagdlatein.invalid/lernen/pruefungsplan' });
  const saved = new Map(), values = new Map(raw === null ? [] : [[REVIEW_STORAGE_KEY, raw]]), writes = [], reads = [], timers = new Map();
  const listeners = new Map(['storage', 'focus', 'jagdlatein-account-deleted', 'visibilitychange'].map(key => [key, new Set()]));
  let denied = '', visibility = 'visible', timerId = 0, now = base, probeState, reactRoot = null;
  const storage = {
    getItem(key) { reads.push(key); if (denied === 'read') throw Error('Synthetic denied read'); return values.get(key) ?? null; },
    setItem(key, value) { writes.push(['set', key, value]); throw Error('Unexpected progress write'); },
    removeItem(key) { writes.push(['remove', key]); throw Error('Unexpected progress removal'); },
    clear() { writes.push(['clear']); throw Error('Unexpected progress clear'); },
  };
  Object.defineProperty(dom.window, 'localStorage', { configurable: true, get() { if (denied === 'getter') throw Error('Synthetic denied storage'); return storage; } });
  Object.defineProperty(dom.window.document, 'visibilityState', { configurable: true, get: () => visibility });
  for (const target of [dom.window, dom.window.document]) {
    const add = target.addEventListener.bind(target), remove = target.removeEventListener.bind(target);
    target.addEventListener = (type, callback, ...rest) => { if (target === dom.window || type === 'visibilitychange') listeners.get(type)?.add(callback); return add(type, callback, ...rest); };
    target.removeEventListener = (type, callback, ...rest) => { if (target === dom.window || type === 'visibilitychange') listeners.get(type)?.delete(callback); return remove(type, callback, ...rest); };
  }
  dom.window.setInterval = (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; };
  dom.window.clearInterval = id => timers.delete(id);
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const savedNow = Date.now; Date.now = () => now;
  const api = planLoader(), Plan = api('components/ExamStudyPlan.js').default;
  const useProgress = api('lib/use-exam-review-progress.js').default;
  function Probe({ catalog, beforeEffects }) {
    probeState = useProgress(catalog);
    React.useLayoutEffect(() => { beforeEffects?.(probeState); }, [catalog]);
    return React.createElement('output', { 'data-phase': probeState.phase }, probeState.summary ? JSON.stringify(probeState.summary) : probeState.phase);
  }
  const act = action => React.act(async () => { action(); await settle(); });
  const withStrict = element => strict ? React.createElement(React.StrictMode, null, element) : element;
  const render = element => act(() => { reactRoot ||= local('react-dom/client').createRoot(document.getElementById('root')); reactRoot.render(withStrict(element)); });
  const unmount = async () => { if (reactRoot) { const leaving = reactRoot; reactRoot = null; await act(() => leaving.unmount()); } };
  t.after(async () => { await unmount(); assert.deepEqual(writes, [], 'Progress is a read-only view'); dom.window.close(); Date.now = savedNow; for (const [key, descriptor] of saved) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]; });
  function event(type, fields = {}) {
    const target = type === 'visibilitychange' ? dom.window.document : dom.window;
    const value = new dom.window.Event(type);
    if (type === 'storage') Object.defineProperties(value, Object.fromEntries(Object.entries({ key: REVIEW_STORAGE_KEY, storageArea: storage, newValue: null, ...fields }).map(([key, value]) => [key, { value }])));
    target.dispatchEvent(value);
  }
  return {
    act, dom, reads, writes, timers, listeners, values, storage, event, unmount,
    deny(value) { denied = value; }, visibility(value) { visibility = value; }, advance(amount) { now += amount; },
    state: () => probeState,
    renderProbe: (catalog = catalogA, beforeEffects) => render(React.createElement(Probe, { catalog, beforeEffects })),
    renderPlan: (catalog = catalogA) => render(React.createElement(Plan, { data, reviewCatalog: catalog })),
    hydratePlan: recoverable => act(() => { reactRoot = local('react-dom/client').hydrateRoot(document.getElementById('root'), React.createElement(Plan, { data, reviewCatalog: catalogA }), { onRecoverableError: error => recoverable.push(error) }); }),
    progress: () => document.querySelector('[aria-labelledby="exam-plan-progress"]'),
    text: () => document.querySelector('main')?.textContent || document.querySelector('output')?.textContent,
  };
}

function totals(h) { return [...h.progress().querySelectorAll('dl > div')].map(node => [node.querySelector('dt').textContent, Number(node.querySelector('dd').textContent)]); }
function links(node) { return [...node.querySelectorAll('a')].map(anchor => anchor.getAttribute('href')); }

test('Actual plan SSR is storage-free and its loading markup hydrates without mismatches', async t => {
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'window');
  let html;
  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, get() { throw Error('SSR accessed browser storage'); } });
    const Plan = planLoader()('components/ExamStudyPlan.js').default;
    html = local('react-dom/server').renderToString(React.createElement(Plan, { data, reviewCatalog: catalogA }));
  } finally { saved ? Object.defineProperty(globalThis, 'window', saved) : delete globalThis.window; }
  assert.match(html, /Dein lokaler Wiederholungsstand wird geladen/);
  assert.doesNotMatch(html, /Zuletzt falsch<\/dt>/);
  const h = await fixture(t, { html }), recoverable = [];
  await h.hydratePlan(recoverable);
  assert.deepEqual(recoverable, []);
  assert.deepEqual(totals(h), [['Beantwortet', 3], ['Fällig', 2], ['Zuletzt falsch', 1]]);
});

test('Actual plan renders distinct current question counts and exact category/mode links', async t => {
  const h = await fixture(t); await h.renderPlan();
  assert.deepEqual(totals(h), [['Beantwortet', 3], ['Fällig', 2], ['Zuletzt falsch', 1]]);
  assert.deepEqual(links(h.progress()), ['/lernen/fuenf-minuten?modus=faellig', '/lernen/fuenf-minuten?modus=fehler', '/lernen/fuenf-minuten?modus=gemischt']);
  const wild = [...document.querySelectorAll('li')].find(node => node.querySelector('a[href="/lernen/wildkunde"]'));
  assert.match(wild.textContent, /2 beantwortet · 1 fällig · 1 zuletzt falsch/);
  assert.deepEqual(links(wild), ['/lernen/wildkunde', '/lernen/fuenf-minuten?modus=faellig&kategorie=wildkunde', '/lernen/fuenf-minuten?modus=fehler&kategorie=wildkunde']);
  const dogs = [...document.querySelectorAll('li')].find(node => node.querySelector('a[href="/lernen/hundewesen"]'));
  assert.match(dogs.textContent, /1 beantwortet · 1 fällig · 0 zuletzt falsch/);
  assert.equal(dogs.querySelector('[aria-label="Fehler üben: Hundewesen"]'), null);
  const law = [...document.querySelectorAll('li')].find(node => node.querySelector('a[href="/lernen/jagdrecht"]'));
  assert.deepEqual(links(law), ['/lernen/jagdrecht']);
  assert.doesNotMatch(law.textContent, /beantwortet|fällig|zuletzt falsch/);
  assert.match(h.progress().textContent, /keine vollständige Prüfungsabdeckung oder Prüfungsreife/);
  assert.match(h.progress().textContent, /beim Abmelden entfernt/);
});

test('Storage updates use the present record and ignore unrelated keys and other storage areas', async t => {
  const h = await fixture(t); await h.renderProbe(); const before = h.reads.length;
  await h.act(() => { h.event('storage', { key: 'unrelated-test' }); h.event('storage', { storageArea: h.dom.window.sessionStorage }); });
  assert.equal(h.reads.length, before);
  h.values.set(REVIEW_STORAGE_KEY, history({ 'lifecycle-two': entry(1, base + 120000) }));
  await h.act(() => h.event('storage', { newValue: initialHistory }));
  assert.equal(h.state().summary.total.answered, 1); assert.equal(h.state().summary.total.due, 0); assert.equal(h.state().summary.total.mistakes, 0);
  h.values.delete(REVIEW_STORAGE_KEY);
  await h.act(() => h.event('storage', { key: null, newValue: initialHistory }));
  assert.deepEqual(h.state().summary.total, { available: 4, answered: 0, due: 0, mistakes: 0 });
});

test('Account removal, focus, visibility and due-time refresh update the mounted plan', async t => {
  const h = await fixture(t); await h.renderPlan();
  assert.equal(h.timers.size, 1); assert.equal([...h.timers.values()][0].delay, 60000);
  h.advance(120001); h.visibility('hidden');
  const before = h.reads.length;
  await h.act(() => [...h.timers.values()][0].callback());
  assert.equal(h.reads.length, before); assert.equal(totals(h)[1][1], 2);
  await h.act(() => h.event('visibilitychange'));
  assert.equal(h.reads.length, before);
  h.visibility('visible'); await h.act(() => h.event('visibilitychange'));
  assert.equal(totals(h)[1][1], 3);
  h.values.delete(REVIEW_STORAGE_KEY); await h.act(() => h.event('jagdlatein-account-deleted'));
  assert.deepEqual(totals(h), [['Beantwortet', 0], ['Fällig', 0], ['Zuletzt falsch', 0]]);
  assert.deepEqual(links(h.progress()), ['/lernen/fuenf-minuten?modus=gemischt']);
  h.values.set(REVIEW_STORAGE_KEY, initialHistory); await h.act(() => h.event('focus'));
  assert.equal(totals(h)[0][1], 3);
});

test('Denied storage getters/reads and malformed records show unavailable without false zeros, then recover', async t => {
  const h = await fixture(t);
  for (const denial of ['getter', 'read']) {
    h.deny(denial); await h.renderPlan(); await h.act(() => h.event('focus'));
    assert.match(h.progress().textContent, /gerade nicht lesbar/);
    assert.equal(h.progress().querySelector('dl'), null);
    assert.deepEqual(links(h.progress()), []);
    assert.ok(document.querySelector('a[href="/lernen/wildkunde"]'));
  }
  h.deny('');
  for (const raw of ['not-json', '{"version":9,"entries":{}}', '{"version":1,"entries":[]}']) {
    h.values.set(REVIEW_STORAGE_KEY, raw); await h.act(() => h.event('focus'));
    assert.match(h.progress().textContent, /gerade nicht lesbar/); assert.equal(h.progress().querySelector('dl'), null);
  }
  h.values.set(REVIEW_STORAGE_KEY, initialHistory); await h.act(() => h.event('focus'));
  assert.deepEqual(totals(h), [['Beantwortet', 3], ['Fällig', 2], ['Zuletzt falsch', 1]]);
});

test('Unknown or regional-law catalogs cannot display a stale ready summary; a later valid catalog recovers', async t => {
  const h = await fixture(t); await h.renderPlan();
  for (const category of ['unknown-category', 'jagdrecht']) {
    await h.renderPlan(packDailyReviewCatalog([{ id: 'lifecycle-one', category }]));
    assert.match(h.progress().textContent, /gerade nicht lesbar/);
    assert.equal(h.progress().querySelector('dl'), null); assert.deepEqual(links(h.progress()), []);
  }
  await h.renderPlan(catalogB);
  assert.deepEqual(totals(h), [['Beantwortet', 1], ['Fällig', 0], ['Zuletzt falsch', 0]]);
});

test('Old callbacks are inert before catalog cleanup, including returning to the same A catalog object', async t => {
  const h = await fixture(t); await h.renderProbe(catalogA);
  const capture = () => [
    ...['focus', 'jagdlatein-account-deleted'].flatMap(type => [...h.listeners.get(type)]),
    ...[...h.listeners.get('storage')].map(callback => () => callback({ key: REVIEW_STORAGE_KEY, storageArea: h.storage })),
    ...h.listeners.get('visibilitychange'), ...[...h.timers.values()].map(item => item.callback),
  ];
  const oldA = capture();
  const checkBeforeEffects = oldCallbacks => state => {
    assert.equal(state.phase, 'loading'); assert.equal(state.summary, null);
    assert.equal(document.querySelector('output').getAttribute('data-phase'), 'loading');
    const before = h.reads.length; oldCallbacks.forEach(callback => callback()); assert.equal(h.reads.length, before);
  };
  await h.renderProbe(catalogB, checkBeforeEffects(oldA));
  assert.equal(h.state().summary.total.available, 1);
  const oldB = capture();
  await h.renderProbe(catalogA, checkBeforeEffects([...oldA, ...oldB]));
  assert.equal(h.state().summary.total.available, 4);
  const before = h.reads.length;
  await h.act(() => [...oldA, ...oldB].forEach(callback => callback()));
  assert.equal(h.reads.length, before);
});

test('StrictMode keeps one live subscription/timer and all retained callbacks stop after unmount', async t => {
  const h = await fixture(t, { strict: true }); await h.renderProbe();
  for (const group of h.listeners.values()) assert.equal(group.size, 1);
  assert.equal(h.timers.size, 1);
  const callbacks = [...h.listeners.get('focus'), ...h.listeners.get('jagdlatein-account-deleted'), ...[...h.timers.values()].map(item => item.callback)];
  await h.unmount();
  for (const group of h.listeners.values()) assert.equal(group.size, 0);
  assert.equal(h.timers.size, 0);
  const before = h.reads.length;
  await h.act(() => { callbacks.forEach(callback => callback()); h.event('focus'); h.event('storage'); h.event('jagdlatein-account-deleted'); h.event('visibilitychange'); });
  assert.equal(h.reads.length, before);
});
