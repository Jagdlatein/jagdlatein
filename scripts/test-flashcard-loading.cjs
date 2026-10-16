// Execute the route, page-data builder and loading hook; content accuracy is reviewed separately.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const React = pr('react');
const css = new Proxy({}, { get: (_, key) => String(key) });

function load(relative, overrides = {}, cache = new Map()) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
  const mod = { exports: {} };
  cache.set(filename, mod.exports);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' },
  });
  function req(id) {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/router') return { useRouter: () => ({ query: {}, isReady: true }) };
    if (id === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
    if (id === 'next/head') return ({ children }) => children;
    if (id.endsWith('.module.css')) return { __esModule: true, default: css };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')), overrides, cache);
    return pr(id);
  }
  new Function('require', 'module', 'exports', code)(req, mod, mod.exports);
  return mod.exports;
}

const { packFlashcards, unpackFlashcards } = load('lib/flashcard-payload.js');
const sources = [
  { label: 'Ausgangslektion', url: 'https://example.org/lesson' },
  { label: 'Unabhängige Fachquelle', url: 'https://example.net/source' },
];
function card(id, categoryId, question, answer) {
  return { id, categoryId, categoryTitle: categoryId === 'hundewesen' ? 'Hundewesen' : 'Wildkunde',
    moduleTitle: 'Geprüfter Beispielkurs', lessonTitle: 'Beispiellernen', context: 'Vorhandene Wissenslektion',
    question, answer, explanation: 'Die Erklärung bleibt mit den Quellen beim vollständigen Abruf erhalten.',
    sources, sourceScope: 'lesson', reviewedOn: '2026-10-16', courseHref: '/kurse/beispiel#lektion' };
}
const seedCards = [
  card('flash-wild-eins', 'wildkunde', 'Welche Information wird beim Wild geprüft?', 'Die passende Artzuordnung.'),
  card('flash-hund-eins', 'hundewesen', 'Wie wird eine Belohnung eingeordnet?', 'In den Tagesplan.'),
];
const fullCards = [...seedCards,
  card('flash-hund-zwei', 'hundewesen', 'Wie wird die Belohnung im Verlauf erfasst?', 'Mit tatsächlicher Menge.'),
  card('flash-wild-zwei', 'wildkunde', 'Welche zweite Wildinformation gehört dazu?', 'Die Beobachtungsbedingungen.'),
];
const categories = [{ id: 'wildkunde', title: 'Wildkunde', count: 2 }, { id: 'hundewesen', title: 'Hundewesen', count: 2 }];
const makeDeck = cards => packFlashcards({ version: 1, title: 'Ausgangswissen', cards, categories });
const seedDeck = makeDeck(seedCards);
const fullDeck = makeDeck(fullCards);
const baseProps = { deck: seedDeck, remote: true, totalCount: fullCards.length };

function words(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(words).join(' ');
  return typeof node === 'object' ? words(node.props?.children) : String(node);
}
function find(node, predicate) {
  if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } return null; }
  if (!node || typeof node !== 'object') return null;
  return predicate(node) ? node : find(node.props?.children, predicate);
}

function engine() {
  const slots = []; let cursor = 0; let effects = []; let mounted = true; let updatesAfterUnmount = 0;
  return {
    hooks: { ...React,
      useState(initial) {
        const i = cursor++;
        if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial };
        return [slots[i].value, value => {
          if (!mounted) { updatesAfterUnmount++; return; }
          slots[i].value = typeof value === 'function' ? value(slots[i].value) : value;
        }];
      },
      useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
      useMemo(callback, deps) {
        const i = cursor++; const prev = slots[i];
        if (!prev || !deps || deps.length !== prev.deps?.length || deps.some((value, j) => !Object.is(value, prev.deps[j]))) slots[i] = { deps, value: callback() };
        return slots[i].value;
      },
      useEffect(callback, deps) {
        const i = cursor++; const prev = slots[i];
        if (!prev || !deps || deps.length !== prev.deps?.length || deps.some((value, j) => !Object.is(value, prev.deps[j]))) {
          slots[i] = { deps, cleanup: prev?.cleanup };
          effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = callback(); });
        }
      },
    },
    render(fn) { cursor = 0; return fn(); },
    flush() { const pending = effects; effects = []; pending.forEach(fn => fn()); },
    unmount() { if (!mounted) return; mounted = false; effects = []; slots.forEach(slot => slot?.cleanup?.()); },
    get updatesAfterUnmount() { return updatesAfterUnmount; },
  };
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const settlePromises = () => new Promise(resolve => setImmediate(resolve));
function response(status = 200, data = fullDeck) { return { ok: status >= 200 && status < 300, status, json: async () => structuredClone(data) }; }
function browser(fetchImpl) {
  const originals = { fetch: global.fetch, setTimeout: global.setTimeout, clearTimeout: global.clearTimeout, window: global.window };
  const calls = []; const timers = new Map(); let nextTimer = 1; let stored = null; let prints = 0;
  global.fetch = (url, options) => { calls.push({ url, options }); return fetchImpl(url, options, calls.length); };
  global.setTimeout = (callback, milliseconds) => { const id = nextTimer++; timers.set(id, { callback, milliseconds }); return id; };
  global.clearTimeout = id => timers.delete(id);
  global.window = { localStorage: { getItem: () => stored, setItem: (key, value) => { stored = value; } },
    setInterval: () => 1, clearInterval() {}, addEventListener() {}, removeEventListener() {}, requestAnimationFrame: fn => fn(), print: () => prints++ };
  return {
    calls, timers,
    get prints() { return prints; },
    fireTimeout(milliseconds) {
      const timer = [...timers.entries()].find(([, value]) => value.milliseconds === milliseconds);
      assert.ok(timer, `timeout ${milliseconds} ms was scheduled`);
      timers.delete(timer[0]); timer[1].callback();
    },
    restore() { Object.assign(global, originals); },
  };
}
function hookHarness(props = baseProps) {
  const e = engine();
  const hook = load('components/useFlashcardDeck.js', { react: e.hooks }).default;
  let value; let currentProps = props;
  const render = () => { value = e.render(() => hook(currentProps)); return value; };
  render();
  return { e, get value() { return value; }, render, setProps(next) { currentProps = next; render(); },
    flush() { render(); e.flush(); render(); }, async settle() { await settlePromises(); render(); e.flush(); render(); }, cleanup() { e.unmount(); } };
}
function routeFor(auth, exported = () => ({ version: 1, cards: fullCards, categories })) {
  let exportsRead = 0; let receivedRequest;
  const route = load('app/api/lernen/lernkarten/route.js', {
    '../../../../lib/account-access': { getSignedAccountAccess: async request => { receivedRequest = request; return typeof auth === 'function' ? auth(request) : auth; } },
    '../../../../lib/learning-flashcards': { getFlashcardExport: () => { exportsRead++; return exported(); } },
  });
  return { ...route, get exportsRead() { return exportsRead; }, get receivedRequest() { return receivedRequest; } };
}
function assertPrivate(response) {
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('vary'), 'Cookie');
}

test('Real SSR page data contain at most 24 cards and remain below the 128 KB page budget', () => {
  const actual = load('lib/learning-flashcards.js').getFlashcardExport();
  assert.ok(actual.cards.length > 24, 'the real expanded bank exercises incremental loading');
  for (const file of ['pages/lernen/lernkarten.js', 'pages/lernen/lernkarten-drucken.js']) {
    const { props } = load(file).getStaticProps();
    assert.ok(Buffer.byteLength(JSON.stringify(props)) < 128 * 1024, `${file}: SSR payload too large`);
    const seed = unpackFlashcards(props.deck);
    assert.equal(seed.cards.length, 24);
    assert.equal(props.totalCount, actual.cards.length);
    assert.equal(props.remote, true);
    assert.deepEqual(seed.cards, actual.cards.slice(0, 24));
    assert.deepEqual(seed.categories, actual.categories, 'all categories remain available before fetching');
  }
});

test('Page-data builder handles a complete small bank without an unnecessary remote request', () => {
  const original = { version: 1, cards: seedCards, categories };
  const data = load('lib/flashcard-page-data.js', { './learning-flashcards': { getFlashcardExport: () => original } }).getFlashcardPageData();
  assert.equal(data.remote, false);
  assert.equal(data.totalCount, 2);
  assert.deepEqual(unpackFlashcards(data.deck), original);
});

test('API returns the full source-preserving bank for paid and admin accounts with private/no-store', async () => {
  for (const auth of [{ paid: true, admin: false }, { paid: false, admin: true }]) {
    const api = routeFor(auth);
    const request = new Request('https://jagdlatein.de/api/lernen/lernkarten', { headers: { cookie: 'session=fixture' } });
    const result = await api.GET(request);
    assert.equal(result.status, 200); assertPrivate(result);
    assert.equal(api.receivedRequest, request);
    assert.equal(api.exportsRead, 1);
    assert.deepEqual(unpackFlashcards(await result.json()).cards, fullCards);
  }
});

test('API denies unsigned and unpaid callers without evaluating the protected content bank', async () => {
  for (const [auth, status] of [[null, 401], [{ paid: false, admin: false }, 403]]) {
    const api = routeFor(auth);
    const result = await api.GET(new Request('https://jagdlatein.de/api/lernen/lernkarten'));
    assert.equal(result.status, status); assertPrivate(result);
    assert.equal(api.exportsRead, 0);
    const body = await result.json();
    assert.equal(typeof body.message, 'string');
    assert.equal(body.cards, undefined);
  }
});

test('API failures remain a private 503 and do not expose internal errors or partial cards', async () => {
  for (const api of [routeFor(() => { throw new Error('private auth failure'); }), routeFor({ paid: true }, () => { throw new Error('private catalog failure'); })]) {
    const result = await api.GET(new Request('https://jagdlatein.de/api/lernen/lernkarten'));
    assert.equal(result.status, 503); assertPrivate(result);
    const body = await result.json();
    assert.match(body.message, /vorübergehend/);
    assert.doesNotMatch(JSON.stringify(body), /private auth|private catalog/);
    assert.equal(body.cards, undefined);
  }
});

test('Hook displays initial cards immediately, fetches once and keeps category references on success', async () => {
  const pending = deferred(); const b = browser(() => pending.promise); const h = hookHarness();
  try {
    assert.deepEqual(h.value.cards, seedCards);
    assert.equal(h.value.incomplete, true); assert.equal(h.value.loading, true);
    const firstCategories = h.value.categories;
    assert.equal(b.calls.length, 0, 'SSR does not fetch');
    h.flush();
    assert.equal(b.calls.length, 1);
    assert.equal(b.calls[0].url, '/api/lernen/lernkarten');
    assert.equal(b.calls[0].options.cache, 'no-store');
    assert.equal(b.calls[0].options.credentials, 'same-origin');
    assert.ok(b.calls[0].options.signal instanceof AbortSignal);
    pending.resolve(response()); await h.settle();
    assert.deepEqual(h.value.cards, fullCards);
    assert.equal(h.value.categories, firstCategories);
    assert.equal(h.value.incomplete, false); assert.equal(h.value.loading, false);
    assert.equal(h.value.totalCount, fullCards.length); assert.equal(h.value.loadError, '');
    h.flush(); await h.settle();
    assert.equal(b.calls.length, 1, 'ordinary re-renders do not restart fetching');
    assert.equal(b.timers.size, 0);
  } finally { h.cleanup(); b.restore(); }
});

test('Offline failure preserves usable seed cards and retry replaces them with the complete bank', async () => {
  const b = browser((url, options, call) => call === 1 ? Promise.reject(new Error('Netzwerk nicht erreichbar')) : Promise.resolve(response()));
  const h = hookHarness();
  try {
    h.flush(); await h.settle();
    assert.deepEqual(h.value.cards, seedCards);
    assert.equal(h.value.incomplete, true); assert.equal(h.value.loading, false);
    assert.match(h.value.loadError, /Netzwerk/);
    h.value.onReload(); h.flush(); await h.settle();
    assert.equal(b.calls.length, 2); assert.equal(b.calls[0].options.signal.aborted, true);
    assert.deepEqual(h.value.cards, fullCards);
    assert.equal(h.value.loadError, ''); assert.equal(h.value.incomplete, false);
  } finally { h.cleanup(); b.restore(); }
});

test('An already complete small bank needs no client fetch or timeout', () => {
  const b = browser(() => { throw new Error('unnecessary fetch'); });
  const h = hookHarness({ deck: seedDeck, remote: false, totalCount: seedCards.length });
  try {
    h.flush();
    assert.deepEqual(h.value.cards, seedCards);
    assert.equal(h.value.incomplete, false); assert.equal(h.value.loading, false);
    assert.equal(h.value.loadError, ''); assert.equal(b.calls.length, 0); assert.equal(b.timers.size, 0);
  } finally { h.cleanup(); b.restore(); }
});

test('401 and 403 fetch failures retain the seed with actionable access messages', async () => {
  for (const [status, expected] of [[401, /erneut an/], [403, /aktiver Zugang/]]) {
    const b = browser(() => Promise.resolve(response(status))); const h = hookHarness();
    try {
      h.flush(); await h.settle();
      assert.deepEqual(h.value.cards, seedCards);
      assert.equal(h.value.incomplete, true); assert.equal(h.value.loading, false);
      assert.match(h.value.loadError, expected);
    } finally { h.cleanup(); b.restore(); }
  }
});

test('Malformed source references and incomplete card records fail safely back to the seed', async () => {
  const invalidReference = structuredClone(fullDeck); invalidReference.cards[0].context = 999;
  const invalidRecord = structuredClone(fullDeck); delete invalidRecord.cards[0].a;
  for (const body of [invalidReference, invalidRecord]) {
    const b = browser(() => Promise.resolve(response(200, body))); const h = hookHarness();
    try {
      h.flush(); await h.settle();
      assert.deepEqual(h.value.cards, seedCards);
      assert.equal(h.value.incomplete, true); assert.equal(h.value.loading, false);
      assert.ok(h.value.loadError);
    } finally { h.cleanup(); b.restore(); }
  }
});

test('15-second timeout aborts the request and leaves retry and seed data available', async () => {
  const b = browser((url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })), { once: true })));
  const h = hookHarness();
  try {
    h.flush(); b.fireTimeout(15000); await h.settle();
    assert.equal(b.calls[0].options.signal.aborted, true);
    assert.deepEqual(h.value.cards, seedCards);
    assert.equal(h.value.incomplete, true); assert.equal(h.value.loading, false);
    assert.match(h.value.loadError, /zu lange/);
    assert.equal(typeof h.value.onReload, 'function');
    assert.equal(b.timers.size, 0);
  } finally { h.cleanup(); b.restore(); }
});

test('Unmount aborts the request and ignores both late successful data and abort errors', async () => {
  const pending = deferred(); const b = browser(() => pending.promise); const h = hookHarness();
  try {
    h.flush(); h.cleanup();
    assert.equal(b.calls[0].options.signal.aborted, true); assert.equal(b.timers.size, 0);
    pending.resolve(response()); await settlePromises();
    assert.equal(h.e.updatesAfterUnmount, 0);
  } finally { h.cleanup(); b.restore(); }
  const b2 = browser((url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })), { once: true })));
  const h2 = hookHarness();
  try { h2.flush(); h2.cleanup(); await settlePromises(); assert.equal(h2.e.updatesAfterUnmount, 0); }
  finally { h2.cleanup(); b2.restore(); }
});

test('A new seed cancels an old request and an aborted old response cannot overwrite it', async () => {
  const first = deferred(); const second = deferred();
  const nextCards = [card('flash-next', 'hundewesen', 'Neue Belohnungsfrage?', 'Neue Antwort.')];
  const nextDeck = makeDeck(nextCards);
  const b = browser((url, options, call) => call === 1 ? first.promise : second.promise); const h = hookHarness();
  try {
    h.flush(); h.setProps({ deck: nextDeck, remote: true, totalCount: 2 }); h.flush();
    assert.equal(b.calls[0].options.signal.aborted, true);
    first.resolve(response()); await h.settle();
    assert.deepEqual(h.value.cards, nextCards); assert.equal(h.value.incomplete, true);
    second.resolve(response(200, nextDeck)); await h.settle();
    assert.deepEqual(h.value.cards, nextCards);
  } finally { h.cleanup(); b.restore(); }
});

test('A completed bank is invalidated immediately when its seed changes', async () => {
  const second = deferred();
  const b = browser((url, options, call) => call === 1 ? Promise.resolve(response()) : second.promise);
  const h = hookHarness();
  try {
    h.flush(); await h.settle();
    assert.equal(h.value.incomplete, false); assert.deepEqual(h.value.cards, fullCards);
    const changed = [card('flash-revised', 'hundewesen', 'Neu geprüfte Frage?', 'Die neue Antwort.')];
    h.setProps({ deck: makeDeck(changed), remote: true, totalCount: fullCards.length });
    assert.deepEqual(h.value.cards, changed, 'the previous full bank must not be shown for a different seed');
    assert.equal(h.value.incomplete, true);
    h.flush();
    assert.equal(b.calls.length, 2);
  } finally { h.cleanup(); b.restore(); }
});

test('Expanded cards preserve the active category, typed search and revealed answer in the learning UI', async () => {
  const pending = deferred(); const b = browser(() => pending.promise); const h = hookHarness(); const e = engine();
  const UI = load('components/LearningFlashcards.js', { react: e.hooks }).default;
  let tree;
  const render = () => { tree = e.render(() => UI(h.value)); };
  const settle = () => { render(); e.flush(); render(); e.flush(); render(); };
  try {
    h.flush(); settle();
    find(tree, node => node.type === 'select').props.onChange({ target: { value: 'hundewesen' } }); settle();
    find(tree, node => node.type === 'input' && node.props.type === 'search').props.onChange({ target: { value: 'Belohnung' } }); settle();
    const reveal = find(tree, node => node.type === 'button' && /Antwort zeigen/.test(words(node)));
    assert.ok(reveal); reveal.props.onClick(); settle();
    assert.match(words(tree), /In den Tagesplan/);
    pending.resolve(response()); await h.settle(); settle();
    assert.equal(find(tree, node => node.type === 'select').props.value, 'hundewesen');
    assert.equal(find(tree, node => node.type === 'input' && node.props.type === 'search').props.value, 'Belohnung');
    assert.match(words(tree), /In den Tagesplan/);
    assert.match(words(tree), /2 Karten offen oder fällig/);
    const printLink = find(tree, node => node.props?.href?.pathname === '/lernen/lernkarten-drucken');
    assert.deepEqual(printLink.props.href.query, { kategorie: 'hundewesen', q: 'Belohnung' });
  } finally { e.unmount(); h.cleanup(); b.restore(); }
});

function printHarness() {
  const e = engine();
  const Page = load('pages/lernen/lernkarten-drucken.js', { react: e.hooks }).default;
  let tree;
  const render = () => { tree = e.render(() => Page(baseProps)); };
  const settleRender = () => { render(); e.flush(); render(); e.flush(); render(); };
  settleRender();
  return { e, get tree() { return tree; }, settleRender, async settle() { await settlePromises(); settleRender(); },
    get printButton() { return find(tree, node => node.type === 'button' && (/drucken|Druckauswahl/.test(words(node)))); }, cleanup() { e.unmount(); } };
}

test('Print page withholds every printable card until the bank is complete, then preserves its filters', async () => {
  const pending = deferred(); const b = browser(() => pending.promise); const p = printHarness();
  try {
    assert.equal(p.printButton.props.disabled, true);
    assert.equal(find(p.tree, node => node.type === 'article'), null);
    assert.match(words(p.tree), /vollständige Auswahl/);
    find(p.tree, node => node.type === 'select').props.onChange({ target: { value: 'hundewesen' } }); p.settleRender();
    find(p.tree, node => node.type === 'input' && node.props.type === 'search').props.onChange({ target: { value: 'Belohnung' } }); p.settleRender();
    pending.resolve(response()); await p.settle();
    assert.equal(find(p.tree, node => node.type === 'select').props.value, 'hundewesen');
    assert.equal(find(p.tree, node => node.type === 'input' && node.props.type === 'search').props.value, 'Belohnung');
    assert.equal(p.printButton.props.disabled, false);
    assert.ok(find(p.tree, node => node.type === 'article'));
    assert.match(words(p.tree), /2 Karten drucken/);
    p.printButton.props.onClick(); assert.equal(b.prints, 1);
  } finally { p.cleanup(); b.restore(); }
});

test('A failed print fetch never exposes a partial printable selection', async () => {
  const b = browser(() => Promise.resolve(response(401))); const p = printHarness();
  try {
    await p.settle();
    assert.equal(p.printButton.props.disabled, true);
    assert.equal(find(p.tree, node => node.type === 'article'), null);
    assert.match(words(p.tree), /erneut an/);
    assert.equal(b.prints, 0);
    assert.ok(find(p.tree, node => node.type === 'button' && words(node).trim() === 'Erneut laden'));
  } finally { p.cleanup(); b.restore(); }
});

test('A valid-looking truncated bank cannot unlock printing below the announced total', async () => {
  const b = browser(() => Promise.resolve(response(200, makeDeck(fullCards.slice(0, 3))))); const p = printHarness();
  try {
    await p.settle();
    assert.equal(p.printButton.props.disabled, true, 'three cards must not unlock a four-card print selection');
    assert.equal(find(p.tree, node => node.type === 'article'), null);
  } finally { p.cleanup(); b.restore(); }
});

test('Repeated card IDs cannot masquerade as a complete printable bank', async () => {
  const duplicated = [...seedCards, seedCards[0], seedCards[1]];
  const b = browser(() => Promise.resolve(response(200, makeDeck(duplicated)))); const p = printHarness();
  try {
    await p.settle();
    assert.equal(p.printButton.props.disabled, true, 'four entries with only two distinct cards are incomplete');
    assert.equal(find(p.tree, node => node.type === 'article'), null);
  } finally { p.cleanup(); b.restore(); }
});

test('Category totals still protect completeness when a numeric total is absent', async () => {
  const b = browser(() => Promise.resolve(response(200, makeDeck(fullCards.slice(0, 3)))));
  const h = hookHarness({ deck: seedDeck, remote: true });
  try {
    h.flush(); await h.settle();
    assert.deepEqual(h.value.cards, seedCards);
    assert.equal(h.value.incomplete, true);
    assert.equal(h.value.loading, false);
    assert.match(h.value.loadError, /unvollständig/);
  } finally { h.cleanup(); b.restore(); }
});

test('A same-sized response may not silently discard a learner\'s initial cards', async () => {
  const changed = fullCards.map((item, index) => index === 1
    ? card('flash-unrelated', 'hundewesen', 'Andere Frage?', 'Andere Antwort.') : item);
  const b = browser(() => Promise.resolve(response(200, makeDeck(changed)))); const h = hookHarness();
  try {
    h.flush(); await h.settle();
    assert.deepEqual(h.value.cards, seedCards, 'a revealed starting card remains usable on a mismatched server response');
    assert.equal(h.value.incomplete, true);
    assert.match(h.value.loadError, /unvollständig/);
  } finally { h.cleanup(); b.restore(); }
});
