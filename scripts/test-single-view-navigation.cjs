// Real DOM/effect/portal regressions. jsdom does not measure a visual viewport.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const React = local('react');
const load = createLoader();
const { installSingleViewNavigation, setSingleMenuOpen } = load('lib/single-view-navigation.js');
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
function snapshot(element) {
  return { inert: element.getAttribute('inert'), hidden: element.getAttribute('aria-hidden'), opacity: element.style.getPropertyValue('opacity'), priority: element.style.getPropertyPriority('opacity') };
}
function fixture() {
  const dom = new JSDOM(`<!doctype html><html><body style="overflow:scroll!important">
    <header id="outer-header">Kopf</header><div id="app"><main id="reading" aria-hidden="false" style="opacity:.75!important"><h1 id="heading" tabindex="-1">Gesetzestext</h1><button id="outside">Außen</button></main>
    <div id="shell"><aside id="near" inert="previous" aria-hidden="true" style="opacity:.3">Vorhanden verborgen</aside>
      <nav id="dock" aria-label="Seitennavigation"><button id="back">Zurück</button><a href="/lernen">Lernen</a>
      <details id="menu"><summary aria-label="Menü öffnen">Menü</summary><div id="panel" data-navigation-view>
        <div id="jl-page-menu"><input id="field" aria-label="Region" /></div>
        <details id="category"><summary id="category-summary">Kategorien</summary><a id="closed-link" href="/lernen/wildkunde">Verborgenes Ziel</a></details>
        <button disabled>Gesperrt</button><button hidden>Versteckt</button><a id="last" href="/konto">Konto</a>
      </div></details></nav>
    </div></div><aside id="outer-note">Fuß</aside><script id="script">/* untouched */</script>
  </body></html>`, { url: 'https://jagdlatein.test/jagdrecht/ch?region=ZH' });
  const { window } = dom; const { document } = window;
  document.documentElement.style.setProperty('overflow', 'auto');
  const nav = document.getElementById('dock'), menu = document.getElementById('menu'), panel = document.getElementById('panel');
  const outlet = document.getElementById('jl-page-menu');
  let cleanup = installSingleViewNavigation(nav, menu);
  return { dom, window, document, nav, menu, panel, outlet,
    id: value => document.getElementById(value),
    open: () => setSingleMenuOpen(menu, true), close: () => setSingleMenuOpen(menu, false),
    reinstall() { cleanup(); cleanup = installSingleViewNavigation(nav, menu); },
    cleanup() { cleanup(); }, dispose() { cleanup(); window.close(); },
  };
}
function press(f, target, key, shiftKey = false) {
  const event = new f.window.KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
  target.dispatchEvent(event); return event;
}

test('One open shared view hides only the outside page, preserves the dock and restores exact inherited state on close', () => {
  const f = fixture();
  try {
    const outside = ['reading', 'near', 'outer-header', 'outer-note'].map(f.id);
    const before = outside.map(snapshot);
    f.open();
    for (const element of outside) {
      assert.equal(element.getAttribute('inert'), ''); assert.equal(element.getAttribute('aria-hidden'), 'true');
      assert.equal(element.style.opacity, '0');
    }
    for (const id of ['app', 'shell', 'dock', 'menu', 'panel', 'jl-page-menu']) assert.equal(f.id(id).hasAttribute('inert'), false, id);
    assert.equal(f.document.body.style.overflow, 'hidden'); assert.equal(f.document.documentElement.style.overflow, 'hidden');
    assert.equal(f.id('menu').querySelector('summary').getAttribute('aria-label'), 'Menü schließen');
    assert.equal(f.document.querySelectorAll('[data-single-menu-view]').length, 1);
    assert.equal(f.document.querySelectorAll('[role="dialog"]').length, 0);
    assert.equal(f.id('script').hasAttribute('inert'), false);
    assert.equal(f.id('jl-page-menu'), f.outlet, 'The portal destination is never cloned or moved');
    f.close();
    assert.deepEqual(outside.map(snapshot), before);
    assert.equal(f.document.body.style.overflow, 'scroll'); assert.equal(f.document.body.style.getPropertyPriority('overflow'), 'important');
    assert.equal(f.document.documentElement.style.overflow, 'auto');
    assert.equal(f.id('menu').querySelector('summary').getAttribute('aria-label'), 'Menü öffnen');
    assert.equal(f.document.querySelectorAll('[data-single-menu-view]').length, 0);
  } finally { f.dispose(); }
});

test('Native details opening is observed and a newly mounted outside page cannot appear as a second view', async () => {
  const f = fixture();
  try {
    f.menu.open = true; await settle();
    assert.equal(f.id('reading').getAttribute('aria-hidden'), 'true');
    const fresh = f.document.createElement('main'); fresh.id = 'replacement'; fresh.innerHTML = '<h1>Andere Ansicht</h1>';
    f.id('app').prepend(fresh); await settle();
    assert.equal(fresh.getAttribute('inert'), ''); assert.equal(fresh.style.opacity, '0');
    assert.equal(f.id('jl-page-menu'), f.outlet);
    f.menu.open = false; await settle();
    assert.equal(fresh.hasAttribute('inert'), false); assert.equal(fresh.style.opacity, '');
  } finally { f.dispose(); }
});

test('Unmount and effect cleanup/setup replay release all masks and reacquire the open view without corrupting original values', async () => {
  const f = fixture();
  try {
    const before = snapshot(f.id('reading'));
    f.open(); f.reinstall();
    assert.equal(f.menu.open, true); assert.equal(f.id('reading').style.opacity, '0');
    f.cleanup(); assert.deepEqual(snapshot(f.id('reading')), before);
    assert.equal(f.document.body.style.overflow, 'scroll');
    f.menu.open = false; f.menu.dispatchEvent(new f.window.Event('toggle'));
    f.menu.open = true; f.menu.dispatchEvent(new f.window.Event('toggle')); await settle();
    assert.deepEqual(snapshot(f.id('reading')), before, 'Disposed native handlers and observers cannot hide the page again');
  } finally { f.dispose(); }
});

test('Closing preserves later external attribute/style updates rather than replacing them with stale snapshots', () => {
  const f = fixture();
  try {
    f.open(); const main = f.id('reading');
    main.setAttribute('aria-hidden', 'false'); main.setAttribute('inert', 'changed-by-owner'); main.style.setProperty('opacity', '.6');
    f.document.body.style.setProperty('overflow', 'clip');
    f.close();
    assert.equal(main.getAttribute('aria-hidden'), 'false'); assert.equal(main.getAttribute('inert'), 'changed-by-owner');
    assert.equal(main.style.opacity, '0.6'); assert.equal(main.style.getPropertyPriority('opacity'), '');
    assert.equal(f.document.body.style.overflow, 'clip');
  } finally { f.dispose(); }
});

test('A later owner writing the same CSS value with a different priority keeps that new state after close', () => {
  const f = fixture();
  try {
    f.open();
    f.id('reading').style.setProperty('opacity', '0');
    f.document.body.style.setProperty('overflow', 'hidden');
    f.close();
    assert.equal(f.id('reading').style.opacity, '0');
    assert.equal(f.id('reading').style.getPropertyPriority('opacity'), '');
    assert.equal(f.document.body.style.overflow, 'hidden');
    assert.equal(f.document.body.style.getPropertyPriority('overflow'), '');
  } finally { f.dispose(); }
});

test('Tab wraps through the visible dock and current menu only, excluding closed disclosure links and disabled/hidden controls', () => {
  const f = fixture();
  try {
    f.open(); f.id('last').focus();
    assert.equal(press(f, f.id('last'), 'Tab').defaultPrevented, true);
    assert.equal(f.document.activeElement.id, 'back');
    assert.equal(press(f, f.id('back'), 'Tab', true).defaultPrevented, true);
    assert.equal(f.document.activeElement.id, 'last');
    f.id('field').focus();
    assert.equal(press(f, f.id('field'), 'Tab').defaultPrevented, false, 'Ordinary internal movement remains native');
    f.id('outside').focus();
    assert.equal(press(f, f.id('outside'), 'Tab').defaultPrevented, true);
    assert.equal(f.document.activeElement.id, 'back');
  } finally { f.dispose(); }
});

test('An inherited disabled fieldset never becomes the keyboard wrap target', () => {
  const f = fixture();
  try {
    const fieldset = f.document.createElement('fieldset'); fieldset.disabled = true; fieldset.innerHTML = '<button id="inherited-disabled">Nicht erreichbar</button>';
    f.panel.append(fieldset); f.open(); f.id('back').focus();
    assert.equal(press(f, f.id('back'), 'Tab', true).defaultPrevented, true);
    assert.equal(f.document.activeElement.id, 'last', 'The last actual reachable control is the account link');
  } finally { f.dispose(); }
});

test('CSS-hidden controls and controls below a hidden ancestor never become the keyboard wrap target', () => {
  for (const mode of ['self', 'ancestor', 'visibility']) {
    const f = fixture();
    try {
      const wrapper = f.document.createElement('div'), hidden = f.document.createElement('button');
      hidden.id = 'css-hidden'; hidden.textContent = 'Nicht sichtbar'; wrapper.append(hidden);
      if (mode === 'self') hidden.style.display = 'none';
      if (mode === 'ancestor') wrapper.style.display = 'none';
      if (mode === 'visibility') wrapper.style.visibility = 'hidden';
      f.panel.append(wrapper); f.open(); f.id('back').focus();
      assert.equal(press(f, f.id('back'), 'Tab', true).defaultPrevented, true);
      assert.equal(f.document.activeElement.id, 'last', mode);
    } finally { f.dispose(); }
  }
});

test('Escape from either selection or dock closes one view and returns focus to its existing menu control', () => {
  const f = fixture();
  try {
    for (const id of ['field', 'back']) {
      f.open(); f.id(id).focus(); const event = press(f, f.id(id), 'Escape');
      assert.equal(event.defaultPrevented, true); assert.equal(f.menu.open, false);
      assert.equal(f.id('reading').getAttribute('aria-hidden'), 'false');
      assert.equal(f.document.activeElement, f.menu.querySelector('summary'));
    }
    const event = press(f, f.id('back'), 'Escape'); assert.equal(event.defaultPrevented, false);
  } finally { f.dispose(); }
});

test('Printing closes the menu and restores the readable document without reopening it afterwards', () => {
  const f = fixture();
  try {
    f.open(); f.id('field').focus(); f.window.dispatchEvent(new f.window.Event('beforeprint'));
    assert.equal(f.menu.open, false); assert.equal(f.id('reading').hasAttribute('inert'), false);
    assert.equal(f.id('reading').style.opacity, '0.75'); assert.equal(f.document.body.style.overflow, 'scroll');
    assert.equal(f.document.activeElement, f.menu.querySelector('summary'));
    f.window.dispatchEvent(new f.window.Event('afterprint')); assert.equal(f.menu.open, false);
  } finally { f.dispose(); }
});

test('Only an actual menu reopening resets the single scrolling panel; still-open view updates preserve its position', async () => {
  const f = fixture();
  try {
    f.open(); f.panel.scrollTop = 380;
    const local = f.document.createElement('p'); local.textContent = 'Neue lokale Auswahl'; f.outlet.append(local); await settle();
    assert.equal(f.panel.scrollTop, 380);
    f.window.history.replaceState(null, '', '/jagdrecht/ch?region=BE');
    f.outlet.append(f.document.createTextNode('Neue Region')); await settle();
    assert.equal(f.panel.scrollTop, 380, 'URL changes alone cannot scroll an active view; the shell owns committed close/reopen transitions');
    f.close(); f.open();
    assert.equal(f.panel.scrollTop, 0);
    f.panel.scrollTop = 240; f.menu.dispatchEvent(new f.window.Event('toggle'));
    assert.equal(f.panel.scrollTop, 240);
  } finally { f.dispose(); }
});

test('Typing a search URL update inside the still-open menu does not jump its scrolling view to the top', async () => {
  const f = fixture();
  try {
    f.open(); f.id('field').focus(); f.panel.scrollTop = 380;
    f.window.history.replaceState(null, '', '/jagdrecht/ch?region=ZH&q=Jagd');
    f.outlet.append(f.document.createTextNode('Gefilterte Treffer')); await settle();
    assert.equal(f.panel.scrollTop, 380, 'Keeping a focused live search open must also preserve its reading position');
    assert.equal(f.document.activeElement.id, 'field');
  } finally { f.dispose(); }
});

async function reactFixture(strict = false) {
  const dom = new JSDOM('<!doctype html><html><body><div id="mount"></div></body></html>', { url: 'https://jagdlatein.test/jagdrecht/ch?region=ZH' });
  const { window } = dom; const saved = new Map(); const observers = new Set();
  window.scrollTo = () => {};
  const NativeObserver = window.MutationObserver;
  window.MutationObserver = class extends NativeObserver {
    observe(...args) { observers.add(this); return super.observe(...args); }
    disconnect() { observers.delete(this); return super.disconnect(); }
  };
  for (const [key, value] of Object.entries({ window, document: window.document, navigator: window.navigator,
    HTMLElement: window.HTMLElement, MutationObserver: window.MutationObserver, sessionStorage: window.sessionStorage, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(global, key)); Object.defineProperty(global, key, { configurable: true, writable: true, value });
  }
  const loader = createLoader({
    'next/navigation': { usePathname: () => '/jagdrecht/ch' },
    'next/compat/router': { useRouter: () => ({ isReady: true, asPath: '/jagdrecht/ch?region=ZH', push: async () => true }) },
    'next/link': ({ children, href, prefetch, scroll, ...props }) => React.createElement('a', { ...props, href }),
    './AppIcon': { __esModule: true, default: () => null }, './AppUpdateStatus': { __esModule: true, default: () => null },
  });
  const { default: Dock } = loader('components/GlobalHomeButton.js');
  const { default: PageMenu, openPageMenu, closePageMenu } = loader('components/PageMenu.js');
  const root = local('react-dom/client').createRoot(window.document.getElementById('mount'));
  const View = () => React.createElement(React.Fragment, null,
    React.createElement('main', { id: 'reading' }, React.createElement('h1', { id: 'reading-heading', tabIndex: -1 }, 'Gewählter Rechtsinhalt'),
      React.createElement(PageMenu, { title: 'Aktuelle Auswahl', openInitially: true, initialFocusId: 'region-choice' },
        React.createElement('button', { id: 'region-choice' }, 'Zürich'))), React.createElement(Dock));
  await React.act(async () => { root.render(React.createElement(strict ? React.StrictMode : React.Fragment, null, React.createElement(View))); await settle(); });
  return { window, document: window.document, observers, openPageMenu, closePageMenu,
    get menu() { return window.document.getElementById('jl-page-menu').closest('details'); },
    async dispose() { await React.act(async () => root.unmount()); assert.equal(observers.size, 0); window.close();
      for (const [key, previous] of saved) { if (previous) Object.defineProperty(global, key, previous); else delete global[key]; }
    },
  };
}

for (const strict of [false, true]) test(`The actual React shell and PageMenu keep one outlet and synchronous content focus${strict ? ' under StrictMode replay' : ''}`, async () => {
  const f = await reactFixture(strict);
  try {
    const main = f.document.getElementById('reading'), outlet = f.document.getElementById('jl-page-menu');
    assert.equal(f.menu.open, true); assert.equal(main.getAttribute('inert'), '');
    assert.equal(f.document.activeElement.id, 'region-choice');
    assert.equal(f.document.querySelectorAll('#jl-page-menu').length, 1);
    assert.equal(f.document.querySelectorAll('[data-navigation-view]').length, 1);
    assert.equal(f.document.querySelectorAll('[role="dialog"]').length, 0);
    let focusObserved = false; const heading = f.document.getElementById('reading-heading');
    const actualFocus = heading.focus.bind(heading);
    heading.focus = options => { focusObserved = true; assert.equal(main.hasAttribute('inert'), false, 'The page must be released before a following caller focuses its content'); assert.notEqual(main.style.opacity, '0'); actualFocus(options); };
    assert.equal(f.closePageMenu(), true); heading.focus({ preventScroll: true });
    assert.equal(focusObserved, true); assert.equal(f.document.activeElement, heading);
    assert.equal(f.menu.open, false); assert.equal(f.document.body.style.overflow, '');
    assert.equal(f.document.getElementById('jl-page-menu'), outlet);
    assert.equal(f.openPageMenu('region-choice'), true);
    assert.equal(main.getAttribute('inert'), ''); assert.equal(f.document.activeElement.id, 'region-choice');
  } finally { await f.dispose(); }
});
