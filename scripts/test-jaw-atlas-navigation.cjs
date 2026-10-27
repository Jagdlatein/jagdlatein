// Actual React DOM route owner and real MenuChoice/focus hook. No external
// model, user storage, account, authentication or network service is opened.
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root: repo } = require('./helpers/project-module.cjs');
const { nodes } = require('./helpers/field-reader-fixture.cjs');
const React = local('react'), { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const inventory = createLoader()('lib/european-wildlife-discovery.js').europeanWildlife;
const models = createLoader()('lib/wildlife-jaw-models.js');
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function address(query, hash = '') { const search = new URLSearchParams(); for (const [key, value] of Object.entries(query)) for (const item of Array.isArray(value) ? value : [value]) search.append(key, item); return '/lernen/kiefer-3d' + (search.size ? '?' + search : '') + (hash ? '#' + hash : ''); }
function callback(element) { assert.ok(element); const key = Object.keys(element).find(key => key.startsWith('__reactProps$')); return element[key].onClick; }
async function fixture(t, query = {}, { ready = true, hash = '' } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://example.invalid' + address(query, hash) });
  const saved = new Map(), calls = [], scrolls = [], frames = new Map(), menu = { opened: 0, closed: 0 }, activators = []; let frameId = 0;
  dom.window.scrollTo = options => scrolls.push(options); dom.window.HTMLElement.prototype.scrollIntoView = () => { throw new Error('Ordinary selection must start at page top'); };
  dom.window.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; }; dom.window.cancelAnimationFrame = id => frames.delete(id);
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) { saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { value, writable: true, configurable: true }); }
  const router = { isReady: ready, query, asPath: address(query, hash), push(href, as, options) { const job = { href, as, options, ...deferred() }; calls.push(job); return job.promise; } };
  const moduleValue = value => ({ __esModule: true, default: value });
  const Component = createLoader({ 'next/router': { useRouter: () => router }, 'next/link': ({ href, children, ...rest }) => React.createElement('a', { ...rest, href }, children),
    '../../components/LearningToolLayout': moduleValue(({ children }) => React.createElement('main', null, React.createElement('h1', { tabIndex: -1, 'data-learning-page-start': true }, 'Kiefer & Schädel'), children)),
    '../../components/PageMenu': { ...moduleValue(({ children }) => React.createElement('aside', null, children)), openPageMenu() { menu.opened++; }, closePageMenu() { menu.closed++; } },
    '../../components/WildlifeJawModel': moduleValue(props => { activators.push(props.onActivate); return React.createElement('section', { 'data-model-panel': props.slug, 'data-viewer-owner': props.viewerOwner || '' }, props.name); }),
    '../../components/WildlifeJawComparison': moduleValue(props => React.createElement('div', { 'data-comparison': props.left + ':' + props.right })),
    '../../components/WildlifeDentition': moduleValue(props => React.createElement('div', { 'data-dentition': props.slug })),
  })('pages/lernen/kiefer-3d.js').default;
  let mounted = local('react-dom/client').createRoot(document.getElementById('root'));
  const render = () => React.act(async () => { mounted.render(React.createElement(Component)); await settle(); });
  async function route(next, hash = '', ready = true) { router.query = next; router.asPath = address(next, hash); router.isReady = ready; dom.window.history.replaceState(null, '', router.asPath); await render(); }
  async function act(handler) { await React.act(async () => { handler(); await settle(); }); }
  const fields = () => [...document.querySelectorAll('aside fieldset')];
  const choice = (value, field = 0) => [...fields()[field].querySelectorAll('button[data-menu-choice]')].find(button => button.dataset.menuChoice === value);
  const title = () => document.querySelector('main p[tabindex="-1"]')?.textContent || null;
  async function commit(index = calls.length - 1) { const job = calls[index]; await route(job.href.query, job.href.hash); await act(() => job.resolve(true)); }
  async function unmount() { if (mounted) { await React.act(async () => mounted.unmount()); mounted = null; } }
  t.after(async () => { await unmount(); dom.window.close(); for (const [key, old] of saved) if (old) Object.defineProperty(globalThis, key, old); else delete globalThis[key]; });
  await render(); scrolls.length = 0; frames.clear(); menu.closed = 0;
  return { router, calls, menu, frames, scrolls, activators, render, route, act, fields, choice, title, commit, unmount, choose: (value, field = 0) => act(() => choice(value, field).click()) };
}

test('Bare entry offers114 primary choices only; an unready URL never flashes Rehwild or permits navigation', async t => {
  const h = await fixture(t, {}, { ready: false });
  assert.equal(h.title(), null); assert.equal(h.fields().length, 1); assert.equal(h.fields()[0].querySelectorAll('button').length, 114); assert.equal(document.querySelector('[data-model-panel]'), null);
  assert.ok([...h.fields()[0].querySelectorAll('button')].every(button => button.disabled));
  await h.act(() => callback(h.choice('damwild'))()); assert.equal(h.calls.length, 0);
  await h.route({}); await new Promise(resolve => setTimeout(resolve, 1));
  assert.equal(h.title(), null); assert.match(document.querySelector('main').textContent, /Wähle zuerst eine Wildart/); assert.equal(h.fields().length, 1); assert.ok(h.menu.opened >= 1);
});

test('Explicit invalid, empty, repeated and conflicting fields show help without substitute model or comparison facts', async t => {
  const h = await fixture(t);
  for (const query of [{ art: '' }, { art: 'unknown' }, { art: ['rehwild'] }, { art: ['wolf', 'rotwild'] }, { vergleich: 'rotwild' }, { art: 'rehwild', vergleich: 'rehwild' }, { art: 'rehwild', vergleich: 'unknown' }, { art: 'rehwild', vergleich: ['rotwild'] }]) {
    await h.route(query); assert.equal(h.title(), null, JSON.stringify(query)); assert.equal(document.querySelector('[data-model-panel],[data-comparison],[data-dentition]'), null); assert.match(document.querySelector('main').textContent, /Diese Auswahl ist nicht verfügbar/);
  }
  await h.route({ art: 'rehwild', vergleich: '' }); assert.equal(h.title(), 'Rehwild'); assert.equal(h.fields().length, 2); assert.equal(h.choice('', 1).getAttribute('aria-pressed'), 'true');
  await h.route({ art: 'rehwild', vergleich: 'unknown' }); await h.choose('', 1); await h.commit(); assert.deepEqual(h.router.query, { art: 'rehwild' });
});

test('Every114 explicit species remains exact with its actual model presence, honest open state and reciprocal portrait target', async t => {
  const h = await fixture(t);
  for (const species of inventory) {
    await h.route({ art: species.slug }); assert.equal(h.title(), species.name); assert.equal(h.choice(species.slug).getAttribute('aria-pressed'), 'true');
    assert.equal(document.querySelector('[data-model-panel]')?.dataset.modelPanel || null, models.jawModelsBySlug[species.slug] ? species.slug : null);
    if (!models.jawModelsBySlug[species.slug]) assert.match(document.querySelector('main').textContent, /Ein ähnliches Tier wird hier nicht als Ersatz ausgegeben/);
    const link = document.querySelector('main a'); assert.equal(link.getAttribute('href'), `/wildkunde/${species.slug}${models.jawModelsBySlug[species.slug] ? '#kiefer-3d' : '#gebiss'}`);
  }
  assert.equal(document.querySelector('iframe'), null); assert.equal(h.calls.length, 0);
});

test('A real push preserves old full selection until URL commit; comparison clearing and primary changes combine only displayed fields', async t => {
  const h = await fixture(t, { art: 'rehwild', vergleich: 'rotwild', ref: ['one', 'two'] }, { hash: 'kiefer-3d' });
  const before = h.title(); await h.choose('damwild', 1);
  assert.equal(h.title(), before); assert.deepEqual(h.scrolls, []); assert.deepEqual(h.calls[0].href, { pathname: '/lernen/kiefer-3d', query: { art: 'rehwild', vergleich: 'damwild', ref: ['one', 'two'] }, hash: 'kiefer-3d' }); assert.deepEqual(h.calls[0].options, { shallow: true, scroll: false });
  await h.act(() => h.calls[0].resolve(true)); assert.equal(h.title(), before);
  await h.commit(); assert.equal(h.title(), 'Rehwild im Vergleich mit Damwild'); assert.equal(document.activeElement.tagName, 'H1'); assert.ok(h.scrolls.every(scroll => scroll.top === 0));
  await h.choose('damwild'); await h.commit(); assert.deepEqual(h.router.query, { art: 'damwild', ref: ['one', 'two'] }); assert.equal(h.title(), 'Damwild');
  await h.route({ art: 'rehwild', vergleich: 'rotwild' }); assert.equal(h.title(), 'Rehwild im Vergleich mit Rotwild');
});

test('False, rejected and cancelled pushes preserve the chosen model and a current reselect retires an older pending target', async t => {
  const h = await fixture(t, { art: 'rehwild' });
  for (const kind of ['false', 'error', 'cancelled']) {
    await h.choose('damwild'); const job = h.calls.at(-1); await h.act(() => kind === 'false' ? job.resolve(false) : job.reject(Object.assign(new Error('Isolated navigation'), { cancelled: kind === 'cancelled' })));
    assert.equal(h.title(), 'Rehwild'); assert.equal(document.querySelector('iframe'), null);
    assert.equal(!!document.querySelector('[role="alert"]'), kind !== 'cancelled');
  }
  await h.choose('damwild'); const old = h.calls.at(-1); await h.choose('rehwild'); const current = h.calls.at(-1);
  await h.route(current.href.query); await h.act(() => { current.resolve(true); old.reject(new Error('Obsolete request')); });
  assert.equal(h.title(), 'Rehwild'); assert.equal(document.querySelector('[role="alert"]'), null);
  const count = h.calls.length; await h.choose('rehwild'); assert.equal(h.calls.length, count);
});

test('Raw history/hash context and real unmount retire old selection and activation handlers before URL or view writes', async t => {
  const h = await fixture(t, { art: 'rehwild' }), old = callback(h.choice('damwild')), activation = h.activators.at(-1);
  await h.route({ art: 'rotwild', quelle: 'history' }); await h.act(old); assert.equal(h.calls.length, 0); assert.equal(h.title(), 'Rotwild');
  await h.route({ art: 'rehwild' }); await h.act(() => { old(); activation('rehwild'); }); assert.equal(h.calls.length, 0); assert.equal(document.querySelector('[data-model-panel]').dataset.viewerOwner, '');
  const same = callback(h.choice('damwild')); await h.route({ art: 'rehwild' }, 'gebiss'); await h.act(same); assert.equal(h.calls.length, 0);
  const retained = callback(h.choice('damwild')); await h.choose('rotwild'); const job = h.calls.at(-1); const count = h.calls.length;
  const frame = [...h.frames.values()].at(-1); await h.unmount(); const scrolls = h.scrolls.length;
  await h.act(() => { retained(); job.reject(new Error('After actual unmount')); frame?.(); }); assert.equal(h.calls.length, count); assert.equal(h.scrolls.length, scrolls);
});

test('A newer different choice uses the displayed selection and an older rejected request cannot reopen its error after commit', async t => {
  const h = await fixture(t, { art: 'rehwild', vergleich: 'rotwild' });
  await h.choose('damwild'); await h.choose('fuchs');
  assert.deepEqual(h.calls[1].href.query, { art: 'fuchs', vergleich: 'rotwild' }); assert.equal(h.title(), 'Rehwild im Vergleich mit Rotwild');
  await h.commit(1); const opened = h.menu.opened;
  await h.act(() => h.calls[0].reject(new Error('Old Damwild selection')));
  assert.equal(h.title(), 'Fuchs im Vergleich mit Rotwild'); assert.equal(h.menu.opened, opened); assert.equal(document.querySelector('[role="alert"]'), null);
});

test('A changed render retires its former owner callbacks even before effect cleanup can run', () => {
  const slots = [], effects = [], cleanups = new Map(), calls = []; let cursor = 0, writes = 0;
  const hooks = { ...React,
    useRef(value) { const i = cursor++; return slots[i] ||= { current: value }; },
    useState(initial) { const i = cursor++; slots[i] ||= { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, value => { writes++; slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; },
    useEffect(fn, deps) { const i = cursor++, old = slots[i]; if (!old || deps.some((value, index) => !Object.is(value, old.deps[index]))) { slots[i] = { deps }; effects.push(() => { cleanups.get(i)?.(); cleanups.set(i, fn()); }); } },
  };
  const router = { isReady: true, query: { art: 'rehwild' }, asPath: '/lernen/kiefer-3d?art=rehwild', push(href) { calls.push(href); return new Promise(() => {}); } };
  const wrap = value => ({ __esModule: true, default: value });
  const Component = createLoader({ react: hooks, 'next/router': { useRouter: () => router }, '../../components/LearningToolLayout': wrap(({ children }) => React.createElement('main', null, children)), '../../components/PageMenu': { ...wrap(() => null), closePageMenu() {}, openPageMenu() {} }, '../../components/WildlifeJawModel': wrap(() => null), '../../components/WildlifeJawComparison': wrap(() => null), '../../components/WildlifeDentition': wrap(() => null) })('pages/lernen/kiefer-3d.js').default;
  const render = () => { cursor = 0; return Component(); };
  const first = render(); effects.splice(0).forEach(fn => fn()); const old = nodes(first, node => node.props?.id === 'kiefer-artauswahl')[0].props.onChange;
  router.query = { art: 'rotwild' }; router.asPath = '/lernen/kiefer-3d?art=rotwild'; render();
  const before = writes; old({ target: { value: 'damwild' } }); assert.equal(calls.length, 0); assert.equal(writes, before);
  for (const cleanup of cleanups.values()) cleanup?.();
});

test('Catalog, model/license provenance and local model implementation preserve exact source text apart from checkout line endings', () => {
  for (const file of ['lib/european-wildlife-discovery.js', 'lib/wildlife-jaw-models.js', 'lib/wildlife-jaw-comparison.js', 'lib/wildlife-dentition.js', 'components/WildlifeJawModel.js', 'components/WildlifeJawComparison.js']) {
    assert.equal(fs.readFileSync(path.join(repo, file), 'utf8').replaceAll('\r\n', '\n'), execFileSync('git', ['show', `3983e1e0b5787a0e250166cb9fc8962d845bcf13:${file}`], { cwd: repo, encoding: 'utf8' }).replaceAll('\r\n', '\n'), file);
  }
});
