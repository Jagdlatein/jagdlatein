// Independent commit/lifetime regression tests. All cards, storage and browser
// surfaces in this file are isolated doubles; no learner data is accessed.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const categories = [
  { id: 'wildkunde', title: 'Wildkunde', count: 2 },
  { id: 'hundewesen', title: 'Hundewesen', count: 1 },
];
const cards = [
  { id: 'test-reh', question: 'Prüffrage Reh?', answer: 'Rehantwort', choices: ['Rehantwort', 'Gamsantwort', 'Hundantwort', 'Fuchsantwort'], explanation: 'Erklärung Reh.', categoryId: 'wildkunde', categoryTitle: 'Wildkunde', moduleId: 'test-kurs', lessonId: 'test-lektion', courseHref: '/kurse/test-kurs', sources: [] },
  { id: 'test-gams', question: 'Prüffrage Gams?', answer: 'Gamsantwort', choices: ['Gamsantwort', 'Rehantwort', 'Hundantwort', 'Fuchsantwort'], explanation: 'Erklärung Gams.', categoryId: 'wildkunde', categoryTitle: 'Wildkunde', moduleId: 'test-kurs', lessonId: 'zweite-lektion', courseHref: '/kurse/test-kurs', sources: [] },
  { id: 'test-hund', question: 'Prüffrage Hund?', answer: 'Hundantwort', choices: ['Hundantwort', 'Gamsantwort', 'Rehantwort', 'Fuchsantwort'], explanation: 'Erklärung Hund.', categoryId: 'hundewesen', categoryTitle: 'Hundewesen', moduleId: 'hund-kurs', lessonId: 'hund-lektion', courseHref: '/kurse/hund-kurs', sources: [] },
];
const base = '/lernen/lernkarten?kategorie=wildkunde&modus=alle&karte=test-reh';
function all(node, predicate) { if (Array.isArray(node)) return node.flatMap(child => all(child, predicate)); if (!node || typeof node !== 'object') return []; return [...(predicate(node) ? [node] : []), ...all(node.props?.children, predicate)]; }
function text(node) { if (node == null || typeof node === 'boolean') return ''; if (Array.isArray(node)) return node.map(text).join(' '); return typeof node === 'object' ? text(node.props?.children) : String(node); }
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
async function tick() { for (let i = 0; i < 12; i++) await Promise.resolve(); }
function engine() {
  const slots = []; let cursor = 0, effects = [], mounted = true, lateWrites = 0;
  const memo = (callback, deps) => { const i = cursor++, old = slots[i]; if (!old || !deps || deps.some((v, j) => v !== old.deps?.[j])) slots[i] = { deps, value: callback() }; return slots[i].value; };
  const effect = (callback, deps) => { const i = cursor++, old = slots[i]; if (!old || !deps || deps.some((v, j) => v !== old.deps?.[j])) { const slot = { deps, cleanup: old?.cleanup }; slots[i] = slot; effects.push(() => { slot.cleanup?.(); slot.cleanup = callback(); }); } };
  return { hooks: { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; const slot = slots[i]; return [slot.value, value => { if (!mounted) { lateWrites++; return; } slot.value = typeof value === 'function' ? value(slot.value) : value; }]; },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
    useMemo: memo, useCallback: (callback, deps) => memo(() => callback, deps), useEffect: effect, useLayoutEffect: effect,
  }, render(fn) { cursor = 0; return fn(); }, flush() { const jobs = effects; effects = []; jobs.forEach(fn => fn()); }, dispose() { if (!mounted) return; mounted = false; effects = []; slots.forEach(slot => slot?.cleanup?.()); }, get lateWrites() { return lateWrites; } };
}
function ui({ href = base, ready = true, initialProps = {} } = {}) {
  const before = { window: global.window, document: global.document }, e = engine(), timers = new Map(), frames = new Map(), capturedFrames = [], events = new Map(), listeners = new Map(), calls = [], focuses = [], assigned = [], historyReplacements = [];
  let sequence = 0, saved = null, writes = 0, reads = 0, tree, alive = true, props = { cards, categories, ...initialProps };
  const queryFor = href => { const out = {}; for (const [key, value] of new URL(href, 'https://jagdlatein.de').searchParams) out[key] = Object.hasOwn(out, key) ? [...(Array.isArray(out[key]) ? out[key] : [out[key]]), value] : value; return out; };
  const emit = (name, ...args) => { for (const fn of [...(events.get(name) || [])]) fn(...args); };
  function request(kind, href, as, options) { const task = deferred(); calls.push({ kind, href, options, task }); emit('routeChangeStart', href, { shallow: true }); return task.promise; }
  const router = { pathname: '/lernen/lernkarten', isReady: ready, asPath: href, query: queryFor(href), push: (...args) => request('push', ...args), replace: (...args) => request('replace', ...args), events: { on(name, fn) { const set = events.get(name) || new Set(); set.add(fn); events.set(name, set); }, off(name, fn) { events.get(name)?.delete(fn); } } };
  const storage = { getItem() { reads++; return saved; }, setItem(key, value) { writes++; saved = value; } };
  function raw(next, query = queryFor(next)) { const url = new URL(next, 'https://jagdlatein.de'); router.asPath = next; router.query = query; Object.assign(global.window.location, { href: url.href, pathname: url.pathname, search: url.search, hash: url.hash }); }
  global.window = { location: { assign: href => assigned.push(href) }, localStorage: storage, history: { state: { __N: true, key: 'isolated-test' }, replaceState(state, title, href) { historyReplacements.push({ state, href }); } }, setTimeout(fn) { const id = ++sequence; timers.set(id, fn); return id; }, clearTimeout(id) { timers.delete(id); }, setInterval() { return ++sequence; }, clearInterval() {}, requestAnimationFrame(fn) { const id = ++sequence; frames.set(id, fn); capturedFrames.push(fn); return id; }, cancelAnimationFrame(id) { frames.delete(id); }, scrollTo(value) { focuses.push({ scroll: value }); }, addEventListener(name, fn) { const set = listeners.get(name) || new Set(); set.add(fn); listeners.set(name, set); }, removeEventListener(name, fn) { listeners.get(name)?.delete(fn); } };
  global.document = { addEventListener() {}, removeEventListener() {}, getElementById() { return null; }, querySelector() { return null; }, activeElement: null };
  raw(href);
  const navigation = createLoader()('lib/flashcard-navigation.js');
  const framework = { react: e.hooks, 'next/router': { useRouter: () => router }, 'next/link': { __esModule: true, default: function Link({ children }) { return children; } }, 'next/head': { __esModule: true, default: ({ children }) => children }, '../lib/flashcard-navigation': { ...navigation, createFlashcardURLSync: args => navigation.createFlashcardURLSync({ ...args, setTimer: global.window.setTimeout, clearTimer: global.window.clearTimeout }) } };
  const Component = createLoader(framework)('components/LearningFlashcards.js').default;
  function render() { assert.ok(alive, 'test does not render an unmounted component'); tree = e.render(() => Component(props)); for (const node of all(tree, item => typeof item.props?.ref === 'object' && item.props.ref)) { node.props.ref.current = { isConnected: true, focus(options) { focuses.push({ id: node.props.id, options }); }, scrollIntoView(options) { focuses.push({ id: node.props.id, anchor: options }); }, closest() { return { querySelector() { return null; } }; } }; } return tree; }
  async function settle() { for (let i = 0; i < 5; i++) { e.flush(); render(); await tick(); } }
  const find = predicate => all(tree, predicate)[0];
  const button = label => { const result = find(node => node.type === 'button' && text(node).trim() === label); assert.ok(result, `button ${label}`); return result; };
  const choose = value => { const chooser = find(node => node.type?.name === 'MenuChoice' && node.props.id === 'lernkarten-kategorien'); if (chooser) { const option = all(chooser.type(chooser.props), node => node.type === 'button' && node.props['data-menu-choice'] === value)[0]; assert.ok(option, `category ${value}`); option.props.onClick(); } else { const select = find(node => node.type === 'select' && node.props['aria-label'] === 'Kategorie'); assert.ok(select); select.props.onChange({ target: { value } }); } render(); };
  render();
  return { get tree() { return tree; }, get writes() { return writes; }, get reads() { return reads; }, get saved() { return saved; }, get lateWrites() { return e.lateWrites; }, calls, focuses, assigned, historyReplacements, router, find, button, choose, render, settle, raw,
    click(label) { const b = button(label); assert.notEqual(b.props.disabled, true, label); b.props.onClick(); render(); },
    input(value) { const node = find(item => item.type === 'input' && item.props.type === 'search'); assert.ok(node); node.props.onChange({ target: { value } }); render(); },
    setProps(next) { props = { ...props, ...next }; render(); },
    async flushTimers() { const jobs = [...timers.values()]; timers.clear(); jobs.forEach(fn => fn()); await tick(); await settle(); },
    flushFrames() { const jobs = [...frames.values()]; frames.clear(); jobs.forEach(fn => fn()); },
    flushStaleFrames() { capturedFrames.splice(0).forEach(fn => fn()); },
    async commit(i) { const call = calls[i]; assert.ok(call, `route call ${i}`); raw(call.href); emit('routeChangeComplete', call.href, { shallow: true }); await settle(); },
    async accept(i, value = true) { assert.ok(calls[i], `route call ${i}`); calls[i].task.resolve(value); await tick(); await settle(); },
    async complete(i) { await this.commit(i); await this.accept(i); },
    async reject(i) { const error = new Error('isolated router rejection'); calls[i].task.reject(error); emit('routeChangeError', error, calls[i].href, { shallow: true }); await tick(); await settle(); },
    async history(next) { raw(next); for (const fn of [...(listeners.get('popstate') || [])]) fn({}); emit('routeChangeComplete', next, { shallow: true }); await settle(); },
    unmount() { alive = false; e.dispose(); },
    cleanup() { alive = false; e.dispose(); global.window = before.window; global.document = before.document; },
  };
}
const question = s => text(s.find(node => node.type === 'h2' && node.props.id === 'lernkarten-frage'));
const reveal = s => s.button('Antwort zeigen');
const article = s => s.find(node => node.type === 'article');

test('Independent: unready explicit card is withheld while local persistence restores independently', async () => {
  const s = ui({ ready: false }); try { await s.settle(); assert.equal(article(s), undefined); assert.equal(s.find(node => node.type === 'button' && text(node).trim() === 'Antwort zeigen'), undefined); assert.ok(s.reads > 0); assert.equal(s.calls.length, 0); s.router.isReady = true; s.render(); await s.settle(); assert.equal(question(s), 'Prüffrage Reh?'); } finally { s.cleanup(); }
});

for (const result of ['false', 'reject']) test(`Independent: category push ${result} preserves the committed card and hidden/revealed answer`, async () => {
  const s = ui(); try { await s.settle(); s.click('Antwort zeigen'); await s.settle(); const before = s.writes; s.choose('hundewesen'); await s.settle(); assert.equal(s.calls.length, 1); assert.equal(s.calls[0].kind, 'push'); assert.equal(question(s), 'Prüffrage Reh?'); assert.match(text(s.tree), /Erklärung Reh/); assert.doesNotMatch(text(s.tree), /Prüffrage Hund/); if (result === 'false') await s.accept(0, false); else await s.reject(0); assert.equal(question(s), 'Prüffrage Reh?'); assert.match(text(s.tree), /Erklärung Reh/); assert.equal(s.writes, before); assert.ok(s.find(node => node.props?.role === 'alert' || node.props?.role === 'status' && /nicht|fehl|erneut/i.test(text(node))), 'navigation failure is visible'); } finally { s.cleanup(); }
});

test('Independent: successful promise alone cannot adopt another card before the actual URL commit', async () => {
  const s = ui(); try { await s.settle(); const focusCount = s.focuses.length; s.choose('hundewesen'); await s.settle(); await s.accept(0); assert.equal(question(s), 'Prüffrage Reh?'); assert.equal(s.focuses.length, focusCount, 'focus waits for the URL commit'); await s.commit(0); assert.equal(question(s), 'Prüffrage Hund?'); assert.doesNotMatch(text(s.tree), /Erklärung Hund/); s.flushFrames(); assert.ok(s.focuses.some(item => item.scroll?.top === 0)); } finally { s.cleanup(); }
});

test('Independent: URL commit before route acceptance withholds destructive rating callbacks', async () => {
  const s = ui(); try { await s.settle(); s.click('Antwort zeigen'); await s.settle(); const oldRating = s.button('Gewusst').props.onClick, before = s.writes; s.choose('hundewesen'); await s.settle(); await s.commit(0); assert.equal(question(s), 'Prüffrage Hund?'); oldRating(); s.render(); await s.settle(); const currentReveal = reveal(s); currentReveal.props.onClick(); s.render(); await s.settle(); const rating = s.find(node => node.type === 'button' && text(node).trim() === 'Gewusst'); rating?.props.onClick(); s.render(); await s.settle(); assert.equal(s.writes, before); await s.accept(0); assert.equal(question(s), 'Prüffrage Hund?'); } finally { s.cleanup(); }
});

test('Independent: browser history restores exact card and query/hash without additional navigation or rating', async () => {
  const s = ui(); try { await s.settle(); const before = s.writes; await s.history('/lernen/lernkarten?category=hundewesen&modus=alle&karte=test-hund&hinweis=behalten#lernkarten-frage'); assert.equal(question(s), 'Prüffrage Hund?'); assert.equal(s.calls.length, 0); assert.equal(s.writes, before); await s.history(base); assert.equal(question(s), 'Prüffrage Reh?'); } finally { s.cleanup(); }
});

test('Independent: invalid explicit route selections cannot silently widen to unrelated lesson text', async () => {
  for (const query of ['kategorie=&modus=alle', 'kategorie=unbekannt&q=Reh', 'kategorie=wildkunde&kategorie=hundewesen&modus=alle', 'kategorie=wildkunde&category=hundewesen&modus=alle', 'kategorie=all&modus=alle&karte=test-unbekannt', 'kategorie=all&modus=alle&karte=']) {
    const s = ui({ href: `/lernen/lernkarten?${query}` }); try { await s.settle(); assert.equal(article(s), undefined, query); assert.equal(s.calls.length, 0); } finally { s.cleanup(); }
  }
});

test('Independent: requested unloaded card waits rather than rendering first loaded card', async () => {
  const s = ui({ href: '/lernen/lernkarten?kategorie=all&modus=alle&karte=test-hund', initialProps: { cards: cards.slice(0, 2), incomplete: true, loading: true } }); try { await s.settle(); assert.equal(article(s), undefined); s.setProps({ cards, incomplete: false, loading: false }); await s.settle(); assert.equal(question(s), 'Prüffrage Hund?'); } finally { s.cleanup(); }
});

test('Independent: raw hash or query changes invalidate stale reveal/rating before the next render', async () => {
  for (const suffix of ['#anderer-kontext', '&hinweis=anderer-kontext']) {
    const s = ui(); try { await s.settle(); const oldReveal = reveal(s).props.onClick; s.raw(base + suffix); oldReveal(); s.render(); await s.settle(); assert.doesNotMatch(text(s.tree), /Erklärung Reh/); s.click('Antwort zeigen'); await s.settle(); const oldRating = s.button('Gewusst').props.onClick, before = s.writes; s.raw(base + suffix + (suffix.startsWith('#') ? '-neu' : '&weiter=neu')); oldRating(); s.render(); await s.settle(); assert.equal(s.writes, before); assert.equal(s.calls.length, 0); } finally { s.cleanup(); }
  }
});

test('Independent: semantic replacement of a same-ID card closes old answer and rejects old choices/ratings', async () => {
  const s = ui(); try { await s.settle(); const oldChoice = s.find(node => node.type === 'button' && text(node).trim() === 'Rehantwort').props.onClick; s.click('Antwort zeigen'); await s.settle(); const oldRating = s.button('Gewusst').props.onClick, before = s.writes; const revised = { ...cards[0], question: 'Überarbeitete Prüffrage Reh?', answer: 'Neue Antwort', choices: ['Neue Antwort', 'Zweite Antwort', 'Dritte Antwort', 'Vierte Antwort'], explanation: 'Überarbeitete Erklärung.' }; s.setProps({ cards: [revised, ...cards.slice(1)] }); await s.settle(); assert.equal(question(s), revised.question); assert.doesNotMatch(text(s.tree), /Überarbeitete Erklärung/); oldChoice(); oldRating(); s.render(); await s.settle(); assert.doesNotMatch(text(s.tree), /Überarbeitete Erklärung/); assert.equal(s.writes, before); assert.equal(s.calls.length, 0); } finally { s.cleanup(); }
});

test('Independent: equivalent catalog objects preserve revealed answer and its current rating action', async () => {
  const s = ui(); try { await s.settle(); s.click('Antwort zeigen'); await s.settle(); const rating = s.button('Gewusst').props.onClick, before = s.writes; s.setProps({ cards: cards.map(card => ({ ...card, choices: [...card.choices], sources: [] })) }); await s.settle(); assert.match(text(s.tree), /Erklärung Reh/); rating(); s.render(); await s.settle(); assert.ok(s.writes > before); assert.equal(JSON.parse(s.saved).cards['test-reh'].rating, 'known'); } finally { s.cleanup(); }
});

test('Independent: retained handlers and queued focus callbacks are inert after real effect cleanup', async () => {
  const s = ui(); try { await s.settle(); const oldReveal = reveal(s).props.onClick, oldNext = s.button('Weiter ohne Bewertung').props.onClick; const oldChoice = s.find(node => node.type === 'button' && text(node).trim() === 'Rehantwort').props.onClick; s.click('Antwort zeigen'); await s.settle(); const oldRating = s.button('Gewusst').props.onClick; const chooser = s.find(node => node.type === 'select' && node.props['aria-label'] === 'Kategorie'); const oldCategory = chooser?.props.onChange; const before = { writes: s.writes, calls: s.calls.length, focuses: s.focuses.length }; s.unmount(); oldReveal(); oldNext(); oldChoice(); oldRating(); oldCategory?.({ target: { value: 'hundewesen' } }); s.flushFrames(); await tick(); assert.equal(s.writes, before.writes); assert.equal(s.calls.length, before.calls); assert.equal(s.focuses.length, before.focuses); assert.equal(s.lateWrites, 0, 'handlers return before setState after cleanup'); } finally { s.cleanup(); }
});

test('Independent: delayed search uses replace and leaves the committed card visible until commit', async () => {
  const s = ui(); try { await s.settle(); const before = s.writes; s.input('Hund'); await s.settle(); assert.equal(question(s), 'Prüffrage Reh?'); assert.equal(s.calls.length, 0); await s.flushTimers(); assert.equal(s.calls.length, 1); assert.equal(s.calls[0].kind, 'replace'); assert.equal(question(s), 'Prüffrage Reh?'); await s.accept(0, false); assert.equal(question(s), 'Prüffrage Reh?'); assert.equal(s.find(node => node.type === 'input' && node.props.type === 'search').props.value, 'Hund'); assert.equal(s.writes, before); } finally { s.cleanup(); }
});

test('Independent: superseding history prevents late rejected/accepted category navigation from restoring its state', async () => {
  const s = ui(); try { await s.settle(); s.choose('hundewesen'); await s.settle(); await s.history('/lernen/lernkarten?kategorie=wildkunde&modus=alle&karte=test-gams&hinweis=history#lernkarten-frage'); assert.equal(question(s), 'Prüffrage Gams?'); await s.accept(0); assert.equal(question(s), 'Prüffrage Gams?'); assert.equal(s.router.asPath, '/lernen/lernkarten?kategorie=wildkunde&modus=alle&karte=test-gams&hinweis=history#lernkarten-frage'); } finally { s.cleanup(); }
});

test('Independent: scoped card and invalid scope do not expose another lesson', async () => {
  const scope = { courseId: 'test-kurs', lessonId: 'test-lektion' };
  const s = ui({ href: '/lernen/lernkarten?kurs=test-kurs&lektion=test-lektion&modus=alle&karte=test-gams', initialProps: { selection: scope } }); try { await s.settle(); assert.equal(article(s), undefined); await s.history('/lernen/lernkarten?kurs=test-kurs&lektion=test-lektion&modus=alle&karte=test-reh'); assert.equal(question(s), 'Prüffrage Reh?'); s.setProps({ selection: { invalid: true } }); await s.settle(); assert.equal(article(s), undefined); } finally { s.cleanup(); }
});

test('Independent: four neutral answer options reveal feedback only after an explicit choice', async () => {
  const s = ui(); try { await s.settle(); const group = s.find(node => node.props?.role === 'group' && node.props['aria-label'] === 'Antwort wählen'); assert.ok(group); const options = all(group, node => node.type === 'button'); assert.equal(options.length, 4); assert.doesNotMatch(text(s.tree), /Richtige Antwort|Deine Antwort|Erklärung Reh/); options.find(node => text(node).trim() === 'Fuchsantwort').props.onClick(); s.render(); await s.settle(); assert.match(text(s.tree), /Das ist noch nicht richtig/); assert.match(text(s.tree), /Erklärung Reh/); } finally { s.cleanup(); }
});

test('Independent: explicit next is a pending push; failed next does not reset the committed card answer', async () => {
  const s = ui(); try { await s.settle(); s.click('Antwort zeigen'); await s.settle(); s.click('Weiter ohne Bewertung'); await s.settle(); assert.equal(s.calls.length, 1); assert.equal(s.calls[0].kind, 'push'); assert.equal(question(s), 'Prüffrage Reh?'); assert.match(text(s.tree), /Erklärung Reh/); await s.accept(0, false); assert.equal(question(s), 'Prüffrage Reh?'); assert.match(text(s.tree), /Erklärung Reh/); } finally { s.cleanup(); }
});

test('Independent: a local rating cannot silently display another pending card under the old card URL', async () => {
  const s = ui({ href: '/lernen/lernkarten?kategorie=wildkunde&karte=test-reh' }); try { await s.settle(); s.click('Antwort zeigen'); await s.settle(); const rating = s.button('Gewusst').props.onClick; rating(); s.render(); await s.settle(); assert.equal(question(s), 'Prüffrage Reh?'); assert.equal(s.calls.length, 1); assert.equal(s.calls[0].kind, 'push'); await s.accept(0, false); assert.equal(question(s), 'Prüffrage Reh?'); assert.equal(JSON.parse(s.saved).cards['test-reh'].rating, 'known'); const writes = s.writes; rating(); s.render(); await s.settle(); assert.equal(s.writes, writes, 'retained rating is not applied twice'); } finally { s.cleanup(); }
});

test('Independent: contradictory ready query/asPath never exposes an unrelated card', async () => {
  const s = ui(); try { s.raw(base, { kategorie: 'hundewesen', modus: 'alle', karte: 'test-hund' }); s.render(); await s.settle(); assert.ok(!article(s)); assert.equal(s.calls.length, 0); s.raw(base); s.render(); await s.settle(); assert.equal(question(s), 'Prüffrage Reh?'); } finally { s.cleanup(); }
});

test('Independent: stale search/mode/form callbacks are inert after cleanup', async () => {
  const s = ui(); try { await s.settle(); const search = s.find(node => node.type === 'input' && node.props.type === 'search').props.onChange; const mode = s.find(node => node.type === 'input' && node.props.type === 'checkbox').props.onChange; const submit = s.find(node => node.type === 'form').props.onSubmit; const before = s.calls.length; s.unmount(); search({ target: { value: 'Hund' } }); mode({ target: { checked: true } }); submit({ preventDefault() {} }); s.flushFrames(); await tick(); assert.equal(s.calls.length, before); assert.equal(s.lateWrites, 0); } finally { s.cleanup(); }
});

test('Independent: late push/replace completions cannot invoke state setters after unmount', async () => {
  for (const action of ['category', 'search']) {
    const s = ui(); try { await s.settle(); if (action === 'category') { s.choose('hundewesen'); await s.settle(); } else { s.input('Reh'); await s.flushTimers(); } assert.equal(s.calls.length, 1); const before = { calls: s.calls.length, writes: s.writes }; s.unmount(); s.calls[0].task.resolve(true); await tick(); s.flushFrames(); assert.equal(s.lateWrites, 0, action); assert.equal(s.calls.length, before.calls); assert.equal(s.writes, before.writes); } finally { s.cleanup(); }
  }
});

test('Independent: History cancels an unsent search draft and restores the committed filter', async () => {
  const s = ui(); try { await s.settle(); s.input('Reh'); await s.settle(); await s.history('/lernen/lernkarten?kategorie=hundewesen&modus=alle&karte=test-hund'); await s.flushTimers(); assert.equal(question(s), 'Prüffrage Hund?'); assert.equal(s.calls.length, 0); assert.equal(s.find(node => node.type === 'input' && node.props.type === 'search').props.value, ''); } finally { s.cleanup(); }
});

test('Independent: choosing the current category preserves the revealed answer without a new history step', async () => {
  const s = ui(); try { await s.settle(); s.click('Antwort zeigen'); await s.settle(); const before = s.writes; s.choose('wildkunde'); await s.settle(); assert.match(text(s.tree), /Erklärung Reh/); assert.equal(s.calls.length, 0); assert.equal(s.writes, before); } finally { s.cleanup(); }
});

test('Independent: rating the final open card enters the empty state only after its committed URL step', async () => {
  const s = ui({ href: '/lernen/lernkarten?kategorie=wildkunde&karte=test-reh', initialProps: { cards: [cards[0]] } }); try { await s.settle(); s.click('Antwort zeigen'); await s.settle(); s.click('Gewusst'); await s.settle(); assert.equal(question(s), 'Prüffrage Reh?'); assert.equal(s.calls.length, 1); assert.equal(s.calls[0].kind, 'push'); await s.complete(0); assert.ok(!article(s)); assert.match(text(s.tree), /Für jetzt ist deine Auswahl wiederholt/); assert.doesNotMatch(text(s.tree), /Erklärung Reh/); } finally { s.cleanup(); }
});

test('Independent: an already captured focus callback remains inert even if cancellation loses the race', async () => {
  const s = ui(); try { await s.settle(); s.click('Antwort zeigen'); await s.settle(); const before = s.focuses.length; s.unmount(); s.flushStaleFrames(); assert.equal(s.focuses.length, before); assert.equal(s.lateWrites, 0); } finally { s.cleanup(); }
});

test('Independent: a later external same-page link to a previously owned URL restores its navigation intent', async () => {
  const s = ui(); try { await s.settle(); s.choose('hundewesen'); await s.settle(); await s.complete(0); const previous = s.calls[0].href; s.choose('wildkunde'); await s.settle(); await s.complete(1); assert.equal(question(s), 'Prüffrage Reh?'); s.raw(previous); s.render(); await s.settle(); assert.equal(question(s), 'Prüffrage Hund?'); s.choose('wildkunde'); await s.settle(); assert.equal(s.calls.length, 3, 'current category is read from the external committed link, not an obsolete own URL'); await s.complete(2); assert.equal(question(s), 'Prüffrage Reh?'); } finally { s.cleanup(); }
});

test('Independent: native History can start a current choice without waiting for an obsolete hung push', async () => {
  const s = ui(); try { await s.settle(); s.choose('hundewesen'); await s.settle(); assert.equal(s.calls.length, 1); await s.history('/lernen/lernkarten?kategorie=wildkunde&modus=alle&karte=test-gams#history'); assert.equal(question(s), 'Prüffrage Gams?'); s.choose('hundewesen'); await s.settle(); assert.equal(s.calls.length, 2, 'the old navigation has been superseded by native history'); await s.complete(1); assert.equal(question(s), 'Prüffrage Hund?'); s.calls[0].task.resolve(false); await tick(); await s.settle(); assert.equal(question(s), 'Prüffrage Hund?'); } finally { s.cleanup(); }
});

test('Independent: after a failed rated-card advance, the remaining open card is reachable without rating twice', async () => {
  const s = ui({ href: '/lernen/lernkarten?kategorie=wildkunde&karte=test-reh' }); try { await s.settle(); s.click('Antwort zeigen'); await s.settle(); s.click('Gewusst'); await s.settle(); await s.accept(0, false); assert.equal(question(s), 'Prüffrage Reh?'); const writes = s.writes; s.click('Weiter ohne Bewertung'); await s.settle(); assert.equal(s.calls.length, 2); await s.complete(1); assert.equal(question(s), 'Prüffrage Gams?'); assert.equal(s.writes, writes, 'retrying navigation does not rate again'); } finally { s.cleanup(); }
});

test('Independent: a course URL cannot render unscoped or obsolete scoped props while the page catches up', async () => {
  const s = ui({ href: '/lernen/lernkarten?kurs=hund-kurs&lektion=hund-lektion&kategorie=all&modus=alle&karte=test-reh' }); try { await s.settle(); assert.ok(!article(s), 'the Reh card is outside the requested Hund lesson'); s.setProps({ selection: { courseId: 'hund-kurs', lessonId: 'hund-lektion' } }); await s.settle(); assert.ok(!article(s)); s.raw('/lernen/lernkarten?kurs=hund-kurs&lektion=hund-lektion&modus=alle&karte=test-hund'); s.render(); await s.settle(); assert.equal(question(s), 'Prüffrage Hund?'); s.raw('/lernen/lernkarten?kategorie=all&modus=alle&karte=test-hund'); s.render(); await s.settle(); assert.ok(!article(s), 'old scoped props await the matching unscoped route data'); } finally { s.cleanup(); }
});

test('Independent: a failed category remains retryable by selecting that category again', async () => {
  const s = ui(); try { await s.settle(); s.choose('hundewesen'); await s.settle(); await s.reject(0); assert.equal(question(s), 'Prüffrage Reh?'); s.choose('hundewesen'); await s.settle(); assert.equal(s.calls.length, 2, 'a failed desired category is not the committed current category'); await s.complete(1); assert.equal(question(s), 'Prüffrage Hund?'); } finally { s.cleanup(); }
});

test('Independent: choosing the still-current category after failure adds no redundant history step', async () => {
  const s = ui(); try { await s.settle(); s.click('Antwort zeigen'); await s.settle(); s.choose('hundewesen'); await s.settle(); await s.reject(0); s.choose('wildkunde'); await s.settle(); assert.equal(s.calls.length, 1); assert.equal(question(s), 'Prüffrage Reh?'); assert.match(text(s.tree), /Erklärung Reh/); } finally { s.cleanup(); }
});

test('Independent: printing a pending search uses the flushed selection in its destination and return snapshot', async () => {
  const s = ui(); try { await s.settle(); const writes = s.writes; s.input('Gams'); await s.settle(); const link = s.find(node => node.props?.['aria-label'] === 'Diese Auswahl drucken'); const event = { button: 0, prevented: false, preventDefault() { this.prevented = true; } }; link.props.onClick(event); await s.settle(); assert.equal(event.prevented, true); assert.equal(s.calls.length, 1); assert.equal(s.calls[0].kind, 'replace'); const source = new URL(s.calls[0].href, 'https://jagdlatein.de'); assert.equal(source.searchParams.get('q'), 'Gams'); assert.equal(source.searchParams.get('karte'), 'test-gams'); await s.complete(0); assert.equal(s.calls.length, 2); assert.equal(s.calls[1].kind, 'push'); assert.equal(s.calls[1].href.pathname, '/lernen/lernkarten-drucken'); assert.deepEqual(s.calls[1].href.query, { kategorie: 'wildkunde', q: 'Gams', modus: 'alle', karte: 'test-gams' }); assert.equal(s.writes, writes); } finally { s.cleanup(); }
});

test('Independent: hung print flush falls back to the same latest search and preserves the Next history key', async () => {
  const s = ui({ href: `${base}&hinweis=behalten#lernkarten-suche` }); try { await s.settle(); s.input('Gams'); await s.settle(); const link = s.find(node => node.props?.['aria-label'] === 'Diese Auswahl drucken'); link.props.onClick({ button: 0, preventDefault() {} }); await s.settle(); await s.flushTimers(); assert.equal(s.assigned.length, 1); const target = new URL(s.assigned[0], 'https://jagdlatein.de'); assert.equal(target.pathname, '/lernen/lernkarten-drucken'); assert.equal(target.searchParams.get('q'), 'Gams'); assert.equal(target.searchParams.get('karte'), 'test-gams'); assert.equal(s.historyReplacements.length, 1); const snapshot = s.historyReplacements[0]; assert.equal(snapshot.state.__N, true); assert.equal(snapshot.state.key, 'isolated-test'); const source = new URL(snapshot.href, 'https://jagdlatein.de'); assert.equal(source.searchParams.get('q'), 'Gams'); assert.equal(source.searchParams.get('karte'), 'test-gams'); assert.equal(source.searchParams.get('hinweis'), 'behalten'); assert.equal(source.hash, '#lernkarten-suche'); assert.equal(s.calls.length, 1, 'the fallback does not start another Next route'); } finally { s.cleanup(); }
});

test('Independent: stale link and form callbacks prevent their native default navigation', async () => {
  const s = ui(); try { await s.settle(); const link = s.find(node => node.props?.['aria-label'] === 'Diese Auswahl drucken').props.onClick; const submit = s.find(node => node.type === 'form').props.onSubmit; s.raw(`${base}#neuer-kontext`); const event = () => ({ button: 0, prevented: false, preventDefault() { this.prevented = true; } }); const linkEvent = event(), formEvent = event(); link(linkEvent); submit(formEvent); assert.equal(linkEvent.prevented, true, 'Next Link must not perform its own navigation after a stale owner returns'); assert.equal(formEvent.prevented, true, 'the browser must not submit a stale search form'); assert.equal(s.calls.length, 0); } finally { s.cleanup(); }
});

test('Independent: an obsolete failed request leaves no error after the queued current choice succeeds', async () => {
  const s = ui(); try { await s.settle(); s.choose('hundewesen'); await s.settle(); s.choose('wildkunde'); await s.settle(); assert.equal(s.calls.length, 1); await s.accept(0, false); assert.equal(s.calls.length, 2); await s.complete(1); assert.equal(question(s), 'Prüffrage Reh?'); const status = s.find(node => node.props?.role === 'status'); assert.doesNotMatch(text(status), /konnte nicht geöffnet|wähle sie erneut|fehlgeschlagen/i); } finally { s.cleanup(); }
});

test('Independent: newly loaded open cards remain reachable after completing the partial seed', async () => {
  const s = ui({ href: '/lernen/lernkarten?kategorie=wildkunde&karte=test-reh', initialProps: { cards: [cards[0]], incomplete: true, loading: true } }); try { await s.settle(); s.click('Antwort zeigen'); await s.settle(); s.click('Gewusst'); await s.settle(); await s.complete(0); assert.ok(!article(s)); const writes = s.writes; s.setProps({ cards: cards.slice(0, 2), incomplete: false, loading: false }); await s.settle(); assert.equal(question(s), 'Prüffrage Gams?'); assert.doesNotMatch(text(s.tree), /Erklärung Gams/); assert.equal(s.writes, writes); assert.equal(s.calls.length, 1, 'finishing the load does not add an artificial history entry'); } finally { s.cleanup(); }
});

test('Independent: different object-key order preserves the same card content and current answer round', async () => {
  const reverseKeys = value => Array.isArray(value) ? value.map(reverseKeys) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).reverse().map(([key, item]) => [key, reverseKeys(item)])) : value;
  const fixture = { ...cards[0], image: { src: '/isolated-test-photo.png', width: 100, height: 100, alt: 'Isolierter Bildplatzhalter', author: 'Testautor', creditUrl: 'https://example.invalid/test' }, sources: [{ label: 'Isolierte Testquelle', url: 'https://example.invalid/source' }] };
  const s = ui({ initialProps: { cards: [fixture, cards[1]] } }); try { await s.settle(); s.click('Antwort zeigen'); await s.settle(); const rating = s.button('Gewusst').props.onClick; s.setProps({ cards: [reverseKeys(fixture), reverseKeys(cards[1])] }); await s.settle(); assert.match(text(s.tree), /Erklärung Reh/); const writes = s.writes; rating(); s.render(); await s.settle(); assert.ok(s.writes > writes); assert.equal(JSON.parse(s.saved).cards['test-reh'].rating, 'known'); } finally { s.cleanup(); }
});
