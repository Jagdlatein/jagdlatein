const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const requireProject = createRequire(path.join(root, 'package.json'));
const React = requireProject('react');
const swc = requireProject('next/dist/build/swc');
const { renderToStaticMarkup } = requireProject('react-dom/server');
const load = require('./helpers/project-module.cjs').createLoader();
function collectLinks(node) {
  if (Array.isArray(node)) return node.flatMap(collectLinks);
  if (!node || typeof node !== 'object') return [];
  return [...(node.props?.href ? [node] : []), ...collectLinks(node.props?.children)];
}

function setup(pathname = '/login', history = [], appRouter = false, navigation = null, viewportSupported = true) {
  let state;
  const effects = [], cleanups = [], listeners = new Map(), windowListeners = new Map(), viewportListeners = new Map(), timers = new Map();
  let timerId = 0, stored = JSON.stringify(history), destination;
  const clientNavigations = [], documentNavigations = [];
  let summaryFocus = 0;
  const menu = { open: false, contains: element => element?.insideMenu === true, querySelector: selector => selector === 'summary' ? { focus() { summaryFocus++; } } : null,
    getBoundingClientRect: () => ({ height: 64 }),
    style: { getPropertyValue: () => `${state?.bottom || 0}px` },
  };
  const document = { activeElement: null,
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name, callback) { if (listeners.get(name) === callback) listeners.delete(name); },
  };
  const viewport = { height: 800, offsetTop: 0, scale: 1,
    addEventListener(name, fn) { viewportListeners.set(name, fn); },
    removeEventListener(name, fn) { if (viewportListeners.get(name) === fn) viewportListeners.delete(name); },
  };
  const window = { innerHeight: 800, visualViewport: viewportSupported ? viewport : undefined, location: { pathname, search: '', hash: '', assign(value) { documentNavigations.push(value); destination = value; } },
    getComputedStyle: () => ({ bottom: `${(state?.bottom || 0) + 16}px` }),
    addEventListener(name, fn) { windowListeners.set(name, fn); }, removeEventListener(name, fn) { if(windowListeners.get(name)===fn) windowListeners.delete(name); },
    setTimeout(callback) { const id = ++timerId; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  const sessionStorage = { getItem: () => stored, setItem: (_key, value) => { stored = value; } };
  const router = { asPath: pathname, push(value) { clientNavigations.push(value); destination = value; return navigation ? navigation(value) : Promise.resolve(true); } };
  const filename = path.join(root, 'components/GlobalHomeButton.js');
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2020', transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' },
  });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'window', 'document', 'sessionStorage', code)(id => {
    if (id === 'react') return { ...React, useState: initial => {
      if (state === undefined) state = initial;
      return [state, value => { state = typeof value === 'function' ? value(state) : value; }];
    }, useRef: () => ({ current: menu }), useEffect: callback => effects.push(callback) };
    if (id === 'next/navigation') return { usePathname: () => pathname };
    if (id === 'next/compat/router') return { useRouter: () => appRouter ? null : router };
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    if (id === './AppIcon') return { __esModule: true, default: () => null };
    if (id === './PageMenu') return { PAGE_MENU_OUTLET_ID: 'jl-page-menu' };
    if (id === '../lib/learning-categories') return load('lib/learning-categories.js');
    return requireProject(id);
  }, mod, mod.exports, window, document, sessionStorage);
  const render = () => mod.exports.default();
  const tree = render();
  effects.splice(0).forEach(callback => cleanups.push(callback()));
  return { tree, render, html: () => renderToStaticMarkup(render()), listeners, windowListeners, viewportListeners, timers, sessionStorage, menu, get summaryFocus() { return summaryFocus; },
    route(asPath) { const url = new URL(asPath, 'https://test.invalid'); pathname = url.pathname; router.asPath = asPath; window.location.pathname = url.pathname; window.location.search = url.search; window.location.hash = url.hash; render(); effects.splice(0).forEach(callback => cleanups.push(callback())); },
    navigateBeforeEffects(asPath) { const url = new URL(asPath, 'https://test.invalid'); window.location.pathname = url.pathname; window.location.search = url.search; window.location.hash = url.hash; },
    hash(value) { window.location.hash=value; windowListeners.get('hashchange')?.(); },
    focus(element) { document.activeElement = element; listeners.get('focusin')?.(); },
    blur(element = null) { document.activeElement = element; listeners.get('focusout')?.(); timers.forEach(callback => callback()); timers.clear(); },
    resizeViewport(height, offsetTop = 0, scale = 1) { Object.assign(viewport, { height, offsetTop, scale }); viewportListeners.get('resize')?.(); },
    get destination() { return destination; }, get history() { return JSON.parse(stored); }, clientNavigations, documentNavigations,
    unmount() { cleanups.forEach(callback => callback?.()); },
  };
}

test('Shared dock retains Back, learning, search, community and Start and adds account access', () => {
  const tree = setup('/lernen/wildkunde').tree;
  assert.equal(tree.props.children.length, 4);
  assert.equal(tree.props.children[3].type, 'details');
  assert.equal(tree.props.children[3].props.children[0].type, 'summary');
  const html = setup('/lernen/wildkunde').html();
  for (const href of ['/lernen', '/lernen#lernen-suche', '/community', '/', '/konto']) assert.ok(html.includes(`href="${href}"`), href);
  assert.match(html, /Zurück zur vorherigen Seite/);
  assert.match(html, /Konto und Abo öffnen/);
  assert.match(html, /aria-label="Zum Lernbereich" aria-current="true"/);
  assert.doesNotMatch(html, /aria-label="Konto und Abo öffnen" aria-current/);
  assert.match(setup('/').html(), /Seitennavigation/);
});

test('Dock links use client navigation without preloading private destinations on every page', () => {
  const s = setup('/konto');
  const children = s.tree.props.children;
  const links = collectLinks(children);
  assert.equal(links.length, 32);
  for (const link of links) {
    assert.notEqual(link.type, 'a');
    assert.equal(link.props.prefetch, false);
  }
  s.tree.props.children[0].props.onClick();
  assert.deepEqual(s.clientNavigations, ['/']);
  assert.deepEqual(s.documentNavigations, []);
});

test('Back falls back after a genuine router failure and never overrides a cancelled transition', async () => {
  const rejected = setup('/konto', ['/lernen'], false, () => Promise.reject(new Error('Chunk failed')));
  rejected.tree.props.children[0].props.onClick(); await Promise.resolve();
  assert.deepEqual(rejected.documentNavigations, ['/lernen']);
  const cancelled = setup('/konto', ['/lernen'], false, () => Promise.reject({ cancelled: true }));
  cancelled.tree.props.children[0].props.onClick(); await Promise.resolve();
  assert.deepEqual(cancelled.documentNavigations, []);
  const synchronous = setup('/konto', ['/lernen'], false, () => { throw new Error('Router failed'); });
  synchronous.tree.props.children[0].props.onClick();
  assert.deepEqual(synchronous.documentNavigations, ['/lernen']);
  const app = setup('/quiz-app', ['/lernen'], true);
  app.tree.props.children[0].props.onClick();
  assert.deepEqual(app.clientNavigations, []);
  assert.deepEqual(app.documentNavigations, ['/lernen']);
});

test('Dock Back retains the selected lesson fragment instead of sending the learner to the first lesson', () => {
  const s = setup('/lernen', ['/']);
  s.route('/kurse/wissen-vertiefung-hunde-vorstehrassen#lesson-vizsla');
  s.route('/kurse/wissen-vertiefung-hunde-vorstehrassen#lesson-setter');
  s.route('/lernen/jagdhund-kompass?rasse=pointer#dog-pointer');
  s.render().props.children[0].props.onClick();
  assert.equal(s.destination, '/kurse/wissen-vertiefung-hunde-vorstehrassen#lesson-setter');
});

test('Account grouping follows entry and pricing while records and leaderboard keep a single exact current destination', () => {
  for (const route of ['/login', '/registrieren', '/preise', '/konto']) {
    assert.match(setup(route).html(), /aria-label="Konto und Abo öffnen" aria-current="page"/, route);
  }
  for (const route of ['/meine-kurse', '/auswertungen', '/quiz-app/leaderboard']) {
    const links = collectLinks(setup(route).tree.props.children[3].props.children[1]);
    assert.deepEqual(links.filter(link => link.props['aria-current']).map(link => link.props.href), [route]);
  }
  assert.doesNotMatch(setup('/community-other').html(), /aria-label="Zur Community" aria-current/);
});

test('Menu exposes one expandable category branch and highlights the specific current learning tool', () => {
  const s = setup('/lernen/lernkarten');
  const details = s.tree.props.children[3];
  const links = collectLinks(details.props.children[1]);
  const categories = load('lib/learning-categories.js').learningCategoryDetails;
  assert.deepEqual(links.map(link => link.props.href), ['/', '/lernen', ...categories.map(c => `/lernen/${c.slug}`), '/wildkunde', '/fotohelfer', '/lernen/lernkarten', '/kurse', '/quiz-app', '/quiz-app/leaderboard', '/jagdpraxis', '/glossar', '/jagdrecht', '/community', '/news', '/lernen/videos', '/konto', '/meine-kurse', '/auswertungen', '/hilfe']);
  assert.equal(new Set(links.map(link => link.props.href)).size, links.length);
  assert.equal(links.filter(link => link.props['aria-current']).length, 1);
  assert.equal(links.find(link => link.props['aria-current']).props.href, '/lernen/lernkarten');
  assert.equal(details.props.children[0].type, 'summary', 'Native menu summary keeps keyboard and expanded state behavior');
  assert.ok(links.every(link => link.type !== 'button' && link.props.prefetch === false));
  const categoryBranch = details.props.children[1].props.children.flat(Infinity).find(item => item.type === 'details');
  assert.ok(categoryBranch && !categoryBranch.props.open);
  for (const route of ['/wildkunde/rehwild', '/kurse/wissen-rehwild-jahreslauf', '/fotohelfer']) assert.match(setup(route).html(), /aria-label="Zum Lernbereich" aria-current="true"/);
  for (const route of ['/lernen/videos', '/lernen/wildtier-videofaelle', '/lernen/jagdhund-videos']) {
    const videoLinks = setup(route).tree.props.children[3].props.children[1].props.children.flat(Infinity);
    assert.equal(videoLinks.filter(link => link.props['aria-current']).length, 1);
    assert.equal(videoLinks.find(link => link.props['aria-current']).props.href, '/lernen/videos');
  }
});

test('Menu closes after a normal choice, Escape restores summary focus, and outside clicks or a new route dismiss it', () => {
  const s = setup('/lernen'); const details = s.tree.props.children[3];
  const first = collectLinks(details.props.children[1])[0];
  s.menu.open = true; first.props.onClick({ button: 0 }); assert.equal(s.menu.open, false);
  s.menu.open = true; first.props.onClick({ button: 0, ctrlKey: true }); assert.equal(s.menu.open, true, 'A new-tab choice retains native behavior');
  s.listeners.get('pointerdown')({ target: { insideMenu: true } }); assert.equal(s.menu.open, true);
  s.listeners.get('pointerdown')({ target: {} }); assert.equal(s.menu.open, false);
  s.menu.open = true; let prevented = false;
  details.props.onKeyDown({ key: 'Escape', preventDefault() { prevented = true; } });
  assert.equal(s.menu.open, false); assert.equal(prevented, true); assert.equal(s.summaryFocus, 1);
  s.menu.open = true; s.route('/news'); assert.equal(s.menu.open, false); assert.equal(s.summaryFocus, 1, 'Route changes do not steal focus');
  s.unmount(); assert.equal(s.listeners.size, 0);
});

test('Small-screen menu stays inside a 320px viewport, scrolls vertically and keeps readable large touch targets', () => {
  const css = fs.readFileSync(path.join(root, 'styles/GlobalNavigation.module.css'), 'utf8');
  assert.match(css, /width:\s*min\(340px,\s*calc\(100vw - 32px\)\)/);
  assert.match(css, /max-height:\s*min\(70dvh,\s*560px,\s*var\(--navigation-menu-height,\s*560px\)\)/); assert.match(css, /overflow-y:\s*auto/);
  assert.match(css, /\.moreLinks a\s*\{[^}]*min-height:\s*52px[^}]*font-size:\s*18px/s);
  assert.match(css, /@media\s*\(max-width:\s*620px\)[\s\S]*\.button\s*\{[^}]*font-size:\s*17px[^}]*min-height:\s*64px/s);
});

test('Email and code autofocus, selects and text editing keep every bottom destination available', () => {
  const s = setup();
  for (const field of [{ tagName: 'INPUT', type: 'email' }, { tagName: 'INPUT', type: 'password' }, { tagName: 'INPUT', type: 'text', inputMode: 'numeric' }, { tagName: 'TEXTAREA' }, { tagName: 'SELECT' }, { isContentEditable: true }]) {
    s.focus(field); assert.match(s.html(), /Seitennavigation/); assert.match(s.html(), /Menü/);
    assert.equal(s.render().props.style['--navigation-bottom-inset'], '0px');
    assert.doesNotMatch(s.html(), /editing/);
  }
  s.unmount(); assert.equal(s.listeners.size, 0); assert.equal(s.timers.size, 0); assert.equal(s.viewportListeners.size, 0);
});

test('A reduced visual viewport raises the dock and bounds its menu, including keyboard dismissal while a field stays focused', () => {
  const s = setup('/registrieren');
  s.focus({ tagName: 'INPUT', type: 'email' });
  s.resizeViewport(460, 20);
  assert.equal(s.render().props.style['--navigation-bottom-inset'], '320px');
  assert.equal(s.render().props.style['--navigation-menu-height'], '358px');
  assert.match(s.html(), /Menü/);
  s.blur({ tagName: 'SUMMARY' });
  assert.equal(s.render().props.style['--navigation-bottom-inset'], '320px', 'Closing keyboard transition must not drop the menu under the keyboard.');
  s.focus({ tagName: 'INPUT', type: 'text', inputMode: 'numeric' });
  s.resizeViewport(800);
  assert.equal(s.render().props.style['--navigation-bottom-inset'], '0px');
  assert.equal(s.render().props.style['--navigation-menu-height'], undefined);
  s.resizeViewport(730);
  assert.equal(s.render().props.style['--navigation-bottom-inset'], '0px', 'Browser chrome is not a keyboard-sized obstruction.');
  s.resizeViewport(400, 0, 2);
  assert.equal(s.render().props.style['--navigation-bottom-inset'], '0px', 'Pinch zoom must not reposition the dock.');
  for (const height of [NaN, Infinity, -1]) {
    s.resizeViewport(height);
    assert.equal(s.render().props.style['--navigation-bottom-inset'], '0px');
  }
  s.resizeViewport(150);
  assert.equal(s.render().props.style['--navigation-menu-height'], '48px', 'A landscape keyboard menu fits above the measured dock and safe-area gap.');
  s.resizeViewport(80);
  assert.equal(s.render().props.style['--navigation-menu-height'], '0px', 'A tiny viewport cannot force a minimum menu above the screen.');
  s.unmount(); assert.equal(s.windowListeners.size, 0); assert.equal(s.viewportListeners.size, 0);
});

test('Bottom navigation also covers home, document print stays clean and no touch-focus rule hides the menu', () => {
  for (const route of ['/', '/login', '/registrieren', '/preise', '/konto', '/quiz-app', '/wildkunde/rehwild']) assert.match(setup(route).html(), /Seitennavigation/);
  const css = fs.readFileSync(path.join(root, 'styles/GlobalNavigation.module.css'), 'utf8');
  assert.doesNotMatch(css, /\.editing\s*\{/);
  assert.match(css, /@media print\s*\{\s*\.nav\s*\{\s*display:\s*none/);
  const base = fs.readFileSync(path.join(root, 'styles/AppBase.css'), 'utf8');
  assert.match(base, /padding-bottom:\s*calc\(100px\s*\+\s*env\(safe-area-inset-bottom/);
  assert.match(base, /scroll-padding-bottom:/);
  const legacy = setup('/login', [], false, null, false);
  assert.match(legacy.html(), /Menü/);
  assert.equal(legacy.render().props.style['--navigation-bottom-inset'], '0px');
  legacy.unmount(); assert.equal(legacy.windowListeners.size, 0);
});

test('Back ignores unsafe stored routes and works when session storage is unavailable', () => {
  const s = setup('/lernen/wildkunde', ['//external.invalid', '/\\external.invalid', '/lernen']);
  s.tree.props.children[0].props.onClick();
  assert.equal(s.destination, '/lernen');
  const blocked = setup('/konto');
  blocked.sessionStorage.getItem = () => { throw new Error('Storage blocked'); };
  blocked.sessionStorage.setItem = () => { throw new Error('Storage blocked'); };
  blocked.tree.props.children[0].props.onClick();
  assert.equal(blocked.destination, '/');
});

test('Shallow search edits retain one history entry and dock Back returns from a result to the latest search', () => {
  const s = setup('/lernen', ['/']);
  s.route('/lernen?q=Gams'); s.route('/lernen?q=Steinbock&type=species');
  assert.deepEqual(s.history, ['/', '/lernen?q=Steinbock&type=species']);
  s.route('/wildkunde/steinwild');
  s.render().props.children[0].props.onClick();
  assert.equal(s.destination, '/lernen?q=Steinbock&type=species');
  assert.deepEqual(s.history, ['/', '/lernen?q=Steinbock&type=species']);
});

test('An immediate Back click after a same-page query edit skips that page and the App Router remains compatible', () => {
  const s = setup('/lernen', ['/']);
  s.navigateBeforeEffects('/lernen?q=Gams'); s.tree.props.children[0].props.onClick();
  assert.equal(s.destination, '/');
  const app = setup('/quiz-app', ['/lernen'], true);
  assert.match(app.html(), /Seitennavigation/);
  app.tree.props.children[0].props.onClick(); assert.equal(app.destination, '/lernen');
});


test('Back follows a selected category branch before leaving the category', () => {
  const s = setup('/lernen/wildkunde', ['/lernen']);
  s.route('/lernen/wildkunde?bereich=schalenwild#learning-modules');
  s.route('/kurse/wissen-rehwild-jahreslauf#lesson-1');
  s.tree.props.children[0].props.onClick();
  assert.equal(s.destination, '/lernen/wildkunde?bereich=schalenwild#learning-modules');
  const branch = setup('/lernen/wildkunde', ['/lernen']);
  branch.route('/lernen/wildkunde?bereich=schalenwild#learning-modules');
  branch.tree.props.children[0].props.onClick();
  assert.equal(branch.destination, '/lernen/wildkunde');
});

test('Back preserves the course choice as a separate tree level while search typing stays within that level', () => {
  const base = '/lernen/wildkunde';
  const branch = `${base}?bereich=schalenwild#learning-modules`;
  const course = `${base}?bereich=schalenwild&kurs=wissen-rehwild-jahreslauf#learning-modules`;
  const s = setup(base, ['/lernen']);
  s.route(branch); s.route(course);
  s.route('/kurse/wissen-rehwild-jahreslauf#lesson-reh-nachwuchs');
  s.render().props.children[0].props.onClick();
  assert.equal(s.destination, course);
  const choice = setup(base, ['/lernen']);
  choice.route(branch); choice.route(course);
  choice.render().props.children[0].props.onClick();
  assert.equal(choice.destination, branch);
  const search = setup(base, ['/lernen']);
  search.route(branch); search.route(course);
  search.route(`${base}?bereich=schalenwild&kurs=wissen-rehwild-jahreslauf&q=Reh`);
  search.route(`${base}?bereich=schalenwild&kurs=wissen-rehwild-jahreslauf&q=Kitz`);
  assert.equal(search.history.length, 4);
  search.render().props.children[0].props.onClick();
  assert.equal(search.destination, branch);
});


test('Native species topic links preserve each branch for dock Back, including browser history navigation', () => {
  const s=setup('/wildkunde/rehwild',['/lernen/wildkunde']);
  s.hash('#portrait-grundlagen');s.hash('#portrait-lebensraum');
  s.tree.props.children[0].props.onClick();assert.equal(s.destination,'/wildkunde/rehwild#portrait-grundlagen');
  const native=setup('/wildkunde/rehwild',['/lernen/wildkunde']);
  native.hash('#portrait-grundlagen');native.hash('#portrait-lebensraum');native.hash('#portrait-grundlagen');
  native.tree.props.children[0].props.onClick();assert.equal(native.destination,'/wildkunde/rehwild');
});

test('Breed profiles preserve the chosen working topic as a real lower-menu Back step', () => {
  const s = setup('/lernen/jagdhunde/drahthaar', ['/lernen/jagdhunde']);
  s.hash('#rassenprofil'); s.hash('#arbeitsprofil');
  s.tree.props.children[0].props.onClick(); assert.equal(s.destination, '/lernen/jagdhunde/drahthaar#rassenprofil');
});


test('Habitat reading fragments are also real Back stops without adding search typing stops', () => {
 const s=setup('/lernen/lebensraum-werkstatt',['/lernen/natur-revier']);
 s.hash('#habitat-lesen?baustein=wald&art=alle');s.hash('#habitat-lesen?baustein=wiese&art=rehwild');
 s.tree.props.children[0].props.onClick();assert.equal(s.destination,'/lernen/lebensraum-werkstatt#habitat-lesen?baustein=wald&art=alle');
});

test('Law navigation returns through statute, topic and region without mixing another jurisdiction', () => {
  const base = '/jagdrecht/ch';
  const canton = `${base}?region=SG`;
  const topic = `${canton}&thema=pruefung`;
  const norm = `${topic}&artikel=ch-sg-pruefung`;
  const s = setup(base, ['/jagdrecht']);
  s.route(canton); s.route(topic); s.route(norm);
  s.render().props.children[0].props.onClick(); assert.equal(s.destination, topic);
  s.route(topic); s.render().props.children[0].props.onClick(); assert.equal(s.destination, canton);
  s.route(canton); s.render().props.children[0].props.onClick(); assert.equal(s.destination, base);
  const practice = setup(canton, ['/jagdrecht', base]);
  practice.route(`${canton}&ansicht=uebung`);
  practice.route(`${canton}&ansicht=uebung&bund=0`);
  practice.render().props.children[0].props.onClick(); assert.equal(practice.destination, `${canton}&ansicht=uebung`);
  assert.match(practice.html(), /aria-label="Zum Lernbereich" aria-current="true"/);
  const browserBack = setup(base, ['/jagdrecht']);
  browserBack.route(canton); browserBack.route(topic); browserBack.route(norm); browserBack.route(topic);
  browserBack.render().props.children[0].props.onClick(); assert.equal(browserBack.destination, canton);
});
