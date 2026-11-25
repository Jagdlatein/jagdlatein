// Real React commits and native controls in an isolated DOM. No real browser,
// account, storage, photograph upload, API request or persistence is involved.
const test = require('node:test'), assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
let JSDOM;
try { ({ JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom')); }
catch (error) { throw new Error('Set JAGDLATEIN_TEST_DOM to the isolated installed jsdom module; no repository dependency is required.', { cause: error }); }
const React = local('react');
const catalogue = createLoader()('lib/photo-detective.js').photoDetectiveRounds;
const tick = () => new Promise(resolve => setImmediate(resolve));
const query = href => { const params = new URL(href, 'https://jagdlatein.test').searchParams, value = {}; for (const key of new Set(params.keys())) { const values = params.getAll(key); value[key] = values.length > 1 ? values : values[0]; } return value; };
async function fixture(url = '/lernen/fotodetektiv') {
  const dom = new JSDOM('<!doctype html><html><body><div id="test-root"></div><nav><details id="menu"><summary>Menü</summary><div id="jl-page-menu"></div></details></nav></body></html>', { url: 'https://jagdlatein.test' + url });
  const { window } = dom, saved = new Map(), frames = new Map(); let frame = 0;
  const events = { focus: [], scroll: [], anchors: [] };
  window.requestAnimationFrame = callback => { frames.set(++frame, callback); return frame; }; window.cancelAnimationFrame = id => frames.delete(id);
  window.scrollTo = value => events.scroll.push(value); window.HTMLElement.prototype.scrollIntoView = function(value) { events.anchors.push({ element: this, value }); };
  window.document.addEventListener('focusin', event => events.focus.push(event.target));
  for (const [key, value] of Object.entries({ window, document: window.document, navigator: window.navigator, HTMLElement: window.HTMLElement, MutationObserver: window.MutationObserver, IS_REACT_ACT_ENVIRONMENT: true })) { saved.set(key, Object.getOwnPropertyDescriptor(global, key)); Object.defineProperty(global, key, { configurable: true, writable: true, value }); }
  const router = { isReady: true, asPath: url, query: query(url) }, requests = [];
  router.push = (href, as, options) => { const request = { href, as, options }; requests.push(request); return new Promise((resolve, reject) => Object.assign(request, { resolve, reject })); };
  const load = createLoader({
    'next/router': { useRouter: () => router }, 'next/head': () => null,
    'next/link': ({ href, children, prefetch, ...props }) => React.createElement('a', { href, ...props }, children),
    'next/image': ({ priority, fill, ...props }) => React.createElement('img', props),
    './AppIcon': { __esModule: true, default: () => null },
  });
  const Page = load('components/PhotoDetective.js').default, { createRoot } = local('react-dom/client');
  const host = window.document.getElementById('test-root'), root = createRoot(host); let disposed = false;
  const render = async () => React.act(async () => { root.render(React.createElement(Page)); await Promise.resolve(); });
  const f = { window, router, requests, host, events, render,
    get text() { return host.textContent; }, get menu() { return window.document.getElementById('menu'); },
    button(label) { const result = [...window.document.querySelectorAll('button')].find(button => button.textContent.trim() === label); assert.ok(result, label); return result; },
    async click(label) { const button = this.button(label); assert.equal(button.disabled, false, label); await React.act(async () => { button.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }); },
    async pick(value, field = 'photo-detective-species') { const button = window.document.querySelector(`#${field} button[data-menu-choice="${value}"]`); assert.ok(button, `${field}:${value}`); assert.equal(button.disabled, false); this.menu.open = true; button.focus(); this.clearEvents(); await React.act(async () => button.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))); },
    handler(element, name = 'onClick') { return element[Object.keys(element).find(key => key.startsWith('__reactProps'))][name]; },
    async update(href, { browser = true, router: updateRouter = true, ready = true } = {}) { if (browser) window.history.replaceState(null, '', href); if (updateRouter) { router.asPath = href; router.query = query(href); } router.isReady = ready; window.document.getElementById('jl-page-menu').setAttribute('data-page-menu-route', window.location.pathname + window.location.search); await render(); },
    async resolve(index, result = true) { await React.act(async () => { requests[index].resolve(result); await tick(); }); },
    async reject(index, cancelled = false) { await React.act(async () => { requests[index].reject(Object.assign(new Error('Isolated transition failure'), cancelled ? { cancelled: true } : {})); await tick(); }); },
    async commit(index) { await this.update(requests[index].href); await this.resolve(index); },
    flushFrames() { const jobs = [...frames.values()]; frames.clear(); jobs.forEach(callback => callback()); },
    clearEvents() { events.focus.length = events.scroll.length = events.anchors.length = 0; },
    async dispose() { if (disposed) return; disposed = true; await React.act(async () => root.unmount()); assert.equal(frames.size, 0); window.close(); for (const [key, value] of saved) { if (value) Object.defineProperty(global, key, value); else delete global[key]; } },
  };
  window.document.getElementById('jl-page-menu').setAttribute('data-page-menu-route', window.location.pathname + window.location.search);
  await render(); f.flushFrames(); f.clearEvents(); return f;
}

test('Native lower choices push, keep the old photograph until a real commit, then close the one menu and focus/scroll to the page top', async () => {
  const f = await fixture('/lernen/fotodetektiv?art=gams&ref=own');
  try { f.menu.open = true; await f.pick('steinbock'); assert.match(f.text, /Gämse: Merkmale/); assert.equal(f.events.focus.length, 0); assert.equal(f.events.scroll.length, 0); assert.deepEqual(f.requests[0].options, { shallow: true, scroll: false });
    await f.resolve(0); assert.match(f.text, /Gämse: Merkmale/); assert.equal(f.events.scroll.length, 0); await f.update(f.requests[0].href);
    assert.match(f.text, /Alpensteinbock: Merkmale/); assert.equal(f.menu.open, false); assert.equal(f.window.document.activeElement.tagName, 'H1'); assert.equal(f.events.focus.length, 1); assert.equal(f.events.scroll.length, 1); f.flushFrames(); assert.equal(f.events.scroll.length, 2); assert.equal(f.events.anchors.length, 0);
    await f.update('/lernen/fotodetektiv?art=gams&ref=own'); assert.match(f.text, /Gämse: Merkmale/); assert.equal(f.requests.length, 1);
  } finally { await f.dispose(); }
});

test('Committed choices form native history entries; real popstate back/forward restores the precise photograph without an extra navigation request', async () => {
  const f = await fixture('/lernen/fotodetektiv?art=gams');
  try {
    for (const id of ['steinbock', 'feldhase']) { await f.pick(id); const index = f.requests.length - 1, target = f.requests[index].href; f.window.history.pushState(null, '', target); await f.update(target, { browser: false }); await f.resolve(index); }
    assert.equal(f.window.history.length, 3); assert.match(f.text, /Feldhase: Merkmale/);
    async function travel(direction) { await new Promise((resolve, reject) => { f.window.addEventListener('popstate', () => { const location = f.window.location; f.update(location.pathname + location.search + location.hash, { browser: false }).then(resolve, reject); }, { once: true }); f.window.history[direction](); }); }
    await travel('back'); assert.match(f.text, /Alpensteinbock: Merkmale/); await travel('back'); assert.match(f.text, /Gämse: Merkmale/); await travel('forward'); assert.match(f.text, /Alpensteinbock: Merkmale/); assert.equal(f.requests.length, 2);
  } finally { await f.dispose(); }
});

for (const phase of ['direct', 'browser-first', 'router-first']) test(`Own same-semantic return commits focus once across ${phase} readiness without granting an old handler`, async () => {
  const f = await fixture('/lernen/fotodetektiv?art=gams');
  try { await f.pick('steinbock'); await f.pick('gams'); const target = f.requests[1].href, retained = f.handler(f.window.document.querySelector('#photo-detective-species button[data-menu-choice="feldhase"]'));
    if (phase !== 'direct') { await f.update(target, { browser: phase === 'browser-first', router: phase === 'router-first' }); assert.equal(f.host.querySelector('img'), null); assert.equal(f.events.scroll.length, 0); await React.act(async () => retained()); assert.equal(f.requests.length, 2); }
    await f.update(target); assert.match(f.text, /Gämse: Merkmale/); assert.equal(f.events.focus.length, 1); assert.equal(f.events.scroll.length, 1); f.flushFrames(); assert.equal(f.events.scroll.length, 2);
  } finally { await f.dispose(); }
});

test('Current false/reject/cancelled in either readiness gap discards focus intent; obsolete failure cannot cancel the newest valid commit', async () => {
  for (const phase of ['browser-first', 'router-first']) for (const outcome of ['false', 'reject', 'cancelled']) {
    const f = await fixture('/lernen/fotodetektiv?art=gams');
    try { await f.pick('steinbock'); await f.pick('gams'); const target = f.requests[1].href; await f.update(target, { browser: phase === 'browser-first', router: phase === 'router-first' }); if (outcome === 'false') await f.resolve(1, false); else await f.reject(1, outcome === 'cancelled'); await f.update(target); assert.equal(f.events.focus.length, 0); assert.equal(f.events.scroll.length, 0); }
    finally { await f.dispose(); }
  }
  const f = await fixture('/lernen/fotodetektiv?art=gams');
  try { await f.pick('steinbock'); await f.pick('gams'); await f.reject(0); await f.commit(1); assert.equal(f.events.focus.length, 1); assert.equal(f.host.querySelector('[role="alert"]'), null); }
  finally { await f.dispose(); }
});

test('Unrelated full-query/hash drift invalidates an old native action permanently, including an unready gap before an old focus target', async () => {
  const f = await fixture('/lernen/fotodetektiv?art=gams&ref=one');
  try { const handler = f.handler(f.window.document.querySelector('#photo-detective-species button[data-menu-choice="steinbock"]')); f.window.history.replaceState(null, '', '/lernen/fotodetektiv?art=gams&ref=two#foreign'); await React.act(async () => handler()); assert.equal(f.requests.length, 0);
    await f.update('/lernen/fotodetektiv?art=gams&ref=one'); await React.act(async () => handler()); assert.equal(f.requests.length, 0);
    await f.pick('steinbock'); await f.pick('gams'); const target = f.requests[1].href; await f.update(target + '&foreign=unexpected', { router: false }); await f.update(target); assert.equal(f.events.focus.length, 0); assert.equal(f.events.scroll.length, 0);
  } finally { await f.dispose(); }
});

test('The reproduced stale explorer helper cannot taint an unviewed quiz answer, and old photo markers cannot select a new photograph', async () => {
  const f = await fixture('/lernen/fotodetektiv?art=gams');
  try { const staleSpecies = f.handler(f.window.document.querySelector('#photo-detective-species button[data-menu-choice="steinbock"]')); const staleMarker = f.handler(f.button('2'));
    await f.pick('quiz', 'photo-detective-view'); await f.commit(0); await f.click(catalogue[0].name); await f.click('Nächstes Foto'); await React.act(async () => staleSpecies()); assert.equal(f.requests.length, 1);
    await f.click(catalogue[1].name); assert.match(f.text, /1 richtig ohne Hilfe/); assert.doesNotMatch(f.text, /Mit Merkmals-Hilfe beantwortet/);
    await f.update('/lernen/fotodetektiv?art=steinbock'); await React.act(async () => staleMarker()); assert.equal(f.host.querySelector('.locator'), null); assert.equal(f.host.querySelector('.leader'), null);
  } finally { await f.dispose(); }
});

test('Only committed visible feature reading assists a question; failed choices preserve hints, answers, question index and completed review pool', async () => {
  const f = await fixture();
  try { await f.click('Merkmale als Hilfe anzeigen'); await f.click(catalogue[0].name); await f.click('Nächstes Foto'); await f.pick('merkmale', 'photo-detective-view'); await f.commit(0); assert.equal(f.host.querySelector('img'), null);
    await f.pick('steinbock'); await f.resolve(1, false); await f.pick('feldhase'); await f.commit(2); await f.pick('quiz', 'photo-detective-view'); await f.commit(3); assert.match(f.text, /Foto 2 von 8/); await f.click(catalogue[1].name); assert.match(f.text, /1 richtig ohne Hilfe/); assert.doesNotMatch(f.text, /Mit Merkmals-Hilfe beantwortet/);
    await f.click('Nächstes Foto'); await f.click(catalogue[2].name); assert.match(f.text, /Mit Merkmals-Hilfe beantwortet/);
    for (let index = 3; index < catalogue.length; index++) { await f.click('Nächstes Foto'); await f.click(catalogue[index].name); } await f.click('Auswertung ansehen'); assert.match(f.text, /8 von 8 Arten richtig erkannt/);
    await f.update('/lernen/fotodetektiv?art=steinbock'); await f.update('/lernen/fotodetektiv'); assert.match(f.text, /8 von 8 Arten richtig erkannt/); await f.click('Fehler und Hilfefragen wiederholen (2)'); assert.match(f.text, /Foto 1 von 2/);
  } finally { await f.dispose(); }
});

test('All eight live quiz questions have four native answers, concealed species before reveal, and clean original feedback for each fourth choice', async () => {
  const f = await fixture();
  try { for (const [index, round] of catalogue.entries()) { const choices = f.host.querySelectorAll('[aria-label="Art auswählen"] button'); assert.equal(choices.length, 4); assert.equal(f.host.querySelector('img').alt, round.neutralAlt); assert.equal(f.host.querySelector('.traitDetail'), null); assert.equal(f.host.querySelector('.locator'), null);
      const answer = f.button(round.options[3]), stale = f.handler(answer); await React.act(async () => { answer.dispatchEvent(new f.window.MouseEvent('click', { bubbles: true })); stale(); }); assert.match(f.text, /Vergleiche die sichtbaren Merkmale mit der Erklärung zum Foto/); assert.ok(f.text.includes(round.explanation)); assert.equal(f.host.querySelector('img').alt, round.photo.alt); await f.click(index === 7 ? 'Auswertung ansehen' : 'Nächstes Foto'); }
    assert.match(f.text, /0 von 8 Arten richtig erkannt/); await f.click('Fehler und Hilfefragen wiederholen (8)'); assert.match(f.text, /Wiederholung · Foto 1 von 8/);
  } finally { await f.dispose(); }
});

test('Captured select, hint, answer and feature handlers stop before navigation or state mutations after actual unmount', async () => {
  const f = await fixture(), callbacks = [];
  callbacks.push(f.handler(f.button('Merkmale als Hilfe anzeigen')), f.handler(f.button(catalogue[0].name)));
  await f.update('/lernen/fotodetektiv?art=gams'); callbacks.push(f.handler(f.button('2')), f.handler(f.window.document.querySelector('#photo-detective-species button[data-menu-choice="steinbock"]')));
  const requests = f.requests.length; await f.dispose(); for (const callback of callbacks) await callback(); assert.equal(f.requests.length, requests);
});

test('Native source disclosure is unique, closed and last after observation, with exact active-photo and all-eight-result source associations', async () => {
  const f = await fixture();
  const source = () => [...f.host.querySelectorAll('details')].filter(details => details.querySelector('summary')?.textContent === 'Fachquellen zur Erklärung');
  function check(expected) {
    const found = source(); assert.equal(found.length, expected.length ? 1 : 0); if (!expected.length) return;
    const details = found[0]; assert.equal(details.open, false); assert.equal(details.parentElement.lastElementChild, details); assert.equal(details.previousElementSibling.tagName, 'ASIDE');
    assert.deepEqual([...details.querySelectorAll('section')].map(section => ({ name: section.querySelector('h3').textContent, sources: [...section.querySelectorAll('a')].map(link => ({ title: link.textContent, url: link.getAttribute('href') })) })), expected.map(round => ({ name: round.name, sources: round.sources })));
  }
  try { check([]); await f.click('Merkmale als Hilfe anzeigen'); check([]);
    for (const [index, round] of catalogue.entries()) { await f.click(round.name); check([round]); await f.click(index === 7 ? 'Auswertung ansehen' : 'Nächstes Foto'); if (index < 7) check([]); } check(catalogue);
    await f.update('/lernen/fotodetektiv?art=stockente'); check([catalogue.find(round => round.id === 'stockente')]); await f.update('/lernen/fotodetektiv?art=fasan'); check([catalogue.find(round => round.id === 'fasan')]); await f.update('/lernen/fotodetektiv?art=missing'); check([]);
    await f.update('/lernen/fotodetektiv?art=stockente', { ready: false }); check([]);
  } finally { await f.dispose(); }
});

test('An explicitly opened source disclosure remounts closed for a new photo, view, result phase or attempt while same-source context edits retain opening', async () => {
  const f = await fixture('/lernen/fotodetektiv?art=gams');
  const source = () => [...f.host.querySelectorAll('details')].find(details => details.querySelector('summary')?.textContent === 'Fachquellen zur Erklärung');
  function opened() { const details = source(); assert.ok(details); details.open = true; return details; }
  function closedAfter(previous) { const details = source(); assert.ok(details); assert.notEqual(details, previous); assert.equal(details.open, false); assert.equal(details.parentElement.lastElementChild, details); return details; }
  try {
    let previous = opened(); await f.pick('steinbock'); await f.commit(0); closedAfter(previous);
    previous = opened(); await f.update('/lernen/fotodetektiv?ansicht=merkmale&art=steinbock&ref=unchanged-source#context'); assert.equal(source(), previous); assert.equal(source().open, true);
    await f.pick('steinbock'); assert.equal(f.requests.length, 1); assert.equal(source(), previous); assert.equal(source().open, true);
    await f.update('/lernen/fotodetektiv'); assert.equal(source(), undefined); await f.click(catalogue[0].name);
    previous = opened(); await f.update('/lernen/fotodetektiv?art=gams'); closedAfter(previous);
    previous = opened(); await f.update('/lernen/fotodetektiv'); closedAfter(previous); assert.match(f.text, /Mit Merkmals-Hilfe beantwortet/);
    for (let index = 1; index < catalogue.length; index++) { await f.click('Nächstes Foto'); await f.click(catalogue[index].name); }
    previous = opened(); await f.click('Auswertung ansehen'); closedAfter(previous); assert.equal(source().querySelectorAll('section').length, 8);
    previous = opened(); await f.click('Fehler und Hilfefragen wiederholen (2)'); assert.equal(source(), undefined); await f.click(catalogue[0].name); closedAfter(previous);
    await f.click('Nächstes Foto'); await f.click(catalogue[1].options.find(option => option !== catalogue[1].name)); previous = opened(); await f.click('Auswertung ansehen'); closedAfter(previous); assert.equal(source().querySelectorAll('section').length, 2);
    previous = opened(); await f.click('Fehler und Hilfefragen wiederholen (1)'); assert.equal(source(), undefined); await f.click(catalogue[1].name); closedAfter(previous);
    previous = opened(); await f.click('Auswertung ansehen'); closedAfter(previous); assert.equal(source().querySelectorAll('section').length, 1);
    previous = opened(); await f.click('Alle Fotos neu üben'); assert.equal(source(), undefined); await f.click(catalogue[0].name); closedAfter(previous);
  } finally { await f.dispose(); }
});
