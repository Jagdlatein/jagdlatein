// Isolated signed cookies, pure catalog metadata and real ReactDOM mounts only.
// No real users, credentials, database, media permission or network are used.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const { NextRequest, NextResponse } = local('next/server');
const swc = local('next/dist/build/swc');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));

function accessHarness() {
  const cache = new Map(), requests = [];
  const context = vm.createContext({ process: { env: { JL_SESSION_SECRET: 'synthetic-web-course-access-secret-at-least-32bytes' } }, Buffer, crypto: webcrypto,
    TextEncoder, TextDecoder, atob, URL, AbortSignal, Date,
    fetch: async url => { requests.push(String(url)); throw new Error('Isolated network denial'); },
  });
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(id => {
      if (id === 'next/server') return { NextResponse };
      if (id === '../components/OnlineAcademy') return { __esModule: true, default: () => null };
      if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`));
      return local(id);
    }, module, module.exports);
    return module.exports;
  }
  const sessions = load('lib/account-session.js');
  const middleware = load('middleware.js').middleware;
  const page = load('pages/online-kurse.js');
  function request(route, token) { return new NextRequest(`https://jagdlatein.test${route}`, { headers: token ? { cookie: `jl_account_session=${token}` } : {} }); }
  return { sessions, requests, request,
    run: (route = '/online-kurse', token) => middleware(request(route, token)),
    async props(route = '/online-kurse', token) {
      const headers = {};
      const result = await page.getServerSideProps({ req: request(route, token), res: { setHeader(name, value) { headers[name.toLowerCase()] = value; } }, resolvedUrl: route });
      return { result, headers };
    },
  };
}

test('The exact online-course route hands signed identity to its server guard; unsigned and nested paths remain protected', async () => {
  const h = accessHarness();
  for (const route of ['/online-kurse', '/online-kurse?ansicht=live', '/online-kurse/private']) {
    const response = await h.run(route);
    assert.equal(response.status, 307, route);
    const destination = new URL(response.headers.get('location'));
    assert.equal(destination.pathname, '/preise'); assert.equal(destination.searchParams.get('next'), route);
  }
  const unpaid = h.sessions.createAccountSession('synthetic@example.invalid', Date.now(), { paid: false, admin: false });
  const exact = await h.run('/online-kurse?ansicht=live', unpaid);
  assert.equal(exact.headers.get('x-middleware-next'), '1');
  const nested = await h.run('/online-kurse/private', unpaid);
  assert.equal(new URL(nested.headers.get('location')).pathname, '/preise');
  assert.equal(h.requests.length, 0, 'The exact server-guarded route does not perform a duplicate permission refresh');
});

test('Page guard denies missing, forged, unpaid and stale identities before producing catalog props', async () => {
  const h = accessHarness();
  const unpaid = h.sessions.createAccountSession('synthetic@example.invalid', Date.now(), { paid: false, admin: false });
  const paid = h.sessions.createAccountSession('synthetic@example.invalid', Date.now(), { paid: true, admin: false });
  for (const token of [undefined, unpaid, paid.slice(0, -8) + 'forgedxx']) {
    const { result, headers } = await h.props('/online-kurse?ansicht=angebote', token);
    assert.equal(result.props, undefined); assert.ok(result.redirect);
    assert.equal(headers['cache-control'], 'private, no-store, max-age=0');
  }
  const stale = h.sessions.createAccountSession('synthetic@example.invalid', Date.now() - 3600000, { paid: true, admin: false });
  const { result } = await h.props('/online-kurse', stale);
  assert.equal(result.props, undefined); assert.equal(result.redirect.destination, '/konto?access=unavailable');
  assert.equal(h.requests.length, 0, 'No unconfigured database/network is contacted by these synthetic guards');
});

test('Authorized page props contain existing catalog metadata only, never question answers or private classroom room names', async () => {
  const h = accessHarness();
  const token = h.sessions.createAccountSession('synthetic@example.invalid', Date.now(), { paid: true, admin: false });
  const { result, headers } = await h.props('/online-kurse', token);
  assert.equal(result.redirect, undefined);
  assert.deepEqual(Object.keys(result.props), ['catalog']); assert.ok(result.props.catalog.length > 190);
  for (const item of result.props.catalog) {
    assert.deepEqual(Object.keys(item).sort(), ['categorySlug', 'categoryTitle', 'description', 'href', 'id', 'title', 'totalQuestions'].sort());
    assert.match(item.href, /^\/kurse\/[a-z0-9-]+$/);
    assert.ok(Number.isInteger(item.totalQuestions) && item.totalQuestions > 0);
  }
  assert.doesNotMatch(JSON.stringify(result.props), /"questions"|"answers"|"correct"|"paragraphs"|"room_name"|"roomName"|"email"/);
  assert.equal(headers['cache-control'], 'private, no-store, max-age=0'); assert.equal(h.requests.length, 0);
});

test('Browser-only menu entry is absent from SSR rather than flashing inside native apps', () => {
  const load = createLoader({ '@capacitor/core': { Capacitor: { isNativePlatform: () => true } }, 'next/link': ({ children, ...props }) => React.createElement('a', props, children) });
  const Entry = load('components/WebCoursePlatformEntry.js').default;
  assert.equal(renderToStaticMarkup(React.createElement(Entry)), '');
});

test('Actual lower navigation mounts one web-only link in a browser, highlights the platform and closes its one shared view', async () => {
  const saved = new Map();
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://jagdlatein.test/online-kurse?ansicht=live' });
  const { window } = dom; window.scrollTo = () => {};
  for (const [key,value] of Object.entries({ window, document: window.document, navigator: window.navigator,
    sessionStorage: window.sessionStorage, MutationObserver: window.MutationObserver, HTMLElement: window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  let mounted;
  try {
    for (const native of [false, true]) {
      const load = createLoader({
        '@capacitor/core': { Capacitor: { isNativePlatform: () => native } },
        'next/navigation': { usePathname: () => '/online-kurse' },
        'next/compat/router': { useRouter: () => ({ isReady: true, asPath: '/online-kurse?ansicht=live', push: async () => true }) },
        'next/link': ({ children, prefetch, scroll, ...props }) => React.createElement('a', { ...props, onClick(event) { props.onClick?.(event); event.preventDefault(); } }, children),
        './AppIcon': { __esModule: true, default: () => null }, './AppUpdateStatus': { __esModule: true, default: () => null },
      });
      const Dock = load('components/GlobalHomeButton.js').default;
      const { openPageMenu } = load('components/PageMenu.js');
      mounted = local('react-dom/client').createRoot(document.getElementById('root'));
      await React.act(async () => { mounted.render(React.createElement(React.StrictMode, null, React.createElement(Dock))); });
      assert.equal(document.querySelectorAll('a[href="/online-kurse"]').length, native ? 0 : 1);
      assert.equal(document.querySelector('a[aria-label="Zum Lernbereich"]').getAttribute('aria-current'), 'true');
      assert.equal(document.querySelectorAll('[data-navigation-view]').length, 1);
      if (!native) {
        const link = document.querySelector('a[href="/online-kurse"]');
        assert.equal(link.getAttribute('aria-current'), 'page');
        await React.act(async () => { openPageMenu(); });
        assert.equal(link.closest('details').open, true);
        await React.act(async () => { link.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true })); });
        assert.equal(link.closest('details').open, false);
      }
      await React.act(async () => { mounted.unmount(); }); mounted = null;
    }
  } finally {
    if (mounted) await React.act(async () => { mounted.unmount(); });
    window.close();
    for (const [key,value] of saved) { if (value) Object.defineProperty(globalThis,key,value); else delete globalThis[key]; }
  }
});
