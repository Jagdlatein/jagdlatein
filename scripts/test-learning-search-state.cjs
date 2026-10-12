const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const requireProject = createRequire(path.join(root, 'package.json'));
const React = requireProject('react');
const swc = requireProject('next/dist/build/swc');

function load(relative, overrides = {}, globals = {}, cache = new Map()) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  new Function('require', 'module', 'exports', 'window', 'fetch', 'setTimeout', 'clearTimeout', code)(id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
    if (id === 'next/link') return { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) };
    if (id === './AppIcon') return { __esModule: true, default: () => null };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), id + '.js')), overrides, globals, cache);
    return requireProject(id);
  }, mod, mod.exports, globals.window, globals.fetch, globals.setTimeout || setTimeout, globals.clearTimeout || clearTimeout);
  cache.set(filename, mod.exports); return mod.exports;
}

const state = load('lib/learning-search-state.js');
test('Search URLs restore all validated fields and inherit a category page only when no valid override exists', () => {
  assert.deepEqual(state.readLearningSearchURL('/lernen/jagdrecht?q=Schonzeit&type=course&country=CH&page=3', 'jagdrecht'),
    { query: 'Schonzeit', category: 'jagdrecht', type: 'course', country: 'CH', page: 3 });
  assert.equal(state.readLearningSearchURL('/lernen/hundewesen?q=Hund', 'hundewesen').category, 'hundewesen');
  assert.equal(state.readLearningSearchURL('/lernen/hundewesen?searchCategory=all', 'hundewesen').category, 'all');
  assert.equal(state.readLearningSearchURL('/lernen?category=wildkunde', 'all').category, 'all', 'Dynamic route parameters must not become search filter overrides');
});

test('Malformed values cannot override allowed filters; country only applies to Jagdrecht and text has a bound', () => {
  assert.deepEqual(state.readLearningSearchURL('/lernen?q=x%00y&searchCategory=outside&type=__proto__&country=US&page=-1'),
    { query: 'x y', category: 'all', type: 'all', country: 'all', page: 1 });
  assert.equal(state.readLearningSearchURL('/lernen?q=' + 'x'.repeat(300)).query.length, 160);
  for (const value of ['1.5', 'Infinity', '1001', '2e2', '']) assert.equal(state.readLearningSearchURL('/lernen?page=' + value).page, 1);
  assert.equal(state.readLearningSearchURL('/lernen?searchCategory=wildkunde&country=CH').country, 'all');
  assert.deepEqual(state.readLearningSearchURL('//external.invalid?type=course'), state.defaultLearningSearch());
});

test('Writing a search preserves unrelated duplicate parameters, actual category path and hash; reset only clears search fields', () => {
  const original = '/lernen/hundewesen?eintrag=a&eintrag=b&next=%2Fkonto&q=old&page=8#werkzeuge';
  const href = state.learningSearchURL(original, { query: 'Gams & Steinbock', category: 'wildkunde', type: 'species', country: 'CH', page: 2 }, 'hundewesen');
  const url = new URL(href, 'https://test.invalid');
  assert.equal(url.pathname, '/lernen/hundewesen'); assert.equal(url.hash, '#werkzeuge');
  assert.deepEqual(url.searchParams.getAll('eintrag'), ['a', 'b']); assert.equal(url.searchParams.get('next'), '/konto');
  assert.equal(url.searchParams.get('q'), 'Gams & Steinbock'); assert.equal(url.searchParams.get('searchCategory'), 'wildkunde');
  assert.equal(url.searchParams.has('country'), false); assert.equal(url.searchParams.get('page'), '2');
  const reset = new URL(state.learningSearchURL(href, state.defaultLearningSearch('hundewesen'), 'hundewesen'), 'https://test.invalid');
  for (const key of ['q', 'searchCategory', 'type', 'country', 'page']) assert.equal(reset.searchParams.has(key), false);
  assert.equal(reset.hash, '#werkzeuge'); assert.deepEqual(reset.searchParams.getAll('eintrag'), ['a', 'b']);
});

function find(node, predicate) {
  if (Array.isArray(node)) { for (const child of node) { const found = find(child, predicate); if (found) return found; } return null; }
  if (!node || typeof node !== 'object') return null;
  return predicate(node) ? node : find(node.props?.children, predicate);
}
function words(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(words).join('');
  return typeof node === 'object' ? words(node.props?.children) : String(node);
}
function setup(asPath = '/lernen', category = 'all', ready = true) {
  let cursor = 0, changed = false, tree, props = { category }, nextTimer = 0;
  const slots = [], effects = [], timers = new Map(), listeners = new Map(), requests = [], replacements = [];
  const hooks = { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, next => { const value = typeof next === 'function' ? next(slots[i].value) : next; if (!Object.is(value, slots[i].value)) changed = true; slots[i].value = value; }]; },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
    useEffect(callback, deps) { const i = cursor++, previous = slots[i]; if (!previous || deps.some((value, n) => value !== previous.deps[n])) { slots[i] = { deps, cleanup: previous?.cleanup }; effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = callback(); }); } },
  };
  const router = { asPath, isReady: ready, replace: (...args) => { replacements.push(args); return Promise.resolve(true); } };
  const window = { location: {}, addEventListener(name, callback) { listeners.set(name, callback); }, removeEventListener(name, callback) { if (listeners.get(name) === callback) listeners.delete(name); } };
  const globals = { window, setTimeout(callback) { const id = ++nextTimer; timers.set(id, callback); return id; }, clearTimeout(id) { timers.delete(id); },
    fetch(url, options) { return new Promise(resolve => requests.push({ url, options, resolve })); } };
  const Component = load('components/LearningSearch.js', { react: hooks, 'next/router': { useRouter: () => router } }, globals).default;
  function render() { cursor = 0; changed = false; tree = Component(props); }
  function flush() { for (let i = 0; i < 12; i++) { const pending = effects.splice(0); pending.forEach(fn => fn()); if (changed) render(); else if (!effects.length) return; } throw new Error('Effect loop'); }
  function route(href, pop = false) { const url = new URL(href, 'https://test.invalid'); router.asPath = href; Object.assign(window.location, { pathname: url.pathname, search: url.search, hash: url.hash }); if (pop) listeners.get('popstate')?.(); render(); flush(); }
  render(); flush();
  return { router, requests, replacements, timers, listeners, route, get tree() { return tree; }, words: () => words(tree), render, flush,
    field(label) { const node = find(tree, item => item.type === 'label' && words(item).startsWith(label)); assert.ok(node, label); return find(node, item => ['input', 'select'].includes(item.type)); },
    change(label, value) { this.field(label).props.onChange({ target: { value } }); render(); flush(); },
    runTimers() { const pending = [...timers.entries()]; timers.clear(); pending.forEach(([, callback]) => callback()); },
    async respond(index, title = 'Treffer', total = 1, pages = 1) { requests[index].resolve({ ok: true, json: async () => ({ total, pages, results: total > 0 ? [{ id: title, title, href: '/kurse/test', categories: ['wildkunde'], type: 'course', description: 'Erklärung' }] : [] }) }); for (let i = 0; i < 5; i++) await Promise.resolve(); render(); flush(); },
    setCategory(value) { props = { category: value }; render(); flush(); },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
  };
}

test('Client waits for router hydration and restores direct-link filters/page before making a search request', () => {
  const s = setup('/lernen/jagdrecht?q=Schonzeit&type=course&country=CH&page=3#lernen-suche', 'jagdrecht', false);
  assert.equal(s.requests.length, 0); assert.equal(s.timers.size, 0);
  assert.equal(s.field('Suchbegriff').props.disabled, true);
  s.router.isReady = true; s.render(); s.flush();
  assert.equal(s.field('Suchbegriff').props.value, 'Schonzeit'); assert.equal(s.field('Land').props.value, 'CH');
  assert.equal(s.field('Suchbegriff').props.disabled, false);
  s.runTimers();
  const request = new URL(s.requests[0].url, 'https://test.invalid');
  assert.equal(request.searchParams.get('page'), '3'); assert.equal(request.searchParams.get('category'), 'jagdrecht');
  assert.equal(s.replacements.length, 0, 'URL restoration must not produce a router loop');
  assert.match(s.words(), /Link zu dieser Suche/);
});

test('Typing produces one shallow replace, resets page, preserves context, and an older URL acknowledgement cannot overwrite a newer draft', () => {
  const s = setup('/lernen?q=Reh&type=species&page=4&eintrag=keep#lernen-suche');
  s.change('Suchbegriff', 'G'); s.change('Suchbegriff', 'Ga'); s.change('Suchbegriff', 'Gams');
  s.runTimers(); assert.equal(s.replacements.length, 1);
  const [href, , options] = s.replacements[0], url = new URL(href, 'https://test.invalid');
  assert.equal(url.searchParams.get('q'), 'Gams'); assert.equal(url.searchParams.has('page'), false);
  assert.equal(url.searchParams.get('eintrag'), 'keep'); assert.equal(url.hash, '#lernen-suche');
  assert.deepEqual(options, { shallow: true, scroll: false });
  s.change('Suchbegriff', 'Gamswild'); s.route(href);
  assert.equal(s.field('Suchbegriff').props.value, 'Gamswild');
  s.runTimers(); assert.equal(s.replacements.length, 2);
  s.route(s.replacements[1][0]); s.runTimers(); assert.equal(s.replacements.length, 2, 'No URL acknowledgement loop');
});

test('Back/forward restores filters, category-page defaults and legal country selection without writing another history entry', () => {
  const s = setup('/lernen?q=Gams&type=species');
  s.change('Suchbegriff', 'Steinbock'); s.runTimers(); s.route(s.replacements[0][0]);
  const replacements = s.replacements.length;
  s.route('/lernen?searchCategory=jagdrecht&q=Jagdkarte&country=AT&page=2', true);
  assert.equal(s.field('Suchbegriff').props.value, 'Jagdkarte'); assert.equal(s.field('Land').props.value, 'AT');
  s.route('/lernen?q=Gams&type=species', true);
  assert.equal(s.field('Suchbegriff').props.value, 'Gams'); assert.equal(find(s.tree, item => item.type === 'label' && words(item).startsWith('Land')), null);
  assert.equal(s.replacements.length, replacements);
  const contextual = setup('/lernen/hundewesen', 'hundewesen');
  contextual.setCategory('jagdrecht'); assert.equal(contextual.field('Kategorie').props.value, 'jagdrecht');
  contextual.unmount(); assert.equal(contextual.listeners.size, 0); assert.equal(contextual.timers.size, 0);
});

test('Results from a previous request cannot reappear after changed filters or browser history restoration', async () => {
  const s = setup('/lernen?q=Reh'); s.runTimers();
  s.change('Suchbegriff', 'Reh');
  assert.equal(s.requests.length, 1, 'An unchanged field must not invalidate its still-current request');
  s.change('Suchbegriff', 'Gams'); s.runTimers();
  await s.respond(0, 'ALTER REH-TREFFER'); assert.doesNotMatch(s.words(), /ALTER REH-TREFFER/);
  await s.respond(1, 'GAMS-TREFFER'); assert.match(s.words(), /GAMS-TREFFER/);
  s.route('/lernen?q=Steinbock', true); assert.doesNotMatch(s.words(), /GAMS-TREFFER/);
  s.runTimers(); await s.respond(2, 'STEINBOCK-TREFFER'); assert.match(s.words(), /STEINBOCK-TREFFER/);
});

test('A bookmarked results page beyond the current result set recovers to the actual last page without a false empty state or a loop', async () => {
  const s = setup('/lernen?q=Reh&page=999'); s.runTimers();
  await s.respond(0, 'UNREACHABLE-PAGE', 42, 2);
  assert.doesNotMatch(s.words(), /UNREACHABLE-PAGE|Keine passenden Angebote gefunden/);
  s.runTimers();
  assert.equal(new URL(s.requests[1].url, 'https://test.invalid').searchParams.get('page'), '2');
  await s.respond(1, 'LAST-PAGE', 42, 2); assert.match(s.words(), /LAST-PAGE|Seite 2 von 2/);
  s.route(s.replacements[0][0]); s.runTimers(); assert.equal(s.requests.length, 2); assert.equal(s.replacements.length, 1);
  const empty = setup('/lernen?q=missing&page=999'); empty.runTimers();
  await empty.respond(0, 'NOT-A-REAL-RESULT', 0, 0); empty.runTimers();
  assert.equal(new URL(empty.requests[1].url, 'https://test.invalid').searchParams.get('page'), '1');
  await empty.respond(1, 'NOT-A-REAL-RESULT', 0, 0); empty.runTimers(); assert.equal(empty.requests.length, 2);
});

test('Live search keeps focus while typing; an explicit search moves to the visible result region without a new request', async () => {
  const s = setup('/lernen?q=Reh');
  const calls = [];
  const region = find(s.tree, item => item.props?.id === 'learning-search-results');
  region.props.ref.current = { focus: options => calls.push(['focus', options]), scrollIntoView: options => calls.push(['scroll', options]) };
  s.change('Suchbegriff', 'Gams');
  s.change('Kategorie', 'wildkunde');
  assert.deepEqual(calls, [], 'Typing and live filters must not steal focus or jump the page');
  s.runTimers(); await s.respond(0, 'GAMS-TREFFER');
  assert.deepEqual(calls, [], 'A delayed response must not move the user unexpectedly');
  const before = s.requests.length;
  let prevented = false;
  find(s.tree, item => item.type === 'form').props.onSubmit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.deepEqual(calls, [['focus', { preventScroll: true }], ['scroll', { block: 'start', behavior: 'auto' }]]);
  assert.equal(s.requests.length, before, 'The submit action displays the live results without duplicating the request');
  assert.equal(s.field('Suchbegriff').props.enterKeyHint, 'search');
  assert.equal(s.field('Suchbegriff').props['aria-controls'], 'learning-search-results');
  assert.equal(region.props.tabIndex, -1);
  assert.match(words(find(s.tree, item => item.props?.id === 'learning-search-results')), /GAMS-TREFFER/);
});

test('Paging explicitly returns to results, while bookmark and history restoration do not force a scroll', async () => {
  const s = setup('/lernen?q=Gams');
  const calls = [];
  find(s.tree, item => item.props?.id === 'learning-search-results').props.ref.current = {
    focus: () => calls.push('focus'), scrollIntoView: () => calls.push('scroll'),
  };
  s.runTimers(); await s.respond(0, 'Gams', 40, 2);
  assert.deepEqual(calls, []);
  find(s.tree, item => item.type === 'button' && words(item) === 'Weiter').props.onClick();
  assert.deepEqual(calls, ['focus', 'scroll']);
  s.render(); s.flush(); s.runTimers(); await s.respond(1, 'Seite zwei', 40, 2);
  assert.deepEqual(calls, ['focus', 'scroll']);
  s.route('/lernen?q=Rehwild', true);
  assert.deepEqual(calls, ['focus', 'scroll']);
});
