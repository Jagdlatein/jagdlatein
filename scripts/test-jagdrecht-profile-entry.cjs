// Actual React/effects with isolated account-profile snapshots and deferred
// Next router results. No account API, customer data or real browser storage.
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react'), { renderToString } = local('react-dom/server');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));

async function fixture({ ready = true, profile = { country: 'CH', region: 'ZH' }, routerReady = true, href = '/jagdrecht', hydrate = false, throws = false } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: `https://jagdlatein.test${href}` });
  const saved = new Map(), calls = [], listeners = new Set(), actions = new Map(), layouts = [];
  let snapshot = { ready, profile }, failSynchronously = throws, mounted = true;
  const serverSnapshot = { ready: false, profile: null }, container = dom.window.document.getElementById('root');
  const router = { isReady: routerReady, asPath: href, query: {}, replace(target, as, options) {
    const call = { target, as, options }; calls.push(call);
    if (failSynchronously) throw new Error('Isolated router failure');
    return new Promise((resolve, reject) => { call.resolve = resolve; call.reject = reject; });
  } };
  function rawRoute(value) {
    const url = new URL(value, 'https://jagdlatein.test');
    router.asPath = `${url.pathname}${url.search}${url.hash}`; router.pathname = url.pathname;
    router.query = Object.fromEntries([...new Set(url.searchParams.keys())].map(key => {
      const values = url.searchParams.getAll(key); return [key, values.length > 1 ? values : values[0]];
    }));
    dom.window.history.replaceState(null, '', value);
  }
  rawRoute(href);
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
  const useProfile = () => {
    const value = React.useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);
    React.useLayoutEffect(() => { layouts.push(container.textContent); });
    return value;
  };
  const jsx = local('react/jsx-runtime'), capture = factory => (type, props, ...rest) => {
    if ((type === 'button' || type === Link) && typeof props?.onClick === 'function' && typeof props.children === 'string') actions.set(props.children, props.onClick);
    return factory(type, props, ...rest);
  };
  function Link({ href, children, prefetch, scroll, ...props }) { return React.createElement('a', { ...props, href }, children); }
  const load = createLoader({
    'react/jsx-runtime': { ...jsx, jsx: capture(jsx.jsx), jsxs: capture(jsx.jsxs) },
    'next/link': { __esModule: true, default: Link }, 'next/router': { useRouter: () => router },
    '../../lib/use-exam-profile': { __esModule: true, default: useProfile },
    '../../lib/learning-curriculum': { learningModules: [] },
    '../../components/AppIcon': { __esModule: true, default: () => null },
    '../../components/LearningDiscovery': { __esModule: true, default: () => null },
    '../../components/RegionalLawResume': { __esModule: true, default: () => null },
    '../../components/ExamProfileSummary': { __esModule: true, default: () => null },
    '../../components/PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', null, children) },
  });
  const Component = load('pages/jagdrecht/index.js').default, node = () => React.createElement(Component, { discoveryModules: [], regionCountries: [] });
  const { createRoot, hydrateRoot } = local('react-dom/client');
  let root, serverHtml = null;
  if (hydrate) { serverHtml = renderToString(node()); assert.equal(calls.length, 0); container.innerHTML = serverHtml;
    await React.act(async () => { root = hydrateRoot(container, node()); });
  } else { root = createRoot(container); await React.act(async () => root.render(node())); }
  return { container, window: dom.window, router, calls, layouts, serverHtml,
    text: () => container.textContent, action: label => actions.get(label), rawRoute,
    async profile(value, nextReady = true) { await React.act(async () => { snapshot = { ready: nextReady, profile: value }; [...listeners].forEach(fn => fn()); }); },
    async commit(value) { rawRoute(value); await React.act(async () => root.render(node())); },
    async routerReady(value) { router.isReady = value; await React.act(async () => root.render(node())); },
    async answer(index, value = true, error = null) { await React.act(async () => { if (error) calls[index].reject(error); else calls[index].resolve(value); }); },
    async invoke(handler, event = {}) { await React.act(async () => handler(event)); },
    throws(value) { failSynchronously = value; },
    async unmount() { if (!mounted) return; mounted = false; await React.act(async () => root.unmount()); },
    async dispose() { if (mounted) { mounted = false; await React.act(async () => root.unmount()); } dom.window.close();
      for (const [key, value] of saved) { if (value) Object.defineProperty(globalThis, key, value); else delete globalThis[key]; } },
  };
}

test('Actual SSR/hydration keeps the generic entry neutral before opening the exact hydrated account region', async () => {
  const f = await fixture({ hydrate: true });
  try {
    assert.match(f.serverHtml, /Prüfungsprofil wird geladen/); assert.doesNotMatch(f.serverHtml, /Deutsches Jagdrecht|Land wählen/);
    assert.equal(f.calls.length, 1); assert.equal(f.calls[0].target, '/jagdrecht/ch?region=ZH');
    assert.deepEqual(f.calls[0].options, { scroll: false });
    assert.equal(f.container.querySelectorAll('a').length, 0);
    assert.ok(f.layouts.every(text => !/Deutsches Jagdrecht|Land wählen/.test(text)), 'No transient foreign country picker');
  } finally { await f.dispose(); }
});

test('Profile and route readiness are separate; no country choice or default navigation leaks from an unready snapshot', async () => {
  const f = await fixture({ ready: false, routerReady: false });
  try {
    assert.equal(f.calls.length, 0); await f.routerReady(true); assert.equal(f.calls.length, 0);
    assert.equal(f.container.querySelectorAll('a').length, 0);
    await f.profile({ country: 'AT', region: 'NOE' }); assert.equal(f.calls[0].target, '/jagdrecht/at?region=NOE');
  } finally { await f.dispose(); }
});

test('Each country target uses only its exact region while an explicit other-country path never redirects', async () => {
  for (const [country, region, slug] of [['CH', 'TI', 'ch'], ['AT', 'W', 'at'], ['DE', 'BY', 'de']]) {
    const f = await fixture({ profile: { country, region } });
    try { assert.deepEqual(f.calls.map(x => x.target), [`/jagdrecht/${slug}?region=${region}`]); }
    finally { await f.dispose(); }
  }
  const f = await fixture({ href: '/jagdrecht/de?region=BY', profile: { country: 'CH', region: 'ZH' } });
  try { assert.equal(f.calls.length, 0); await f.profile({ country: 'AT', region: 'T' }); assert.equal(f.calls.length, 0); }
  finally { await f.dispose(); }
});

test('Accepted navigation stays pending until actual commit and never substitutes the picker or legal facts', async () => {
  const f = await fixture();
  try {
    await f.answer(0, true); assert.match(f.text(), /Recht für Zürich.*wird geöffnet/);
    assert.equal(f.container.querySelector('button'), null); assert.equal(f.container.querySelector('a'), null);
    await f.commit('/jagdrecht/ch?region=ZH'); assert.equal(f.calls.length, 1);
    assert.doesNotMatch(f.text(), /Deutsches Jagdrecht|Land wählen/);
  } finally { await f.dispose(); }
});

test('False, cancelled, rejected and synchronous failed navigation keep a clear safe retry and exact direct destination', async () => {
  for (const mode of ['false', 'cancel', 'error', 'throw']) {
    const f = await fixture({ throws: mode === 'throw' });
    try {
      if (mode !== 'throw') await f.answer(0, mode === 'false' ? false : undefined, mode === 'cancel' ? { cancelled: true } : mode === 'error' ? new Error('Isolated failure') : null);
      assert.match(f.text(), /konnte nicht geöffnet werden/);
      assert.equal(f.container.querySelector('a').getAttribute('href'), '/jagdrecht/ch?region=ZH');
      const retry = f.action('Erneut öffnen'); f.throws(false);
      await f.invoke(retry); await f.invoke(retry); assert.equal(f.calls.length, 2, 'Repeated retry while pending cannot duplicate navigation');
      assert.match(f.text(), /wird geöffnet/); assert.equal(f.container.querySelector('button'), null);
    } finally { await f.dispose(); }
  }
});

test('A profile A–B–A history invalidates old promises and retained retry/direct-link handlers', async () => {
  const f = await fixture();
  try {
    await f.answer(0, false); const retry = f.action('Erneut öffnen'), direct = f.action('Regionales Recht direkt öffnen');
    await f.profile({ country: 'AT', region: 'T' }); await f.profile({ country: 'CH', region: 'ZH' });
    assert.equal(f.calls.length, 3); await f.invoke(retry); assert.equal(f.calls.length, 3);
    let prevented = false; await f.invoke(direct, { preventDefault() { prevented = true; } }); assert.equal(prevented, true);
    await f.answer(1, false); assert.doesNotMatch(f.text(), /konnte nicht geöffnet werden/);
    await f.answer(2, true); assert.match(f.text(), /wird geöffnet/);
  } finally { await f.dispose(); }
});

test('Live raw query and window hash changes before React rerenders block stale actions and failed-promise writes', async () => {
  const f = await fixture();
  try {
    await f.answer(0, false); const retry = f.action('Erneut öffnen');
    f.rawRoute('/jagdrecht?vergleich=1'); await f.invoke(retry); assert.equal(f.calls.length, 1);
    await f.commit('/jagdrecht'); assert.equal(f.calls.length, 1, 'Same rendered origin does not retry implicitly');
    await f.invoke(retry); assert.equal(f.calls.length, 2);
    f.window.history.replaceState(null, '', '/jagdrecht#vergleich');
    await f.answer(1, false); assert.doesNotMatch(f.text(), /konnte nicht geöffnet werden/);
  } finally { await f.dispose(); }
});

test('Unmounted pending responses and retained callbacks cannot navigate or update the entry', async () => {
  const f = await fixture();
  try {
    await f.answer(0, false); const retry = f.action('Erneut öffnen'); await f.invoke(retry);
    await f.unmount(); await f.answer(1, false); await f.invoke(retry); assert.equal(f.calls.length, 2);
  } finally { await f.dispose(); }
});

test('Hash History A–B–A does not revive the first same-address navigation failure', async () => {
  const f = await fixture();
  try {
    await f.commit('/jagdrecht#vergleich'); await f.commit('/jagdrecht');
    assert.equal(f.calls.length, 3);
    await f.answer(0, false); await f.answer(1, undefined, { cancelled: true });
    assert.doesNotMatch(f.text(), /konnte nicht geöffnet werden/);
    await f.answer(2, true); assert.match(f.text(), /wird geöffnet/);
  } finally { await f.dispose(); }
});

test('Missing/invalid ready targets retain explicit country comparisons instead of inventing a default', async () => {
  for (const profile of [null, { country: 'CH', region: 'BY' }, { country: ['CH'], region: 'ZH' }]) {
    const f = await fixture({ profile });
    try {
      assert.equal(f.calls.length, 0);
      assert.deepEqual([...f.container.querySelectorAll('a')].filter(a => /^\/jagdrecht\/(de|ch|at)$/.test(a.getAttribute('href'))).map(a => a.getAttribute('href')), ['/jagdrecht/de', '/jagdrecht/ch', '/jagdrecht/at']);
    } finally { await f.dispose(); }
  }
});
