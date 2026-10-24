// Uses real React effects, portals and DOM mutation delivery. Supply jsdom via
// JAGDLATEIN_TEST_DOM (absolute module path) or install it in the test environment.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
let JSDOM;
try { ({ JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom')); }
catch (error) {
  throw new Error('This lifecycle regression needs jsdom. Set JAGDLATEIN_TEST_DOM to an installed jsdom module path; no repository dependency or browser is required.', { cause: error });
}
const React = local('react');

async function fixture(options = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="test-root"></div></body></html>', { url: 'https://jagdlatein.test/jagdrecht' });
  const { window } = dom;
  // jsdom has no visual viewport scrolling; category scrolling has its own
  // frame/lifecycle regression suite. Keep this real portal/effect test quiet.
  window.scrollTo = () => {};
  const saved = new Map();
  const activeObservers = new Set(), openings = [];
  const NativeObserver = window.MutationObserver;
  class ObservedMutationObserver extends NativeObserver {
    observe(...args) { activeObservers.add(this); return super.observe(...args); }
    disconnect() { activeObservers.delete(this); return super.disconnect(); }
  }
  const openProperty = Object.getOwnPropertyDescriptor(window.HTMLDetailsElement.prototype, 'open');
  Object.defineProperty(window.HTMLDetailsElement.prototype, 'open', {
    ...openProperty,
    set(value) { openings.push({ menu: this, value }); openProperty.set.call(this, value); },
  });
  for (const [key, value] of Object.entries({ window, document: window.document, navigator: window.navigator,
    HTMLElement: window.HTMLElement, MutationObserver: ObservedMutationObserver, sessionStorage: window.sessionStorage,
    IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(global, key));
    Object.defineProperty(global, key, { configurable: true, writable: true, value });
  }
  let pathname = options.pathname === undefined ? '/jagdrecht' : options.pathname;
  const router = { asPath: options.asPath || '/jagdrecht', isReady: options.ready !== false };
  let page = options.page !== false, epoch = 0;
  const load = createLoader({
    'next/navigation': { usePathname: () => pathname },
    'next/compat/router': { useRouter: () => options.appRouter ? null : router },
    'next/link': ({ children, href, prefetch, ...props }) => React.createElement('a', { ...props, href }, children),
    './AppIcon': { __esModule: true, default: () => null },
    '../../components/AppIcon': { __esModule: true, default: () => null },
    './AppUpdateStatus': { __esModule: true, default: () => null },
    '../../components/LearningDiscovery': { __esModule: true, default: () => null },
    '../../lib/learning-curriculum': { learningModules: [] },
    '../lib/learning-categories': { learningCategoryDetails: [] },
  });
  const { default: PageMenu, closePageMenu, PAGE_MENU_ROUTE_ATTRIBUTE } = load('components/PageMenu.js');
  const Home = load('pages/jagdrecht/index.js').default;
  const Dock = load('components/GlobalHomeButton.js').default;
  function View() {
    const content = page && (options.focus ? React.createElement(PageMenu, { key: epoch, openInitially: true, initialFocusId: 'region-input' },
      React.createElement('select', { id: 'region-input' }, React.createElement('option', null, 'Prüfungsregion'))) : React.createElement(Home, { key: epoch, discoveryModules: [], regionCountries: [] }));
    const shell = React.createElement(Dock, { key: 'shell' });
    return React.createElement(React.Fragment, null, ...(options.shellFirst ? [shell, content] : [content, shell]));
  }
  const { createRoot } = local('react-dom/client');
  const root = createRoot(window.document.getElementById('test-root'));
  let disposed = false;
  const render = async () => React.act(async () => {
    root.render(React.createElement(options.strict ? React.StrictMode : React.Fragment, null, React.createElement(View)));
    await Promise.resolve();
  });
  const f = {
    window, router, activeObservers, openings, render, closePageMenu, PAGE_MENU_ROUTE_ATTRIBUTE,
    get outlet() { return window.document.getElementById('jl-page-menu'); },
    get menu() { return this.outlet?.closest('details'); },
    get openingCount() { return openings.filter(record => record.value === true).length; },
    async update(next = {}) {
      if (Object.hasOwn(next, 'pathname')) pathname = next.pathname;
      if (Object.hasOwn(next, 'asPath')) router.asPath = next.asPath;
      if (Object.hasOwn(next, 'ready')) router.isReady = next.ready;
      if (Object.hasOwn(next, 'page')) page = next.page;
      if (next.remount) epoch++;
      if (next.url) window.history.replaceState(null, '', next.url);
      await render();
    },
    async dispose() {
      if (disposed) return;
      disposed = true;
      await React.act(async () => root.unmount());
      assert.equal(activeObservers.size, 0, 'Unmount disconnects all page menu observers');
      window.close();
      for (const [key, previous] of saved) {
        if (previous) Object.defineProperty(global, key, previous);
        else delete global[key];
      }
    },
  };
  await render();
  return f;
}

for (const shellFirst of [false, true]) test(`Law entry opens after real sibling effects (${shellFirst ? 'shell first' : 'page first'})`, async () => {
  const f = await fixture({ shellFirst });
  try {
    assert.equal(f.menu.open, true);
    assert.equal(f.openingCount, 1);
    assert.match(f.outlet.textContent, /Jagdrecht – Land wählen/);
    for (const country of ['de', 'ch', 'at']) assert.ok(f.outlet.querySelector(`a[href="/jagdrecht/${country}"]`));
    assert.equal(f.window.document.activeElement.id, 'jagdrecht-land-de', 'The first country is visible and keyboard-ready inside the opened lower menu');
    assert.equal(f.window.document.querySelectorAll('nav[aria-label="Seitennavigation"]').length, 1);
    assert.equal(f.window.document.querySelector('main').querySelectorAll('a[href^="/jagdrecht/"]').length, 0, 'Country choices stay in the shared lower menu');
    assert.equal(f.activeObservers.size, 0, 'A successful opening needs no permanent observer');
  } finally { await f.dispose(); }
});

test('An outlet mounted after the page is discovered and opens with its committed country controls', async () => {
  const f = await fixture({ pathname: null, ready: false });
  try {
    assert.equal(f.outlet, null);
    assert.equal(f.activeObservers.size, 1);
    await f.update({ pathname: '/jagdrecht', ready: true });
    assert.equal(f.menu.open, true);
    assert.ok(f.outlet.querySelector('a[href="/jagdrecht/ch"]'));
    assert.equal(f.openingCount, 1);
    assert.equal(f.activeObservers.size, 0);
  } finally { await f.dispose(); }
});

for (const first of ['pathname', 'asPath']) test(`A delayed ${first} update cannot make the shell dismiss the initial country menu`, async () => {
  const f = await fixture({ pathname: '/lernen', asPath: '/lernen', page: false });
  try {
    await f.update({ page: true });
    // Mount the destination page before either routing view catches up, as can
    // happen during a client transition. Both update orders must be safe.
    await f.update({ url: '/jagdrecht?eingang=menue', remount: true });
    assert.equal(f.menu.open, false);
    assert.equal(f.openingCount, 0);
    const target = { pathname: '/jagdrecht', asPath: '/jagdrecht?eingang=menue' };
    await f.update({ [first]: target[first] });
    assert.equal(f.menu.open, false, 'One ready routing view must not mark the whole route ready');
    assert.equal(f.openingCount, 0);
    const second = first === 'pathname' ? 'asPath' : 'pathname';
    await f.update({ [second]: target[second] });
    assert.equal(f.menu.open, true);
    assert.equal(f.openingCount, 1);
    assert.equal(f.outlet.getAttribute(f.PAGE_MENU_ROUTE_ATTRIBUTE), '/jagdrecht?eingang=menue');
  } finally { await f.dispose(); }
});

test('The pages router must be ready before the initial menu opens; fragments do not become readiness addresses', async () => {
  const f = await fixture({ ready: false, asPath: '/jagdrecht#auswahl' });
  try {
    assert.equal(f.menu.open, false);
    assert.equal(f.openingCount, 0);
    await f.update({ ready: true, url: '/jagdrecht#auswahl' });
    assert.equal(f.menu.open, true);
    assert.equal(f.openingCount, 1);
    assert.equal(f.outlet.getAttribute(f.PAGE_MENU_ROUTE_ATTRIBUTE), '/jagdrecht');
  } finally { await f.dispose(); }
});

test('App Router entry uses its ready pathname with the current query', async () => {
  const f = await fixture({ appRouter: true, pathname: null });
  try {
    await f.update({ pathname: '/jagdrecht', url: '/jagdrecht?eingang=app' });
    assert.equal(f.menu.open, true);
    assert.equal(f.outlet.getAttribute(f.PAGE_MENU_ROUTE_ATTRIBUTE), '/jagdrecht?eingang=app');
  } finally { await f.dispose(); }
});

test('User dismissal and content, route-query, readiness or fragment updates never reopen an already consumed initial request', async () => {
  const f = await fixture();
  try {
    f.window.document.body.dispatchEvent(new f.window.Event('pointerdown', { bubbles: true }));
    assert.equal(f.menu.open, false);
    await f.render();
    await f.update({ ready: false });
    await f.update({ ready: true });
    await f.update({ url: '/jagdrecht?thema=quellen', asPath: '/jagdrecht?thema=quellen' });
    await f.update({ url: '/jagdrecht?thema=quellen#grundlagen', asPath: '/jagdrecht?thema=quellen#grundlagen' });
    assert.equal(f.menu.open, false);
    assert.equal(f.openingCount, 1);
  } finally { await f.dispose(); }
});

test('Focused portal controls exist when the initial opening is delivered, and an explicit close stays closed', async () => {
  const f = await fixture({ focus: true });
  try {
    assert.equal(f.menu.open, true);
    assert.equal(f.window.document.activeElement.id, 'region-input');
    assert.equal(f.closePageMenu(), true);
    await f.render();
    assert.equal(f.menu.open, false);
    assert.equal(f.openingCount, 1);
  } finally { await f.dispose(); }
});

test('Strict Mode effect replay still consumes one initial opening', async () => {
  const f = await fixture({ strict: true, pathname: null, ready: false });
  try {
    await f.update({ pathname: '/jagdrecht', ready: true });
    assert.equal(f.menu.open, true);
    assert.equal(f.openingCount, 1);
  } finally { await f.dispose(); }
});

for (const missingOutlet of [false, true]) test(`Unmount cancels a pending ${missingOutlet ? 'outlet discovery' : 'route-ready opening'}`, async () => {
  const f = await fixture({ ready: false, pathname: missingOutlet ? null : '/jagdrecht' });
  assert.equal(f.activeObservers.size, 1);
  assert.equal(f.openingCount, 0);
  await f.dispose();
  assert.equal(f.openingCount, 0);
});
