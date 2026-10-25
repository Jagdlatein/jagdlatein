const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const { detectWebCoursePlatform: detect, readWebCoursePlatform: read } = createLoader()('lib/web-course-platform.js');
const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const ipad = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

test('Only an available client may classify; explicit native runtimes win over browser UA or standalone mode', () => {
  assert.equal(detect({ available: false }), 'checking');
  for (const options of [{ capacitorNative: true }, { cordova: true }, { capacitorNative: true, standalone: true, userAgent: iphone + ' Safari/604.1' }])
    assert.equal(detect(options), 'native');
  assert.equal(detect({ userAgent: 'Mozilla/5.0 Chrome/140 Safari/537.36' }), 'browser');
  assert.equal(detect({ userAgent: 'Mozilla/5.0 Firefox/140' }), 'browser');
  assert.equal(detect({ userAgent: 'Mozilla/5.0 Edg/140' }), 'browser');
});

test('Existing iOS bridge and older WKWebView are native without hiding Safari or iOS third-party browsers', () => {
  assert.equal(detect({ userAgent: iphone }), 'native');
  assert.equal(detect({ userAgent: ipad, platform: 'MacIntel', maxTouchPoints: 5 }), 'native');
  assert.equal(detect({ userAgent: iphone + ' Version/18.0 Safari/604.1', photoCapture: true }), 'native');
  for (const suffix of [' Version/18.0 Safari/604.1', ' CriOS/140.0 Mobile/15E148', ' FxiOS/143.0 Mobile/15E148', ' EdgiOS/140.0', ' OPiOS/10.0', ' DuckDuckGo/7.0', ' GSA/340.0'])
    assert.equal(detect({ userAgent: iphone + suffix }), 'browser', suffix);
  assert.equal(detect({ userAgent: ipad + ' Version/18.0 Safari/605.1.15', platform: 'MacIntel', maxTouchPoints: 5 }), 'browser');
  assert.equal(detect({ userAgent: ipad, platform: 'MacIntel', maxTouchPoints: 0 }), 'browser', 'Ordinary desktop WebKit is not iPad');
});

test('Installed web apps and Android browser are supported, Android WebView is not the web-only course platform', () => {
  assert.equal(detect({ userAgent: iphone, standalone: true }), 'browser');
  assert.equal(detect({ userAgent: ipad, platform: 'MacIntel', maxTouchPoints: 5, standalone: true }), 'browser');
  assert.equal(detect({ userAgent: 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36' }), 'browser');
  assert.equal(detect({ userAgent: 'Mozilla/5.0 (Linux; Android 15; Build/ABCD; wv) AppleWebKit/537.36 Version/4.0 Chrome/140 Mobile Safari/537.36' }), 'native');
  assert.equal(detect({ userAgent: 'JagdlateinApp AppleWebKit/605.1.15' }), 'native');
});

test('Reader uses only local runtime signals and tolerates unsupported matchMedia/Capacitor checks', () => {
  assert.equal(read(), 'checking');
  assert.equal(read({ browserWindow: {}, browserNavigator: { userAgent: iphone, standalone: true }, capacitor: { isNativePlatform() { throw new Error('Unavailable'); } } }), 'browser');
  assert.equal(read({ browserWindow: { matchMedia: () => ({ matches: true }) }, browserNavigator: { userAgent: iphone } }), 'browser');
  assert.equal(read({ browserWindow: { matchMedia() { throw new Error('Unavailable'); } }, browserNavigator: { userAgent: iphone } }), 'native');
  assert.equal(read({ browserWindow: { cordova: {} }, browserNavigator: {} }), 'native');
});

test('SSR never flashes the browser-only platform before hydration', () => {
  const usePlatform = createLoader({ '@capacitor/core': { Capacitor: { isNativePlatform: () => false } } })('hooks/useWebCoursePlatform.js').default;
  function View() { const state = usePlatform(); return React.createElement('div', { 'data-platform': state }, state === 'browser' ? 'Onlinekurse' : 'Wird geprüft'); }
  const html = renderToStaticMarkup(React.createElement(View));
  assert.match(html, /data-platform="checking"/); assert.ok(!html.includes('Onlinekurse'));
});

test('Actual mounted hook confirms browser/native after hydration and StrictMode cleanup never flashes the wrong view', async () => {
  const previous = Object.fromEntries(['window', 'document', 'navigator', 'IS_REACT_ACT_ENVIRONMENT'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://jagdlatein.test/online-kurse' });
  let mountedRoot;
  try {
    for (const [key,value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true }))
      Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    const { createRoot } = local('react-dom/client');
    for (const native of [false, true]) {
      const states = [];
      const usePlatform = createLoader({ '@capacitor/core': { Capacitor: { isNativePlatform: () => native } } })('hooks/useWebCoursePlatform.js').default;
      function View() { const state = usePlatform(); states.push(state); return React.createElement('div', { 'data-platform': state }, state === 'browser' ? 'Onlinekurse' : 'Browser erforderlich'); }
      mountedRoot = createRoot(document.getElementById('root'));
      await React.act(async () => { mountedRoot.render(React.createElement(React.StrictMode, null, React.createElement(View))); });
      assert.equal(document.querySelector('[data-platform]').getAttribute('data-platform'), native ? 'native' : 'browser');
      assert.ok(!states.includes(native ? 'browser' : 'native')); assert.ok(states.includes('checking'));
      await React.act(async () => { mountedRoot.unmount(); }); mountedRoot = null;
      assert.equal(document.getElementById('root').children.length, 0);
    }
  } finally {
    if (mountedRoot) await React.act(async () => { mountedRoot.unmount(); });
    dom.window.close();
    for (const [key,descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
});
