// UI/persistence checks only; the existing card source content is reviewed separately.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');
const css = new Proxy({}, { get: (_, key) => String(key) });
const source = [{ label: 'Belegte Ausgangslektion', url: 'https://example.org/lesson' }, { label: 'Unabhängige Quelle', url: 'https://example.net/knowledge' }];
const cards = [
  { id: 'flash-photo-example', categoryId: 'wildkunde', categoryTitle: 'Wildkunde', moduleTitle: 'Wildarten erkennen', question: 'Welche Wildart zeigt dieses Foto?', answer: 'Beispielart', explanation: 'Dokumentiertes Motiv aus dem vorhandenen Bildnachweis.', sources: source, sourceScope: 'photo', reviewedOn: '2026-10-04', courseHref: '/wildkunde/beispiel', image: { src: '/wildkunde/nachweise-2026/example.jpg', width: 1280, height: 853, author: 'Fotograf', creditUrl: 'https://example.org/photo', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', alt: 'Tierfoto für diese Bestimmungskarte' } },
  { id: 'flash-example-two', categoryId: 'hundewesen', categoryTitle: 'Hundewesen', moduleTitle: 'Hunde verstehen', context: 'Hunde verstehen', lessonTitle: 'Vorhandene Lektion', question: 'Wie wird die nächste Frage sinnvoll beantwortet?', answer: 'Zweite Antwort', explanation: 'Zweite vorhandene Erklärung.', sources: source, sourceScope: 'lesson', reviewedOn: '2026-10-16', courseHref: '/kurse/beispiel-hunde#lektion-eins' },
  { id: 'flash-example-three', categoryId: 'wildkunde', categoryTitle: 'Wildkunde', moduleTitle: 'Wildwissen', question: 'Was gehört zum dritten Beispiel?', answer: 'Dritte Antwort', explanation: 'Dritte vorhandene Erklärung.', sources: source, sourceScope: 'course', reviewedOn: '2026-10-16', courseHref: '/kurse/beispiel-wild#lektion-eins' },
];
const categories = [{ id: 'wildkunde', title: 'Wildkunde', count: 2 }, { id: 'hundewesen', title: 'Hundewesen', count: 1 }];
function load(relative, overrides = {}, cache = new Map()) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
  const mod = { exports: {} };
  cache.set(filename, mod.exports);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  function req(id) {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/router') return { useRouter: () => ({ query: {}, isReady: true }) };
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href: typeof href === 'string' ? href : href.pathname + (Object.keys(href.query || {}).length ? '?' + new URLSearchParams(href.query) : ''), ...props }, children);
    if (id === 'next/head') return ({ children }) => children;
    if (id.endsWith('.module.css')) return { __esModule: true, default: css };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')), overrides, cache);
    return pr(id);
  }
  new Function('require', 'module', 'exports', code)(req, mod, mod.exports);
  return mod.exports;
}
function words(node) { if (node == null || typeof node === 'boolean') return ''; if (Array.isArray(node)) return node.map(words).join(' '); return typeof node === 'object' ? words(node.props?.children) : String(node); }
function find(node, predicate) { if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } return null; } if (!node || typeof node !== 'object') return null; return predicate(node) ? node : find(node.props?.children, predicate); }
function engine() {
  const slots = []; let cursor = 0; let effects = [];
  return {
    hooks: { ...React,
      useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; },
      useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
      useMemo(callback, deps) { const i = cursor++; const prev = slots[i]; if (!prev || !deps || deps.some((value, j) => value !== prev.deps?.[j])) slots[i] = { deps, value: callback() }; return slots[i].value; },
      useEffect(callback, deps) { const i = cursor++; const prev = slots[i]; if (!prev || !deps || deps.some((value, j) => value !== prev.deps?.[j])) { slots[i] = { deps, cleanup: prev?.cleanup }; effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = callback(); }); } },
    }, render(fn) { cursor = 0; return fn(); }, flush() { const pending = effects; effects = []; pending.forEach(fn => fn()); }, unmount() { slots.forEach(slot => slot?.cleanup?.()); },
  };
}
function setup({ stored = null, blocked = false, query = {} } = {}) {
  const e = engine(); let value = stored; let writes = 0;
  const previousWindow = global.window; const originalNow = Date.now; let tick = 0;
  Date.now = () => 1792137600000 + tick++;
  global.window = { localStorage: { getItem() { if (blocked) throw new Error('blocked'); return value; }, setItem(key, next) { if (blocked) throw new Error('blocked'); writes++; value = next; } }, setInterval: () => 1, clearInterval() {}, addEventListener() {}, removeEventListener() {}, requestAnimationFrame(fn) { fn(); } };
  const Component = load('components/LearningFlashcards.js', { react: e.hooks, 'next/router': { useRouter: () => ({ query, isReady: true }) } }).default;
  let tree;
  const render = () => { tree = e.render(() => Component({ cards, categories })); };
  render();
  return { get tree() { return tree; }, get saved() { return value; }, get writes() { return writes; }, render,
    flush() { e.flush(); render(); },
    button(label) { const node = find(tree, item => item.type === 'button' && words(item).trim() === label); assert.ok(node, label); return node; },
    click(label) { const button = this.button(label); assert.ok(!button.props.disabled, label); button.props.onClick(); render(); },
    cleanup() { e.unmount(); global.window = previousWindow; Date.now = originalNow; },
  };
}

test('SSR immediately shows the current question, answer, explanation and sources', () => {
  const Component = load('components/LearningFlashcards.js').default;
  const html = renderToStaticMarkup(React.createElement(Component, { cards, categories }));
  assert.equal((html.match(/<h1/g) || []).length, 1);
  assert.match(html, /Welche Wildart zeigt dieses Foto/);
  assert.match(html, /Tierfoto für diese Bestimmungskarte/);
  assert.match(html, /Fotograf/);
  assert.match(html, /Beispielart/);
  assert.match(html, /Dokumentiertes Motiv aus dem vorhandenen Bildnachweis/);
  assert.match(html, /Bildnachweis und Artenporträt/);
  assert.match(html, /https:\/\/example.org\/lesson/);
  assert.doesNotMatch(html, /Zweite Antwort|Dritte Antwort|Antwort zeigen/);
  assert.match(html, /Freiwillige Selbsteinschätzung/);
  assert.match(html, /Weiter ohne Bewertung/);
  assert.match(html, /nur in diesem Browser auf diesem Gerät/);
  assert.match(html, /lernkarten-drucken/);
});

test('Seeing and browsing cards does not rate them or write learning progress', () => {
  const s = setup();
  try {
    assert.match(words(s.tree), /Beispielart/);
    assert.equal(s.button('Gewusst').props.disabled, true);
    s.button('Gewusst').props.onClick(); s.render();
    s.flush(); s.flush();
    const writes = s.writes;
    const stale = s.button('Weiter ohne Bewertung');
    s.click('Weiter ohne Bewertung');
    assert.match(words(s.tree), /Zweite Antwort/);
    assert.match(words(s.tree), /Zweite vorhandene Erklärung/);
    stale.props.onClick(); s.render();
    assert.match(words(s.tree), /Zweite Antwort/);
    s.click('Weiter ohne Bewertung');
    assert.match(words(s.tree), /Dritte Antwort/);
    s.click('Weiter ohne Bewertung');
    assert.match(words(s.tree), /Beispielart/);
    s.flush();
    assert.doesNotMatch(words(s.tree), /in dieser Sitzung bewertet/);
    assert.deepEqual(JSON.parse(s.saved).cards, {});
    assert.equal(s.writes, writes, 'browsing does not persist a new review state');
  } finally { s.cleanup(); }
});

test('Both card changes focus and scroll the newly rendered question into view', () => {
  const s = setup();
  const frames = [], actions = [];
  global.window.requestAnimationFrame = callback => frames.push(callback);
  const attachHeading = label => {
    find(s.tree, node => node.type === 'h2' && node.props.id === 'lernkarten-frage').props.ref.current = {
      focus(options) { actions.push([label, 'focus', options]); },
      scrollIntoView(options) { actions.push([label, 'scroll', options]); },
    };
  };
  try {
    s.flush();
    attachHeading('first');
    s.click('Weiter ohne Bewertung');
    attachHeading('second');
    assert.equal(frames.length, 1);
    frames.shift()();
    s.click('Gewusst');
    attachHeading('third');
    assert.equal(frames.length, 1);
    frames.shift()();
    assert.deepEqual(actions, [
      ['second', 'focus', { preventScroll: true }],
      ['second', 'scroll', { block: 'start', behavior: 'auto' }],
      ['third', 'focus', { preventScroll: true }],
      ['third', 'scroll', { block: 'start', behavior: 'auto' }],
    ]);
    assert.match(words(s.tree), /Dritte Antwort/);
    s.flush();
    assert.deepEqual(Object.keys(JSON.parse(s.saved).cards), ['flash-example-two']);
  } finally { s.cleanup(); }
});

test('Visible answers retain the correct source scope and an explicit rating persists locally', () => {
  const s = setup();
  try {
    s.flush();
    assert.match(words(s.tree), /Beispielart/);
    assert.match(words(s.tree), /Bildnachweis und Artenporträt/);
    assert.match(words(s.tree), /Bildnachweis geprüft/);
    const sourcePanel = find(s.tree, node => node.type === 'details' && node.props.className === 'sources');
    assert.ok(sourcePanel && !sourcePanel.props.open);
    assert.equal(find(sourcePanel, node => node.props?.className === 'answer'), null, 'The learning answer never requires opening sources');
    assert.ok(find(s.tree, node => node.props?.className === 'courseLink'), 'The full existing lesson remains directly reachable');
    const stale = s.button('Gewusst');
    s.click('Gewusst');
    assert.match(words(s.tree), /Wie wird die nächste Frage/);
    assert.match(words(s.tree), /Hunde verstehen\s+· Vorhandene Lektion/);
    assert.match(words(s.tree), /Zweite Antwort/);
    assert.match(words(s.tree), /Zweite vorhandene Erklärung/);
    assert.match(words(s.tree), /Quellen der Ausgangslektion/);
    assert.match(words(s.tree), /Stand der Ausgangslektion/);
    stale.props.onClick(); s.render();
    assert.match(words(s.tree), /1 in dieser Sitzung bewertet/);
    s.flush();
    const stored = JSON.parse(s.saved);
    assert.equal(stored.cards['flash-photo-example'].rating, 'known');
    assert.equal(stored.cards['flash-photo-example'].intervalDays, 1);
    assert.equal(Object.keys(stored.cards).length, 1);
    assert.ok(s.writes > 0);
  } finally { s.cleanup(); }
});

test('Noch üben moves the card after the remaining cards and known cards leave the pending round', () => {
  const s = setup();
  try {
    s.flush(); s.click('Noch üben');
    assert.match(words(s.tree), /Wie wird die nächste Frage/);
    s.click('Gewusst');
    assert.match(words(s.tree), /Was gehört zum dritten Beispiel/);
    s.click('Gewusst');
    assert.match(words(s.tree), /Welche Wildart zeigt dieses Foto/);
    s.click('Gewusst');
    assert.match(words(s.tree), /Für jetzt ist deine Auswahl wiederholt/);
    assert.match(words(s.tree), /Selbsteinschätzung/);
  } finally { s.cleanup(); }
});

test('Filter changes reject previous-card handlers and keep search/category on the print link', () => {
  const s = setup();
  try {
    s.flush(); const stale = s.button('Gewusst'); const staleNext = s.button('Weiter ohne Bewertung');
    const select = find(s.tree, node => node.type === 'select');
    select.props.onChange({ target: { value: 'hundewesen' } }); s.render();
    stale.props.onClick(); s.render();
    staleNext.props.onClick(); s.render();
    assert.match(words(s.tree), /Wie wird die nächste Frage/);
    assert.match(words(s.tree), /Zweite Antwort/);
    assert.doesNotMatch(words(s.tree), /in dieser Sitzung bewertet/);
    const input = find(s.tree, node => node.type === 'input' && node.props.type === 'search');
    input.props.onChange({ target: { value: 'nächste' } }); s.render();
    const link = find(s.tree, node => node.props?.href?.pathname === '/lernen/lernkarten-drucken');
    assert.deepEqual(link.props.href.query, { kategorie: 'hundewesen', q: 'nächste', karte: cards[1].id });
  } finally { s.cleanup(); }
});

test('Stored local ratings survive a new session, and blocked storage remains usable', () => {
  const review = load('lib/flashcard-review.js');
  const state = review.rateFlashcardReview(null, cards[0].id, 'known', 1792137600000);
  const s = setup({ stored: JSON.stringify(state), query: { kategorie: 'hundewesen' } });
  try { s.flush(); assert.match(words(s.tree), /Wie wird die nächste Frage/); assert.doesNotMatch(words(s.tree), /Welche Wildart/); } finally { s.cleanup(); }
  const blocked = setup({ blocked: true });
  try { blocked.flush(); blocked.click('Gewusst'); assert.match(words(blocked.tree), /nur für diese geöffnete Sitzung/); assert.equal(blocked.writes, 0); } finally { blocked.cleanup(); }
});

test('Print view keeps compact numbered source references and lists every full URL once in an appendix', () => {
  const printModule = load('pages/lernen/lernkarten-drucken.js', { '../../lib/learning-flashcards': { getFlashcardExport: () => ({ cards, categories }) } });
  const Page = printModule.default;
  const html = renderToStaticMarkup(React.createElement(Page, { cards, categories }));
  assert.equal((html.match(/<h1/g) || []).length, 1);
  assert.match(html, /einseitig drucken/);
  assert.match(html, /Mittellinie falten/);
  assert.match(html, /Beispielart/);
  assert.match(html, /Hunde verstehen · Vorhandene Lektion/);
  assert.match(html, /https:\/\/example.org\/lesson/);
  assert.match(html, /Links im Quellenverzeichnis/);
  assert.ok(html.indexOf('Digital wiederholen') < html.indexOf('class="printList"'));
  assert.match(html, /Quellenverzeichnis/);
  const { sourceList, sourceByUrl } = printModule.getPrintSourceIndex(cards);
  assert.equal(sourceList.length, new Set(sourceList.map(item => item.url)).size);
  for (const { url } of sourceList) {
    const ref = sourceByUrl.get(url).id;
    assert.match(html, new RegExp(`href="#lernkarten-quelle-${ref}"`));
    assert.match(html, new RegExp(`id="lernkarten-quelle-${ref}"`));
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.equal((html.match(new RegExp(`class="appendixUrl"[^>]*>${escaped}<`, 'g')) || []).length, 1);
  }
  const cardHtml = html.slice(html.indexOf('class="printList"'), html.indexOf('class="sourceAppendix"'));
  assert.doesNotMatch(cardHtml, /https:\/\/example.org\/lesson/);
  assert.equal((html.match(/id="lernkarten-quelle-\d+"/g) || []).length, sourceList.length);
  assert.match(html, /Bildnachweis geprüft/);
  assert.match(html, /Stand der Ausgangslektion/);
  assert.doesNotMatch(html, /Inhaltlich geprüft/);
  assert.match(html, /Quelle|Quellen/);
  const cssText = fs.readFileSync(path.join(root, 'styles/LearningFlashcards.module.css'), 'utf8');
  assert.match(cssText, /@page\s*\{\s*size:\s*A4 portrait/);
  assert.match(cssText, /break-inside:\s*avoid/);
  assert.match(cssText, /object-fit:\s*contain/);
  assert.match(cssText, /Seitennavigation/);
});

test('Packed print props retain a changed category and search across repeated renders/effects', () => {
  const e = engine();
  const { packFlashcards } = load('lib/flashcard-payload.js');
  const deck = packFlashcards({ version: 1, title: 'Testdeck', cards, categories });
  const Page = load('pages/lernen/lernkarten-drucken.js', {
    react: e.hooks,
    'next/router': { useRouter: () => ({ query: {}, isReady: true }) },
    '../../lib/learning-flashcards': { getFlashcardExport: () => ({ cards, categories }) },
  }).default;
  let tree;
  const render = () => { tree = e.render(() => Page({ deck })); };
  const settle = () => { render(); e.flush(); render(); e.flush(); render(); };
  try {
    settle();
    find(tree, node => node.type === 'select').props.onChange({ target: { value: 'hundewesen' } });
    settle();
    assert.equal(find(tree, node => node.type === 'select').props.value, 'hundewesen');
    find(tree, node => node.type === 'input' && node.props.type === 'search').props.onChange({ target: { value: 'nächste' } });
    settle();
    assert.equal(find(tree, node => node.type === 'select').props.value, 'hundewesen');
    assert.equal(find(tree, node => node.type === 'input' && node.props.type === 'search').props.value, 'nächste');
    assert.match(words(tree), /1\s+Karte\s+drucken/);
    assert.match(words(tree), /Wie wird die nächste Frage/);
    assert.doesNotMatch(words(tree), /Welche Wildart zeigt dieses Foto/);
    const back = find(tree, node => node.props?.href?.pathname === '/lernen/lernkarten');
    assert.deepEqual(back.props.href.query, { kategorie: 'hundewesen', q: 'nächste' });
  } finally { e.unmount(); }
});
