const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function reactHandler(element) { const key = Object.keys(element).find(key => key.startsWith('__reactProps$')); return element[key].onClick; }
async function domFixture(t) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://example.invalid/lernen/wildkunde?bereich=biologie#inhalt' });
  const globals = new Map(), frames = new Map(), timeouts = new Map(), cancelled = [], scrolls = []; let sequence = 0;
  dom.window.scrollTo = settings => scrolls.push({ type: 'top', ...settings });
  dom.window.HTMLElement.prototype.scrollIntoView = function(settings) { scrolls.push({ type: 'anchor', id: this.id, ...settings }); };
  dom.window.requestAnimationFrame = callback => { const id = ++sequence; frames.set(id, callback); return id; };
  dom.window.cancelAnimationFrame = id => { cancelled.push(id); frames.delete(id); };
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) { globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { value, configurable: true, writable: true }); }
  let root = local('react-dom/client').createRoot(document.getElementById('root'));
  const render = element => React.act(async () => { root.render(element); await settle(); });
  const run = callback => React.act(async () => { callback(); await settle(); });
  async function unmount() { if (root) { await React.act(async () => root.unmount()); root = null; } }
  t.after(async () => { await unmount(); dom.window.close(); for (const [key, old] of globals) if (old) Object.defineProperty(globalThis, key, old); else delete globalThis[key]; });
  return { dom, render, run, unmount, frames, timeouts, cancelled, scrolls, fallback() { delete dom.window.requestAnimationFrame; dom.window.setTimeout = callback => { const id = ++sequence; timeouts.set(id, callback); return id; }; dom.window.clearTimeout = id => { cancelled.push(id); timeouts.delete(id); }; } };
}
const MenuChoice = createLoader()('components/MenuChoice.js').default;
const option = (value, label, disabled = false) => React.createElement('option', { key: String(value), value, disabled }, label);
const choices = (props, children) => React.createElement(MenuChoice, { label: 'Thema', id: 'choices', ...props }, children);
const buttons = () => [...document.querySelectorAll('#choices button')];

test('Thirty-one options retain group order and complete labels, omit only a disabled empty instruction and expose one flat button layer', async t => {
  const h = await domFixture(t);
  const children = [option('', 'Bitte wählen', true), option(0, 'Erste Lektion'), option('', 'Kein Vergleich'),
    React.createElement(React.Fragment, { key: 'fragment' }, option('f1', 'Fragment eins'), option('f2', 'Fragment zwei')),
    React.createElement('optgroup', { key: 'group', label: 'Wildkunde' }, Array.from({ length: 7 }, (_, i) => option('w' + i, 'Wild ' + i))),
    React.createElement('optgroup', { key: 'disabled', label: 'Noch gesperrt', disabled: true }, Array.from({ length: 3 }, (_, i) => option('d' + i, 'Gesperrt ' + i))),
    ...Array.from({ length: 17 }, (_, i) => option('p' + i, 'Thema ' + i))];
  await h.render(choices({ value: 0, 'aria-controls': 'result' }, children));
  assert.equal(buttons().length, 31); assert.equal(document.querySelectorAll('select,option,optgroup,dialog').length, 0);
  assert.deepEqual(buttons().map(button => button.textContent), ['Erste Lektion', 'Kein Vergleich', 'Fragment eins', 'Fragment zwei', ...Array.from({ length: 7 }, (_, i) => 'Wild ' + i), ...Array.from({ length: 3 }, (_, i) => 'Gesperrt ' + i), ...Array.from({ length: 17 }, (_, i) => 'Thema ' + i)]);
  assert.deepEqual([...document.querySelectorAll('h3')].map(node => node.textContent), ['Wildkunde', 'Noch gesperrt']);
  assert.equal(document.querySelector('legend').textContent, 'Thema'); assert.ok(buttons().every(button => button.getAttribute('aria-controls') === 'result'));
});

test('Numeric zero and valid empty choices preserve the existing value/currentTarget contract without submitting an enclosing form', async t => {
  const h = await domFixture(t), events = []; let submits = 0;
  await h.render(React.createElement('form', { onSubmit: event => { event.preventDefault(); submits++; } }, choices({ value: 0, onChange: event => events.push(event) }, [option(0, 'Lektion null'), option('', 'Kein Vergleich')])));
  assert.equal(buttons()[0].getAttribute('aria-pressed'), 'true');
  await h.run(() => { buttons()[0].click(); buttons()[1].click(); });
  assert.deepEqual(events.map(event => event.target.value), ['0', '']); assert.ok(events.every(event => event.target === event.currentTarget)); assert.equal(submits, 0); assert.ok(buttons().every(button => button.type === 'button'));
});

test('Disabled option, inherited disabled group and disabled whole picker reject even retained direct handlers', async t => {
  const h = await domFixture(t), events = [];
  const children = [option('ready', 'Bereit'), option('locked', 'Gesperrt', true), React.createElement('optgroup', { label: 'Gruppe', key: 'g', disabled: true }, option('group', 'Gruppenwert'))];
  await h.render(choices({ value: 'ready', onChange: event => events.push(event.target.value) }, children));
  const locked = buttons().slice(1); assert.ok(locked.every(button => button.disabled)); await h.run(() => locked.forEach(button => { button.click(); reactHandler(button)(); })); assert.deepEqual(events, []);
  await h.render(choices({ disabled: true, value: 'ready', onChange: event => events.push(event.target.value) }, children));
  assert.equal(document.getElementById('choices').disabled, true); await h.run(() => buttons().forEach(button => reactHandler(button)())); assert.deepEqual(events, []);
});

test('The picker remains controlled: clicking neither changes pressed selection nor invokes unrelated actions before its owner supplies the committed value', async t => {
  const h = await domFixture(t), events = [], children = [option('a', 'A'), option('b', 'B')];
  const props = { value: 'a', onChange: event => events.push(event.target.value) };
  await h.render(choices(props, children)); await h.run(() => buttons()[1].click());
  assert.deepEqual(events, ['b']); assert.equal(buttons()[0].getAttribute('aria-pressed'), 'true'); assert.equal(buttons()[1].getAttribute('aria-pressed'), 'false');
  await h.render(choices({ ...props, value: 'b' }, children)); assert.equal(buttons()[1].getAttribute('aria-pressed'), 'true');
  for (const value of [['a'], { toString: () => 'a' }, null, undefined]) {
    await h.render(choices({ ...props, value, 'aria-labelledby': 'external-title', 'aria-describedby': 'selection-note' }, children));
    assert.ok(buttons().every(button => button.getAttribute('aria-pressed') === 'false'), 'An invalid URL value must not be coerced into a highlighted choice');
    assert.equal(document.getElementById('choices').getAttribute('aria-labelledby'), 'external-title'); assert.equal(document.getElementById('choices').getAttribute('aria-describedby'), 'selection-note');
  }
});

async function hookFixture(t) {
  const h = await domFixture(t), useSelectionPageStart = createLoader()('hooks/useSelectionPageStart.js').default;
  let api, state = { scope: {}, enabled: true };
  function Probe({ scope, enabled }) { api = useSelectionPageStart(scope, enabled); return React.createElement('main', null, React.createElement('h1', { id: 'page-title', tabIndex: -1, 'data-learning-page-start': true }, 'Übersicht'), React.createElement('h2', { id: 'result', tabIndex: -1 }, 'Gewähltes Thema')); }
  const render = patch => { state = { ...state, ...patch }; return h.render(React.createElement(Probe, state)); };
  await render();
  return { ...h, render, api: () => api, target: () => document.getElementById('result') };
}

test('Normal selection focuses the semantic page heading and scrolls absolutely to zero; an explicit anchor retains its actual target', async t => {
  const h = await hookFixture(t); await h.run(() => assert.equal(h.api().focusSelection(h.target()), true));
  assert.equal(document.activeElement.id, 'page-title'); assert.deepEqual(h.scrolls, [{ type: 'top', left: 0, top: 0, behavior: 'instant' }]);
  const job = [...h.frames.values()][0]; await h.run(job); assert.equal(h.scrolls.length, 2);
  h.scrolls.length = 0; await h.run(() => h.api().focusSelection(h.target(), { anchor: true }));
  assert.equal(document.activeElement.id, 'result'); assert.deepEqual(h.scrolls, [{ type: 'anchor', id: 'result', block: 'start', behavior: 'auto' }]);
});

test('Scope, disabled state and unmount retire both retained APIs and their queued correction before focus or scroll', async t => {
  const h = await hookFixture(t), old = h.api(); await h.run(() => old.focusSelection(h.target())); const queued = [...h.frames.values()][0];
  await h.render({ scope: {} }); h.scrolls.length = 0; await h.run(() => { assert.equal(old.focusSelection(h.target()), false); queued(); }); assert.deepEqual(h.scrolls, []);
  await h.render({ enabled: false }); await h.run(() => assert.equal(h.api().focusSelection(h.target()), false)); assert.deepEqual(h.scrolls, []);
  await h.render({ enabled: true }); const current = h.api(); await h.run(() => current.focusSelection(h.target())); const pending = [...h.frames.values()].at(-1); await h.unmount(); h.scrolls.length = 0;
  await h.run(() => { assert.equal(current.focusSelection(null), false); pending(); }); assert.deepEqual(h.scrolls, []);
});

test('A changed raw address or detached page heading blocks a queued correction without requiring another React render', async t => {
  const h = await hookFixture(t); await h.run(() => h.api().focusSelection(h.target())); const old = [...h.frames.values()].at(-1);
  h.dom.window.history.replaceState(null, '', '?bereich=anderer#quelle'); h.scrolls.length = 0; await h.run(old); assert.deepEqual(h.scrolls, []);
  await h.run(() => h.api().focusSelection(h.target())); const detached = [...h.frames.values()].at(-1); document.getElementById('page-title').remove(); h.scrolls.length = 0; await h.run(detached); assert.deepEqual(h.scrolls, []);
});

test('Pointer, keyboard, wheel and touch interruptions cancel a queued page-start correction before a later native DOM event handler can revive it', async t => {
  const h = await hookFixture(t);
  for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
    await h.run(() => h.api().focusSelection(h.target())); const callback = [...h.frames.values()].at(-1);
    await h.run(() => document.dispatchEvent(new h.dom.window.Event(type, { bubbles: true }))); h.scrolls.length = 0; await h.run(callback); assert.deepEqual(h.scrolls, [], type);
  }
  assert.equal(h.cancelled.length, 4);
});

test('Old queued callbacks cannot clear a newer frame ticket, and the timeout fallback is also explicitly cancellable', async t => {
  const h = await hookFixture(t); await h.run(() => h.api().focusSelection(h.target())); const old = [...h.frames.values()].at(-1);
  await h.run(() => h.api().focusSelection(h.target())); const current = [...h.frames.values()].at(-1); h.scrolls.length = 0;
  await h.run(old); assert.deepEqual(h.scrolls, []); await h.run(current); assert.equal(h.scrolls.length, 1);
  h.fallback(); await h.run(() => h.api().focusSelection(h.target())); const fallback = [...h.timeouts.values()].at(-1);
  await h.run(() => h.api().cancelSelectionFocus()); h.scrolls.length = 0; await h.run(fallback); assert.deepEqual(h.scrolls, []);
});
