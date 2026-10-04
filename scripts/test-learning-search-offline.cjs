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
test('Search covers courses, species, terms and all 13 tools; results contain summaries only', () => {
  const { searchLearning } = load('lib/learning-search.js');
  const { learningExperiences } = load('lib/learning-experiences.js');
  const tools = searchLearning({ type: 'tool' }); assert.equal(tools.total, 13);
  for (const tool of learningExperiences) assert.ok(tools.results.some(item => item.href === tool.href));
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
  for (const course of learningModules) { const pack = createOfflinePack({ courseIds: [course.id], sounds: true }, access, now); assert.ok(validateOfflinePack(pack, now), course.id); assert.equal(pack.expiresAt, now + 3600000); assert.equal(pack.sounds.length, 8); assert.ok(!JSON.stringify(pack).includes('test@example.invalid')); }
  const body = { courseIds: [learningModules[0].id], sounds: false }; const pack = createOfflinePack(body, access, now);
  const alpine = createOfflinePack({ courseIds: ['wissen-gams-steinbock'], sounds: false }, access, now); assert.deepEqual(alpine.photos.map(photo => photo.src), ['/wildkunde/gamswild.jpg', '/wildkunde/steinwild.jpg']);
  assert.equal(validateOfflinePack(pack, pack.expiresAt), false); assert.equal(validateOfflinePack({ ...pack, expiresAt: now + 8 * 86400000 }, now), false);
  assert.throws(() => createOfflinePack({ ...body, courseIds: Array(9).fill(learningModules[0].id) }, access, now)); assert.throws(() => createOfflinePack({ ...body, courseIds: ['fake'] }, access, now));
  assert.equal(validateOfflinePack({ ...pack, courses: [{ ...pack.courses[0], questions: [{ ...pack.courses[0].questions[0], correct: ['evil'] }] }] }, now), false);
});
test('Offline download requires same origin, active account and JSON without any writes', async () => {
  const route = load('app/api/lernen/offline/route.js', { '../../../../lib/account-access': { requirePaidAccount: async () => { throw Object.assign(new Error('Bitte anmelden.'), { status: 401 }); } }, '../../../../lib/offline-learning-server': { createOfflinePack: () => assert.fail('Unauthenticated pack created') } });
  const url = 'https://jagdlatein.example/api/lernen/offline';
  assert.equal((await route.POST(new Request(url, { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: '{}' }))).status, 403);
  const response = await route.POST(new Request(url, { method: 'POST', headers: { origin: 'https://jagdlatein.example', 'content-type': 'application/json' }, body: '{}' })); assert.equal(response.status, 401); assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal((await route.GET(new Request(url))).status, 401);
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
