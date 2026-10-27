const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root: repo } = require('./helpers/project-module.cjs');
const React = local('react'), { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const load = createLoader(), { getWildlifeLearningGuide: guide } = load('lib/wildlife-learning-guide.js'), { getWildlifeStudyContent: content } = load('lib/wildlife-study-content.js');
const course = 'wissen-ausbau-biologie-verdauungsvergleich-2026';
const oldTarget = guide('ringeltaube').find(target => target.moduleId === course && target.lessonId === 'vogelmagen');
const newTarget = guide('ringeltaube').find(target => target.moduleId === course && target.lessonId === 'kropfmilch');
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }

test('The old module-only response retains Vogelmagen while the new exact authored lesson selects only Kropfmilch', () => {
  assert.ok(oldTarget && newTarget); assert.equal(oldTarget.topicId, undefined); assert.ok(newTarget.topicId.endsWith('-kropfmilch'));
  const legacy = content('ringeltaube', course), current = content('ringeltaube', course, 'kropfmilch');
  assert.deepEqual(legacy.lessons.map(lesson => lesson.id), ['vogelmagen']); assert.equal(Object.hasOwn(legacy, 'lessonId'), false);
  assert.equal(legacy.title, oldTarget.title); assert.deepEqual(current.lessons.map(lesson => lesson.id), ['kropfmilch']); assert.equal(current.lessonId, 'kropfmilch'); assert.equal(current.title, newTarget.title);
  assert.equal(current.questions, undefined); assert.equal(legacy.questions, undefined);
  assert.equal(current.reviewedOn, '2026-10-16'); assert.equal(current.lessons[0].reviewedOn, '2026-10-27');
  const Evidence = load('components/LessonEvidence.js').default, html = local('react-dom/server').renderToStaticMarkup(React.createElement(Evidence, { lesson: current.lessons[0], reviewedOn: current.reviewedOn, embedded: true }));
  assert.match(html, /27\. Oktober 2026/); assert.doesNotMatch(html, /16\. Oktober 2026/);
  for (const lesson of ['caecotrophie', 'blinddarm', 'vogelmagen-suffix', '', ['kropfmilch'], null, 'x'.repeat(141)]) assert.equal(content('ringeltaube', course, lesson), null, String(lesson));
  assert.equal(content('feldhase', course, 'kropfmilch'), null);
});

test('All114 complete old guide objects and study links are preserved; only Ringeltaube gains its exact fourth target', () => {
  const cache = new Map(), swc = local('next/dist/build/swc');
  function before(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const source = execFileSync('git', ['show', `68606953ec7fc8f9d9adc0dde85bfb9848b12b57:${file}`], { cwd: repo, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }), mod = { exports: {} }; cache.set(file, mod);
    if (file.endsWith('.json')) { mod.exports = JSON.parse(source); return mod.exports; }
    const { code } = swc.transformSync(source, { filename: file, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? before(path.posix.normalize(path.posix.join(path.posix.dirname(file), path.posix.extname(id) ? id : id + '.js'))) : local(id), mod, mod.exports);
    return mod.exports;
  }
  const old = before('lib/wildlife-learning-guide.js'), current = load('lib/wildlife-learning-guide.js'), inventory = load('lib/wild-year-catalog.js').wildYearCatalog;
  assert.equal(inventory.length, 114);
  for (const species of inventory) {
    const actual = current.getWildlifeLearningGuide(species.slug), previous = old.getWildlifeLearningGuide(species.slug);
    assert.deepEqual(species.slug === 'ringeltaube' ? actual.slice(0, 3) : actual, previous, species.slug);
    assert.deepEqual(current.getWildlifeStudyLinks(species.slug), old.getWildlifeStudyLinks(species.slug), species.slug);
  }
  assert.equal(guide('ringeltaube').length, 4); assert.deepEqual(guide('ringeltaube')[3], newTarget);
});

test('Live access is checked first; optional lesson query rejects repeats/empty/overlong values and cannot choose arbitrary course lessons', async () => {
  let accesses = 0, denied = null;
  const route = createLoader({ '../../../../lib/account-access': { requirePaidAccount: async () => { accesses++; if (denied) throw { status: denied }; } } })('app/api/lernen/artenwissen/route.js');
  const run = query => route.GET(new Request('https://example.invalid/api/lernen/artenwissen?' + query));
  const base = 'art=ringeltaube&kurs=' + course;
  let response = await run(base); assert.equal(response.status, 200); assert.equal(Object.hasOwn(await response.json(), 'lessonId'), false);
  response = await run(base + '&lektion=kropfmilch'); assert.equal(response.status, 200); assert.equal((await response.json()).lessonId, 'kropfmilch'); assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0'); assert.equal(response.headers.get('vary'), 'Cookie');
  for (const suffix of ['&lektion=', '&lektion=%20%20', '&lektion=kropfmilch&lektion=vogelmagen', '&lektion=' + 'x'.repeat(141)]) assert.equal((await run(base + suffix)).status, 400);
  for (const suffix of ['&lektion=caecotrophie', '&lektion=blinddarm', '&lektion=unknown']) assert.equal((await run(base + suffix)).status, 404);
  for (const status of [401, 403, 500]) { denied = status; response = await run('art=x&art=y&lektion='); assert.equal(response.status, status === 500 ? 503 : status); assert.equal((await response.json()).lessons, undefined); }
  assert.equal(accesses, 12);
});

test('Actual portrait topics and guide links keep the historical anchor and add a distinct fourth Kropfmilch anchor', () => {
  const Portrait = load('components/WildlifePortraitLayout.js').default;
  const tree = Portrait({ slug: 'ringeltaube' });
  const collect = (node, predicate) => Array.isArray(node) ? node.flatMap(child => collect(child, predicate)) : !node || typeof node !== 'object' ? [] : [...(predicate(node) ? [node] : []), ...collect(node.props?.children, predicate)];
  const reader = collect(tree, node => node.type?.name === 'TopicSectionReader')[0], topics = reader.props.groups.flatMap(group => group.topics), ids = topics.map(topic => topic.id);
  assert.equal(new Set(ids).size, ids.length); assert.ok(ids.includes('art-lerntext-' + course)); assert.ok(ids.includes(newTarget.topicId));
  const selected = topics.find(topic => topic.id === newTarget.topicId).render(); assert.equal(selected.props.target.lessonId, 'kropfmilch');
  const old = topics.find(topic => topic.id === 'art-lerntext-' + course).render(); assert.equal(old.props.target.lessonId, 'vogelmagen'); assert.notEqual(selected.key, old.key);
  const Guide = load('components/WildlifeLearningGuide.js').default, links = collect(Guide({ slug: 'ringeltaube', name: 'Ringeltaube' }), node => node.type === 'a').map(node => node.props.href);
  assert.ok(links.includes('#art-lerntext-' + course)); assert.ok(links.includes('#' + newTarget.topicId));
});

async function fixture(t, initial = oldTarget) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://example.invalid/wildkunde/ringeltaube' });
  const saved = new Map(), requests = [], timers = new Map(); let nextTimer = 0;
  const actualSet = global.setTimeout, actualClear = global.clearTimeout;
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true,
    fetch(url, options) { const request = { url, options, ...deferred() }; requests.push(request); return request.promise; },
    setTimeout(fn, delay, ...args) { if (delay !== 18000) return actualSet(fn, delay, ...args); const id = 'study-' + ++nextTimer; timers.set(id, fn); return id; },
    clearTimeout(id) { if (timers.has(id)) timers.delete(id); else actualClear(id); },
  })) { saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value }); }
  const Component = createLoader({ 'next/link': ({ href, children }) => React.createElement('a', { href }, children), './LessonDiagram': () => null, './LessonEvidence': () => null })('components/WildlifeStudyContent.js').default;
  let root = local('react-dom/client').createRoot(document.getElementById('root')), target = initial;
  const render = async next => { target = next || target; await React.act(async () => { root.render(React.createElement(Component, { slug: 'ringeltaube', target })); await settle(); }); };
  const act = async fn => React.act(async () => { fn(); await settle(); });
  async function answer(index, body, status = 200) { await act(() => requests[index].resolve({ ok: status >= 200 && status < 300, status, json: async () => body })); }
  const text = () => document.getElementById('root').textContent;
  async function unmount() { if (root) { await React.act(async () => root.unmount()); root = null; } }
  t.after(async () => { await unmount(); dom.window.close(); for (const [key, old] of saved) if (old) Object.defineProperty(globalThis, key, old); else delete globalThis[key]; });
  await render(); return { requests, timers, render, act, answer, text, unmount };
}

test('Same-species/same-module switching sends the exact optional lesson only for the new target and retires old A-B-A responses', async t => {
  const h = await fixture(t); assert.equal(new URL(h.requests[0].url, 'https://example.invalid').searchParams.has('lektion'), false);
  await h.render(newTarget); assert.equal(h.requests[0].options.signal.aborted, true); assert.equal(new URL(h.requests[1].url, 'https://example.invalid').searchParams.get('lektion'), 'kropfmilch');
  await h.answer(0, content('ringeltaube', course)); assert.match(h.text(), /Wissenstext wird geladen/); assert.ok(!h.text().includes(content('ringeltaube', course).lessons[0].paragraphs[0]));
  await h.render(oldTarget); assert.equal(h.requests[1].options.signal.aborted, true); await h.answer(1, content('ringeltaube', course, 'kropfmilch')); assert.match(h.text(), /Wissenstext wird geladen/);
  await h.answer(2, content('ringeltaube', course)); assert.ok(h.text().includes(content('ringeltaube', course).lessons[0].paragraphs[0]));
  assert.equal(new URL(h.requests[2].url, 'https://example.invalid').searchParams.has('lektion'), false);
});

test('A wrong lesson response is rejected; retry retains exact request identity and403/401 paths retain the distinct new anchor', async t => {
  const h = await fixture(t, newTarget);
  await h.answer(0, content('ringeltaube', course)); assert.match(h.text(), /Antwort gehört nicht/); assert.ok(!h.text().includes(content('ringeltaube', course).lessons[0].paragraphs[0]));
  const retry = document.querySelector('button'); await h.act(() => retry.click()); assert.equal(h.requests.length, 2); assert.equal(new URL(h.requests[1].url, 'https://example.invalid').searchParams.get('lektion'), 'kropfmilch');
  await h.answer(1, { message: 'Anmeldung nötig' }, 401); const returnURL = new URL(document.querySelector('a').href); assert.equal(returnURL.searchParams.get('next'), '/wildkunde/ringeltaube#' + newTarget.topicId);
  await h.render(oldTarget); await h.answer(2, { message: 'Zugang nötig' }, 403); assert.equal(document.querySelector('a').getAttribute('href'), '/konto');
});

test('A retained old retry cannot reload a successor target; actual unmount aborts requests and prevents late content or failures', async t => {
  const h = await fixture(t); await h.answer(0, { message: 'Vorübergehend nicht erreichbar' }, 503);
  const button = document.querySelector('button'), key = Object.keys(button).find(key => key.startsWith('__reactProps$')), retry = button[key].onClick;
  await h.render(newTarget); const count = h.requests.length; await h.act(retry); assert.equal(h.requests.length, count);
  await h.unmount(); assert.equal(h.requests.at(-1).options.signal.aborted, true); assert.equal(h.timers.size, 0);
  await h.act(() => { retry(); h.requests.at(-1).reject(new Error('After unmount')); }); assert.equal(h.requests.length, count);
});

test('Timeout remains a bounded visible retry state and a fresh request keeps the intended lesson', async t => {
  const h = await fixture(t, newTarget), timeout = [...h.timers.values()][0]; assert.ok(timeout);
  await h.act(() => { timeout(); h.requests[0].reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })); });
  assert.match(h.text(), /Laden dauert zu lange/); assert.equal(h.requests[0].options.signal.aborted, true);
  await h.act(() => document.querySelector('button').click()); await h.answer(1, content('ringeltaube', course, 'kropfmilch'));
  const actual = content('ringeltaube', course, 'kropfmilch'); assert.ok(h.text().includes(actual.lessons[0].paragraphs[0])); assert.equal(document.querySelector('details').open, false);
  assert.ok(h.text().includes('Übernommener Kursprüfstand: 2026-10-16.')); assert.ok(!h.text().includes('Prüfstand der Ausgangslektion: 2026-10-16'));
  assert.ok(h.text().indexOf('Ergänzende Fachquellen') > h.text().indexOf(actual.lessons[0].paragraphs[0]));
});
