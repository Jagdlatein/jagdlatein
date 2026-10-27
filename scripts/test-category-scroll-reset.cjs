const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const React = local('react');
const swc = local('next/dist/build/swc');
const load = createLoader();
const sourceFile = path.join(root, 'components/GlobalHomeButton.js');
const { code } = swc.transformSync(fs.readFileSync(sourceFile, 'utf8'), {
  filename: sourceFile,
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } },
  module: { type: 'commonjs' },
});

// Execute the real component and its effects with separate render, host commit,
// effect cleanup/setup and browser-frame phases. Unlike a render-only mock,
// dependencies persist and a replaced or unmounted effect runs its cleanup.
function shell(initial = '/', { appRouter = false, animationFrames = true, ready = true } = {}) {
  const hookSlots = [], activeEffects = new Map();
  const frames = new Map(), timers = new Map(), callbacks = new Map();
  const documentListeners = new Map(), windowListeners = new Map();
  const scrolls = [], outletAttributes = new Map();
  let hookCursor = 0, nextEffects = new Map(), tree, handle = 0, phase = 'idle', committedURL = null, stored = '[]';
  const control = { pathname: new URL(initial, 'https://jagdlatein.test').pathname,
    router: { asPath: initial, isReady: ready, push: async () => true } };
  const outlet = { setAttribute(name, value) { outletAttributes.set(name, value); } };
  const menu = { open: false, contains: () => false, querySelector: selector => selector === '#jl-page-menu' ? outlet : null };
  const navigation = { getBoundingClientRect: () => ({ height: 70 }), style: { getPropertyValue: () => '0' } };
  const location = {};
  function browserURL(value) {
    const url = new URL(value, 'https://jagdlatein.test');
    Object.assign(location, { pathname: url.pathname, search: url.search, hash: url.hash });
  }
  browserURL(initial);
  const window = {
    location, innerHeight: 800,
    scrollTo(options) { scrolls.push({ options, phase, committedURL, browserURL: location.pathname + location.search + location.hash }); },
    addEventListener(name, callback) { windowListeners.set(name, callback); },
    removeEventListener(name, callback) { if (windowListeners.get(name) === callback) windowListeners.delete(name); },
    getComputedStyle: () => ({ bottom: '16px' }),
    setTimeout(callback) { const id = ++handle; callbacks.set(id, callback); timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
    ...(animationFrames ? {
      requestAnimationFrame(callback) { const id = ++handle; callbacks.set(id, callback); frames.set(id, callback); return id; },
      cancelAnimationFrame(id) { frames.delete(id); },
    } : {}),
  };
  const document = { activeElement: null,
    addEventListener(name, callback) { documentListeners.set(name, callback); },
    removeEventListener(name, callback) { if (documentListeners.get(name) === callback) documentListeners.delete(name); },
  };
  const sessionStorage = { getItem: () => stored, setItem: (_key, value) => { stored = value; } };
  const hooks = { ...React,
    useRef(initialValue) {
      const index = hookCursor++;
      if (!hookSlots[index]) hookSlots[index] = { current: initialValue };
      return hookSlots[index];
    },
    useState(initialValue) {
      const index = hookCursor++;
      if (!hookSlots[index]) hookSlots[index] = { value: typeof initialValue === 'function' ? initialValue() : initialValue };
      return [hookSlots[index].value, value => { hookSlots[index].value = typeof value === 'function' ? value(hookSlots[index].value) : value; }];
    },
    useEffect(setup, dependencies) { nextEffects.set(hookCursor++, { setup, dependencies }); },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'window', 'document', 'sessionStorage', code)(id => {
    if (id === 'react') return hooks;
    if (id === 'next/navigation') return { usePathname: () => control.pathname };
    if (id === 'next/compat/router') return { useRouter: () => appRouter ? null : control.router };
    if (id === 'next/link') return { __esModule: true, default: () => null };
    if (id === './AppIcon' || id === './AppUpdateStatus') return { __esModule: true, default: () => null };
    if (id === './WebCoursePlatformEntry') return load('components/WebCoursePlatformEntry.js');
    if (id === './PageMenu') return { PAGE_MENU_OUTLET_ID: 'jl-page-menu', PAGE_MENU_ROUTE_ATTRIBUTE: 'data-page-menu-route' };
    if (id === '../lib/learning-categories') return load('lib/learning-categories.js');
    if (id === '../lib/category-navigation') return load('lib/category-navigation.js');
    if (id === '../lib/single-view-navigation') return load('lib/single-view-navigation.js');
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    return local(id);
  }, module, module.exports, window, document, sessionStorage);

  function attach(node) {
    if (Array.isArray(node)) { node.forEach(attach); return; }
    if (!node || typeof node !== 'object') return;
    if (node.props?.ref) node.props.ref.current = node.type === 'nav' ? navigation : menu;
    attach(node.props?.children);
  }
  const sameDependencies = (left, right) => left && right && left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
  function render() {
    phase = 'render'; hookCursor = 0; nextEffects = new Map();
    tree = module.exports.default(); phase = 'idle';
    return tree;
  }
  function commit() {
    phase = 'host-commit'; attach(tree);
    committedURL = control.router.asPath;
    const changed = [...nextEffects].filter(([index, effect]) => !sameDependencies(activeEffects.get(index)?.dependencies, effect.dependencies));
    phase = 'effect-cleanup';
    for (const [index] of changed) activeEffects.get(index)?.cleanup?.();
    phase = 'effect-setup';
    for (const [index, effect] of changed) activeEffects.set(index, { ...effect, cleanup: effect.setup() });
    phase = 'idle';
  }
  function flush(queue, framePhase) {
    const pending = [...queue]; queue.clear(); phase = framePhase;
    for (const [, callback] of pending) callback();
    phase = 'idle';
  }
  return {
    render, commit, scrolls, frames, timers, menu, window, control, outletAttributes,
    browserURL,
    route(value, changes = {}) {
      browserURL(value);
      control.pathname = changes.pathname ?? location.pathname;
      Object.assign(control.router, { asPath: value, ...changes });
      delete control.router.pathname;
    },
    update(value, changes) { this.route(value, changes); render(); commit(); },
    flushFrames() { flush(frames, 'animation-frame'); },
    flushTimers() { flush(timers, 'timer'); },
    fireStale(id) { phase = 'stale-frame'; callbacks.get(id)?.(); phase = 'idle'; },
    replayEffects() {
      phase = 'effect-cleanup'; for (const effect of activeEffects.values()) effect.cleanup?.();
      phase = 'effect-setup'; for (const effect of activeEffects.values()) effect.cleanup = effect.setup();
      phase = 'idle';
    },
    unmount() {
      phase = 'unmount'; for (const effect of activeEffects.values()) effect.cleanup?.();
      activeEffects.clear(); phase = 'idle';
    },
  };
}

test('A category reset waits for the actual committed route and one browser frame', () => {
  const s = shell('/');
  s.render(); s.commit();
  s.route('/lernen/wildkunde'); s.render();
  assert.equal(s.frames.size, 0, 'Rendering a prospective page cannot schedule the reset');
  assert.deepEqual(s.scrolls, []);
  s.commit();
  assert.equal(s.frames.size, 1);
  assert.deepEqual(s.scrolls, []);
  s.flushFrames();
  assert.deepEqual(s.scrolls, [{ options: { left: 0, top: 0, behavior: 'instant' }, phase: 'animation-frame', committedURL: '/lernen/wildkunde', browserURL: '/lernen/wildkunde' }]);
  s.render(); s.commit(); s.flushFrames();
  assert.equal(s.scrolls.length, 1, 'A normal rerender does not repeat the reset');
  s.unmount();
});

test('Both router views and browser URL must agree, and Pages Router readiness cannot be skipped', () => {
  const s = shell('/lernen/wildkunde', { ready: false });
  s.control.pathname = '/lernen/hundewesen'; s.render(); s.commit();
  assert.equal(s.frames.size, 0);
  s.control.pathname = '/lernen/wildkunde'; s.render(); s.commit();
  assert.equal(s.frames.size, 0);
  s.control.router.isReady = true; s.control.router.asPath = '/lernen/hundewesen'; s.render(); s.commit();
  assert.equal(s.frames.size, 0);
  s.control.router.asPath = '/lernen/wildkunde'; s.render(); s.commit();
  assert.equal(s.frames.size, 1); s.flushFrames(); assert.equal(s.scrolls.length, 1); s.unmount();
  const app = shell('/lernen/wildkunde', { appRouter: true });
  app.control.pathname = '/lernen/hundewesen'; app.render(); app.commit(); assert.equal(app.frames.size, 0);
  app.control.pathname = '/lernen/wildkunde'; app.render(); app.commit(); app.flushFrames();
  assert.equal(app.scrolls.length, 1); app.unmount();
});

test('New branches, old course selections and explicit legal-country selections each reset to the top', () => {
  const s = shell('/'); s.render(); s.commit();
  const routes = [
    '/lernen/wildkunde',
    '/lernen/wildkunde?bereich=schalenwild#learning-modules',
    '/lernen/wildkunde?bereich=schalenwild&kurs=wissen-rehwild-jahreslauf#learning-modules',
    '/lernen/hundewesen',
    '/jagdrecht',
    '/jagdrecht/ch',
    '/jagdrecht/ch?region=zh',
    '/jagdrecht/ch?region=zh&thema=jagdausuebung',
    '/jagdrecht/ch?region=zh&thema=jagdausuebung&artikel=beispiel',
    '/jagdrecht/ch?region=zh&thema=jagdausuebung&artikel=beispiel&ansicht=quelle',
    '/jagdrecht/de', '/jagdrecht/at',
  ];
  for (const route of routes) { s.update(route); assert.equal(s.frames.size, 1, route); s.flushFrames(); }
  assert.equal(s.scrolls.length, routes.length); s.unmount();
});

test('Search, pagination, hash changes, local accordions and ordinary course lessons preserve scrolling', () => {
  const s = shell('/lernen/wildkunde?bereich=schalenwild'); s.render(); s.commit(); s.flushFrames();
  const before = s.scrolls.length;
  for (const route of [
    '/lernen/wildkunde?bereich=schalenwild&q=Reh',
    '/lernen/wildkunde?bereich=schalenwild&q=Reh&searchCategory=wildkunde&type=course&page=2',
    '/lernen/wildkunde?bereich=schalenwild&q=Reh&searchCategory=wildkunde&type=course&page=2#lernen-suche',
  ]) { s.update(route); s.flushFrames(); assert.equal(s.scrolls.length, before, route); }
  s.menu.open = true; s.render(); s.commit(); s.flushFrames();
  assert.equal(s.scrolls.length, before, 'Native local opening has no category transition');
  for (const route of [
    '/kurse/wissen-rehwild-jahreslauf#lesson-jahreslauf',
    '/kurse/wissen-rehwild-jahreslauf#lesson-entwicklung',
    '/lernen/anatomie?bereich=wiederkaeuer', '/lernen/anatomie?bereich=schwarzwild',
    '/lernen/lernkarten?kategorie=wildkunde', '/jagdrecht/wildarten',
  ]) { s.update(route); s.flushFrames(); assert.equal(s.scrolls.length, before, route); }
  s.update('/jagdrecht/ch?region=zh'); s.flushFrames();
  const legalBefore = s.scrolls.length;
  s.update('/jagdrecht/ch?region=zh&q=Jagd&page=2#quellen'); s.flushFrames();
  assert.equal(s.scrolls.length, legalBefore); s.unmount();
});

test('Fast navigation, stale callbacks and unmount cannot scroll an obsolete page', () => {
  const s = shell('/'); s.render(); s.commit();
  s.update('/lernen/wildkunde'); const obsolete = [...s.frames.keys()][0];
  s.update('/lernen/hundewesen'); const current = [...s.frames.keys()][0];
  assert.notEqual(obsolete, current); assert.equal(s.frames.size, 1);
  s.fireStale(obsolete); assert.equal(s.scrolls.length, 0);
  s.flushFrames(); assert.equal(s.scrolls.length, 1); assert.equal(s.scrolls[0].committedURL, '/lernen/hundewesen');
  s.update('/lernen/wald-pflanzen'); const moved = [...s.frames.keys()][0];
  s.browserURL('/kurse/wissen-rehwild-jahreslauf#lesson-jahreslauf');
  s.fireStale(moved); assert.equal(s.scrolls.length, 1, 'The browser URL guards a route change before the next commit');
  s.update('/lernen/natur-revier'); const unmounted = [...s.frames.keys()][0];
  s.unmount(); assert.equal(s.frames.size, 0); s.fireStale(unmounted);
  assert.equal(s.scrolls.length, 1, 'A late callback cannot scroll after unmount');
});

test('Browsers without animation frames keep the same committed and cancellable timer behavior', () => {
  const s = shell('/', { animationFrames: false }); s.render(); s.commit();
  s.update('/lernen/wildkunde'); assert.equal(s.timers.size, 1); assert.equal(s.scrolls.length, 0);
  const old = [...s.timers.keys()][0];
  s.update('/lernen/hundewesen'); assert.equal(s.timers.size, 1);
  s.fireStale(old); assert.equal(s.scrolls.length, 0);
  s.flushTimers(); assert.equal(s.scrolls.length, 1); assert.equal(s.scrolls[0].phase, 'timer');
  s.update('/lernen/wald-pflanzen'); const removed = [...s.timers.keys()][0]; s.unmount();
  assert.equal(s.timers.size, 0); s.fireStale(removed); assert.equal(s.scrolls.length, 1);
});

test('Returning to a previous category before an intervening reset still resets that new entry', () => {
  const s = shell('/lernen/wildkunde'); s.render(); s.commit(); s.flushFrames();
  s.update('/lernen/hundewesen'); const abandoned = [...s.frames.keys()][0];
  s.update('/lernen/wildkunde');
  s.fireStale(abandoned); assert.equal(s.scrolls.length, 1);
  s.flushFrames();
  assert.equal(s.scrolls.length, 2);
  assert.equal(s.scrolls[1].committedURL, '/lernen/wildkunde');
  s.unmount();
});

test('An unfinished category reset survives query typing, while an explicit search target cancels its top reset', () => {
  for (const route of ['/lernen/wildkunde?q=Reh', '/lernen/wildkunde#lernen-suche']) {
    const s = shell('/'); s.render(); s.commit();
    s.update('/lernen/wildkunde'); const original = [...s.frames.keys()][0];
    s.update(route); s.fireStale(original); s.flushFrames();
    const expected = route.includes('#') ? 0 : 1;
    assert.equal(s.scrolls.length, expected, `${route}: explicit search focus takes precedence over a pending category reset`);
    s.render(); s.commit(); s.flushFrames(); assert.equal(s.scrolls.length, expected); s.unmount();
  }
});

test('Direct source/search fragments and late explicit anchors are never overridden by a category frame', () => {
  for (const route of ['/lernen/wildkunde#quellen', '/lernen/hundewesen#lernen-suche', '/jagdrecht/ch?region=zh#quellen']) {
    const s = shell(route); s.render(); s.commit(); s.flushFrames(); assert.equal(s.scrolls.length, 0, route); s.unmount();
  }
  const s = shell('/'); s.render(); s.commit();
  s.update('/lernen/wildkunde'); const frame = [...s.frames.keys()][0];
  s.browserURL('/lernen/wildkunde#lernen-suche');
  s.fireStale(frame); assert.equal(s.scrolls.length, 0, 'A real hash change before the next render invalidates the queued reset');
  s.unmount();
});

test('Effect cleanup/setup replay cannot discard the initial category reset', () => {
  const s = shell('/lernen/wildkunde'); s.render(); s.commit();
  s.replayEffects(); s.flushFrames();
  assert.equal(s.scrolls.length, 1, 'The committed initial category is still reset once after effect replay');
  s.unmount();
});
