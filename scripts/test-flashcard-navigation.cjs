const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const navigation = createLoader()('lib/flashcard-navigation.js');
const { readFlashcardNavigation: read, readFlashcardURL: readURL, flashcardNavigationURL: url, createFlashcardURLSync: synchronizer } = navigation;
const framework = {
  'next/link': { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href: typeof href === 'string' ? href : href.pathname, ...props }, children) },
  'next/head': { __esModule: true, default: ({ children }) => children },
};
const categories = [{ id: 'wildkunde', title: 'Wildkunde', count: 2 }, { id: 'hundewesen', title: 'Hundewesen', count: 1 }];
const state = { category: 'wildkunde', query: 'Gams', mode: 'all', cardId: 'flash-gams' };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function clock() { let id = 0; const tasks = new Map(); return { setTimer(fn) { tasks.set(++id, fn); return id; }, clearTimer(key) { tasks.delete(key); }, flush() { const pending = [...tasks.values()]; tasks.clear(); pending.forEach(fn => fn()); }, get size() { return tasks.size; } }; }

test('Browsing URL contains only navigation fields and preserves exact scoped/other parameters', () => {
  const scoped = { courseId: 'beispiel-kurs', lessonId: 'beispiel-lektion' };
  const source = '/lernen/lernkarten?kurs=beispiel-kurs&lektion=beispiel-lektion&hinweis=behalten#lernkarten-suche';
  const href = url(source, state, categories, scoped);
  const parsed = new URL(href, 'https://jagdlatein.de');
  assert.equal(parsed.searchParams.get('kurs'), scoped.courseId); assert.equal(parsed.searchParams.get('lektion'), scoped.lessonId);
  assert.equal(parsed.searchParams.get('hinweis'), 'behalten'); assert.equal(parsed.hash, '#lernkarten-suche');
  assert.equal(parsed.searchParams.has('kategorie'), false);
  assert.deepEqual(readURL(href, categories, scoped), { ...state, category: 'all' });
  assert.deepEqual(read({ kategorie: ['wildkunde', 'hundewesen'], q: ['Reh', 'Gams'], karte: '../falsch', modus: 'anders' }, categories), { category: 'all', query: '', mode: 'pending', cardId: null });
  assert.equal(read({ q: 'a'.repeat(300) }, categories).query.length, 160);
  assert.equal(url('/kurse/beispiel', state, categories), null);
  assert.equal(new URL(url('/lernen/lernkarten?kurs=ungültig', state, categories, { invalid: true }), 'https://jagdlatein.de').searchParams.get('kurs'), 'ungültig');
});

test('Every actual card ID survives a complete browsing URL round trip', () => {
  const cards = createLoader()('lib/learning-flashcards.js').getFlashcardExport().cards;
  // The catalog grows; exercise every real ID without freezing an old deck size.
  assert.ok(cards.length >= 1331);
  assert.equal(new Set(cards.map(card => card.id)).size, cards.length);
  for (const card of cards) assert.equal(readURL(url('/lernen/lernkarten', { ...state, cardId: card.id }, categories), categories).cardId, card.id);
});

test('Serialized shallow changes acknowledge old URLs without rolling back newer typing', async () => {
  const timer = clock(), calls = [], restored = [];
  let latest = { ...state, query: 'G' };
  const router = { isReady: true, asPath: '/lernen/lernkarten', replace(href, as, options) { const task = deferred(); calls.push({ href, options, task }); return task.promise; } };
  const sync = synchronizer({ getRouter: () => router, getState: () => latest, getContext: () => ({ categories }), onRestore: next => restored.push(next), ...timer });
  sync.schedule(); timer.flush(); await tick();
  latest = { ...latest, query: 'Ga' }; sync.schedule(); timer.flush();
  latest = { ...latest, query: 'Gams' }; sync.schedule(); timer.flush();
  assert.equal(calls.length, 1);
  router.asPath = calls[0].href; sync.route(router.asPath); calls[0].task.resolve(true); await tick();
  assert.equal(restored.length, 0); assert.equal(calls.length, 2);
  assert.equal(new URL(calls[1].href, 'https://jagdlatein.de').searchParams.get('q'), 'Gams');
  assert.deepEqual(calls[1].options, { shallow: true, scroll: false });
  router.asPath = calls[1].href; sync.route(router.asPath); calls[1].task.resolve(true); await tick();
  assert.equal(restored.length, 0); sync.dispose();
});

test('Back cancels delayed typing and old completions cannot restore stale state; external navigation suspends writes', async () => {
  const timer = clock(), calls = [];
  let latest = { ...state }, restored;
  const router = { isReady: true, asPath: '/lernen/lernkarten', replace(href) { const task = deferred(); calls.push({ href, task }); return task.promise; } };
  const sync = synchronizer({ getRouter: () => router, getState: () => latest, getContext: () => ({ categories }), onRestore(next) { latest = next; restored = next; }, ...timer });
  sync.schedule(); assert.equal(timer.size, 1);
  sync.restore('/lernen/lernkarten?q=Reh&karte=flash-reh'); timer.flush(); await tick(); assert.equal(calls.length, 0); assert.equal(restored.query, 'Reh');
  latest = { ...state }; const savedVersion = sync.version(); sync.flush(); await tick();
  sync.restore('/lernen/lernkarten?q=Hund&karte=flash-hund');
  router.asPath = calls[0].href; sync.route(router.asPath); calls[0].task.resolve(true); await tick();
  assert.equal(latest.query, 'Hund'); assert.equal(sync.isCurrent(savedVersion), false);
  assert.equal(new URL(calls[1].href, 'https://jagdlatein.de').searchParams.get('q'), 'Hund');
  const externalVersion = sync.version(); sync.start('/kurse/anderer-kurs');
  router.asPath = calls[1].href; sync.route(router.asPath); calls[1].task.resolve(true); await tick();
  assert.equal(sync.isCurrent(externalVersion), false); assert.equal(calls.length, 2);
  sync.dispose();
});

function engine() {
  const slots = []; let cursor = 0, effects = [];
  return { hooks: { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
    useMemo(callback, deps) { const i = cursor++; const before = slots[i]; if (!before || deps.some((v, j) => v !== before.deps[j])) slots[i] = { deps, value: callback() }; return slots[i].value; },
    useEffect(callback, deps) { const i = cursor++; const before = slots[i]; if (!before || deps.some((v, j) => v !== before.deps[j])) { slots[i] = { deps, cleanup: before?.cleanup }; effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = callback(); }); } },
  }, render(fn) { cursor = 0; return fn(); }, flush() { const pending = effects; effects = []; pending.forEach(fn => fn()); }, dispose() { slots.forEach(slot => slot?.cleanup?.()); } };
}
function all(node, predicate) { if (Array.isArray(node)) return node.flatMap(child => all(child, predicate)); if (!node || typeof node !== 'object') return []; return [...(predicate(node) ? [node] : []), ...all(node.props?.children, predicate)]; }
function text(node) { if (node == null || typeof node === 'boolean') return ''; if (Array.isArray(node)) return node.map(text).join(' '); return typeof node === 'object' ? text(node.props?.children) : String(node); }
const cards = [
  { id: 'flash-reh', question: 'Was erklärt das Reh-Beispiel?', answer: 'Antwort Reh', categoryId: 'wildkunde', categoryTitle: 'Wildkunde', explanation: 'Vorhandene Erklärung Reh.', sources: [], courseHref: '/kurse/reh' },
  { id: 'flash-gams', question: 'Was erklärt das Gams-Beispiel?', answer: 'Antwort Gams', categoryId: 'wildkunde', categoryTitle: 'Wildkunde', explanation: 'Vorhandene Erklärung Gams.', sources: [], courseHref: '/kurse/gams' },
  { id: 'flash-hund', question: 'Was erklärt das Hund-Beispiel?', answer: 'Antwort Hund', categoryId: 'hundewesen', categoryTitle: 'Hundewesen', explanation: 'Vorhandene Erklärung Hund.', sources: [], courseHref: '/kurse/hund' },
];
function ui({ href = '/lernen/lernkarten', initialProps = {} } = {}) {
  const oldWindow = global.window, timer = clock(), e = engine(), handlers = {}, events = {}, replacements = [], pushes = [];
  let writes = 0, saved = null, tree, props = { cards, categories, ...initialProps };
  function queryFor(url) { return Object.fromEntries(new URL(url, 'https://jagdlatein.de').searchParams); }
  const router = { isReady: true, asPath: href, query: queryFor(href), replace(next) { const task = deferred(); replacements.push({ href: next, task }); events.routeChangeStart?.(next); return task.promise; }, push(next) { pushes.push(next); return Promise.resolve(true); }, events: { on(name, fn) { events[name] = fn; }, off(name) { delete events[name]; } } };
  const assigned = [], history = [];
  global.window = { history: { state: { __N: true, key: 'same-history-entry', url: href, as: href }, replaceState(state, title, href) { history.push({ state, href }); } }, location: { pathname: '/lernen/lernkarten', search: '', hash: '', assign: href => assigned.push(href) }, localStorage: { getItem() { return saved; }, setItem(key, value) { writes++; saved = value; } }, setTimeout: timer.setTimer, clearTimeout: timer.clearTimer, setInterval: () => 1, clearInterval() {}, requestAnimationFrame(fn) { fn(); }, addEventListener(name, fn) { handlers[name] = fn; }, removeEventListener(name) { delete handlers[name]; } };
  const Component = createLoader({ ...framework, react: e.hooks, 'next/router': { useRouter: () => router }, '../lib/flashcard-navigation': { ...navigation, createFlashcardURLSync: args => synchronizer({ ...args, ...timer }) } })('components/LearningFlashcards.js').default;
  const render = () => { tree = e.render(() => Component(props)); };
  const settle = async () => { for (let i = 0; i < 4; i++) { e.flush(); render(); await tick(); } };
  render();
  return { get tree() { return tree; }, get writes() { return writes; }, get saved() { return saved; }, replacements, pushes, assigned, history, router, timer, render, settle,
    find(predicate) { return all(tree, predicate)[0]; },
    input(value) { this.find(node => node.type === 'input' && node.props.type === 'search').props.onChange({ target: { value } }); render(); },
    click(label) { const node = this.find(item => item.type === 'button' && text(item).trim() === label); assert.ok(node); node.props.onClick(); render(); },
    setProps(next) { props = { ...props, ...next }; render(); },
    async complete(index) { const call = replacements[index]; router.asPath = call.href; router.query = queryFor(call.href); call.task.resolve(true); await settle(); },
    async back(next) { const parsed = new URL(next, 'https://jagdlatein.de'); window.location = { pathname: parsed.pathname, search: parsed.search, hash: parsed.hash }; router.asPath = next; router.query = queryFor(next); handlers.popstate(); await settle(); },
    event() { return { prevented: false, preventDefault() { this.prevented = true; } }; },
    emit(name, ...args) { events[name]?.(...args); },
    unmount() { e.dispose(); },
    cleanup() { e.dispose(); global.window = oldWindow; },
  };
}

test('Current card/category survive new category array instances, then reload from the saved URL without ratings', async () => {
  const s = ui({ href: '/lernen/lernkarten?kategorie=wildkunde&karte=flash-gams' });
  try {
    await s.settle(); const baseline = s.writes;
    assert.match(text(s.tree), /Antwort Gams/);
    s.setProps({ categories: categories.map(item => ({ ...item })) }); await s.settle();
    assert.match(text(s.tree), /Antwort Gams/); assert.equal(s.find(node => node.type === 'select').props.value, 'wildkunde');
    s.click('Weiter ohne Bewertung'); await s.settle(); await s.complete(0);
    assert.equal(new URL(s.router.asPath, 'https://jagdlatein.de').searchParams.get('karte'), 'flash-reh');
    assert.equal(s.writes, baseline); assert.deepEqual(JSON.parse(s.saved).cards, {});
    const restored = readURL(s.router.asPath, categories); assert.equal(restored.cardId, 'flash-reh'); assert.equal(restored.category, 'wildkunde');
  } finally { s.cleanup(); }
});

test('An initial card beyond the seed waits for complete data, retaining the requested card', async () => {
  const s = ui({ href: '/lernen/lernkarten?karte=flash-hund', initialProps: { cards: cards.slice(0, 1), incomplete: true, loading: true } });
  try {
    await s.settle(); assert.doesNotMatch(text(s.tree), /Antwort Reh/);
    s.setProps({ cards, categories: categories.map(item => ({ ...item })), incomplete: false, loading: false }); await s.settle();
    assert.match(text(s.tree), /Antwort Hund/); assert.equal(s.replacements.length, 0);
  } finally { s.cleanup(); }
});

test('A course click flushes delayed search/card URL before navigating and a later click takes priority', async () => {
  const s = ui();
  try {
    await s.settle(); const baseline = s.writes; s.input('Gams');
    const course = s.find(node => node.props?.href === '/kurse/gams'), first = s.event();
    course.props.onClick(first); assert.equal(first.prevented, true); await tick();
    assert.equal(s.pushes.length, 0); assert.equal(s.replacements.length, 1);
    const written = new URL(s.replacements[0].href, 'https://jagdlatein.de'); assert.equal(written.searchParams.get('q'), 'Gams'); assert.equal(written.searchParams.get('karte'), 'flash-gams');
    const print = s.find(node => node.props?.href?.pathname === '/lernen/lernkarten-drucken'), second = s.event(); print.props.onClick(second);
    await s.complete(0); await tick();
    assert.equal(s.pushes.length, 1); assert.equal(s.pushes[0].pathname, '/lernen/lernkarten-drucken');
    assert.equal(s.writes, baseline); assert.deepEqual(JSON.parse(s.saved).cards, {});
  } finally { s.cleanup(); }
});

test('Back or another route before a pending course click completes cancels that old destination', async () => {
  for (const navigationType of ['back', 'other-route', 'unmount']) {
    const s = ui();
    try {
      await s.settle(); s.input('Gams'); const event = s.event(); s.find(node => node.props?.href === '/kurse/gams').props.onClick(event); await tick();
      if (navigationType === 'back') await s.back('/lernen/lernkarten?karte=flash-reh');
      if (navigationType === 'other-route') { const cancelled = s.router.replace('/kurse/anderes-ziel'); cancelled.catch(() => {}); }
      if (navigationType === 'unmount') s.unmount();
      await s.complete(0);
      if (navigationType === 'back' && s.replacements[1]) await s.complete(1);
      await tick(); assert.equal(s.pushes.length, 0, navigationType);
    } finally { s.cleanup(); }
  }
});

test('Print/PDF actions appear once near filters before the current card, with no new buttons', () => {
  const Component = createLoader({ ...framework, 'next/router': { useRouter: () => ({ query: {}, isReady: true }) } })('components/LearningFlashcards.js').default;
  const html = renderToStaticMarkup(React.createElement(Component, { cards, categories }));
  assert.ok(html.indexOf('Lernkarten drucken und speichern') < html.indexOf('<article'));
  assert.equal((html.match(/Diese Auswahl drucken/g) || []).length, 1);
  assert.equal((html.match(/Starterset als PDF/g) || []).length, 1);
  assert.equal((html.match(/<button/g) || []).length, 3);
});

test('Print and its visible digital return link preserve the current card and browsing mode', () => {
  const query = { kategorie: 'wildkunde', q: 'Gams', modus: 'alle', karte: 'flash-gams' };
  const linking = { __esModule: true, default: ({ href, children, prefetch, ...props }) => React.createElement('a', { ...props, href: typeof href === 'string' ? href : `${href.pathname}?${new URLSearchParams(href.query)}` }, children) };
  const loader = createLoader({ ...framework, 'next/link': linking, 'next/router': { useRouter: () => ({ query, isReady: true }) } });
  const digital = renderToStaticMarkup(React.createElement(loader('components/LearningFlashcards.js').default, { cards, categories }));
  const printHref = digital.match(/href="(\/lernen\/lernkarten-drucken\?[^\"]+)"/)[1].replaceAll('&amp;', '&');
  assert.deepEqual(Object.fromEntries(new URL(printHref, 'https://jagdlatein.de').searchParams), query);
  const printed = renderToStaticMarkup(React.createElement(loader('pages/lernen/lernkarten-drucken.js').default, { cards, categories }));
  const backHref = printed.match(/href="(\/lernen\/lernkarten\?[^\"]+)"/)[1].replaceAll('&amp;', '&');
  assert.deepEqual(Object.fromEntries(new URL(backHref, 'https://jagdlatein.de').searchParams), query);
  assert.ok(printed.indexOf('Digital wiederholen') < printed.indexOf('<article'));
  assert.equal((printed.match(/Digital wiederholen/g) || []).length, 1);
});

test('An old shallow route error preserves a newer draft and its scheduled replacement', async () => {
  const s = ui();
  try {
    await s.settle(); s.input('Reh'); s.timer.flush(); await tick();
    assert.equal(s.replacements.length, 1); s.input('Gams');
    s.emit('routeChangeError', { cancelled: true }, s.replacements[0].href);
    s.emit('routeChangeError', new Error('temporary router failure'), s.replacements[0].href);
    await s.settle(); assert.equal(s.find(node => node.type === 'input' && node.props.type === 'search').props.value, 'Gams');
    s.timer.flush(); s.replacements[0].task.reject(new Error('temporary router failure')); await tick();
    assert.equal(s.replacements.length, 2);
    assert.equal(new URL(s.replacements[1].href, 'https://jagdlatein.de').searchParams.get('q'), 'Gams');
    await s.complete(1); assert.match(text(s.tree), /Antwort Gams/);
  } finally { s.cleanup(); }
});

test('A hung shallow replacement cannot trap a course link and keeps the current entry for Back', async () => {
  const s = ui();
  try {
    await s.settle(); s.input('Gams'); const event = s.event(); s.find(node => node.props?.href === '/kurse/gams').props.onClick(event); await tick();
    s.timer.flush(); await tick();
    assert.deepEqual(s.assigned, ['/kurse/gams']); assert.equal(s.pushes.length, 0); assert.equal(s.history.length, 1);
    const remembered = new URL(s.history[0].href, 'https://jagdlatein.de');
    assert.equal(remembered.searchParams.get('q'), 'Gams'); assert.equal(remembered.searchParams.get('karte'), 'flash-gams');
    assert.equal(s.history[0].state.key, 'same-history-entry'); assert.equal(s.history[0].state.url, s.history[0].href); assert.equal(s.history[0].state.as, s.history[0].href);
    s.unmount(); await s.complete(0); assert.equal(s.assigned.length, 1); assert.equal(s.pushes.length, 0);
  } finally { s.cleanup(); }
});
