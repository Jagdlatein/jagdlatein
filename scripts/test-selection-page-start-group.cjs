// Actual React DOM owners, actual MenuChoice and shared selection-focus hook.
// All records, router commits, media, speech and network are isolated doubles.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const defer = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
function address(base, query, hash = '') { return base + '?' + new URLSearchParams(query) + (hash ? '#' + hash : ''); }
function handler(element, name = 'onClick') { assert.ok(element); const key = Object.keys(element).find(key => key.startsWith('__reactProps$')); return element[key][name]; }
async function fixture(t, file, base, query, props, hash = '') {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://example.invalid' + address(base, query, hash) });
  const saved = new Map(), nav = [], scrolls = [], frames = new Map(), cancelled = [], menu = { closed: 0, opened: 0 }; let sequence = 0;
  dom.window.scrollTo = options => scrolls.push({ kind: 'top', ...options });
  dom.window.HTMLElement.prototype.scrollIntoView = function(options) { scrolls.push({ kind: 'anchor', id: this.id, ...options }); };
  dom.window.HTMLMediaElement.prototype.pause = () => {};
  dom.window.requestAnimationFrame = fn => { const id = ++sequence; frames.set(id, fn); return id; };
  dom.window.cancelAnimationFrame = id => { cancelled.push(id); frames.delete(id); };
  const router = { isReady: true, query, asPath: address(base, query, hash), push(href, as, options) { const job = { href, as, options, ...defer() }; nav.push(job); return job.promise; } };
  const values = { window: dom.window, document: dom.window.document, navigator: dom.window.navigator, MutationObserver: dom.window.MutationObserver, IS_REACT_ACT_ENVIRONMENT: true, fetch: () => new Promise(() => {}) };
  for (const [key, value] of Object.entries(values)) { saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value }); }
  const Component = createLoader({ 'next/router': { useRouter: () => router }, 'next/script': () => null, 'next/link': ({ href, children, ...rest }) => React.createElement('a', { ...rest, href: typeof href === 'string' ? href : href.pathname }, children), 'next/image': ({ priority, fill, ...rest }) => React.createElement('img', rest), './LearningToolLayout': { __esModule: true, default: ({ title, children }) => React.createElement('main', null, React.createElement('h1', { tabIndex: -1, 'data-learning-page-start': true }, title), children) }, './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', { 'data-lower-menu': true }, children), closePageMenu() { menu.closed++; }, openPageMenu() { menu.opened++; } }, './JagdakademiePromotion': () => null })(file).default;
  let root = local('react-dom/client').createRoot(document.getElementById('root'));
  const render = () => React.act(async () => { root.render(React.createElement(Component, props)); await settle(); });
  async function route(next, nextHash = '') { router.query = next; router.asPath = address(base, next, nextHash); dom.window.history.replaceState(null, '', router.asPath); await render(); }
  async function commit(job) { await route(job.href.query, job.href.hash); await React.act(async () => { job.resolve(true); await settle(); }); }
  async function click(element) { assert.ok(element, 'Expected a real mounted action'); await React.act(async () => { element.click(); await settle(); }); }
  const choice = (id, value) => [...document.querySelectorAll('#' + id + ' button[data-menu-choice]')].find(button => button.dataset.menuChoice === value);
  const button = label => [...document.querySelectorAll('button')].find(button => button.textContent === label);
  async function unmount() { if (root) { await React.act(async () => root.unmount()); root = null; } }
  t.after(async () => { await unmount(); dom.window.close(); for (const [key, old] of saved) if (old) Object.defineProperty(globalThis, key, old); else delete globalThis[key]; });
  await render(); scrolls.length = 0; frames.clear();
  return { dom, router, nav, scrolls, frames, cancelled, menu, render, route, commit, click, choice, button, unmount, reset() { scrolls.length = 0; }, text: () => document.querySelector('main').textContent };
}
function atTop(h) {
  assert.equal(document.activeElement.tagName, 'H1');
  assert.ok(h.scrolls.some(scroll => scroll.kind === 'top' && scroll.top === 0 && scroll.left === 0 && scroll.behavior === 'instant'));
  assert.equal(h.scrolls.filter(scroll => scroll.kind === 'anchor').length, 0);
}

for (const entry of [
  { name: 'Anatomy', file: 'components/AnatomyExplorer.js', base: '/lernen/anatomie', query: { eintrag: 'schaedel', quelle: 'suche' }, id: 'anatomy-entry-select', value: 'unterkiefer' },
  { name: 'Journal reading', file: 'components/DogTrainingJournal.js', base: '/lernen/hundetraining-tagebuch', query: { eintrag: 'pflege', quelle: 'suche' }, id: 'journal-exercise-select', value: 'rueckruf' },
]) test(entry.name + ' uses real one-layer buttons, commits before top focus and rejects retained unmounted actions', async t => {
  const h = await fixture(t, entry.file, entry.base, entry.query);
  assert.equal(document.querySelectorAll('aside select').length, 0);
  const control = h.choice(entry.id, entry.value), oldHandler = handler(control), before = h.text();
  assert.equal(control.type, 'button'); await h.click(control);
  assert.equal(h.nav.length, 1); assert.equal(h.text(), before); assert.deepEqual(h.scrolls, []);
  assert.deepEqual(h.nav[0].options, { shallow: true, scroll: false }); assert.equal(h.nav[0].href.query.quelle, 'suche');
  await h.commit(h.nav[0]); atTop(h); assert.equal(h.choice(entry.id, entry.value).getAttribute('aria-pressed'), 'true');
  const oldFrame = [...h.frames.values()][0]; await h.unmount(); const count = h.scrolls.length;
  await React.act(async () => { oldHandler(); oldFrame?.(); await settle(); });
  assert.equal(h.nav.length, 1); assert.equal(h.scrolls.length, count);
});

test('Anatomy keeps the explicit question destination open and anchored while ordinary museum choices go to the page start', async t => {
  const h = await fixture(t, 'components/AnatomyExplorer.js', '/lernen/anatomie', { eintrag: 'unterkiefer' }, undefined, 'anatomie-fragen');
  assert.equal(document.getElementById('anatomie-fragen').closest('details').open, true);
  assert.equal(document.activeElement.id, 'anatomie-fragen');
  await h.click(h.choice('anatomy-entry-select', 'schaedel')); await h.commit(h.nav[0]); atTop(h);
});

test('Video case selection reaches the page start; a direct text version still opens the real transcript', async t => {
  const cases = createLoader()('lib/wildlife-video-cases.js').wildlifeVideoCases;
  const h = await fixture(t, 'components/WildlifeVideoCases.js', '/lernen/wildtier-videofaelle', { eintrag: cases[0].id });
  const select = [...document.querySelectorAll('aside button')].find(button => button.textContent.includes(cases[1].title));
  const before = document.getElementById('video-fall').textContent; await h.click(select);
  assert.equal(document.getElementById('video-fall').textContent, before); assert.deepEqual(h.scrolls, []);
  await h.commit(h.nav[0]); atTop(h); h.reset();
  await h.route({ eintrag: cases[1].id }, 'video-textfassung');
  assert.equal(document.getElementById('video-textfassung').open, true); assert.equal(document.activeElement.id, 'video-textfassung');
  assert.ok(h.scrolls.some(scroll => scroll.kind === 'anchor' && scroll.id === 'video-textfassung'));
  assert.equal(h.scrolls.filter(scroll => scroll.kind === 'top').length, 0);
});

test('Oral menu selection starts at the page heading but rated Next remains a question exercise destination', async t => {
  const questions = createLoader()('lib/oral-exam-trainer.js').oralExamQuestions;
  const h = await fixture(t, 'components/OralExamTrainer.js', '/lernen/pruefungsgespraech', { eintrag: questions[0].id });
  assert.equal(document.querySelectorAll('aside select').length, 0);
  await h.click(h.choice('exam-question-select', questions[1].id)); await h.commit(h.nav[0]); atTop(h); h.reset();
  const spoken = [...document.querySelectorAll('input[type="checkbox"]')][0]; await h.click(spoken);
  await h.click(h.button('Mit der Musterantwort vergleichen')); await h.click(h.button('Sicher erklärt'));
  await h.click(h.button('Nächste Frage')); assert.equal(h.nav.length, 2); assert.deepEqual(h.scrolls, []);
  await h.commit(h.nav[1]);
  assert.equal(document.activeElement.id, 'exam-question-title'); assert.ok(h.scrolls.some(scroll => scroll.kind === 'anchor' && scroll.id === 'exam-question-title'));
  assert.equal(h.scrolls.filter(scroll => scroll.kind === 'top').length, 0);
});

test('Daily round selection uses actual pressed buttons and reaches the page start while a failed push leaves the shown pool', async t => {
  const pool = [{ id: 'synthetic-wild', category: 'wildkunde' }, { id: 'synthetic-dog', category: 'hundewesen' }];
  const h = await fixture(t, 'components/DailyReview.js', '/lernen/fuenf-minuten', { modus: 'gemischt' }, { pool });
  assert.equal(document.querySelectorAll('aside select').length, 0);
  await h.click(h.choice('review-category', 'hundewesen')); assert.equal(h.nav.length, 1); assert.deepEqual(h.scrolls, []);
  await React.act(async () => { h.nav[0].reject(new Error('Isolated refused navigation')); await settle(); });
  assert.equal(h.choice('review-category', '').getAttribute('aria-pressed'), 'true'); assert.deepEqual(h.scrolls, []);
  await h.click(h.choice('review-category', 'hundewesen')); await h.commit(h.nav[1]); atTop(h);
});
