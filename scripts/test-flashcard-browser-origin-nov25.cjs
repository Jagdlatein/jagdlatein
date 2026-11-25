// Read-only, real React/native DOM probes with isolated cards/router/storage.
const test = require('node:test'), assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom');
const React = local('react'), { createRoot } = local('react-dom/client');
const categories = [{ id: 'wildkunde', title: 'Wildkunde', count: 2 }, { id: 'hundewesen', title: 'Hundewesen', count: 1 }];
const card = (id, title, categoryId = 'wildkunde') => ({ id, question: `${title}: isolierte Frage?`, answer: `${title}: richtige Antwort`, explanation: `${title}: isolierte Erklärung.`, choices: [`${title}: richtige Antwort`, 'Isolierte Alternative B', 'Isolierte Alternative C', 'Isolierte Alternative D'], categoryId, categoryTitle: categories.find(item => item.id === categoryId).title, moduleId: 'isolierter-kurs', moduleTitle: 'Isolierter Kurs', lessonId: id, courseHref: '/kurse/isolierter-kurs', sources: [], reviewedOn: '2026-10-13' });
const cards = [card('audit-reh', 'Reh'), card('audit-gams', 'Gams'), card('audit-hund', 'Hund', 'hundewesen')];
const base = '/lernen/lernkarten?kategorie=wildkunde&modus=alle&karte=audit-reh';
const query = href => { const out = {}; for (const [key, value] of new URL(href, 'https://isolated.invalid').searchParams) out[key] = Object.hasOwn(out, key) ? [].concat(out[key], value) : value; return out; };
const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
function nativeHandler(node, name) { const key = Object.keys(node).find(key => key.startsWith('__reactProps')); assert.ok(key, 'Actual mounted React DOM props exist'); return node[key][name]; }
async function fixture(href = base, extraProps = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="probe"></div><details id="menu"><summary>Menü</summary><div data-navigation-view><div id="jl-page-menu"></div></div></details></body></html>', { url: 'https://isolated.invalid' + href });
  const saved = new Map(), writes = [], calls = [], events = new Map(), frames = new Map(), timers = new Map(); let frameId = 0, mounted = true;
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, MutationObserver: dom.window.MutationObserver, IS_REACT_ACT_ENVIRONMENT: true })) { saved.set(key, Object.getOwnPropertyDescriptor(global, key)); Object.defineProperty(global, key, { configurable: true, writable: true, value }); }
  dom.window.Storage.prototype.getItem = () => null;
  dom.window.Storage.prototype.setItem = (key, value) => writes.push({ key, value: JSON.parse(value) });
  dom.window.requestAnimationFrame = fn => { const id = ++frameId; frames.set(id, fn); return id; };
  dom.window.cancelAnimationFrame = id => frames.delete(id); dom.window.scrollTo = () => {};
  dom.window.setTimeout = fn => { const id = ++frameId; timers.set(id, fn); return id; };
  dom.window.clearTimeout = id => timers.delete(id);
  dom.window.setInterval = () => ++frameId; dom.window.clearInterval = () => {};
  const emit = (name, ...args) => { for (const fn of [...(events.get(name) || [])]) fn(...args); };
  const router = { pathname: '/lernen/lernkarten', isReady: true, asPath: href, query: query(href), events: { on(name, fn) { const set = events.get(name) || new Set(); set.add(fn); events.set(name, set); }, off(name, fn) { events.get(name)?.delete(fn); } } };
  for (const kind of ['push', 'replace']) router[kind] = href => { const task = deferred(); calls.push({ kind, href, task }); emit('routeChangeStart', href, { shallow: true }); return task.promise; };
  const navigation = createLoader()('lib/flashcard-navigation.js');
  const Link = ({ href, children, onClick, prefetch, ...props }) => React.createElement('a', { ...props, href: typeof href === 'string' ? href : href.pathname, onClick: event => { onClick?.(event); if (!event.defaultPrevented) { event.preventDefault(); router.push(href); } } }, children);
  const load = createLoader({ 'next/router': { useRouter: () => router }, 'next/link': { __esModule: true, default: Link }, './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', {}, React.createElement('h1', { 'data-learning-page-start': true, tabIndex: -1 }, 'Lernkarten'), children) }, '../lib/flashcard-navigation': { ...navigation, createFlashcardURLSync: options => navigation.createFlashcardURLSync({ ...options, setTimer: dom.window.setTimeout, clearTimer: dom.window.clearTimeout }) } });
  const Component = load('components/LearningFlashcards.js').default, host = dom.window.document.getElementById('probe'), root = createRoot(host);
  async function render() { await React.act(async () => { root.render(React.createElement(Component, { cards, categories, ...extraProps })); await tick(); }); }
  await render();
  const question = () => host.querySelector('#lernkarten-frage')?.textContent || null;
  const answer = () => { const node = host.querySelector('#lernkarten-antwort'); return node ? { hidden: node.hidden, text: node.textContent } : null; };
  const button = label => { const node = [...dom.window.document.querySelectorAll('button')].find(item => item.textContent.trim() === label); assert.ok(node, label); return node; };
  const click = async label => { const node = button(label); assert.equal(node.disabled, false, label); await React.act(async () => { node.click(); await tick(); }); };
  const setBrowser = href => dom.window.history.pushState({}, '', href);
  const setRouter = href => { router.asPath = href; router.query = query(href); dom.window.document.getElementById('jl-page-menu').setAttribute('data-page-menu-route', new URL(href, 'https://isolated.invalid').pathname + new URL(href, 'https://isolated.invalid').search); };
  const complete = async index => { const request = calls[index]; assert.ok(request); await React.act(async () => { setBrowser(request.href); setRouter(request.href); request.task.resolve(true); emit('routeChangeComplete', request.href); await tick(); }); await render(); };
  const history = async href => { await React.act(async () => { setBrowser(href); setRouter(href); dom.window.dispatchEvent(new dom.window.PopStateEvent('popstate')); await tick(); }); await render(); };
  return { dom, host, router, writes, calls, question, answer, button, click, render, setBrowser, setRouter, emit, complete, history, nativeHandler, timers,
    async chooseCategory(value) { const select = host.querySelector('select[aria-label="Kategorie"]'); await React.act(async () => { if (select) { select.value = value; select.dispatchEvent(new dom.window.Event('change', { bubbles: true })); } else { const button = host.querySelector(`button[data-menu-choice="${value}"]`); assert.ok(button); assert.equal(button.disabled, false); button.click(); } await tick(); }); },
    async changeMode() { const mode = dom.window.document.querySelector('input[type="checkbox"]'); assert.ok(mode); await React.act(async () => { mode.click(); await tick(); }); },
    async browserFirst(href, nextStarted = false) { await React.act(async () => { if (nextStarted) emit('routeChangeStart', href, { shallow: true }); setBrowser(href); dom.window.dispatchEvent(new dom.window.PopStateEvent('popstate')); await tick(); }); await render(); },
    async commit(index) { const request = calls[index]; assert.ok(request); await React.act(async () => { setBrowser(request.href); setRouter(request.href); emit('routeChangeComplete', request.href); await tick(); }); await render(); },
    async accept(index, value = true) { await React.act(async () => { calls[index].task.resolve(value); await tick(); }); },
    async reject(index) { await React.act(async () => { const error = new Error('isolated rejection'); calls[index].task.reject(error); emit('routeChangeError', error, calls[index].href); await tick(); }); },
    async search(value) { const input = dom.window.document.querySelector('input[type="search"]'); assert.ok(input && !input.disabled); await React.act(async () => { nativeHandler(input, 'onChange')({ target: { value } }); await tick(); }); },
    async flushTimers() { await React.act(async () => { const jobs = [...timers.values()]; timers.clear(); jobs.forEach(fn => fn()); await tick(); }); },
    async unmount() { if (mounted) { await React.act(async () => root.unmount()); mounted = false; } },
    async cleanup() { if (mounted) await React.act(async () => root.unmount()); dom.window.close(); for (const [key, value] of saved) if (value) Object.defineProperty(global, key, value); else delete global[key]; },
  };
}

const target = '/lernen/lernkarten?kategorie=hundewesen&modus=alle&karte=audit-hund';
const blind = s => assert.deepEqual(s.answer(), { hidden: true, text: '' });

test('Full origin identity includes all query values and browser hash; invalid fields can still have a repairable origin', async () => {
  const s = await fixture();
  try {
    const { flashcardRouteOriginIsCurrent: current, flashcardRouteIsReady: ready } = createLoader()('lib/flashcard-navigation.js');
    assert.equal(current(s.router), true);
    s.setBrowser(base + '#anderer-kontext'); assert.equal(current(s.router), false);
    s.setRouter(base + '#anderer-kontext'); assert.equal(current(s.router), true);
    s.setBrowser(base + '&ref=neu&ref=zweiter#anderer-kontext'); s.setRouter(base + '&ref=neu&ref=zweiter#anderer-kontext'); assert.equal(current(s.router), true);
    s.router.query.ref = ['neu', 'fremd']; assert.equal(current(s.router), false);
    const invalid = '/lernen/lernkarten?kategorie=&q=Reh&q=Gams'; s.setBrowser(invalid); s.setRouter(invalid); assert.equal(current(s.router), true); assert.equal(ready(s.router, categories), false);
  } finally { await s.cleanup(); }
});

test('Native category, mode, card and browser-history commits keep each newly selected question blind', async () => {
  const s = await fixture();
  try {
    blind(s); await s.click('Antwort zeigen'); assert.equal(s.answer().hidden, false);
    await s.chooseCategory('hundewesen'); assert.equal(s.calls[0].kind, 'push'); assert.equal(s.question(), 'Reh: isolierte Frage?'); assert.equal(s.answer().hidden, false);
    await s.complete(0); assert.equal(s.question(), 'Hund: isolierte Frage?'); blind(s);
    await s.click('Antwort zeigen'); await s.history(base); assert.equal(s.question(), 'Reh: isolierte Frage?'); blind(s);
    await s.click('Antwort zeigen'); const writes = s.writes.length; await s.changeMode(); assert.equal(s.answer().hidden, false); await s.complete(1); assert.equal(s.question(), 'Reh: isolierte Frage?'); blind(s);
    await s.click('Antwort zeigen'); await s.click('Weiter ohne Bewertung'); await s.complete(2); assert.equal(s.question(), 'Gams: isolierte Frage?'); blind(s); assert.equal(s.writes.length, writes);
  } finally { await s.cleanup(); }
});

for (const outcome of ['false', 'reject']) test(`A ${outcome} category push under its unchanged confirmed address preserves the deliberate answer`, async () => {
  const s = await fixture();
  try {
    await s.click('Antwort zeigen'); const answer = s.answer(), writes = s.writes.length; await s.chooseCategory('hundewesen');
    if (outcome === 'false') await s.accept(0, false); else await s.reject(0);
    assert.equal(s.router.asPath, base); assert.equal(s.question(), 'Reh: isolierte Frage?'); assert.deepEqual(s.answer(), answer); assert.equal(s.writes.length, writes); assert.match(s.host.textContent, /konnte nicht geöffnet werden/);
  } finally { await s.cleanup(); }
});

for (const nextStarted of [false, true]) test(`Browser-first history withholds old content and actions${nextStarted ? ' after Next route start too' : ''}`, async () => {
  const s = await fixture();
  try {
    await s.click('Antwort zeigen'); const oldRate = nativeHandler(s.button('Gewusst'), 'onClick'), oldNext = nativeHandler(s.button('Weiter ohne Bewertung'), 'onClick');
    const oldCategory = nativeHandler(s.host.querySelector('select'), 'onChange'), writes = s.writes.length;
    await s.browserFirst(target, nextStarted); assert.equal(s.question(), null); assert.equal(s.answer(), null); assert.equal(s.host.querySelector('fieldset').disabled, true);
    await React.act(async () => { oldRate(); oldNext(); oldCategory({ target: { value: 'wildkunde' } }); await tick(); });
    assert.equal(s.calls.length, 0); assert.equal(s.writes.length, writes);
    await s.history(target); assert.equal(s.question(), 'Hund: isolierte Frage?'); blind(s); assert.equal(s.calls.length, 0); assert.equal(s.writes.length, writes);
  } finally { await s.cleanup(); }
});

test('Router-first adoption also withholds the new card until the browser adopts the exact URL', async () => {
  const s = await fixture();
  try {
    await s.click('Antwort zeigen'); const writes = s.writes.length; s.setRouter(target); await s.render(); assert.equal(s.question(), null); assert.equal(s.answer(), null);
    s.setBrowser(target); await s.render(); assert.equal(s.question(), 'Hund: isolierte Frage?'); blind(s); assert.equal(s.writes.length, writes); assert.equal(s.calls.length, 0);
  } finally { await s.cleanup(); }
});

test('A raw/query mismatch in an otherwise unchanged foreign query field cannot reveal or rate a card', async () => {
  const s = await fixture(base + '&ref=ursprung');
  try {
    const reveal = nativeHandler(s.button('Antwort zeigen'), 'onClick'), writes = s.writes.length; s.router.query.ref = 'anderer-wert'; await s.render(); assert.equal(s.question(), null);
    await React.act(async () => { reveal(); await tick(); }); assert.equal(s.answer(), null); assert.equal(s.writes.length, writes);
    s.router.query.ref = 'ursprung'; await s.render(); assert.equal(s.question(), 'Reh: isolierte Frage?'); blind(s);
  } finally { await s.cleanup(); }
});

test('Explicit empty, repeated or unknown category/mode fields remain repairable when the complete address agrees', async () => {
  for (const suffix of ['kategorie=', 'kategorie=unknown', 'kategorie=wildkunde&kategorie=wildkunde', 'kategorie=wildkunde&modus=offen']) {
    const s = await fixture('/lernen/lernkarten?' + suffix);
    try { assert.equal(s.question(), null); assert.equal(s.host.querySelector('fieldset').disabled, false); await s.chooseCategory('hundewesen'); assert.equal(s.calls.length, 1); await s.complete(0); assert.equal(s.question(), 'Hund: isolierte Frage?'); blind(s); }
    finally { await s.cleanup(); }
  }
});

test('Invalid course selection can use only its explicit ordinary All-cards escape; a stale address blocks that escape', async () => {
  const s = await fixture('/lernen/lernkarten?kurs=unbekannter-kurs', { selection: { invalid: true } });
  try {
    assert.equal(s.question(), null); const link = [...s.dom.window.document.querySelectorAll('a')].find(node => node.textContent === 'Alle Lernkarten'); assert.ok(link);
    await React.act(async () => { link.click(); await tick(); }); assert.equal(s.calls.length, 1); assert.equal(s.calls[0].kind, 'push'); assert.equal(s.calls[0].href, '/lernen/lernkarten?kategorie=all');
  } finally { await s.cleanup(); }
  const stale = await fixture('/lernen/lernkarten?kurs=unbekannter-kurs', { selection: { invalid: true } });
  try {
    const link = [...stale.dom.window.document.querySelectorAll('a')].find(node => node.textContent === 'Alle Lernkarten'); stale.setBrowser(target);
    await React.act(async () => { link.click(); await tick(); }); assert.equal(stale.calls.length, 0); assert.equal(stale.question(), null);
  } finally { await stale.cleanup(); }
});

for (const adoptRouterToo of [false, true]) test(`Debounced search cannot overwrite another browser context without a render${adoptRouterToo ? ', even when its router is already current' : ''}`, async () => {
  const s = await fixture();
  try {
    const writes = s.writes.length; await s.search('Reh'); assert.equal(s.timers.size, 1); s.setBrowser(target); if (adoptRouterToo) s.setRouter(target);
    await s.flushTimers(); assert.equal(s.calls.length, 0); assert.equal(s.writes.length, writes);
    if (adoptRouterToo) { assert.equal(s.question(), 'Hund: isolierte Frage?'); blind(s); } else assert.equal(s.question(), null);
  } finally { await s.cleanup(); }
});

for (const adoptRouterToo of [false, true]) test(`A pending accepted request cannot replay its queued mode over a later foreign browser URL${adoptRouterToo ? ' and ready router' : ''}`, async () => {
  const s = await fixture();
  try {
    const writes = s.writes.length; await s.search('Reh'); await s.flushTimers(); assert.equal(s.calls.length, 1); await s.commit(0); await s.changeMode(); assert.equal(s.calls.length, 1);
    s.setBrowser(target); if (adoptRouterToo) s.setRouter(target); await s.accept(0); assert.equal(s.calls.length, 1); assert.equal(s.writes.length, writes);
    await s.history(target); assert.equal(s.question(), 'Hund: isolierte Frage?'); blind(s); assert.equal(s.calls.length, 1);
  } finally { await s.cleanup(); }
});

test('An owned browser-first target may finish when its matching router really catches up', async () => {
  const s = await fixture();
  try {
    await s.click('Antwort zeigen'); const writes = s.writes.length; await s.chooseCategory('hundewesen'); const href = s.calls[0].href; s.setBrowser(href); await s.render(); assert.equal(s.question(), null);
    await s.accept(0); assert.equal(s.question(), null); s.setRouter(href); await s.render(); assert.equal(s.question(), 'Hund: isolierte Frage?'); blind(s); assert.equal(s.button('Antwort zeigen').disabled, false); assert.equal(s.writes.length, writes);
  } finally { await s.cleanup(); }
});

test('A rejected mixed-phase rating navigation keeps its already recorded rating and duplicate-action guard on rollback', async () => {
  const href = base.replace('&modus=alle', ''), s = await fixture(href);
  try {
    await s.click('Antwort zeigen'); await s.click('Gewusst'); assert.equal(s.calls.length, 1); const writes = s.writes.length;
    s.setBrowser(s.calls[0].href); await s.render(); assert.equal(s.question(), null); await s.accept(0, false);
    s.setBrowser(href); await s.render(); assert.equal(s.question(), 'Reh: isolierte Frage?'); assert.equal(s.answer().hidden, false); assert.equal(s.button('Gewusst').disabled, true);
    await React.act(async () => { nativeHandler(s.button('Gewusst'), 'onClick')(); await tick(); }); assert.equal(s.writes.length, writes); assert.equal(s.calls.length, 1);
    await s.click('Weiter ohne Bewertung'); await s.complete(1); assert.equal(s.question(), 'Gams: isolierte Frage?'); blind(s);
  } finally { await s.cleanup(); }
});

test('Actual unmount blocks captured native answer, rating, next, category, search and form callbacks', async () => {
  const s = await fixture();
  try {
    const reveal = nativeHandler(s.button('Antwort zeigen'), 'onClick'), category = nativeHandler(s.host.querySelector('select'), 'onChange');
    const search = nativeHandler(s.dom.window.document.querySelector('input[type="search"]'), 'onChange'), submit = nativeHandler(s.dom.window.document.querySelector('form'), 'onSubmit');
    await s.click('Antwort zeigen'); const rate = nativeHandler(s.button('Gewusst'), 'onClick'), next = nativeHandler(s.button('Weiter ohne Bewertung'), 'onClick'), writes = s.writes.length;
    await s.unmount(); await React.act(async () => { reveal(); rate(); next(); category({ target: { value: 'hundewesen' } }); search({ target: { value: 'Hund' } }); submit({ preventDefault() {} }); await tick(); });
    assert.equal(s.calls.length, 0); assert.equal(s.writes.length, writes); assert.equal(s.timers.size, 0);
  } finally { await s.cleanup(); }
});

test('Reload remains available for its current error, while a captured native retry is inert after browser drift or unmount', async () => {
  for (const boundary of ['browser', 'unmount']) {
    let reloads = 0; const s = await fixture(base, { loadError: 'Isolierter Ladefehler.', onReload: () => reloads++ });
    try {
      const retry = nativeHandler(s.button('Erneut laden'), 'onClick'); await s.click('Erneut laden'); assert.equal(reloads, 1);
      if (boundary === 'browser') s.setBrowser(target); else await s.unmount();
      await React.act(async () => { retry(); await tick(); }); assert.equal(reloads, 1, boundary);
    } finally { await s.cleanup(); }
  }
});
