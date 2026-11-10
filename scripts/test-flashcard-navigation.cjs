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
  assert.deepEqual(read({ kategorie: ['wildkunde', 'hundewesen'], q: ['Reh', 'Gams'], karte: '../falsch', modus: 'anders' }, categories), { category: null, query: '', mode: 'pending', cardId: null });
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
function ui({ href = '/lernen/lernkarten?kategorie=all', initialProps = {}, isReady = true } = {}) {
  const oldWindow = global.window, timer = clock(), e = engine(), handlers = {}, events = {}, replacements = [], pushes = [];
  let writes = 0, saved = null, tree, props = { cards, categories, ...initialProps };
  function queryFor(url) { return Object.fromEntries(new URL(url, 'https://jagdlatein.de').searchParams); }
  const router = { isReady, asPath: href, query: queryFor(href), replace(next) { const task = deferred(); replacements.push({ href: next, task }); events.routeChangeStart?.(next); return task.promise; }, push(next) { pushes.push(next); return Promise.resolve(true); }, events: { on(name, fn) { events[name] = fn; }, off(name) { delete events[name]; } } };
  const assigned = [], history = [], scrolls = [];
  global.window = { history: { state: { __N: true, key: 'same-history-entry', url: href, as: href }, replaceState(state, title, href) { history.push({ state, href }); } }, location: { pathname: '/lernen/lernkarten', search: '', hash: '', assign: href => assigned.push(href) }, localStorage: { getItem() { return saved; }, setItem(key, value) { writes++; saved = value; } }, setTimeout: timer.setTimer, clearTimeout: timer.clearTimer, setInterval: () => 1, clearInterval() {}, requestAnimationFrame(fn) { fn(); }, scrollTo(options) { scrolls.push(options); }, addEventListener(name, fn) { handlers[name] = fn; }, removeEventListener(name) { delete handlers[name]; } };
  const Component = createLoader({ ...framework, react: e.hooks, 'next/router': { useRouter: () => router }, '../lib/flashcard-navigation': { ...navigation, createFlashcardURLSync: args => synchronizer({ ...args, ...timer }) } })('components/LearningFlashcards.js').default;
  const render = () => { tree = e.render(() => Component(props)); };
  const settle = async () => { for (let i = 0; i < 4; i++) { e.flush(); render(); await tick(); } };
  render();
  return { get tree() { return tree; }, get writes() { return writes; }, get saved() { return saved; }, replacements, pushes, assigned, history, scrolls, router, timer, render, settle,
    find(predicate) { return all(tree, predicate)[0]; },
    categoryButton(value) {
      const chooser = this.find(node => node.type?.name === 'MenuChoice' && node.props.id === 'lernkarten-kategorien');
      assert.ok(chooser);
      const choice = all(chooser.type(chooser.props), node => node.type === 'button' && node.props['data-menu-choice'] === value)[0];
      assert.ok(choice, value);
      return choice;
    },
    chooseCategory(value) {
      const choice = this.categoryButton(value);
      assert.notEqual(choice.props.disabled, true);
      choice.props.onClick(); render();
    },
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

const isCategorySelect = node => node.type === 'select' && node.props['aria-label'] === 'Kategorie';

test('The bare digital deck offers a visible category choice without opening or rating a card', async () => {
  const s = ui({ href: '/lernen/lernkarten' });
  try {
    await s.settle();
    const chooser = s.find(node => node.type?.name === 'MenuChoice' && node.props.id === 'lernkarten-kategorien');
    assert.equal(chooser?.props.label, 'Kategorie wählen');
    assert.ok(!s.find(node => node.type === 'article'));
    s.timer.flush(); await s.settle();
    assert.equal(s.replacements.length, 0, 'arrival alone does not select a category');
    const writes = s.writes;
    s.chooseCategory('hundewesen');
    await s.settle(); s.timer.flush(); await s.settle();
    await s.complete(0);
    assert.equal(s.find(isCategorySelect)?.props.value, 'hundewesen');
    assert.match(text(s.tree), /Was erklärt das Hund-Beispiel/);
    assert.doesNotMatch(text(s.tree), /Was erklärt das Reh-Beispiel|Antwort Hund/);
    assert.equal(new URL(s.router.asPath, 'https://jagdlatein.de').searchParams.get('kategorie'), 'hundewesen');
    assert.equal(s.writes, writes);
    assert.ok(s.scrolls.length, 'the category selection returns to the top of the page');
    assert.ok(s.scrolls.every(scroll => scroll.top === 0));
    await s.back('/lernen/lernkarten');
    assert.ok(!s.find(node => node.type === 'article'));
    assert.ok(s.find(node => node.type?.name === 'MenuChoice' && node.props.id === 'lernkarten-kategorien'));
  } finally { s.cleanup(); }
});

test('The chooser is present before router readiness and opens a category only after readiness', async () => {
  const s = ui({ href: '/lernen/lernkarten', isReady: false });
  try {
    await s.settle();
    const button = s.categoryButton('hundewesen');
    assert.equal(button.props.disabled, true);
    button.props.onClick(); s.render(); await s.settle();
    assert.ok(!s.find(node => node.type === 'article'));
    assert.equal(s.replacements.length, 0);
    s.router.isReady = true; s.render(); await s.settle();
    s.chooseCategory('hundewesen'); await s.settle(); await s.complete(0);
    assert.match(text(s.tree), /Was erklärt das Hund-Beispiel/);
  } finally { s.cleanup(); }
});

test('An old category click cannot open a deck during an external route change', async () => {
  const s = ui({ href: '/lernen/lernkarten' });
  try {
    await s.settle();
    const button = s.categoryButton('hundewesen');
    s.emit('routeChangeStart', '/kurse/reh');
    button.props.onClick(); s.render(); await s.settle();
    assert.ok(!s.find(node => node.type === 'article'));
    assert.equal(s.replacements.length, 0);
    s.emit('routeChangeError', new Error('temporary router failure'), '/kurse/reh');
    s.chooseCategory('hundewesen'); await s.settle(); await s.complete(0);
    assert.match(text(s.tree), /Was erklärt das Hund-Beispiel/);
  } finally { s.cleanup(); }
});

test('A category outside the seed is selectable and waits for the matching cards to arrive', async () => {
  const s = ui({ href: '/lernen/lernkarten', initialProps: { cards: cards.slice(0, 2), incomplete: true, loading: true } });
  try {
    await s.settle(); s.chooseCategory('hundewesen'); await s.settle();
    await s.complete(0);
    assert.equal(s.find(isCategorySelect)?.props.value, 'hundewesen');
    assert.ok(!s.find(node => node.type === 'article'));
    assert.match(text(s.tree), /Deine Auswahl wird vollständig geladen/);
    s.setProps({ cards, incomplete: false, loading: false }); await s.settle();
    assert.match(text(s.tree), /Was erklärt das Hund-Beispiel/);
    assert.doesNotMatch(text(s.tree), /Was erklärt das Reh-Beispiel|Antwort Hund/);
  } finally { s.cleanup(); }
});

test('Explicitly choosing all categories survives URL restoration and a fresh deck', async () => {
  const s = ui({ href: '/lernen/lernkarten' });
  let href;
  try {
    await s.settle(); s.chooseCategory('all');
    await s.settle(); s.timer.flush(); await s.settle();
    await s.complete(0);
    href = s.router.asPath;
    assert.equal(new URL(href, 'https://jagdlatein.de').searchParams.get('kategorie'), 'all');
    assert.equal(s.find(isCategorySelect)?.props.value, 'all');
    assert.match(text(s.tree), /Was erklärt das Reh-Beispiel/);
  } finally { s.cleanup(); }
  const reopened = ui({ href });
  try {
    await reopened.settle();
    assert.equal(reopened.find(isCategorySelect)?.props.value, 'all');
    assert.match(text(reopened.tree), /Was erklärt das Reh-Beispiel/);
    assert.equal(reopened.replacements.length, 0);
  } finally { reopened.cleanup(); }
});

test('Legacy deep links with search, a card or browsing mode enter directly', async () => {
  for (const [query, question] of [['q=Hund', 'Hund'], ['karte=flash-hund', 'Hund'], ['modus=alle', 'Reh']]) {
    const s = ui({ href: '/lernen/lernkarten?' + query });
    try {
      await s.settle();
      assert.equal(s.find(isCategorySelect)?.props.value, 'all', query);
      assert.ok(text(s.tree).includes('Was erklärt das ' + question + '-Beispiel?'), query);
      assert.equal(s.replacements.length, 0, query);
    } finally { s.cleanup(); }
  }
});

test('Current card/category survive new category array instances, then reload from the saved URL without ratings', async () => {
  const studyCards = cards.map(card => card.id === 'flash-gams' ? { ...card, choices: ['Antwort Gams', 'Andere Gamsantwort'] } : card);
  const s = ui({ href: '/lernen/lernkarten?kategorie=wildkunde&karte=flash-gams', initialProps: { cards: studyCards } });
  try {
    await s.settle(); const baseline = s.writes;
    assert.doesNotMatch(text(s.tree), /Richtige Antwort|Vorhandene Erklärung Gams/);
    s.click('Andere Gamsantwort');
    assert.match(text(s.tree), /Das ist noch nicht richtig/);
    s.setProps({ categories: categories.map(item => ({ ...item })) }); await s.settle();
    assert.match(text(s.tree), /Das ist noch nicht richtig/); assert.equal(s.find(isCategorySelect).props.value, 'wildkunde');
    s.click('Weiter ohne Bewertung'); await s.settle(); await s.complete(0);
    assert.equal(new URL(s.router.asPath, 'https://jagdlatein.de').searchParams.get('karte'), 'flash-reh');
    assert.equal(s.writes, baseline); assert.deepEqual(JSON.parse(s.saved).cards, {});
    const restored = readURL(s.router.asPath, categories); assert.equal(restored.cardId, 'flash-reh'); assert.equal(restored.category, 'wildkunde');
    assert.doesNotMatch(text(s.tree), /Antwort Reh/);
    await s.back('/lernen/lernkarten?kategorie=wildkunde&karte=flash-gams');
    assert.match(text(s.tree), /Was erklärt das Gams-Beispiel/);
    assert.match(text(s.tree), /Andere Gamsantwort/);
    assert.doesNotMatch(text(s.tree), /Richtige Antwort|Vorhandene Erklärung Gams|Das ist noch nicht richtig/);
  } finally { s.cleanup(); }
});

test('An initial card beyond the seed waits for complete data, retaining the requested card', async () => {
  const s = ui({ href: '/lernen/lernkarten?karte=flash-hund', initialProps: { cards: cards.slice(0, 1), incomplete: true, loading: true } });
  try {
    await s.settle(); assert.doesNotMatch(text(s.tree), /Antwort Reh/);
    s.setProps({ cards, categories: categories.map(item => ({ ...item })), incomplete: false, loading: false }); await s.settle();
    assert.match(text(s.tree), /Was erklärt das Hund-Beispiel/);
    assert.doesNotMatch(text(s.tree), /Antwort Hund/);
    assert.equal(s.replacements.length, 0);
  } finally { s.cleanup(); }
});

test('A course click flushes delayed search/card URL before navigating and a later click takes priority', async () => {
  const s = ui();
  try {
    await s.settle(); const baseline = s.writes; s.input('Gams'); s.click('Antwort zeigen');
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
      await s.settle(); s.input('Gams'); s.click('Antwort zeigen'); const event = s.event(); s.find(node => node.props?.href === '/kurse/gams').props.onClick(event); await tick();
      if (navigationType === 'back') await s.back('/lernen/lernkarten?karte=flash-reh');
      if (navigationType === 'other-route') { const cancelled = s.router.replace('/kurse/anderes-ziel'); cancelled.catch(() => {}); }
      if (navigationType === 'unmount') s.unmount();
      await s.complete(0);
      if (navigationType === 'back' && s.replacements[1]) await s.complete(1);
      await tick(); assert.equal(s.pushes.length, 0, navigationType);
    } finally { s.cleanup(); }
  }
});

const lowerMenu = { __esModule: true, default: ({ title, children }) => React.createElement('section', { 'data-lower-menu': title }, children), closePageMenu() {} };

test('The entry selection is server-rendered in the page before any card', () => {
  for (const query of [{}, { kategorie: '' }, { kategorie: 'falsch' }, { kategorie: ['wildkunde', 'hundewesen'] }]) {
    const Component = createLoader({ ...framework, 'next/router': { useRouter: () => ({ query, isReady: false }) } })('components/LearningFlashcards.js').default;
    const html = renderToStaticMarkup(React.createElement(Component, { cards, categories }));
    assert.match(html, /id="lernkarten-kategorien"/);
    assert.match(html, /<legend[^>]*>Kategorie wählen<\/legend>/);
    assert.match(html, /data-menu-choice="all"[^>]*>Alle Kategorien/);
    assert.match(html, /data-menu-choice="wildkunde"[^>]*>Wildkunde/);
    assert.match(html, /data-menu-choice="hundewesen"[^>]*>Hundewesen/);
    assert.doesNotMatch(html, /<article|Antwort zeigen|Weiter ohne Bewertung/);
  }
});

test('The category stays in the page while other choices stay in the lower menu and the card offers reveal and skip', () => {
  const router = { useRouter: () => ({ query: { kategorie: 'all' }, isReady: true }) };
  const Component = createLoader({ ...framework, 'next/router': router })('components/LearningFlashcards.js').default;
  const html = renderToStaticMarkup(React.createElement(Component, { cards, categories }));
  assert.doesNotMatch(html, /Diese Auswahl drucken|Starterset als PDF|Karten anzeigen/);
  assert.equal((html.match(/<select[^>]*aria-label="Kategorie"/g) || []).length, 1);
  const card = html.match(/<article[^>]*>.*?<\/article>/)?.[0] || '';
  assert.equal((card.match(/<button/g) || []).length, 2);
  assert.match(card, /Antwort zeigen/);
  assert.match(card, /Weiter ohne Bewertung/);
  const WithMenu = createLoader({ ...framework, './PageMenu': lowerMenu, 'next/router': router })('components/LearningFlashcards.js').default;
  const withMenu = renderToStaticMarkup(React.createElement(WithMenu, { cards, categories }));
  assert.match(withMenu, /data-lower-menu="Lernkarten suchen und filtern"/);
  assert.match(withMenu, /data-lower-menu="Lernkarten drucken und speichern"/);
  const filterMenu = withMenu.match(/<section data-lower-menu="Lernkarten suchen und filtern">.*?<\/section>/)?.[0];
  assert.ok(filterMenu);
  assert.doesNotMatch(filterMenu, /<select|Kategorie wählen|data-menu-choice="wildkunde"/);
  assert.equal((withMenu.match(/Diese Auswahl drucken/g) || []).length, 1);
  assert.equal((withMenu.match(/Starterset als PDF/g) || []).length, 1);
});

test('Print and its visible digital return link preserve the current card and browsing mode', () => {
  const query = { kategorie: 'wildkunde', q: 'Gams', modus: 'alle', karte: 'flash-gams' };
  const linking = { __esModule: true, default: ({ href, children, prefetch, ...props }) => React.createElement('a', { ...props, href: typeof href === 'string' ? href : `${href.pathname}?${new URLSearchParams(href.query)}` }, children) };
  const loader = createLoader({ ...framework, './PageMenu': lowerMenu, '../../components/PageMenu': lowerMenu, 'next/link': linking, 'next/router': { useRouter: () => ({ query, isReady: true }) } });
  const digital = renderToStaticMarkup(React.createElement(loader('components/LearningFlashcards.js').default, { cards, categories }));
  const printHref = digital.match(/href="(\/lernen\/lernkarten-drucken\?[^\"]+)"/)[1].replaceAll('&amp;', '&');
  assert.deepEqual(Object.fromEntries(new URL(printHref, 'https://jagdlatein.de').searchParams), query);
  const printed = renderToStaticMarkup(React.createElement(loader('pages/lernen/lernkarten-drucken.js').default, { cards, categories }));
  const backHref = printed.match(/href="(\/lernen\/lernkarten\?[^\"]+)"/)[1].replaceAll('&amp;', '&');
  assert.deepEqual(Object.fromEntries(new URL(backHref, 'https://jagdlatein.de').searchParams), query);
  assert.match(printed, /data-lower-menu="Weitere Lernkarten"/);
  assert.equal((printed.match(/Digital wiederholen/g) || []).length, 1);

  const AllPrint = createLoader({ ...framework, '../../components/PageMenu': lowerMenu, 'next/link': linking, 'next/router': { useRouter: () => ({ query: {}, isReady: true }) } })('pages/lernen/lernkarten-drucken.js').default;
  const printAll = renderToStaticMarkup(React.createElement(AllPrint, { cards, categories }));
  assert.match(printAll, /href="\/lernen\/lernkarten\?kategorie=all"/);
  assert.equal((printAll.match(/<article\b/g) || []).length, cards.length);
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
    await s.complete(1); assert.match(text(s.tree), /Was erklärt das Gams-Beispiel/);
    assert.doesNotMatch(text(s.tree), /Antwort Gams/);
  } finally { s.cleanup(); }
});

test('A hung shallow replacement cannot trap a course link and keeps the current entry for Back', async () => {
  const s = ui();
  try {
    await s.settle(); s.input('Gams'); s.click('Antwort zeigen'); const event = s.event(); s.find(node => node.props?.href === '/kurse/gams').props.onClick(event); await tick();
    s.timer.flush(); await tick();
    assert.deepEqual(s.assigned, ['/kurse/gams']); assert.equal(s.pushes.length, 0); assert.equal(s.history.length, 1);
    const remembered = new URL(s.history[0].href, 'https://jagdlatein.de');
    assert.equal(remembered.searchParams.get('q'), 'Gams'); assert.equal(remembered.searchParams.get('karte'), 'flash-gams');
    assert.equal(s.history[0].state.key, 'same-history-entry'); assert.equal(s.history[0].state.url, s.history[0].href); assert.equal(s.history[0].state.as, s.history[0].href);
    s.unmount(); await s.complete(0); assert.equal(s.assigned.length, 1); assert.equal(s.pushes.length, 0);
  } finally { s.cleanup(); }
});
