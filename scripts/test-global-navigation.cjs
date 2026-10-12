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

function setup(pathname = '/login', history = []) {
  let editing = false;
  const effects = [], cleanups = [], listeners = new Map(), timers = new Map();
  let timerId = 0, stored = JSON.stringify(history), destination;
  const document = { activeElement: null,
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name, callback) { if (listeners.get(name) === callback) listeners.delete(name); },
  };
  const window = { location: { pathname, search: '', assign(value) { destination = value; } },
    setTimeout(callback) { const id = ++timerId; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  const sessionStorage = { getItem: () => stored, setItem: (_key, value) => { stored = value; } };
  const filename = path.join(root, 'components/GlobalHomeButton.js');
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2020', transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' },
  });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'window', 'document', 'sessionStorage', code)(id => {
    if (id === 'react') return { ...React, useState: () => [editing, value => { editing = value; }], useEffect: callback => effects.push(callback) };
    if (id === 'next/navigation') return { usePathname: () => pathname };
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    if (id === './AppIcon') return { __esModule: true, default: () => null };
    return requireProject(id);
  }, mod, mod.exports, window, document, sessionStorage);
  const render = () => mod.exports.default();
  const tree = render();
  effects.splice(0).forEach(callback => cleanups.push(callback()));
  return { tree, render, html: () => renderToStaticMarkup(render()), listeners, timers, sessionStorage,
    focus(element) { document.activeElement = element; listeners.get('focusin')?.(); },
    blur(element = null) { document.activeElement = element; listeners.get('focusout')?.(); timers.forEach(callback => callback()); timers.clear(); },
    get destination() { return destination; }, get history() { return JSON.parse(stored); },
    unmount() { cleanups.forEach(callback => callback?.()); },
  };
}

test('Shared dock retains Back, learning, search, community and Start and adds account access', () => {
  const html = setup('/lernen/wildkunde').html();
  for (const href of ['/lernen', '/lernen#lernen-suche', '/community', '/', '/konto']) assert.ok(html.includes(`href="${href}"`), href);
  assert.match(html, /Zurück zur vorherigen Seite/);
  assert.match(html, /Konto und Abo öffnen/);
  assert.match(html, /aria-label="Zum Lernbereich" aria-current="true"/);
  assert.doesNotMatch(html, /aria-label="Konto und Abo öffnen" aria-current/);
  assert.equal(setup('/').tree, null);
});

test('Account grouping follows login, registration, pricing, account and learning records without prefix collisions', () => {
  for (const route of ['/login', '/registrieren', '/preise', '/konto', '/meine-kurse', '/auswertungen']) {
    assert.match(setup(route).html(), /aria-label="Konto und Abo öffnen" aria-current="true"/, route);
  }
  assert.doesNotMatch(setup('/community-other').html(), /aria-label="Zur Community" aria-current/);
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
