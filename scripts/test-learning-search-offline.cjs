const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const requireProject = createRequire(path.join(root, 'package.json'));
const swc = requireProject('next/dist/build/swc');
function load(relative, overrides = {}, cache = new Map(), expose = '') {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} }; cache.set(filename, mod.exports);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2020', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  function requireLocal(id) { if (Object.hasOwn(overrides, id)) return overrides[id]; if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) }; if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), id + '.js')), overrides, cache); return requireProject(id); }
  new Function('require', 'module', 'exports', code + expose)(requireLocal, mod, mod.exports); cache.set(filename, mod.exports); return mod.exports;
}
test('Search covers courses, species, terms and all tools; results contain summaries only', () => {
  const { searchLearning } = load('lib/learning-search.js');
  const { learningExperiences } = load('lib/learning-experiences.js');
  const { learningToolCatalog } = load('lib/learning-tool-catalog.js');
  const expectedTools = new Set([...learningToolCatalog, ...learningExperiences].map(tool => tool.href));
  const tools = searchLearning({ type: 'tool' }); assert.equal(tools.total, expectedTools.size);
  const foundTools = new Set(Array.from({ length: tools.pages }, (_, index) => searchLearning({ type: 'tool', page: index + 1 }).results).flat().map(item => item.href));
  assert.deepEqual(foundTools, expectedTools);
  for (const [query, type] of [['Rehwild', 'course'], ['Rehwild', 'species'], ['Abschussplan', 'glossary'], ['Kühlkette', 'entry'], ['Ansitz', 'practice']]) assert.ok(searchLearning({ query, type }).total > 0, query + ':' + type);
  assert.deepEqual(searchLearning({ query: 'Münsterländer' }), searchLearning({ query: 'Muensterlaender' }));
  for (const item of searchLearning({ type: 'entry' }).results) { assert.ok(!('text' in item) && !('questions' in item) && !('correct' in item)); assert.ok(item.href.startsWith('/lernen/')); }
  assert.equal(searchLearning({ query: 'zzznichtvorhanden' }).total, 0);
  assert.throws(() => searchLearning({ category: 'fake' })); assert.throws(() => searchLearning({ page: -1 }));
});
test('Search pagination preserves counts and country filters apply to legal courses', () => {
  const { searchLearning } = load('lib/learning-search.js');
  const first = searchLearning({ type: 'course' }), second = searchLearning({ type: 'course', page: 2 });
  assert.equal(first.total, 107); assert.equal(first.results.length, 30); assert.equal(second.results.length, 30); assert.equal(first.total, second.total);
  assert.ok(!first.results.some(item => second.results.some(other => other.id === item.id)));
  const de = searchLearning({ category: 'jagdrecht', country: 'DE', type: 'course' });
  assert.ok(de.results.some(item => item.href === '/kurse/wissen-jagdrecht-de')); assert.ok(!de.results.some(item => item.href === '/kurse/wissen-jagdrecht-at'));
  assert.deepEqual(searchLearning({ category: 'wildkunde', country: 'DE' }), searchLearning({ category: 'wildkunde', country: 'CH' }));
});
test('Search API rejects unauthenticated and unpaid access and never caches account results', async () => {
  for (const [access, status] of [[null, 401], [{ paid: false }, 403], [{ paid: true }, 200]]) {
    const route = load('app/api/lernen/suche/route.js', { '../../../../lib/account-access': { getSignedAccountAccess: async () => access }, '../../../../lib/learning-search': { searchLearning: () => ({ results: [], total: 0 }) } });
    const response = await route.GET(new Request('https://jagdlatein.example/api/lernen/suche?q=test')); assert.equal(response.status, status); assert.match(response.headers.get('cache-control'), /no-store/);
  }
});
test('Every detailed course creates a valid offline pack; trials cap expiry and selection stays bounded', () => {
  process.env.JL_SESSION_SECRET = 'unit-test-offline-key-never-used-for-auth';
  const { createOfflinePack } = load('lib/offline-learning-server.js'); const { validateOfflinePack } = load('lib/offline-learning.js');
  const { learningModules } = load('lib/learning-curriculum.js'); const now = Date.now(); const access = { email: 'test@example.invalid', paidUntil: new Date(now + 3600000).toISOString() };
  const soundCount = load('lib/animal-sounds.js').animalSounds.length;
  for (const course of learningModules) { const pack = createOfflinePack({ courseIds: [course.id], sounds: true }, access, now); assert.ok(validateOfflinePack(pack, now), course.id); assert.equal(pack.expiresAt, now + 3600000); assert.equal(pack.sounds.length, soundCount); assert.ok(!JSON.stringify(pack).includes('test@example.invalid')); }
  const body = { courseIds: [learningModules[0].id], sounds: false }; const pack = createOfflinePack(body, access, now);
  const alpine = createOfflinePack({ courseIds: ['wissen-gams-steinbock'], sounds: false }, access, now); assert.deepEqual(alpine.photos.map(photo => photo.src), ['/wildkunde/gamswild.jpg', '/wildkunde/steinwild.jpg']);
  assert.equal(validateOfflinePack(pack, pack.expiresAt), false); assert.equal(validateOfflinePack({ ...pack, expiresAt: now + 8 * 86400000 }, now), false);
  assert.throws(() => createOfflinePack({ ...body, courseIds: Array(9).fill(learningModules[0].id) }, access, now)); assert.throws(() => createOfflinePack({ ...body, courseIds: ['fake'] }, access, now));
  assert.equal(validateOfflinePack({ ...pack, courses: [{ ...pack.courses[0], questions: [{ ...pack.courses[0].questions[0], correct: ['evil'] }] }] }, now), false);
  const recordings = createOfflinePack({ ...body, sounds: true }, access, now);
  assert.equal(validateOfflinePack({ ...recordings, sounds: [...recordings.sounds, recordings.sounds[0]] }, now), false);
  assert.equal(validateOfflinePack({ ...recordings, sounds: [{ ...recordings.sounds[0], src: '/lernen/stimmen/erfundene-datei.mp3' }] }, now), false);
});
test('Offline download requires same origin, active account and JSON without any writes', async () => {
  const route = load('app/api/lernen/offline/route.js', { '../../../../lib/account-access': { requirePaidAccount: async () => { throw Object.assign(new Error('Bitte anmelden.'), { status: 401 }); } }, '../../../../lib/offline-learning-server': { createOfflinePack: () => assert.fail('Unauthenticated pack created') } });
  const url = 'https://jagdlatein.example/api/lernen/offline';
  assert.equal((await route.POST(new Request(url, { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: '{}' }))).status, 403);
  const response = await route.POST(new Request(url, { method: 'POST', headers: { origin: 'https://jagdlatein.example', 'content-type': 'application/json' }, body: '{}' })); assert.equal(response.status, 401); assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal((await route.GET(new Request(url))).status, 401);
});
test('Offline recordings retain linked licenses, origin and disclosed source processing', () => {
  process.env.JL_SESSION_SECRET = 'unit-test-offline-key-never-used-for-auth';
  const { createOfflinePack } = load('lib/offline-learning-server.js');
  const pack = createOfflinePack({ courseIds: ['wissen-gams-steinbock'], sounds: true }, { email: 'test@example.invalid', paidUntil: new Date(Date.now() + 3600000).toISOString() });
  const React = requireProject('react'); let stateIndex = 0;
  const hooks = { ...React, useState(initial) { const value = stateIndex++ === 0 ? pack : typeof initial === 'function' ? initial() : initial; return [value, () => {}]; }, useEffect() {}, useRef(value) { return { current: value }; } };
  const OfflineLearning = load('components/OfflineLearning.js', { react: hooks, './LearningToolLayout': { __esModule: true, default: ({ children }) => children } }).default;
  const html = requireProject('react-dom/server').renderToStaticMarkup(React.createElement(OfflineLearning, { courses: [] }));
  for (const id of ['gams', 'murmeltier']) {
    const sound = pack.sounds.find(item => item.id === id); assert.ok(sound);
    assert.ok(html.includes(sound.licenseUrl), id + ' license link');
    assert.ok(html.includes(sound.sourceUrl.replaceAll('&', '&amp;')), id + ' recording source');
    assert.ok(html.includes(sound.recording.replaceAll('&', '&amp;')), id + ' recording context');
    assert.ok(html.includes(sound.modifications.replaceAll('&', '&amp;')), id + ' processing disclosure');
  }
  assert.match(html, /Hintergrundgeräusche reduziert/);
});
test('Offline legal questions follow the selected country; expired and double answers cannot change scores', () => {
  const React = requireProject('react'); let cursor = 0; const slots = [];
  const hooks = { ...React, useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => slots[i] = typeof value === 'function' ? value(slots[i]) : value]; }, useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; } };
  const { OfflineCourse } = load('components/OfflineLearning.js', { react: hooks, './LearningToolLayout': { default: () => null } }, new Map(), '\nexports.OfflineCourse = OfflineCourse;');
  const { learningModules } = load('lib/learning-curriculum.js'); const course = learningModules.find(item => item.category === 'Jagdrecht' && item.countries.length === 3);
  assert.ok(course, 'Known legal course fixture'); let expired = 0; let expiry = Date.now() + 60000;
  function render() { cursor = 0; return OfflineCourse({ course, expiresAt: expiry, onExpired: () => expired++ }); }
  function find(node, predicate) { if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean); if (!node || typeof node !== 'object') return null; return predicate(node) ? node : find(node.props?.children, predicate); }
  const text = node => node == null || typeof node === 'boolean' ? '' : Array.isArray(node) ? node.map(text).join('') : typeof node === 'object' ? text(node.props?.children) : String(node);
  let tree = render(); const country = find(tree, node => node.type === 'select' && node.props.value === 'DE'); assert.ok(country); assert.ok(text(tree).includes(course.countryNotes.DE));
  country.props.onChange({ target: { value: 'AT' } }); tree = render(); assert.ok(text(tree).includes(course.countryNotes.AT));
  const question = course.questions.find(item => item.countries.includes('AT')); assert.ok(text(tree).includes(question.q));
  const button = find(tree, node => node.type === 'button' && text(node) === question.answers[0].text); assert.ok(button); button.props.onClick(); button.props.onClick(); tree = render(); assert.ok(text(tree).includes(question.explain));
  assert.equal(slots[2].score, question.correct.includes(question.answers[0].id) ? 1 : 0);
  expiry = Date.now() - 1; tree = render(); const next = find(tree, node => node.type === 'button' && text(node) === 'Nächste Frage'); next.props.onClick(); assert.equal(expired, 1); assert.equal(slots[2].index, 0);
});
test('Offline worker excludes APIs/protected pages and supports cached audio byte ranges', async () => {
  const handlers = {}; const entries = new Map(); const cache = { match: async key => entries.get(key)?.clone(), put: async (key, response) => entries.set(key, response.clone()) };
  const context = { self: { location: { origin: 'https://jagdlatein.example' }, addEventListener: (name, fn) => handlers[name] = fn }, caches: { open: async () => cache }, URL, Response, Headers, Set, Array, fetch: async () => new Response('network') };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'public/lernen/offline-sw.js'), 'utf8'), context);
  for (const pathname of ['/api/auth/status', '/api/lernen/offline', '/lernen/wildkunde', '/konto', '/preise']) { let intercepted = false; handlers.fetch({ request: new Request('https://jagdlatein.example' + pathname), respondWith: () => intercepted = true }); assert.equal(intercepted, false, pathname); }
  entries.set('/lernen/stimmen/aufnahme-01.mp3', new Response(Uint8Array.from([1, 2, 3, 4, 5]), { headers: { 'Content-Type': 'audio/mpeg' } }));
  let result; handlers.fetch({ request: new Request('https://jagdlatein.example/lernen/stimmen/aufnahme-01.mp3', { headers: { range: 'bytes=1-3' } }), respondWith: promise => result = promise });
  const response = await result; assert.equal(response.status, 206); assert.equal(response.headers.get('content-range'), 'bytes 1-3/5'); assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [2, 3, 4]);
  let completion, message; handlers.message({ data: { type: 'PREPARE', assets: ['/konto'] }, source: { url: 'https://jagdlatein.example/lernen/offline-rucksack' }, ports: [{ postMessage: value => message = value }], waitUntil: promise => completion = promise }); await completion; assert.equal(message.ok, false); assert.match(message.message, /Unzulässige/);
});


test('All established learning shortcuts and legal country hubs are discoverable exactly once', () => {
  const { searchLearning } = load('lib/learning-search.js');
  const { learningTools, legalLearningHubs, learningToolCatalog } = load('lib/learning-tool-catalog.js');
  const validCategories = new Set(load('lib/learning-categories.js').learningCategoryDetails.map(item => item.slug));
  assert.equal(learningTools.length, 8); assert.equal(legalLearningHubs.length, 3);
  assert.equal(new Set(learningToolCatalog.map(item => item.href)).size, learningToolCatalog.length);
  for (const tool of learningToolCatalog) {
    const base = tool.href.split('?')[0];
    assert.ok(fs.existsSync(path.join(root, 'pages', base + '.js')) || fs.existsSync(path.join(root, 'pages', base, 'index.js')) || fs.existsSync(path.join(root, 'app', base, 'page.jsx')), tool.href);
    assert.ok(tool.categories.length && tool.categories.every(category => validCategories.has(category)), tool.href);
  }
  for (const [query, href] of [['Quiz', '/quiz-app'], ['Tagesquiz', '/tagesquiz'], ['Ebook', '/ebook'], ['PDF', '/ebook'], ['Glossar', '/glossar'], ['Deutsches Jagdrecht', '/jagdrecht/de'], ['Österreichisches Jagdrecht', '/jagdrecht/at'], ['Schweizer Jagdrecht', '/jagdrecht/ch']]) {
    assert.ok(searchLearning({ query, type: 'tool' }).results.some(item => item.href === href), query);
  }
  const first = searchLearning({ type: 'tool' });
  const all = Array.from({ length: first.pages }, (_, index) => searchLearning({ type: 'tool', page: index + 1 }).results).flat();
  assert.equal(all.filter(item => item.href === '/wildkunde').length, 1, 'The atlas shortcut and atlas experience share one result');
  for (const [country, href] of [['DE', '/jagdrecht/de'], ['AT', '/jagdrecht/at'], ['CH', '/jagdrecht/ch']]) {
    const results = searchLearning({ category: 'jagdrecht', country, type: 'tool' }).results;
    assert.ok(results.some(item => item.href === href));
    assert.ok(!results.some(item => legalLearningHubs.some(other => other.href === item.href && other.href !== href)));
  }
});

test('Practice exercises are found within their relevant learning categories without losing the practice index', () => {
  const { searchLearning } = load('lib/learning-search.js');
  const { practiceCatalog, practiceCategories } = load('lib/practice-catalog.js');
  const validCategories = new Set(load('lib/learning-categories.js').learningCategoryDetails.map(item => item.slug));
  assert.equal(Object.keys(practiceCategories).length, practiceCatalog.length);
  for (const [id, title] of practiceCatalog) {
    const categories = practiceCategories[id];
    assert.ok(categories && categories.includes('jagdpraxis') && categories.every(category => validCategories.has(category)), id);
    assert.equal(new Set(categories).size, categories.length, id);
    for (const category of categories) assert.ok(searchLearning({ query: title, type: 'practice', category }).results.some(item => item.href === `/jagdpraxis/${id}`), `${id}:${category}`);
  }
  for (const [query, category, href] of [['Waffenhandhabung', 'waffen-sicherheit', '/jagdpraxis/waffenhandhabung'], ['Krankes Wild', 'wildbret-gesundheit', '/jagdpraxis/krankeswild'], ['Nachsuche', 'hundewesen', '/jagdpraxis/nachsuche'], ['Optik', 'ausruestung-technik', '/jagdpraxis/optik'], ['Fährten', 'natur-revier', '/jagdpraxis/wildspuren']]) {
    assert.ok(searchLearning({ query, category, type: 'practice' }).results.some(item => item.href === href), `${query}:${category}`);
  }
});
