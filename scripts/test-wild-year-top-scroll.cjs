const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const swc = local('next/dist/build/swc');
const baseline = '477c10e9f64a23d1dadf3663158ef53f62be9708';
const actualLoad = createLoader();
const actualPageMenu = actualLoad('components/PageMenu.js');
const { installSingleViewNavigation, setSingleMenuOpen } = actualLoad('lib/single-view-navigation.js');
const { getCategoryNavigationKey } = actualLoad('lib/category-navigation.js');
const address = query => '/lernen/wildjahr?' + new URLSearchParams(query) + '#wildjahr-current';
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

// Real shared-menu helpers and real DOM focus are combined with an isolated
// component hook lifetime. jsdom has no physical viewport: scroll calls are
// recorded, never described as a phone or browser visual measurement.
function fixture(t, { old = false, query = { art: 'rehwild', monat: '6' } } = {}) {
  const dom = new JSDOM(`<!doctype html><html><body><div id="app"><main id="reading"><h1 id="page-title">Wildjahr</h1><div id="${old ? 'model-start' : 'wildjahr-top'}" tabindex="-1"><div id="slider-before-heading"></div><h2 id="wildjahr-current" tabindex="-1"></h2></div></main><nav id="dock"><details id="menu"><summary id="summary">Menü</summary><div data-navigation-view><div id="jl-page-menu"></div></div></details></nav></div></body></html>`, { url: 'https://jagdlatein.test' + address(query) });
  const { window } = dom, document = window.document;
  const h = { dom, window, document, query, slots: [], cleanups: [], effects: [], tree: null, requests: [], scrolls: [], focuses: [], anchorScrolls: [], frames: new Map(), retainedFrames: new Map(), cancelled: [], nextFrame: 0 };
  const menu = document.getElementById('menu'), reading = document.getElementById('reading');
  const originalFocus = window.HTMLElement.prototype.focus;
  window.HTMLElement.prototype.focus = function(options) {
    h.focuses.push({ target: this.id || this.tagName, options, menuOpen: menu.open, inert: reading.hasAttribute('inert') });
    return originalFocus.call(this, options);
  };
  document.getElementById('wildjahr-current').scrollIntoView = options => h.anchorScrolls.push({ target: 'wildjahr-current', options, menuOpen: menu.open, inert: reading.hasAttribute('inert') });
  if (!old) document.getElementById('wildjahr-top').scrollIntoView = () => { throw new Error('The new top target must use absolute window scrolling'); };
  window.scrollTo = options => h.scrolls.push({ options, active: document.activeElement?.id, menuOpen: menu.open, inert: reading.hasAttribute('inert') });
  window.requestAnimationFrame = callback => { const id = ++h.nextFrame; h.frames.set(id, callback); h.retainedFrames.set(id, callback); return id; };
  window.cancelAnimationFrame = id => { h.cancelled.push(id); h.frames.delete(id); };
  function globals(action) {
    const previous = ['window', 'document'].map(key => [key, Object.getOwnPropertyDescriptor(global, key)]);
    Object.defineProperty(global, 'window', { configurable: true, value: window });
    Object.defineProperty(global, 'document', { configurable: true, value: document });
    try { return action(); }
    finally { for (const [key, descriptor] of previous) if (descriptor) Object.defineProperty(global, key, descriptor); else delete global[key]; }
  }
  h.router = { isReady: true, query: { ...query }, asPath: address(query), push(href, as, options) {
    const request = { href, as, options }; h.requests.push(request);
    return new Promise((resolve, reject) => Object.assign(request, { resolve, reject }));
  } };
  let cursor = 0, changed = false;
  const hooks = { ...React,
    useRef(initial) { const i = cursor++; return h.slots[i] ||= { current: initial }; },
    useState(initial) { const i = cursor++; h.slots[i] ||= { value: typeof initial === 'function' ? initial() : initial }; return [h.slots[i].value, update => { const next = typeof update === 'function' ? update(h.slots[i].value) : update; changed ||= !Object.is(next, h.slots[i].value); h.slots[i].value = next; }]; },
    useEffect(effect, deps) { const i = cursor++, previous = h.slots[i]; if (!previous || deps.some((value, index) => !Object.is(value, previous.deps[index]))) { h.slots[i] = { deps }; h.effects.push(() => { h.cleanups[i]?.(); h.cleanups[i] = effect(); }); } },
  };
  function PageMenu({ children }) { return children; }
  const overrides = {
    react: hooks, 'next/router': { useRouter: () => h.router },
    'next/link': { __esModule: true, default: ({ href, children }) => React.createElement('a', { href }, children) },
    'next/image': { __esModule: true, default: () => null },
    './LearningToolLayout': { __esModule: true, default: ({ children }) => children },
    './LearningPhoto': { LearningPhotoCredit: () => null },
    './PageMenu': { ...actualPageMenu, __esModule: true, default: PageMenu },
  };
  const cache = new Map();
  function pinned(relative) {
    relative = relative.replaceAll('\\', '/');
    if (cache.has(relative)) return cache.get(relative).exports;
    const source = execFileSync('git', ['show', `${baseline}:${relative}`], { cwd: root, encoding: 'utf8' });
    if (relative.endsWith('.json')) return JSON.parse(source);
    const module = { exports: {} }; cache.set(relative, module);
    const { code } = swc.transformSync(source, { filename: relative, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => Object.hasOwn(overrides, id) ? overrides[id]
      : id.endsWith('.module.css') ? { __esModule: true, default: {} }
      : id.startsWith('.') ? pinned(path.posix.normalize(path.posix.join(path.posix.dirname(relative), path.posix.extname(id) ? id : id + '.js'))) : local(id), module, module.exports);
    return module.exports;
  }
  const Component = (old ? pinned : createLoader(overrides))('components/WildYear.js').default;
  const cleanupMenu = installSingleViewNavigation(document.getElementById('dock'), menu);
  h.render = () => globals(() => {
    for (let pass = 0; pass < 10; pass++) {
      cursor = 0; changed = false; h.tree = Component({ currentMonth: 10, initialSelection: { slug: query.art, month: Number(query.monat) } });
      const focusNode = nodes(h.tree, node => node.props?.id === (old ? 'wildjahr-current' : 'wildjahr-top'))[0];
      if (focusNode?.props.ref) focusNode.props.ref.current = document.getElementById(old ? 'wildjahr-current' : 'wildjahr-top');
      const heading = nodes(h.tree, node => node.props?.id === 'wildjahr-current')[0];
      document.getElementById('wildjahr-current').textContent = text(heading);
      const contribution = nodes(h.tree, node => node.type?.name === 'PageMenu')[0];
      if (!document.getElementById('jl-page-menu').hasChildNodes()) document.getElementById('jl-page-menu').innerHTML = renderToStaticMarkup(React.createElement(React.Fragment, null, contribution.props.children));
      const effects = h.effects; h.effects = []; effects.forEach(effect => effect());
      if (!changed) return;
    }
    throw new Error('Scroll fixture did not settle');
  });
  h.pickerTree = () => { const child = nodes(h.tree, node => node.type?.name === 'WildYearSpeciesPicker')[0]; return child?.type(child.props); };
  h.choose = slug => globals(() => {
    const child = h.pickerTree();
    if (child) { const button = nodes(child, node => node.props?.['data-wildjahr-species'] === slug)[0]; document.querySelector(`[data-wildjahr-species="${slug}"]`)?.focus(); return button.props.onClick(); }
    document.getElementById('wildjahr-species').focus(); return nodes(h.tree, node => node.type === 'select' && node.props.id === 'wildjahr-species')[0].props.onChange({ target: { value: slug } });
  });
  h.range = month => globals(() => nodes(h.tree, node => node.props?.id === 'wildjahr-month')[0].props.onChange({ target: { value: String(month) } }));
  h.open = () => globals(() => setSingleMenuOpen(menu, true));
  h.navigate = (next, hash = 'wildjahr-current') => { h.router.query = next; h.router.asPath = '/lernen/wildjahr?' + new URLSearchParams(next) + '#' + hash; window.history.replaceState(null, '', h.router.asPath); h.render(); };
  h.commit = async (request, action) => { h.navigate(request.href.query, request.href.hash); request.resolve(true); await action; h.render(); };
  h.flushFrames = () => { for (const [id, callback] of [...h.frames]) { h.frames.delete(id); globals(() => callback(0)); } };
  h.fireRetained = id => globals(() => h.retainedFrames.get(id)(0));
  h.clear = () => { h.scrolls.length = 0; h.focuses.length = 0; h.anchorScrolls.length = 0; h.cancelled.length = 0; };
  h.dispose = () => globals(() => { h.cleanups.splice(0).forEach(cleanup => cleanup?.()); cleanupMenu(); window.close(); });
  h.render(); h.flushFrames(); h.clear(); t.after(h.dispose); return h;
}

test('Published baseline reproduces a lower content-anchor jump, without falsely attributing a scroll-restoration race to the shared menu', async t => {
  const h = fixture(t, { old: true }); h.open();
  const action = h.choose('fuchs'); h.clear();
  assert.equal(h.requests[0].href.hash, 'wildjahr-current');
  await h.commit(h.requests[0], action);
  assert.deepEqual(h.anchorScrolls, [{ target: 'wildjahr-current', options: { block: 'start', behavior: 'auto' }, menuOpen: false, inert: false }]);
  assert.equal(h.scrolls.length, 0);
  const heading = h.document.getElementById('wildjahr-current');
  assert.ok(h.document.getElementById('page-title').compareDocumentPosition(heading) & h.window.Node.DOCUMENT_POSITION_FOLLOWING);
  assert.ok(h.document.getElementById('slider-before-heading').compareDocumentPosition(heading) & h.window.Node.DOCUMENT_POSITION_FOLLOWING);
  const focusCount = h.focuses.length; await settle();
  assert.equal(h.focuses.length, focusCount, 'Deferred menu sync does not later move content focus back to the dock');
  assert.equal(h.document.activeElement, heading);
  assert.equal(getCategoryNavigationKey('/lernen/wildjahr?art=fuchs&monat=6'), null);
});

test('Actual shared-menu release precedes page-start focus and absolute top scrolling; the committed URL targets the top', async t => {
  const h = fixture(t); h.open();
  const action = h.choose('fuchs'); h.clear();
  assert.equal(h.scrolls.length, 0); assert.equal(h.requests[0].href.hash, 'wildjahr-top');
  await h.commit(h.requests[0], action);
  assert.equal(h.anchorScrolls.length, 0);
  const focused = h.focuses.find(call => call.target === 'wildjahr-top');
  assert.deepEqual(focused, { target: 'wildjahr-top', options: { preventScroll: true }, menuOpen: false, inert: false });
  assert.deepEqual(h.scrolls, [{ options: { left: 0, top: 0, behavior: 'instant' }, active: 'wildjahr-top', menuOpen: false, inert: false }]);
  assert.equal(h.frames.size, 1); h.flushFrames(); assert.equal(h.scrolls.length, 2);
  await settle(); assert.equal(h.document.activeElement.id, 'wildjahr-top'); assert.equal(h.scrolls.length, 2);
  assert.ok(h.document.getElementById('wildjahr-top').compareDocumentPosition(h.document.getElementById('slider-before-heading')) & h.window.Node.DOCUMENT_POSITION_FOLLOWING);
});

test('A retained older frame cannot clear or scroll a newer focus frame, including its later unmount cancellation', async t => {
  const h = fixture(t);
  const first = h.choose('fuchs'); await h.commit(h.requests[0], first);
  const oldFrame = [...h.frames.keys()][0];
  const second = h.choose('rotwild'); await h.commit(h.requests[1], second);
  const newerFrame = [...h.frames.keys()][0], before = h.scrolls.length;
  assert.notEqual(oldFrame, newerFrame); assert.ok(h.cancelled.includes(oldFrame));
  h.fireRetained(oldFrame); assert.equal(h.scrolls.length, before); assert.ok(h.frames.has(newerFrame));
  h.dispose(); assert.ok(h.cancelled.includes(newerFrame)); assert.equal(h.frames.size, 0);
  h.fireRetained(newerFrame); assert.equal(h.scrolls.length, before);
});

test('A range interaction cancels a pending top correction and retains its own focus and mount on commit', async t => {
  const h = fixture(t);
  const selected = h.choose('fuchs'); await h.commit(h.requests[0], selected);
  const oldFrame = [...h.frames.keys()][0]; h.clear();
  const range = nodes(h.tree, node => node.props?.id === 'wildjahr-month')[0];
  const action = h.range(7); assert.ok(h.cancelled.includes(oldFrame));
  h.fireRetained(oldFrame); assert.equal(h.scrolls.length, 0);
  await h.commit(h.requests[1], action);
  assert.equal(h.scrolls.length, 0); assert.equal(h.frames.size, 0);
  assert.equal(h.focuses.filter(call => call.target === 'wildjahr-top').length, 0);
  const nextRange = nodes(h.tree, node => node.props?.id === 'wildjahr-month')[0];
  assert.equal(nextRange.type, range.type); assert.equal(nextRange.key, range.key); assert.equal(nextRange.props.value, 7);
});

test('Failed selection and departed or unmounted callbacks cannot create top corrections or use an obsolete species button', async t => {
  const h = fixture(t), child = h.pickerTree();
  const stale = nodes(child, node => node.props?.['data-wildjahr-species'] === 'rotwild')[0].props.onClick;
  const action = h.choose('fuchs'); h.requests[0].reject(new Error('offline')); await action; h.render();
  assert.equal(h.scrolls.length, 0); assert.equal(h.frames.size, 0);
  h.navigate({ art: 'gamswild', monat: '9' }); h.flushFrames(); h.clear();
  stale(); assert.equal(h.requests.length, 1); assert.equal(h.scrolls.length, 0);
  const current = nodes(h.pickerTree(), node => node.props?.['data-wildjahr-species'] === 'rotwild')[0].props.onClick;
  h.dispose(); current(); assert.equal(h.requests.length, 1); assert.equal(h.scrolls.length, 0);
});

test('Global menu code has no competing Wildjahr category-top reset or hidden scroll-position restoration', () => {
  assert.equal(getCategoryNavigationKey('/lernen/wildjahr?art=rehwild&monat=7#wildjahr-current'), null);
  const source = fs.readFileSync(path.join(root, 'lib/single-view-navigation.js'), 'utf8');
  assert.doesNotMatch(source, /window\.scrollTo|window\.scrollY|scrollRestoration/);
});
