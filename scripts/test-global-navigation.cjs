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

function setup(pathname = '/login', history = [], appRouter = false, navigation = null) {
  let editing = false;
  const effects = [], cleanups = [], listeners = new Map(), timers = new Map();
  let timerId = 0, stored = JSON.stringify(history), destination;
  const clientNavigations = [], documentNavigations = [];
  let summaryFocus = 0;
  const menu = { open: false, contains: element => element?.insideMenu === true, querySelector: selector => selector === 'summary' ? { focus() { summaryFocus++; } } : null };
  const document = { activeElement: null,
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name, callback) { if (listeners.get(name) === callback) listeners.delete(name); },
  };
  const window = { location: { pathname, search: '', hash: '', assign(value) { documentNavigations.push(value); destination = value; } },
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
    if (id === 'react') return { ...React, useState: () => [editing, value => { editing = value; }], useRef: () => ({ current: menu }), useEffect: callback => effects.push(callback) };
    if (id === 'next/navigation') return { usePathname: () => pathname };
    if (id === 'next/compat/router') return { useRouter: () => appRouter ? null : router };
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    if (id === './AppIcon') return { __esModule: true, default: () => null };
    return requireProject(id);
  }, mod, mod.exports, window, document, sessionStorage);
  const render = () => mod.exports.default();
  const tree = render();
  effects.splice(0).forEach(callback => cleanups.push(callback()));
  return { tree, render, html: () => renderToStaticMarkup(render()), listeners, timers, sessionStorage, menu, get summaryFocus() { return summaryFocus; },
    route(asPath) { const url = new URL(asPath, 'https://test.invalid'); pathname = url.pathname; router.asPath = asPath; window.location.pathname = url.pathname; window.location.search = url.search; window.location.hash = url.hash; render(); effects.splice(0).forEach(callback => cleanups.push(callback())); },
    navigateBeforeEffects(asPath) { const url = new URL(asPath, 'https://test.invalid'); window.location.pathname = url.pathname; window.location.search = url.search; window.location.hash = url.hash; },
    focus(element) { document.activeElement = element; listeners.get('focusin')?.(); },
    blur(element = null) { document.activeElement = element; listeners.get('focusout')?.(); timers.forEach(callback => callback()); timers.clear(); },
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
  assert.equal(setup('/').tree, null);
});

test('Dock links use client navigation without preloading private destinations on every page', () => {
  const s = setup('/konto');
  const children = s.tree.props.children;
  const links = [children[1], children[2], ...children[3].props.children[1].props.children];
  assert.equal(links.length, 12);
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

test('Account grouping follows login, registration, pricing, account and learning records without prefix collisions', () => {
  for (const route of ['/login', '/registrieren', '/preise', '/konto', '/meine-kurse', '/auswertungen']) {
    assert.match(setup(route).html(), /aria-label="Konto und Abo öffnen" aria-current="page"/, route);
  }
  assert.doesNotMatch(setup('/community-other').html(), /aria-label="Zur Community" aria-current/);
});

test('Menu exposes clear destinations in one flat list and highlights the specific current learning tool', () => {
  const s = setup('/lernen/lernkarten');
  const details = s.tree.props.children[3];
  const links = details.props.children[1].props.children;
  assert.deepEqual(links.map(link => link.props.href), ['/', '/lernen', '/wildkunde', '/lernen/lernkarten', '/quiz-app', '/community', '/news', '/lernen/videos', '/konto', '/hilfe']);
  assert.equal(new Set(links.map(link => link.props.href)).size, links.length);
  assert.equal(links.filter(link => link.props['aria-current']).length, 1);
  assert.equal(links.find(link => link.props['aria-current']).props.href, '/lernen/lernkarten');
  assert.equal(details.props.children[0].type, 'summary', 'Native menu summary keeps keyboard and expanded state behavior');
  assert.ok(links.every(link => link.type !== 'button' && link.type !== 'details' && link.props.prefetch === false));
  for (const route of ['/wildkunde/rehwild', '/kurse/wissen-rehwild-jahreslauf']) assert.match(setup(route).html(), /aria-label="Zum Lernbereich" aria-current="true"/);
  for (const route of ['/lernen/videos', '/lernen/wildtier-videofaelle', '/lernen/jagdhund-videos']) {
    const videoLinks = setup(route).tree.props.children[3].props.children[1].props.children;
    assert.equal(videoLinks.filter(link => link.props['aria-current']).length, 1);
    assert.equal(videoLinks.find(link => link.props['aria-current']).props.href, '/lernen/videos');
  }
});

test('Menu closes after a normal choice, Escape restores summary focus, and outside clicks or a new route dismiss it', () => {
  const s = setup('/lernen'); const details = s.tree.props.children[3];
  const first = details.props.children[1].props.children[0];
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
  assert.match(css, /max-height:\s*min\(70dvh,\s*560px\)/); assert.match(css, /overflow-y:\s*auto/);
  assert.match(css, /\.moreLinks a\s*\{[^}]*min-height:\s*52px[^}]*font-size:\s*18px/s);
  assert.match(css, /@media\s*\(max-width:\s*620px\)[\s\S]*\.button\s*\{[^}]*font-size:\s*17px[^}]*min-height:\s*64px/s);
});

test('Editable fields hide the touch dock until focus leaves; checkboxes and readonly fields keep it available', () => {
  const s = setup();
  for (const field of [{ tagName: 'INPUT', type: 'email' }, { tagName: 'INPUT', type: 'password' }, { tagName: 'TEXTAREA' }, { tagName: 'SELECT' }, { isContentEditable: true }]) {
    s.focus(field); assert.match(s.html(), /class="nav editing"/);
    s.blur(); assert.doesNotMatch(s.html(), /class="nav editing"/);
  }
  for (const field of [{ tagName: 'INPUT', type: 'checkbox' }, { tagName: 'INPUT', type: 'text', readOnly: true }, { tagName: 'INPUT', type: 'radio' }, { tagName: 'A' }]) {
    s.focus(field); assert.doesNotMatch(s.html(), /class="nav editing"/);
  }
  s.unmount(); assert.equal(s.listeners.size, 0); assert.equal(s.timers.size, 0);
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
