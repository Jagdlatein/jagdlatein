// Actual product modules with isolated React lifetimes, router and storage.
// No account is signed in, no browser store is read, no real request is sent.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const EXAM_KEY = 'jl_exam_profile_v1', LEGAL_KEY = 'jl_legal_region_v1';
const load = createLoader();
const { QUESTIONS } = load('data/questions-full.js');
const quizScope = load('lib/quiz-learning-scope.js');
const quizOptions = quizScope.quizLearningOptions(QUESTIONS);

function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join('');
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
function nodes(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => nodes(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
}
function fixture(t, { component = 'components/RegionalLawLearning.js', props, query = {}, country = 'CH', ready = true, values = {}, hydrate = true } = {}) {
  const previousWindow = global.window, previousFetch = global.fetch;
  const storage = new Map(Object.entries(values)), writes = [], removes = [], fetches = [], pushes = [], replacements = [], storageListeners = new Set();
  const slots = [], queued = [];
  let cursor = 0, dirty = false, tree, disposed = false, currentProps = props;
  const browserStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem(key, value) { writes.push([key, value]); storage.set(key, value); },
    removeItem(key) { removes.push(key); storage.delete(key); },
  };
  const target = { localStorage: browserStorage, location: { hash: '' }, setTimeout, clearTimeout,
    addEventListener(name, listener) { if (name === 'storage') storageListeners.add(listener); },
    removeEventListener(name, listener) { if (name === 'storage') storageListeners.delete(listener); },
  };
  global.window = target;
  global.fetch = (url, options) => new Promise(resolve => { fetches.push({ url, options, resolve }); });
  const router = { isReady: ready, query, pathname: `/jagdrecht/${country.toLowerCase()}`, asPath: '',
    replace(href, _as, options) { replacements.push({ href, options }); return Promise.resolve(true); },
    push(href, _as, options) { pushes.push({ href, options }); return Promise.resolve(true); },
  };
  function path() {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(router.query)) for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
    router.asPath = `${router.pathname}${params.size ? `?${params}` : ''}`;
  }
  path();
  const hooks = { ...React,
    useState(initial) {
      const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, next => { assert.equal(disposed, false, 'No state write after unmount'); const value = typeof next === 'function' ? next(slots[i].value) : next; dirty ||= !Object.is(value, slots[i].value); slots[i].value = value; }];
    },
    useRef(initial) { const i = cursor++; slots[i] ||= { current: initial }; return slots[i]; },
    useEffect(callback, dependencies) {
      const i = cursor++, previous = slots[i];
      if (!previous || !dependencies || dependencies.some((value, index) => !Object.is(value, previous.dependencies?.[index]))) {
        slots[i] = { dependencies, cleanup: previous?.cleanup };
        queued.push(() => { slots[i].cleanup?.(); slots[i].cleanup = callback(); });
      }
    },
    useSyncExternalStore(subscribe, getSnapshot) {
      hooks.useEffect(() => subscribe(() => { assert.equal(disposed, false, 'Store never notifies an unmounted consumer'); dirty = true; }), [subscribe]);
      return getSnapshot();
    },
  };
  const Link = ({ href, children, shallow, scroll, prefetch, ...attributes }) => React.createElement('a', { href, ...attributes }, children);
  const PageMenu = ({ children }) => React.createElement('aside', {}, children);
  const product = createLoader({ react: hooks, 'next/router': { useRouter: () => router }, 'next/link': { __esModule: true, default: Link },
    './Seo': { __esModule: true, default: () => null }, './AppIcon': { __esModule: true, default: () => null },
    './ExamProfileSummary': { __esModule: true, default: () => null },
    './PageMenu': { __esModule: true, default: PageMenu, closePageMenu() {}, openPageMenu() {}, resetPageMenuPosition() {} },
    '../hooks/useSelectionPageStart': { __esModule: true, default: () => ({ focusSelection() {}, cancelSelectionFocus() {} }) },
  });
  const Component = product(component).default;
  if (!currentProps) currentProps = component.endsWith('QuizSetup.js')
    ? { ...quizOptions, initialCountry: 'DE', initialTopic: 'Recht' }
    : component.endsWith('RegionalLawLearning.js') ? {
      country, name: country === 'CH' ? 'Schweiz' : 'Deutschland', regionLabel: country === 'CH' ? 'Kanton' : 'Bundesland',
      regions: country === 'CH' ? [{ code: 'ZH', name: 'Zürich' }, { code: 'SG', name: 'St. Gallen' }, { code: 'BUND', name: 'Bundesrecht' }]
        : [{ code: 'BY', name: 'Bayern' }, { code: 'NW', name: 'Nordrhein-Westfalen' }, { code: 'BUND', name: 'Bundesrecht' }],
    } : {};
  function render() { cursor = 0; dirty = false; tree = Component(currentProps); return tree; }
  function flush() {
    let count = 0;
    do { render(); queued.splice(0).forEach(callback => callback()); assert.ok(++count < 20, 'Finite stable hydration'); } while (dirty);
    return tree;
  }
  function close() { if (disposed) return; for (const slot of slots) slot?.cleanup?.(); disposed = true; global.window = previousWindow; global.fetch = previousFetch; }
  t.after(close);
  if (hydrate) flush(); else render();
  return { storage, writes, removes, fetches, pushes, replacements, router, product, flush, close,
    get tree() { return tree; }, get storageListeners() { return storageListeners.size; },
    html: () => renderToStaticMarkup(tree),
    commit(nextQuery, { isReady = true, pathname = router.pathname } = {}) { router.query = nextQuery; router.isReady = isReady; router.pathname = pathname; path(); flush(); },
    props(next) { currentProps = { ...currentProps, ...next }; flush(); },
    click(label) { const button = nodes(tree, node => node.type === 'button' && text(node).includes(label))[0]; assert.ok(button, label); button.props.onClick(); flush(); },
    chooseTopic(value) { nodes(tree, node => node.type === 'select' && node.props.id === 'quiz-topic')[0].props.onChange({ target: { value } }); flush(); },
    profile(profile) { if (profile) storage.set(EXAM_KEY, JSON.stringify(profile)); else storage.delete(EXAM_KEY); for (const listener of storageListeners) listener({ key: EXAM_KEY, storageArea: browserStorage }); flush(); },
  };
}

test('Quiz server entry preserves explicit presence even for empty, invalid and repeated country parameters', async () => {
  const Page = createLoader()('app/quiz-app/page.jsx').default;
  for (const [country, expected] of [['AT', 'AT'], ['ch', 'CH'], ['', 'DE'], ['XX', 'DE'], [['AT', 'CH'], 'DE'], [null, 'DE']]) {
    const element = await Page({ searchParams: Promise.resolve({ topic: 'Recht', country }) });
    assert.equal(element.props.countryExplicit, true);
    assert.equal(element.props.initialCountry, expected);
    assert.equal(element.props.initialTopic, 'Recht');
  }
  const absent = await Page({ searchParams: { topic: 'Recht' } });
  assert.equal(absent.props.countryExplicit, false); assert.equal(absent.props.initialCountry, 'DE');
});

test('Law restoration waits for actual router and profile hydration, then uses only a matching explicit exam target', t => {
  const s = fixture(t, { ready: false, hydrate: false, values: { [EXAM_KEY]: JSON.stringify({ country: 'CH', region: 'SG' }), [LEGAL_KEY]: JSON.stringify({ country: 'CH', region: 'ZH' }) } });
  assert.equal(s.replacements.length, 0); assert.equal(s.fetches.length, 0);
  s.flush(); assert.equal(s.replacements.length, 0); assert.equal(s.fetches.length, 0);
  s.commit({});
  assert.deepEqual(s.replacements.map(item => item.href), ['/jagdrecht/ch?region=SG']);
  assert.equal(s.fetches.length, 0, 'A proposed restore does not display or request uncommitted facts');
  s.commit({ region: 'SG' });
  assert.equal(s.fetches.length, 1); assert.equal(s.fetches[0].url, '/api/jagdrecht/region?land=CH&region=SG&bund=1');
  assert.equal(s.fetches[0].options.credentials, 'same-origin'); assert.equal(s.fetches[0].options.cache, 'no-store');
});

test('Explicit legal URL selection, including invalid and repeated values, always wins over stored profiles and legacy browsing', t => {
  for (const region of ['ZH', '', 'BY', ['ZH', 'SG']]) {
    const s = fixture(t, { query: { region }, values: { [EXAM_KEY]: JSON.stringify({ country: 'CH', region: 'SG' }), [LEGAL_KEY]: JSON.stringify({ country: 'CH', region: 'SG' }) } });
    assert.equal(s.replacements.length, 0);
    assert.equal(s.fetches.length, region === 'ZH' ? 1 : 0);
    if (region !== 'ZH') assert.match(s.html(), /Diese Region ist nicht verfügbar/);
    assert.deepEqual(JSON.parse(s.storage.get(EXAM_KEY)), { country: 'CH', region: 'SG' });
    assert.ok(s.writes.every(([key]) => key === LEGAL_KEY));
    s.close();
  }
});

test('An explicit country path is never replaced by a different-country exam profile or its legacy region', t => {
  const s = fixture(t, { country: 'DE', values: { [EXAM_KEY]: JSON.stringify({ country: 'CH', region: 'SG' }), [LEGAL_KEY]: JSON.stringify({ country: 'DE', region: 'BY' }) } });
  assert.deepEqual(s.replacements, []); assert.deepEqual(s.fetches, []);
  assert.match(s.html(), /Jagdrecht Deutschland/);
  assert.deepEqual(JSON.parse(s.storage.get(EXAM_KEY)), { country: 'CH', region: 'SG' });
});

test('Legacy last-viewed region restores only without a valid exam target, and later profile changes do not retarget an active reader', t => {
  const s = fixture(t, { values: { [EXAM_KEY]: JSON.stringify({ country: 'CH', region: 'BY' }), [LEGAL_KEY]: JSON.stringify({ country: 'CH', region: 'ZH' }) } });
  assert.deepEqual(s.replacements.map(item => item.href), ['/jagdrecht/ch?region=ZH']);
  s.commit({ region: 'ZH' });
  s.profile({ country: 'CH', region: 'SG' });
  assert.equal(s.replacements.length, 1); assert.equal(s.fetches.length, 1);
  assert.match(s.html(), /Jagdrecht · Zürich/);
  assert.deepEqual(JSON.parse(s.storage.get(EXAM_KEY)), { country: 'CH', region: 'SG' });
});

test('Manual legal reading changes only last-viewed preference; personal target, drafts and ranking country remain intact', t => {
  const saved = { [EXAM_KEY]: JSON.stringify({ country: 'CH', region: 'SG' }), [LEGAL_KEY]: JSON.stringify({ country: 'CH', region: 'SG' }), jagd_country: 'AT', journal: 'Isolated private draft', account: 'Isolated account projection' };
  const s = fixture(t, { query: { region: 'SG' }, values: saved });
  s.click('Kanton'); s.click('Zürich');
  assert.deepEqual(s.pushes.map(item => item.href), ['/jagdrecht/ch?region=ZH']);
  assert.deepEqual(JSON.parse(s.storage.get(LEGAL_KEY)), { country: 'CH', region: 'SG' }, 'Pending reading changes are not committed preferences');
  s.commit({ region: 'ZH' });
  assert.deepEqual(JSON.parse(s.storage.get(LEGAL_KEY)), { country: 'CH', region: 'ZH' });
  for (const key of [EXAM_KEY, 'jagd_country', 'journal', 'account']) assert.equal(s.storage.get(key), saved[key], key);
  assert.ok(s.writes.every(([key]) => key === LEGAL_KEY));
  assert.deepEqual(s.removes, []);
  assert.ok(s.fetches.every(request => request.url.startsWith('/api/jagdrecht/region?') && !request.options.method));
});

test('Implicit law quiz waits for hydration, takes profile country and exposes a separate regional exercise destination', t => {
  const s = fixture(t, { component: 'components/QuizSetup.js', hydrate: false, values: { [EXAM_KEY]: JSON.stringify({ country: 'AT', region: 'T' }), jagd_country: 'CH' } });
  assert.match(s.html(), /Prüfungsprofil wird geladen/); assert.doesNotMatch(s.html(), /Quiz starten/);
  s.flush();
  assert.match(s.html(), /href="\/quiz-app\/run\?country=AT&amp;topic=Recht"/);
  assert.match(s.html(), /href="\/jagdrecht\/at\?region=T&amp;ansicht=uebung"/);
  assert.match(s.html(), /keine Prüfungssimulation für einen bestimmten Kanton oder ein Bundesland/);
  assert.deepEqual(s.writes, []); assert.deepEqual(s.removes, []); assert.deepEqual(s.fetches, []);
  assert.equal(s.storage.get('jagd_country'), 'CH');
});

test('Explicit quiz URL country wins, manual country choice survives profile changes, and common knowledge remains country-free', t => {
  const s = fixture(t, { component: 'components/QuizSetup.js', props: { ...quizOptions, initialCountry: 'DE', initialTopic: 'Recht', countryExplicit: true }, values: { [EXAM_KEY]: JSON.stringify({ country: 'AT', region: 'T' }) } });
  assert.match(s.html(), /href="\/quiz-app\/run\?country=DE&amp;topic=Recht"/);
  assert.doesNotMatch(s.html(), /Recht für Tirol üben/);
  s.click('Schweiz'); s.profile({ country: 'AT', region: 'W' });
  assert.match(s.html(), /href="\/quiz-app\/run\?country=CH&amp;topic=Recht"/);
  s.chooseTopic('Wildkunde');
  assert.match(s.html(), /href="\/quiz-app\/run\?topic=Wildkunde"/); assert.doesNotMatch(s.html(), /Recht für .* üben/);
  const ids = options => quizScope.quizLearningPool(QUESTIONS, options).map(question => question.id);
  assert.deepEqual(ids({ country: 'DE', topic: 'Wildkunde' }), ids({ country: 'AT', topic: 'Wildkunde' }));
  assert.deepEqual(ids({ country: 'DE', topic: 'Recht', region: 'BY' }), ids({ country: 'DE', topic: 'Recht', region: 'NW' }));
  assert.deepEqual(s.writes, []); assert.deepEqual(s.fetches, []);
});

test('Summary displays the exact hydrated target without changing host URL, ranking, drafts or account data', t => {
  const s = fixture(t, { component: 'components/ExamProfileSummary.js', hydrate: false, query: { region: 'ZH', artikel: 'synthetic' }, values: { [EXAM_KEY]: JSON.stringify({ country: 'DE', region: 'BY' }), jagd_country: 'AT', journal: 'Isolated draft', account: 'Isolated account' } });
  assert.match(s.html(), /Dein Prüfungsplan/); assert.doesNotMatch(s.html(), /Prüfungsziel: Bayern/);
  s.flush(); assert.match(s.html(), /Prüfungsziel: Bayern · Deutschland/);
  assert.match(s.html(), /href="\/jagdrecht\/de\?region=BY"/); assert.match(s.html(), /href="\/lernen\/pruefungsplan"/);
  assert.deepEqual(s.router.query, { region: 'ZH', artikel: 'synthetic' });
  assert.deepEqual(s.pushes, []); assert.deepEqual(s.replacements, []); assert.deepEqual(s.fetches, []); assert.deepEqual(s.writes, []);
  assert.equal(s.storage.get('jagd_country'), 'AT'); assert.equal(s.storage.get('journal'), 'Isolated draft'); assert.equal(s.storage.get('account'), 'Isolated account');
  assert.equal(s.storageListeners, 1); s.close(); assert.equal(s.storageListeners, 0);
});

test('Profile destinations retain the real regional API paid-access gate before any dataset is consulted', async () => {
  let lookups = 0;
  const denied = createLoader({
    '../../../../lib/account-access': { requirePaidAccount: async () => { throw Object.assign(new Error('Access denied'), { status: 401 }); } },
    '../../../../lib/regional-law-data': { getLegalDataset: () => { lookups++; throw new Error('No lookup before access'); } },
  })('app/api/jagdrecht/region/route.js');
  const response = await denied.GET(new Request('https://example.invalid/api/jagdrecht/region?land=CH&region=SG&bund=1'));
  assert.equal(response.status, 401); assert.equal(lookups, 0);
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  assert.equal(response.headers.get('vary'), 'Cookie');
});

async function domFixture(t, values = {}) {
  const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', { url: 'https://example.invalid/quiz-app' });
  for (const [key, value] of Object.entries(values)) dom.window.localStorage.setItem(key, value);
  const savedGlobals = new Map(), writes = [], removes = [], requests = [], listeners = new Set(), roots = [];
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement,
    MutationObserver: dom.window.MutationObserver, IS_REACT_ACT_ENVIRONMENT: true,
    fetch: (...args) => { requests.push(args); throw new Error('This profile integration must not send network requests'); } })) {
    savedGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const originalSet = dom.window.Storage.prototype.setItem, originalRemove = dom.window.Storage.prototype.removeItem;
  dom.window.Storage.prototype.setItem = function (key, value) { writes.push([key, value]); return originalSet.call(this, key, value); };
  dom.window.Storage.prototype.removeItem = function (key) { removes.push(key); return originalRemove.call(this, key); };
  const add = dom.window.addEventListener.bind(dom.window), remove = dom.window.removeEventListener.bind(dom.window);
  dom.window.addEventListener = (name, listener, options) => { if (name === 'storage') listeners.add(listener); add(name, listener, options); };
  dom.window.removeEventListener = (name, listener, options) => { if (name === 'storage') listeners.delete(listener); remove(name, listener, options); };
  const Link = ({ href, children, shallow, scroll, prefetch, ...attributes }) => React.createElement('a', { href, ...attributes }, children);
  const product = createLoader({
    'next/link': { __esModule: true, default: Link },
    './AppIcon': { __esModule: true, default: () => null },
    './LearningToolLayout': { __esModule: true, default: ({ title, children }) => React.createElement('main', {}, React.createElement('h1', {}, title), children) },
    './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', {}, children), closePageMenu() {}, openPageMenu() {} },
    '../hooks/useSelectionPageStart': { __esModule: true, default: () => ({ focusSelection() {}, cancelSelectionFocus() {} }) },
  });
  const { createRoot, hydrateRoot } = local('react-dom/client');
  const container = dom.window.document.getElementById('app');
  t.after(async () => {
    try {
      await React.act(async () => { for (const root of roots) root.unmount(); });
      assert.equal(listeners.size, 0, 'The final actual React unmount removes the shared storage listener');
    } finally {
      dom.window.close();
      for (const [key, descriptor] of savedGlobals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
    }
  });
  return { dom, product, container, writes, removes, requests, get listeners() { return listeners.size; },
    async mount(element) { const root = createRoot(container); roots.push(root); await React.act(async () => root.render(element)); return root; },
    async hydrate(element) {
      container.innerHTML = local('react-dom/server').renderToString(element);
      const recoveries = [];
      await React.act(async () => { roots.push(hydrateRoot(container, element, { onRecoverableError: error => recoveries.push(error) })); });
      return recoveries;
    },
    async external(profile) {
      const newValue = profile ? JSON.stringify(profile) : null;
      await React.act(async () => {
        if (newValue) dom.window.localStorage.setItem(EXAM_KEY, newValue); else dom.window.localStorage.removeItem(EXAM_KEY);
        dom.window.dispatchEvent(new dom.window.StorageEvent('storage', { key: EXAM_KEY, newValue, storageArea: dom.window.localStorage }));
      });
    },
    async click(label) { const button = [...container.querySelectorAll('button')].find(button => button.textContent.includes(label)); assert.ok(button, label); await React.act(async () => button.click()); },
    async select(id, value) { const select = container.querySelector(`#${id}`); assert.ok(select, id); await React.act(async () => { select.value = value; select.dispatchEvent(new dom.window.Event('change', { bubbles: true })); }); },
  };
}

test('Real React hydration shares the actual profile store between quiz and summary, and preserves a later manual quiz choice', async t => {
  const seeded = { [EXAM_KEY]: JSON.stringify({ country: 'AT', region: 'T' }), jagd_country: 'CH', journal: 'Isolated draft', account: 'Isolated account' };
  const s = await domFixture(t, seeded);
  const Quiz = s.product('components/QuizSetup.js').default;
  const element = React.createElement(Quiz, { ...quizOptions, initialCountry: 'DE', initialTopic: 'Recht' });
  const recoveries = await s.hydrate(element);
  const start = () => [...s.container.querySelectorAll('a')].find(link => link.textContent.startsWith('Quiz starten'));
  assert.deepEqual(recoveries, [], 'SSR and hydration agree without a replacement render');
  assert.equal(start().getAttribute('href'), '/quiz-app/run?country=AT&topic=Recht');
  assert.match(s.container.textContent, /Prüfungsziel: Tirol · Österreich/);
  assert.equal(s.listeners, 1, 'Quiz and nested summary share one storage listener');
  await s.external({ country: 'CH', region: 'ZH' });
  assert.equal(start().getAttribute('href'), '/quiz-app/run?country=CH&topic=Recht');
  assert.match(s.container.textContent, /Prüfungsziel: Zürich · Schweiz/);
  await s.click('Deutschland');
  await s.external({ country: 'AT', region: 'W' });
  assert.equal(start().getAttribute('href'), '/quiz-app/run?country=DE&topic=Recht');
  assert.match(s.container.textContent, /Prüfungsziel: Wien · Österreich/);
  for (const key of ['jagd_country', 'journal', 'account']) assert.equal(s.dom.window.localStorage.getItem(key), seeded[key]);
  assert.ok(s.writes.every(([key]) => key === EXAM_KEY), 'Only simulated cross-tab exam changes wrote storage');
  assert.deepEqual(s.removes, []); assert.deepEqual(s.requests, []);
});

test('Actual server element keys remount the real quiz on a new explicit URL context while retaining choices for the same context', async t => {
  const s = await domFixture(t, { [EXAM_KEY]: JSON.stringify({ country: 'CH', region: 'SG' }) });
  const Page = s.product('app/quiz-app/page.jsx').default;
  const first = await Page({ searchParams: { country: 'DE', topic: 'Recht' } });
  const same = await Page({ searchParams: { country: 'DE', topic: 'Recht' } });
  const next = await Page({ searchParams: { country: 'AT', topic: 'Recht' } });
  assert.equal(first.key, same.key); assert.notEqual(first.key, next.key);
  const root = await s.mount(first);
  const start = () => [...s.container.querySelectorAll('a')].find(link => link.textContent.startsWith('Quiz starten')).getAttribute('href');
  assert.equal(start(), '/quiz-app/run?country=DE&topic=Recht');
  await s.click('Schweiz'); assert.equal(start(), '/quiz-app/run?country=CH&topic=Recht');
  await React.act(async () => root.render(same)); assert.equal(start(), '/quiz-app/run?country=CH&topic=Recht');
  await React.act(async () => root.render(next)); assert.equal(start(), '/quiz-app/run?country=AT&topic=Recht');
  for (const country of ['', 'XX', ['AT', 'CH']]) {
    const invalid = await Page({ searchParams: { country, topic: 'Recht' } });
    await React.act(async () => root.render(invalid));
    assert.equal(start(), '/quiz-app/run?country=DE&topic=Recht', 'An explicitly invalid URL keeps its documented server fallback instead of adopting the CH profile');
  }
  assert.deepEqual(s.writes, []); assert.deepEqual(s.requests, []);
});

test('Real plan and summary preserve an unsaved draft through external profile changes and synchronize only an explicit save', async t => {
  const seeded = { [EXAM_KEY]: JSON.stringify({ country: 'CH', region: 'SG' }), [LEGAL_KEY]: JSON.stringify({ country: 'CH', region: 'ZH' }), jagd_country: 'AT', journal: 'Isolated draft' };
  const s = await domFixture(t, seeded);
  const Plan = s.product('components/ExamStudyPlan.js').default, Summary = s.product('components/ExamProfileSummary.js').default;
  const data = s.product('lib/exam-study-plan-server.js').getExamStudyPlanData({ asOf: '2026-10-29' });
  await s.mount(React.createElement(React.Fragment, {}, React.createElement(Plan, { data }), React.createElement(Summary)));
  assert.match(s.container.querySelector('[aria-label="Dein Prüfungsziel"]').textContent, /St\. Gallen · Schweiz/);
  await s.select('exam-plan-country', 'DE'); await s.select('exam-plan-region', 'BY');
  assert.equal(s.dom.window.localStorage.getItem(EXAM_KEY), seeded[EXAM_KEY]); assert.deepEqual(s.writes, []);
  await s.external({ country: 'AT', region: 'W' });
  assert.equal(s.container.querySelector('#exam-plan-country').value, 'DE');
  assert.equal(s.container.querySelector('#exam-plan-region').value, 'BY');
  assert.match(s.container.querySelector('[aria-label="Dein Prüfungsziel"]').textContent, /Wien · Österreich/);
  await React.act(async () => s.container.querySelector('form').dispatchEvent(new s.dom.window.Event('submit', { bubbles: true, cancelable: true })));
  assert.deepEqual(JSON.parse(s.dom.window.localStorage.getItem(EXAM_KEY)), { country: 'DE', region: 'BY' });
  assert.match(s.container.querySelector('[aria-label="Dein Prüfungsziel"]').textContent, /Bayern · Deutschland/);
  assert.match(s.container.querySelector('#exam-plan-target').textContent, /Bayern · Deutschland/);
  assert.ok(s.writes.every(([key]) => key === EXAM_KEY));
  for (const key of [LEGAL_KEY, 'jagd_country', 'journal']) assert.equal(s.dom.window.localStorage.getItem(key), seeded[key]);
  assert.deepEqual(s.requests, []); assert.deepEqual(s.removes, []); assert.equal(s.listeners, 1);
});
