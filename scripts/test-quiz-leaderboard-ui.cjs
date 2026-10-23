const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc'), React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');

function load(relative, hooks = React, cache = new Map()) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' },
  });
  const mod = { exports: {} }, req = createRequire(filename);
  function resolve(id) {
    if (id === 'react') return hooks;
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')), hooks, cache);
    return req(id);
  }
  new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
  cache.set(filename, mod.exports);
  return mod.exports;
}
const { quizLeaderboardRows } = load('lib/quiz-leaderboard-view.js');
const row = (username = 'hannes', points = 3000, country = 'CH') => ({ username, country, total_points: points });
const words = node => node == null || typeof node === 'boolean' ? '' : Array.isArray(node) ? node.map(words).join('') : typeof node === 'object' ? words(node.props?.children) : String(node);
function find(node, predicate) {
  if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean);
  if (!node || typeof node !== 'object') return null;
  return predicate(node) ? node : find(node.props?.children, predicate);
}
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => ({ data }) });
const settle = async () => { await new Promise(resolve => setImmediate(resolve)); };

function harness() {
  const slots = [], effects = []; let cursor = 0, writes = 0;
  const hooks = { ...React,
    useState(initial) {
      const i = cursor++;
      if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; writes++; }];
    },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
    useEffect(callback, deps) {
      const i = cursor++, previous = slots[i];
      if (!previous || deps.some((value, index) => value !== previous.deps[index])) {
        slots[i] = { deps, cleanup: previous?.cleanup };
        effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = callback(); });
      }
    },
  };
  const Component = load('app/quiz-app/leaderboard/LeaderboardClient.jsx', hooks).default;
  let tree;
  const h = {
    render() { cursor = 0; tree = Component(); return tree; },
    get tree() { return tree; }, get writes() { return writes; },
    html() { return renderToStaticMarkup(tree); },
    flush() { effects.splice(0).forEach(callback => callback()); h.render(); },
    unmount() { slots.forEach(slot => slot.cleanup?.()); },
    refresh() { const button = find(tree, node => node.type === 'button' && words(node) === 'Aktualisieren'); assert.ok(button); assert.ok(!button.props.disabled); button.props.onClick(); h.render(); h.flush(); },
  };
  h.render();
  return h;
}
async function withFetch(callback) {
  const previous = global.fetch, requests = [];
  global.fetch = (url, options) => { const request = { url, options, ...deferred() }; requests.push(request); return request.promise; };
  const h = harness();
  try { await callback(h, requests); } finally { h.unmount(); global.fetch = previous; }
}

test('Leaderboard validates every public field, bounded row count and duplicate quiz identities before rendering', () => {
  assert.deepEqual(quizLeaderboardRows([]), []);
  assert.equal(quizLeaderboardRows(Array.from({ length: 100 }, (_, i) => row('spieler' + i))).length, 100);
  for (const value of [null, {}, [null], [[]], [row('')], [row('   ')], [row('x'.repeat(41))], [row('a\nb')], [row('a\u007fb')],
    [row('a', -1)], [row('a', 1.5)], [row('a', NaN)], [row('a', Infinity)], [row('a', '3000')], [row('a', 0, 'ch')],
    [row('a', 0, 'CHE')], [row(), row()], Array.from({ length: 101 }, (_, i) => row('spieler' + i))]) {
    assert.throws(() => quizLeaderboardRows(value), /Ungültige Rangliste/);
  }
  assert.equal(quizLeaderboardRows([row('zero', 0)])[0].points, 0);
});

test('Tied best scores share competition ranks and sorting never mutates or exposes additional account fields', () => {
  const input = Object.freeze([Object.freeze(row('zeta', 1200)), Object.freeze({ ...row('alpha', 1200), account_email: 'private@example.invalid' }), Object.freeze(row('beta', 800))]);
  const actual = quizLeaderboardRows(input);
  assert.deepEqual(actual.map(item => [item.displayName, item.rank, item.points]), [['alpha', 1, 1200], ['zeta', 1, 1200], ['beta', 3, 800]]);
  assert.deepEqual(input.map(item => item.username), ['zeta', 'alpha', 'beta']);
  assert.ok(actual.every(item => !Object.hasOwn(item, 'account_email')));
  assert.equal(quizLeaderboardRows([row('public@example.invalid')])[0].displayName, 'Quizname verborgen');
});

test('Loading and populated views keep the quiz action and readable tied ranks without duplicate page navigation', async () => {
  await withFetch(async (h, requests) => {
    assert.match(h.html(), /<main/); assert.equal((h.html().match(/<h1/g) || []).length, 1);
    assert.doesNotMatch(h.html(), /aria-label="Quizmenü"/); assert.match(h.html(), /href="\/quiz-app"/);
    assert.match(words(h.tree), /Rangliste wird geladen/); assert.doesNotMatch(words(h.tree), /Anfang machen/);
    h.flush();
    assert.equal(requests[0].url, '/api/quiz/leaderboard-week');
    assert.equal(requests[0].options.cache, 'no-store'); assert.equal(requests[0].options.credentials, 'same-origin');
    requests[0].resolve(response([{ ...row('zeta', 1200), account_email: 'private@example.invalid' }, row('alpha', 1200), row('public@example.invalid', 800)]));
    await settle(); h.render();
    assert.match(h.html(), /<caption/); assert.match(h.html(), /scope="col"/); assert.match(h.html(), /scope="row"/);
    assert.match(words(h.tree), /Quizname verborgen/); assert.doesNotMatch(h.html(), /private@example|public@example/);
    assert.equal((words(h.tree).match(/1\. Platz/g) || []).length, 2); assert.match(words(h.tree), /3\. Platz/);
    assert.doesNotMatch(words(h.tree), /Wochenrangliste|Frühere Ranglistenpunkte/);
  });
});

test('Refreshing keeps the current table visible with a busy status and commits a fresh validated ranking', async () => {
  await withFetch(async (h, requests) => {
    h.flush(); requests[0].resolve(response([row('alterstand', 1000)])); await settle(); h.render();
    h.refresh();
    assert.match(words(h.tree), /Rangliste wird aktualisiert/); assert.match(words(h.tree), /alterstand/);
    assert.equal(find(h.tree, node => node.type === 'section').props['aria-busy'], true);
    requests[1].resolve(response([row('neuerstand', 2000)])); await settle(); h.render();
    assert.match(words(h.tree), /neuerstand/); assert.doesNotMatch(words(h.tree), /alterstand|wird aktualisiert/);
    assert.equal(find(h.tree, node => node.type === 'section').props['aria-busy'], false);
  });
});

test('401 and 403 lead to login or account access while service errors offer a guarded retry', async () => {
  for (const [status, label, target] of [[401, 'Anmeldung erneuern', '/login?reauth=1&amp;next=%2Fquiz-app%2Fleaderboard'], [403, 'Zugang prüfen', '/konto']]) {
    await withFetch(async (h, requests) => {
      h.flush(); requests[0].resolve(response(null, status)); await settle(); h.render();
      assert.match(words(h.tree), new RegExp(label)); assert.ok(h.html().includes(`href="${target}"`));
      assert.equal(find(h.tree, node => node.type === 'button'), undefined);
      assert.match(h.html(), /role="alert"/);
    });
  }
  await withFetch(async (h, requests) => {
    h.flush(); requests[0].resolve(response(null, 503)); await settle(); h.render();
    assert.match(words(h.tree), /gerade nicht erreichbar/);
    h.refresh(); assert.doesNotMatch(words(h.tree), /gerade nicht erreichbar/);
    requests[1].resolve(response([])); await settle(); h.render();
    assert.match(words(h.tree), /Dein Ergebnis kann den Anfang machen/);
    assert.equal(find(h.tree, node => node.type === 'table'), undefined);
  });
});

test('Malformed payloads become a recoverable error and late aborted fetches never update an unmounted leaderboard', async () => {
  await withFetch(async (h, requests) => {
    h.flush(); requests[0].resolve(response([row('invalid', Infinity)])); await settle(); h.render();
    assert.match(words(h.tree), /gerade nicht erreichbar/); assert.equal(find(h.tree, node => node.type === 'table'), undefined);
    h.refresh(); const before = h.writes; h.unmount();
    assert.equal(requests[1].options.signal.aborted, true);
    requests[1].resolve(response([row('too-late')])); await settle();
    assert.equal(h.writes, before);
  });
});
