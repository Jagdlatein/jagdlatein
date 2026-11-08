// Real React effects, mutable router commits and isolated in-memory storage.
// This fixture never reads a customer account, browser data or a live API.
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const base = '/lernen/pruefungsplan';
const profile = { country: 'CH', region: 'ZH' };
const goal = (id, title) => ({ id, title, task: `Vollständiger Lernauftrag ${title}`, selfCheck: ['Zusammenhang erklären', 'Grenze benennen'], href: `/kurse/${id}#lesson-text`, quizHref: `/kurse/${id}#wissenscheck`, courseTitle: 'Eigener Lernkurs', lessonTitle: title, sourceScope: 'lesson', sourceIds: [id] });
const wild = goal('wild-testziel', 'Wildmerkmale'), dog = goal('hund-testziel', 'Hundeaufgabe'), regional = goal('regional-testziel', 'Regionaler Lernauftrag');
const categories = [{ slug: 'wildkunde', title: 'Wildkunde', focus: [] }, { slug: 'hundewesen', title: 'Hundewesen', focus: [] }];
const blueprint = { categories: [{ slug: 'wildkunde', goals: [wild] }, { slug: 'hundewesen', goals: [dog] }], sources: [wild, dog].map(item => ({ id: item.id, title: `Quelle ${item.title}`, url: `https://example.invalid/${item.id}`, reviewedOn: '2026-10-01' })) };
const alignment = { regions: [{ ...profile, status: 'confirmed', summary: 'Eng begrenzter Prüfungsrahmen.', formats: [], limits: ['Keine vollständige Prüfungsabdeckung.'], sources: [], subjectAreas: [{ id: 'regional-gebiet', label: 'Regionaler Fachbezug', limit: 'Ausgewählter Lernbezug.', sourceIds: [], goals: [regional] }] }], learningCatalog: {} };
const region = { code: 'ZH', name: 'Zürich', sources: [], examResources: [], totalQuestionCount: 1, totalArticleCount: 1 };
const data = { categories, countries: [{ code: 'CH', regions: [region] }] };
const address = query => base + (Object.keys(query).length ? '?' + new URLSearchParams(Object.entries(query).flatMap(([key, value]) => (Array.isArray(value) ? value : [value]).map(item => [key, item]))).toString() : '');
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const nativeProps = node => node[Object.keys(node).find(key => key.startsWith('__reactProps$'))];
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

async function fixture(t, { query = {}, ready = true, marks = {}, profileReady = true } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://exam.invalid' + address(query) });
  const values = new Map(), writes = [], menus = [], focuses = [], scrolls = [], navigation = [], originals = new Map(), frames = new Map(); let frame = 0, mounted = true;
  if (Object.keys(marks).length) values.set('jagdlatein-exam-goals-v1', JSON.stringify({ version: 1, profiles: { 'CH:ZH': marks } }));
  Object.defineProperty(dom.window, 'localStorage', { configurable: true, value: { getItem: key => values.get(key) ?? null, setItem(key, value) { writes.push([key, value]); values.set(key, value); }, removeItem(key) { writes.push([key, null]); values.delete(key); } } });
  dom.window.scrollTo = value => scrolls.push(value);
  dom.window.requestAnimationFrame = callback => { const id = ++frame; frames.set(id, callback); return id; };
  dom.window.cancelAnimationFrame = id => frames.delete(id);
  const focus = dom.window.HTMLElement.prototype.focus;
  dom.window.HTMLElement.prototype.focus = function(options) { focuses.push(this.id); focus.call(this, options); };
  const router = { isReady: ready, query, asPath: address(query), push(href, as, options) { const item = { href, as, options, ...deferred() }; navigation.push(item); return item.promise; } };
  let account = { profile, ready: profileReady, persistence: 'device', accountKey: null, saving: false, saveProfile() { throw new Error('Reading selection cannot change exam target'); }, clearProfile() { throw new Error('Reading selection cannot clear exam target'); } };
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true, fetch() { throw new Error('No live request allowed'); } })) { originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value }); }
  const wrap = value => ({ __esModule: true, default: value });
  const PageMenu = ({ children }) => React.createElement('aside', { id: 'lower-menu' }, children);
  const Link = ({ href, prefetch, children, ...rest }) => React.createElement('a', { href, ...rest }, children);
  const product = createLoader({ 'next/router': { useRouter: () => router }, 'next/link': wrap(Link), './PageMenu': { ...wrap(PageMenu), closePageMenu() { menus.push('close'); }, openPageMenu(id) { menus.push(id); } }, '../components/PageMenu': { closePageMenu() { menus.push('close'); }, openPageMenu(id) { menus.push(id); } }, './LearningToolLayout': wrap(({ title, children }) => React.createElement('main', null, React.createElement('h1', { id: 'page-start', tabIndex: -1, 'data-learning-page-start': '' }, title), children)), '../lib/use-exam-profile': wrap(() => account), '../lib/use-exam-review-progress': wrap(() => ({ phase: 'ready', summary: { byCategory: {}, total: { answered: 0, due: 0, mistakes: 0 } } })) });
  const Component = product('components/ExamStudyPlan.js').default;
  const root = local('react-dom/client').createRoot(document.getElementById('root'));
  async function render() { await React.act(async () => { root.render(React.createElement(Component, { data, examBlueprint: blueprint, examAlignment: alignment })); await settle(); }); }
  function mutate(nextQuery, hash = '', isReady = true) { router.query = nextQuery; router.asPath = address(nextQuery) + (hash ? '#' + hash : ''); router.isReady = isReady; dom.window.history.replaceState(null, '', router.asPath); }
  async function route(nextQuery, hash = '', isReady = true) { mutate(nextQuery, hash, isReady); await render(); }
  const selector = id => document.getElementById(id);
  const choice = (id, value) => selector(id)?.querySelector(`button[data-menu-choice="${value}"]`);
  const selected = id => selector(id)?.querySelector('button[aria-pressed="true"]')?.getAttribute('data-menu-choice') || '';
  async function change(id, value, handler) { let action; await React.act(async () => { action = (handler || nativeProps(choice(id, value)).onClick)(); await settle(); }); return { action, request: navigation.at(-1) }; }
  async function finish(request, result = true, reject = false) { await React.act(async () => { reject ? request.reject(result) : request.resolve(result); await settle(); }); }
  async function unmount() { if (mounted) { mounted = false; await React.act(async () => root.unmount()); } }
  t.after(async () => { await unmount(); dom.window.close(); for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  await render(); return { dom, product, values, writes, menus, focuses, scrolls, navigation, frames, router, render, selector, choice, selected, change, finish, route, mutate, unmount, text: () => document.getElementById('root').textContent, goals: () => [...document.querySelectorAll('li h4')].map(item => item.textContent), async timers() { await React.act(async () => { await new Promise(resolve => setTimeout(resolve, 1)); }); }, async account(next) { account = { ...account, ...next }; await render(); } };
}

test('Bare all-state reading retains full common and regional learning text without writing a mark', async t => {
  const h = await fixture(t); assert.equal(h.selected('exam-plan-state'), 'alle');
  for (const item of [wild, dog, regional]) assert.ok(h.text().includes(item.task));
  assert.match(h.text(), /3 von 3 Lernzielen passen/); assert.equal(h.writes.length, 0);
  assert.ok(document.querySelector('#lower-menu #exam-plan-state')); assert.equal(document.querySelectorAll('dialog').length, 0);
});

test('Exact deep-link state filters common and regional goals together and sources describe displayed common goals only', async t => {
  const h = await fixture(t, { query: { stand: 'ueben' }, marks: { [wild.id]: 'ueben', [dog.id]: 'erklaert', [regional.id]: 'ueben' } });
  assert.ok(h.text().includes(wild.task)); assert.ok(h.text().includes(regional.task)); assert.ok(!h.text().includes(dog.task));
  assert.match(h.text(), /2 von 3 Lernzielen passen/); assert.match(h.text(), /1 von 1 regionalen Lernzielen/);
  const sources = document.getElementById('exam-plan-sources'); assert.equal(sources.open, false); assert.ok(sources.textContent.includes('Quelle Wildmerkmale')); assert.ok(!sources.textContent.includes('Quelle Hundeaufgabe'));
  assert.equal(h.writes.length, 0);
});

test('Empty, unknown and repeated status fields deliberately request selection help without substituting goals', async t => {
  const h = await fixture(t);
  for (const value of ['', 'unknown', ['ueben'], ['offen', 'erklaert']]) {
    await h.route({ stand: value }); await h.timers(); assert.equal(h.selected('exam-plan-state'), '');
    for (const item of [wild, dog, regional]) assert.ok(!h.text().includes(item.task));
    assert.match(h.text(), /Dieser Lernstand ist nicht verfügbar/); assert.equal(h.menus.at(-1), 'exam-plan-state');
  }
  assert.equal(h.writes.length, 0);
});

test('Router and profile readiness do not flash another selection or turn an unread local stand into an empty result', async t => {
  const h = await fixture(t, { query: { stand: 'ueben' }, ready: false, profileReady: false });
  assert.equal(h.selector('exam-plan-state').disabled, true); assert.ok(!h.text().includes(wild.task));
  await h.route({ stand: 'ueben' }); assert.match(h.text(), /Wähle dein Prüfungsziel, um nach deinem persönlichen Lernstand zu filtern/); assert.doesNotMatch(h.text(), /Keine Lernziele mit diesem Stand/);
  await h.account({ ready: true }); assert.match(h.text(), /Keine Lernziele mit diesem Stand/); assert.equal(h.writes.length, 0);
});

test('Status push preserves committed category and unrelated context and changes the text only after URL commit', async t => {
  const h = await fixture(t, { query: { kategorie: 'wildkunde', quelle: 'suche', q: 'Merkmale' } }); const before = h.text(), focus = h.focuses.length;
  const operation = await h.change('exam-plan-state', 'ueben'); assert.equal(h.text(), before); assert.equal(h.focuses.length, focus);
  assert.deepEqual(operation.request.href, { pathname: base, query: { kategorie: 'wildkunde', quelle: 'suche', q: 'Merkmale', stand: 'ueben' }, hash: 'exam-plan-learning' });
  await h.finish(operation.request); assert.equal(h.text(), before); await h.route(operation.request.href.query, operation.request.href.hash);
  assert.equal(h.selected('exam-plan-state'), 'ueben'); assert.ok(!h.text().includes(wild.task)); assert.equal(document.activeElement.id, 'page-start'); assert.equal(h.writes.length, 0);
});

test('Failed or cancelled navigation retains the existing text and marks and obsolete failures do not replace later history', async t => {
  const h = await fixture(t, { marks: { [wild.id]: 'ueben' } }); const bytes = [...h.values];
  for (const mode of ['false', 'error', 'cancel']) { const action = await h.change('exam-plan-state', 'ueben'); await h.finish(action.request, mode === 'false' ? false : Object.assign(new Error('Synthetic failure'), mode === 'cancel' ? { cancelled: true } : {}), mode !== 'false'); assert.equal(h.selected('exam-plan-state'), 'alle'); assert.ok(h.text().includes(dog.task)); assert.deepEqual([...h.values], bytes); }
  const action = await h.change('exam-plan-state', 'ueben'); await h.route({ stand: 'erklaert' }, 'history'); await h.finish(action.request, new Error('Old failure'), true); assert.equal(h.selected('exam-plan-state'), 'erklaert'); assert.ok(!document.querySelector('[role="alert"]')); assert.equal(h.writes.length, 0);
});

test('Changing a visible mark retains its exact focused control, reports true matches separately and reapplies without extra history', async t => {
  const h = await fixture(t, { query: { stand: 'ueben' }, marks: { [wild.id]: 'ueben' } });
  const control = document.querySelector('select[aria-label="Wildmerkmale: Mein Stand"]'); control.focus(); const focus = h.focuses.length, scroll = h.scrolls.length;
  await React.act(async () => { nativeProps(control).onChange({ target: { value: 'erklaert' } }); await settle(); });
  assert.equal(document.activeElement, control); assert.equal(document.querySelector('select[aria-label="Wildmerkmale: Mein Stand"]'), control); assert.equal(control.value, 'erklaert'); assert.equal(h.focuses.length, focus); assert.equal(h.scrolls.length, scroll);
  assert.match(h.text(), /0 von 3 Lernzielen passen/); assert.match(h.text(), /1 geänderte Einträge/); assert.match(h.text(), /Stand geändert/); assert.ok(h.text().includes(wild.task));
  const pushes = h.navigation.length; await h.change('exam-plan-state', 'ueben'); assert.equal(h.navigation.length, pushes); assert.ok(!h.text().includes(wild.task)); assert.equal(document.activeElement.id, 'page-start');
  const saved = JSON.parse(h.values.get('jagdlatein-exam-goals-v1')); assert.equal(saved.profiles['CH:ZH'][wild.id], 'erklaert');
});

test('Reading history and target changes discard temporary row retention while restoring each independently saved mark', async t => {
  const h = await fixture(t, { query: { stand: 'offen' } });
  const node = document.querySelector('select[aria-label="Wildmerkmale: Mein Stand"]'); await React.act(async () => nativeProps(node).onChange({ target: { value: 'erklaert' } })); assert.ok(h.text().includes(wild.task));
  await h.route({ stand: 'erklaert' }); assert.ok(h.text().includes(wild.task)); assert.ok(!h.text().includes(dog.task));
  await h.route({ stand: 'offen' }); assert.ok(!h.text().includes(wild.task));
  await h.account({ profile: { country: 'AT', region: 'NOE' } }); assert.ok(h.text().includes(wild.task)); assert.ok(!h.text().includes(regional.task));
  await h.account({ profile }); assert.ok(!h.text().includes(wild.task)); const saved = JSON.parse(h.values.get('jagdlatein-exam-goals-v1')); assert.equal(saved.profiles['CH:ZH'][wild.id], 'erklaert');
});

test('Retained old status and mark handlers stop before render on raw URL changes and after genuine unmount', async t => {
  const h = await fixture(t, { query: { stand: 'offen' } }); const oldFilter = nativeProps(h.choice('exam-plan-state', 'ueben')).onClick, oldMark = nativeProps(document.querySelector('select[aria-label="Wildmerkmale: Mein Stand"]')).onChange;
  h.mutate({ stand: 'erklaert' }, 'external'); await h.change('exam-plan-state', 'ueben', oldFilter); await React.act(async () => oldMark({ target: { value: 'ueben' } })); assert.equal(h.navigation.length, 0); assert.equal(h.writes.length, 0);
  await h.route({ stand: 'offen' }); const filter = nativeProps(h.choice('exam-plan-state', 'ueben')).onClick; await h.unmount(); await h.change('exam-plan-state', 'ueben', filter); await React.act(async () => oldMark({ target: { value: 'ueben' } })); assert.equal(h.navigation.length, 0); assert.equal(h.writes.length, 0);
});

test('The same target and URL cannot retain another account’s previously focused row', async t => {
  const h = await fixture(t, { query: { stand: 'offen' } });
  const control = document.querySelector('select[aria-label="Wildmerkmale: Mein Stand"]'); await React.act(async () => nativeProps(control).onChange({ target: { value: 'erklaert' } })); assert.ok(h.text().includes(wild.task)); assert.match(h.text(), /Stand geändert/);
  await h.account({ accountKey: 'synthetic-B' }); assert.doesNotMatch(h.text(), /Stand geändert/); assert.ok(!h.text().includes(wild.task));
  await h.account({ ready: false }); assert.doesNotMatch(h.text(), /Stand geändert/); await h.account({ ready: true }); assert.ok(!h.text().includes(wild.task));
});

test('An external storage update keeps the actually focused goal without rewriting that update or retaining every other row', async t => {
  const h = await fixture(t, { query: { stand: 'ueben' }, marks: { [wild.id]: 'ueben', [dog.id]: 'ueben' } });
  const control = document.querySelector('select[aria-label="Wildmerkmale: Mein Stand"]'); await React.act(async () => control.focus());
  const key = 'jagdlatein-exam-goals-v1', raw = JSON.stringify({ version: 1, profiles: { 'CH:ZH': { [wild.id]: 'erklaert', [dog.id]: 'erklaert' } } });
  h.values.set(key, raw); await React.act(async () => { const event = new h.dom.window.Event('storage'); for (const [name, value] of Object.entries({ key, newValue: raw, storageArea: h.dom.window.localStorage })) Object.defineProperty(event, name, { value }); h.dom.window.dispatchEvent(event); await settle(); });
  assert.equal(document.activeElement, control); assert.equal(control.value, 'erklaert'); assert.ok(h.text().includes(wild.task)); assert.ok(!h.text().includes(dog.task)); assert.match(h.text(), /0 von 3 Lernzielen passen/); assert.match(h.text(), /1 geänderte Einträge/);
  assert.equal(h.values.get(key), raw); assert.equal(h.writes.length, 0); await h.change('exam-plan-state', 'ueben'); assert.ok(!h.text().includes(wild.task));
});

test('Switching the category keeps the displayed status; resetting only status removes no category or search fields', async t => {
  const h = await fixture(t, { query: { kategorie: 'wildkunde', stand: 'ueben', quelle: 'suche' } });
  const first = await h.change('exam-plan-topic', 'hundewesen'); assert.deepEqual(first.request.href.query, { kategorie: 'hundewesen', stand: 'ueben', quelle: 'suche' });
  const second = await h.change('exam-plan-state', 'alle'); assert.deepEqual(second.request.href.query, { kategorie: 'wildkunde', quelle: 'suche' }, 'An uncommitted category never leaks into the next choice');
  await h.route(second.request.href.query, second.request.href.hash); await h.finish(second.request); const menuCount = h.menus.length; await h.finish(first.request, new Error('Superseded'), true); assert.equal(h.menus.length, menuCount); assert.equal(h.selected('exam-plan-topic'), 'wildkunde'); assert.equal(h.selected('exam-plan-state'), 'alle'); assert.equal(h.writes.length, 0);
});
