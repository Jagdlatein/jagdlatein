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
function load(relative, overrides = {}, cache = new Map()) {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} }; cache.set(filename, mod.exports);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  function resolve(id) {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
    if (id === 'next/head') return ({ children }) => children;
    if (id === 'next/image') return ({ priority, fill, sizes, ...props }) => React.createElement('img', props);
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)), overrides, cache);
    return pr(id);
  }
  new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports); cache.set(filename, mod.exports); return mod.exports;
}
function engine() {
  const slots = []; let cursor = 0; let effects = [], writes = 0;
  const hooks = { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; writes++; }]; },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
    useMemo(fn, deps) { const i = cursor++, old = slots[i]; if (!old || deps.some((dep, j) => !Object.is(dep, old.deps[j]))) slots[i] = { deps, value: fn() }; return slots[i].value; },
    useEffect(fn, deps) { const i = cursor++, old = slots[i]; if (!old || !deps || deps.some((dep, j) => !Object.is(dep, old.deps[j]))) { slots[i] = { deps, cleanup: old?.cleanup }; effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = fn(); }); } },
  };
  return { hooks, get writes() { return writes; }, render(fn) { cursor = 0; return fn(); }, flush() { const pending = effects; effects = []; pending.forEach(fn => fn()); }, unmount() { slots.forEach(slot => slot?.cleanup?.()); } };
}
function words(node) { if (node == null || typeof node === 'boolean') return ''; if (Array.isArray(node)) return node.map(words).join(''); return typeof node === 'object' ? words(node.props?.children) : String(node); }
function find(node, predicate) { if (Array.isArray(node)) { for (const child of node) { const found = find(child, predicate); if (found) return found; } return null; } if (!node || typeof node !== 'object') return null; return predicate(node) ? node : find(node.props?.children, predicate); }
function setup(pool, history = { version: 1, entries: {} }, props = {}) {
  const parent = engine(), records = [], review = load('lib/daily-review.js'), children = [];
  let activeEngine = parent, child = null, started = false;
  const router = { isReady: true, query: {}, asPath: '/lernen/fuenf-minuten', async push(href) {
    this.query = href.query; this.asPath = `${href.pathname}?${new URLSearchParams(href.query)}#${href.hash}`; return true;
  } };
  const hooks = { ...React };
  for (const name of ['useState','useRef','useMemo','useEffect']) hooks[name] = (...args) => activeEngine.hooks[name](...args);
  const Component = load('components/DailyReview.js', { react: hooks, 'next/router': { useRouter: () => router }, './PageMenu': { __esModule: true, default: function PageMenu() { return null; }, closePageMenu() {}, openPageMenu() {} }, '../lib/daily-review': { ...review, readReviewHistory: () => history, recordReviewAnswer: (...args) => { records.push(args); return true; }, clearReviewHistory: () => true } }).default;
  function expand(node) {
    if (Array.isArray(node)) return node.map(expand);
    if (!node || typeof node !== 'object') return node;
    if (node.type?.name === 'DailyReviewRound') {
      if (child?.key !== node.key) { child?.engine.unmount(); child = { key: node.key, engine: engine() }; children.push(child.engine); }
      activeEngine = child.engine;
      return expand(child.engine.render(() => node.type(node.props)));
    }
    return { ...node, props: { ...node.props, children: expand(node.props?.children) } };
  }
  let tree;
  const draw = () => { activeEngine = parent; tree = expand(parent.render(() => Component({ pool, ...props }))); return tree; };
  const e = { get writes() { return parent.writes + children.reduce((sum,item) => sum + item.writes, 0); }, flush() { child?.engine.flush(); parent.flush(); }, unmount() { child?.engine.unmount(); parent.unmount(); } };
  const render = () => { draw(); if (started) { e.flush(); draw(); } return tree; }; render();
  return { e, records, router, render, get tree() { return tree; }, start() { started = true; e.flush(); render(); }, category(value) { find(tree, node => node.props?.id === 'review-category').props.onChange({ target: { value } }); render(); }, button(label) { const found = find(tree, node => node.type === 'button' && words(node).trim() === label); assert.ok(found, label); return found; }, html() { return renderToStaticMarkup(tree); } };
}
const maintained = load('lib/daily-review-pool.js');
const compact = load('lib/daily-review-catalog.js');
const fixture = [['wissen-fixture-wild-a', 'wildkunde'], ['wissen-fixture-wild-b', 'wildkunde'], ['wissen-fixture-dog', 'hundewesen']].map(([id, category]) => ({ id, category, q: `Frage ${id}`, answers: ['a', 'b', 'c', 'd'].map(id => ({ id, text: `Antwort ${id}` })), correct: ['a'], explain: `Erklärung ${id}`, courseTitle: 'Fiktiver Testkurs', href: '/kurse/wissen-fixture#lesson-demo', sources: [{ label: 'Testquelle', url: 'https://example.test/' }] }));
const fixtureCatalog = fixture.map(({ id, category }) => ({ id, category }));
const settle = () => new Promise(resolve => setImmediate(resolve));
function requests() {
  const previous = global.fetch, pending = [];
  global.fetch = (url, options) => new Promise((resolve, reject) => pending.push({ url, options, resolve, reject }));
  return { pending, restore() { global.fetch = previous; }, async answer(index, status = 200, body = null) { const request = pending[index]; const ids = new URL(request.url, 'https://example.test').searchParams.get('ids').split(','); request.resolve({ ok: status >= 200 && status < 300, status, json: async () => body || { questions: ids.map(id => fixture.find(item => item.id === id)).reverse() } }); await settle(); } };
}
function responseRecorder() {
  const res = { headers: {}, statusCode: 200, body: null, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  return res;
}

test('Static page metadata stays under 64 KiB, roundtrips every ID/category and never embeds private details', () => {
  const page = load('pages/lernen/fuenf-minuten.js', { '../../components/DailyReview': { __esModule: true, default: () => null } });
  const result = page.getStaticProps(); const bytes = Buffer.byteLength(JSON.stringify(result.props));
  assert.ok(bytes < 64 * 1024, `Static payload ${bytes} bytes`);
  assert.deepEqual(Object.keys(result.props), ['catalog']);
  const pool = compact.unpackDailyReviewCatalog(result.props.catalog);
  assert.ok(pool.length > 600); assert.deepEqual(pool, maintained.getDailyReviewCatalog());
  for (const item of pool) assert.deepEqual(Object.keys(item).sort(), ['category', 'id']);
  assert.equal(pool.length, maintained.getDailyReviewPool().length);
  assert.ok(!JSON.stringify(result.props).includes(maintained.getDailyReviewPool()[0].explain));
});
test('Server question retrieval preserves requested order and never serves legal, regional, unknown or excess IDs', () => {
  const ids = maintained.getDailyReviewCatalog().slice(0, 8).map(item => item.id);
  assert.deepEqual(maintained.getDailyReviewQuestions(ids.reverse()).map(item => item.id), ids);
  for (const invalid of [[], [ids[0], ids[0]], ['wissen-jagdrecht-de-1'], ['wissen-waffensicherheit-4'], ['wissen-no-such-question'], ['__proto__'], Array.from({ length: 9 }, (_, i) => maintained.getDailyReviewCatalog()[i].id)]) assert.throws(() => maintained.getDailyReviewQuestions(invalid));
});

test('Selected questions carry one unchanged lesson paragraph with matching sources, not a whole course', () => {
  const modules = load('lib/learning-curriculum.js').learningModules;
  for (const item of maintained.getDailyReviewPool()) {
    const course = modules.find(course => course.questions.some(question => question.id === item.id));
    const question = course.questions.find(question => question.id === item.id);
    const lesson = course.lessons.find(lesson => lesson.id === question.lessonId);
    assert.deepEqual(item.reading, { title: lesson.title, paragraph: lesson.paragraphs.find(paragraph => typeof paragraph === 'string' && paragraph.trim()) });
    assert.deepEqual(Object.keys(item.reading).sort(), ['paragraph', 'title']);
    assert.ok(!('lessons' in item) && !('objectives' in item));
    const evidence = (lesson.evidence || []).flatMap(record => record.sources || []);
    const expected = [...new Set((evidence.length ? evidence : course.sources).map(source => source.url))];
    assert.deepEqual(item.sources.map(source => source.url), expected);
    assert.equal(item.sourceScope, evidence.length ? 'lesson' : 'course');
  }
  const ids = maintained.getDailyReviewCatalog().slice(0, 8).map(item => item.id);
  assert.equal(maintained.getDailyReviewQuestions(ids).length, 8);
});

test('After an answer the original knowledge is visible immediately and reading does not reset the round', async () => {
  const network = requests();
  try {
    const s = setup(fixtureCatalog); s.start();
    const ids = new URL(network.pending[0].url, 'https://example.test').searchParams.get('ids').split(',');
    const questions = ids.map(id => ({ ...fixture.find(item => item.id === id), sourceScope: 'lesson', reading: { title: 'Vorhandener Lektionsname', paragraph: 'Unveränderter Wissenstext aus der tatsächlich zugeordneten Lektion.' } }));
    await network.answer(0, 200, { questions }); s.render();
    assert.doesNotMatch(words(s.tree), /Wissen dazu|Unveränderter Wissenstext/);
    s.button('Antwort a').props.onClick(); s.render();
    assert.match(words(s.tree), /Wissen dazu.*Vorhandener Lektionsname.*Unveränderter Wissenstext/);
    assert.match(words(s.tree), /Quellen zur passenden Lektion/);
    assert.equal(s.records.length, 1); assert.equal(network.pending.length, 1);
    const reading = find(s.tree, node => node.type === 'section' && node.props['aria-labelledby'] === `reading-${ids[0]}`);
    assert.ok(reading); assert.equal(find(reading, node => node.type === 'details' || node.type === 'button'), null);
    s.button('Nächste Frage').props.onClick(); s.render();
    assert.match(words(s.tree), /Frage 2 von 3/); assert.doesNotMatch(words(s.tree), /Wissen dazu/);
    assert.equal(s.records.length, 1); s.e.unmount();
  } finally { network.restore(); }
});
test('The API uses signed paid/admin access and never caches private question details', async () => {
  let account = null, failure = false, calls = 0;
  const handler = load('pages/api/lernen/wiederholung.js', { '../../../lib/account-access': { getSignedAccountAccess: async req => { calls++; assert.equal(req.method, 'GET'); if (failure) throw Error('service unavailable'); return account; } } }).default;
  const req = { method: 'GET', query: { ids: maintained.getDailyReviewCatalog().slice(0, 8).map(item => item.id).join(',') } };
  for (const [next, expected] of [[null, 401], [{ paid: false, admin: false }, 403], [{ paid: true, admin: false }, 200], [{ paid: false, admin: true }, 200]]) {
    account = next; const res = responseRecorder(); await handler(req, res); assert.equal(res.statusCode, expected);
    assert.equal(res.headers['Cache-Control'], 'private, no-store'); assert.equal(res.headers.Vary, 'Cookie');
    if (expected === 200) { assert.equal(res.body.questions.length, 8); assert.deepEqual(Object.keys(res.body), ['questions']); }
    else assert.ok(!('questions' in res.body));
  }
  failure = true; const unavailable = responseRecorder(); await handler(req, unavailable); assert.equal(unavailable.statusCode, 503);
  const before = calls, method = responseRecorder(); await handler({ method: 'POST', query: req.query }, method); assert.equal(method.statusCode, 405); assert.equal(method.headers.Allow, 'GET'); assert.equal(calls, before);
});
test('The API rejects additional private fields and malformed batches without partial answers', async () => {
  const handler = load('pages/api/lernen/wiederholung.js', { '../../../lib/account-access': { getSignedAccountAccess: async () => ({ paid: true }) } }).default;
  const catalog = maintained.getDailyReviewCatalog(), ids = catalog.slice(0, 8).map(item => item.id).join(',');
  for (const query of [{}, { ids: ['one', 'two'] }, { ids: 'x'.repeat(1288) }, { ids, history: 'private' }, { ids, email: 'private@example.test' }, { ids, answers: 'a' }, { ids: catalog.slice(0, 9).map(item => item.id).join(',') }, { ids: `${catalog[0].id},wissen-no-such-question` }, { ids: `${catalog[0].id},${catalog[0].id}` }]) {
    const res = responseRecorder(); await handler({ method: 'GET', query }, res); assert.equal(res.statusCode, 400); assert.ok(!('questions' in res.body));
  }
});
test('Client selection sends only IDs, leaves history local and never shows an empty result while pending', async () => {
  const network = requests();
  try {
    const s = setup(fixtureCatalog, { version: 1, email: 'private@example.test', entries: {} }); s.start();
    assert.match(words(s.tree), /Fragen werden geladen/); assert.doesNotMatch(words(s.tree), /keine Fragen/);
    const sent = network.pending[0], params = new URL(sent.url, 'https://example.test').searchParams;
    assert.deepEqual([...params.keys()], ['ids']); assert.equal(sent.options.body, undefined); assert.equal(sent.options.credentials, 'same-origin'); assert.equal(sent.options.cache, 'no-store');
    assert.doesNotMatch(sent.url, /private|history|reason|answers|email/); assert.ok(params.get('ids').split(',').length <= 8);
    await network.answer(0); s.render(); assert.match(words(s.tree), /Neu entdecken/); assert.ok(s.button('Antwort a'));
    const firstId = params.get('ids').split(',')[0];
    const categoryTitle = load('lib/learning-categories.js').learningCategoryDetails.find(item => item.slug === fixture.find(item => item.id === firstId).category).title;
    const orientation = find(s.tree, node => node.type === 'p' && node.props.className?.split(' ').includes('reviewContext'));
    assert.match(words(orientation), new RegExp(`${categoryTitle}.*Frage 1 von 3`));
    assert.doesNotMatch(s.html(), /<img|<figure/, 'A text question has no arbitrary category photograph');
    const selectedIds = params.get('ids').split(','); assert.match(words(s.tree), new RegExp(`Frage ${selectedIds[0]}`));
    assert.equal(s.records.length, 0);
    assert.doesNotMatch(s.html(), /href="\/lernen#lernen-suche"/, 'The reader must not restore a second search link above the question');
    const Dock = load('components/GlobalHomeButton.js', {
      'next/navigation': { usePathname: () => '/lernen/fuenf-minuten' },
      'next/compat/router': { useRouter: () => null },
      'next/link': ({ href, children, prefetch, ...props }) => React.createElement('a', { ...props, href }, children),
    }).default;
    const lowerNavigation = renderToStaticMarkup(React.createElement(Dock));
    assert.match(lowerNavigation, /aria-label="Seitennavigation"/);
    assert.equal((lowerNavigation.match(/href="\/lernen#lernen-suche"/g) || []).length, 1);
    assert.match(lowerNavigation, /aria-label="Alle Lernangebote suchen"/);
    assert.match(lowerNavigation, /id="jl-page-menu"/);
  } finally { network.restore(); }
});
test('Packed metadata keeps local due selection, category changes and stale-response protection identical', async () => {
  const network = requests();
  try {
    const history = { version: 1, entries: { [fixture[2].id]: { seen: 1, mistakes: 1, streak: 0, lastSeen: 0, due: 600000, lastEvent: 'fixture-event' } } };
    const s = setup(undefined, history, { catalog: JSON.parse(JSON.stringify(compact.packDailyReviewCatalog(fixtureCatalog))) });
    s.start();
    const firstIds = new URL(network.pending[0].url, 'https://example.test').searchParams.get('ids').split(',');
    assert.equal(firstIds[0], fixture[2].id); assert.match(words(s.tree), /Fragen werden geladen/);
    s.category('wildkunde'); assert.equal(network.pending[0].options.signal.aborted, true);
    assert.ok(new URL(network.pending[1].url, 'https://example.test').searchParams.get('ids').split(',').every(id => id.includes('-wild-')));
    await network.answer(1); s.render(); assert.match(words(s.tree), /wissen-fixture-wild/);
    await network.answer(0); s.render(); assert.match(words(s.tree), /wissen-fixture-wild/);
    assert.doesNotMatch(words(s.tree), /Frage wissen-fixture-dog/); assert.equal(s.records.length, 0);
    s.button('Antwort a').props.onClick(); s.render(); assert.equal(s.records.length, 1);
    assert.ok(s.records[0][0].includes('-wild-')); s.e.unmount();
  } finally { network.restore(); }
});
test('Legacy pool props still take precedence and malformed packed data never requests a fallback deck', () => {
  const network = requests();
  try {
    const legacy = setup(fixtureCatalog, undefined, { catalog: compact.packDailyReviewCatalog([]) }); legacy.start();
    assert.equal(network.pending.length, 1); legacy.e.unmount();
    const invalid = setup(undefined, undefined, { catalog: { version: 1, categories: ['wildkunde'], rows: [[1, 'not-valid-without-prefix', 0]] } });
    invalid.start(); assert.equal(network.pending.length, 1); assert.match(words(invalid.tree), /keine Fragen/); invalid.e.unmount();
  } finally { network.restore(); }
});
test('Slow previous category responses, including failed ones, cannot replace a new selected category', async () => {
  const network = requests();
  try {
    const s = setup(fixtureCatalog); s.start(); s.category('hundewesen');
    assert.equal(network.pending[0].options.signal.aborted, true); assert.match(words(s.tree), /Fragen werden geladen/);
    await network.answer(1); s.render(); assert.match(words(s.tree), /wissen-fixture-dog/);
    await network.answer(0, 503, { message: 'Alte Kategorie nicht erreichbar' }); s.render();
    assert.match(words(s.tree), /wissen-fixture-dog/); assert.doesNotMatch(words(s.tree), /Alte Kategorie/);
    s.category('wildkunde'); assert.doesNotMatch(words(s.tree), /wissen-fixture-dog/);
    await network.answer(2); s.render(); assert.match(words(s.tree), /wissen-fixture-wild/);
  } finally { network.restore(); }
});
test('Failed or incomplete loads can be retried and do not count as answered or unavailable questions', async () => {
  const network = requests();
  try {
    const s = setup(fixtureCatalog); s.start(); await network.answer(0, 503, { message: 'Vorübergehend nicht erreichbar' }); s.render();
    assert.match(words(s.tree), /Vorübergehend/); assert.equal(s.records.length, 0); assert.doesNotMatch(words(s.tree), /keine Fragen/);
    s.button('Erneut versuchen').props.onClick(); s.render(); await network.answer(1, 200, { questions: [] }); s.render();
    assert.match(words(s.tree), /nicht vollständig/); assert.equal(s.records.length, 0);
    s.button('Erneut versuchen').props.onClick(); s.render(); await network.answer(2); s.render(); assert.ok(s.button('Antwort a'));
  } finally { network.restore(); }
});
test('Double and stale answer/advance clicks still count only one local answer after asynchronous loading', async () => {
  const network = requests();
  try {
    const s = setup(fixtureCatalog); s.start(); s.category('hundewesen'); await network.answer(1); s.render();
    const answer = s.button('Antwort a'); answer.props.onClick(); answer.props.onClick(); s.render();
    assert.equal(s.records.length, 1); const finish = s.button('Runde abschließen'); finish.props.onClick(); finish.props.onClick(); s.render();
    assert.match(words(s.tree), /1 von 1 richtig/);
    s.category('wildkunde'); answer.props.onClick(); finish.props.onClick(); s.render();
    assert.equal(s.records.length, 1); assert.match(words(s.tree), /Fragen werden geladen/);
    await network.answer(2); s.render(); assert.doesNotMatch(words(s.tree), /Runde ist abgeschlossen/);
    s.e.unmount();
  } finally { network.restore(); }
});
test('Unmount aborts the pending fetch and ignores a late result without recording or state updates', async () => {
  const network = requests();
  try {
    const s = setup(fixtureCatalog); s.start(); s.e.unmount(); const writes = s.e.writes;
    assert.equal(network.pending[0].options.signal.aborted, true); await network.answer(0);
    assert.equal(s.e.writes, writes); assert.equal(s.records.length, 0);
  } finally { network.restore(); }
});
