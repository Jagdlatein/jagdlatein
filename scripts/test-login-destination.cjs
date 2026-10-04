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
function load(relative, overrides = {}, globals = {}) {
  const filename = path.join(root, relative);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'fetch', 'window', 'setTimeout', 'clearTimeout', code)(id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
    if (id === 'next/head') return ({ children }) => React.createElement(React.Fragment, null, children);
    if (id === 'next/router') return { useRouter: () => ({ query: {} }) };
    if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), id + '.js')), overrides, globals);
    return pr(id);
  }, mod, mod.exports, globals.fetch, globals.window, globals.setTimeout || setTimeout, globals.clearTimeout || clearTimeout);
  return mod.exports;
}
const { getNextUrl, getLoginDestination } = load('lib/login-destination.js');
const unpaid = { paid: false, admin: false };
test('An unpaid learner returns to the free community with category, topic and thread context preserved', () => {
  for (const route of ['/community', '/community/?category=hundewesen&thema=R%C3%BCckruf#frage', '/community/11111111-1111-4111-8111-111111111111']) {
    assert.equal(getLoginDestination(route, unpaid), route);
  }
});
test('Personal account and statistics need identity, while learning and unknown forum paths still lead to prices', () => {
  for (const route of ['/konto', '/meine-kurse', '/auswertungen', '/quiz-app/stats', '/quiz/stats']) assert.equal(getLoginDestination(route, unpaid), route);
  for (const route of ['/lernen', '/community/admin', '/community/not-a-thread', '/kurse/hundewesen?modus=test#quiz']) {
    assert.equal(new URL(getLoginDestination(route, unpaid), 'https://test.invalid').searchParams.get('next'), route);
  }
});
test('Paid or administrator access returns directly to the selected safe learning page', () => {
  for (const account of [{ paid: true }, { admin: true }]) assert.equal(getLoginDestination('/lernen?suche=gams', account), '/lernen?suche=gams');
  assert.match(getLoginDestination('/lernen', { paid: 'true', admin: 1 }), /^\/preise\?/);
});
test('Unsafe return URLs and login loops cannot become navigation destinations', () => {
  for (const route of ['https://evil.invalid', '//evil.invalid', '/\\evil.invalid', '/%5cevil.invalid', '/%2f%2fevil.invalid', '/login', '/login/?next=/lernen', '/%6cogin', '/bad%escape', '/%0anews', '/\nnews', null]) assert.equal(getNextUrl(route), '/');
  assert.equal(getNextUrl(['/community', 'https://evil.invalid']), '/community');
  assert.equal(getLoginDestination('/lernen#quiz', unpaid, '/preise?aktion=abo#paypal'), '/preise?aktion=abo&next=%2Flernen%23quiz#paypal');
});

function find(node, predicate) {
  if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } return null; }
  if (!node || typeof node !== 'object') return null;
  return predicate(node) ? node : find(node.props?.children, predicate);
}
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, json: async () => body });
function harness(fetch) {
  const states = ['member@example.invalid', '123456', 'code', '', false], refs = [], effects = [], timers = new Map(), calls = [];
  let cursor = 0, refCursor = 0, sequence = 0;
  const window = { location: { href: null } };
  const Component = load('pages/login.js', { react: { ...React,
    useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
    useRef(initial) { const i = refCursor++; return refs[i] ||= { current: initial }; },
    useEffect(fn) { if (!effects.length) effects.push(fn()); },
  }, 'next/router': { useRouter: () => ({ query: { next: '/community?category=hundewesen' } }) } }, {
    fetch: async (...args) => { calls.push(args); return fetch(...args); }, window,
    setTimeout: (fn, delay) => { timers.set(++sequence, { fn, delay }); return sequence; }, clearTimeout: id => timers.delete(id),
  }).default;
  const render = () => { cursor = 0; refCursor = 0; return Component(); };
  return { states, calls, timers, window, render, unmount: () => effects.forEach(fn => fn?.()),
    submit: tree => find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} }),
  };
}
test('Duplicate code confirmation and changing email stay blocked through the successful navigation', async () => {
  const pending = deferred(), h = harness(() => pending.promise), tree = h.render();
  const first = h.submit(tree); await h.submit(tree); assert.equal(h.calls.length, 1);
  pending.resolve(response({ success: true, paid: false, admin: false })); await first;
  const updated = h.render(); assert.equal(find(updated, node => node.type === 'button' && node.props.type === 'submit').props.disabled, true);
  assert.equal(find(updated, node => node.type === 'button' && node.props.type === 'button').props.disabled, true);
  const navigation = [...h.timers.values()].find(timer => timer.delay === 500); assert.ok(navigation); navigation.fn();
  assert.equal(h.window.location.href, '/community?category=hundewesen'); h.unmount();
});
test('A failed code can be corrected and submitted again without leaving the learner stuck', async () => {
  const h = harness(() => Promise.resolve(response({ success: false, message: 'Code abgelaufen' }, 400)));
  await h.submit(h.render()); assert.equal(h.states[4], false); assert.equal(h.states[3], 'Code abgelaufen');
  await h.submit(h.render()); assert.equal(h.calls.length, 2); assert.equal(h.window.location.href, null); h.unmount();
});
test('Leaving the login page cancels the request and ignores a late successful response', async () => {
  const pending = deferred(), h = harness(() => pending.promise); const action = h.submit(h.render());
  h.unmount(); assert.equal(h.calls[0][1].signal.aborted, true);
  pending.resolve(response({ success: true, paid: true })); await action;
  assert.equal(h.window.location.href, null); assert.equal(h.states[3], ''); assert.equal(h.timers.size, 0);
});
test('A stalled authentication request times out and offers another attempt', async () => {
  const h = harness((url, init) => new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })));
  const action = h.submit(h.render()); [...h.timers.values()].find(timer => timer.delay === 18000).fn(); await action;
  assert.equal(h.states[4], false); assert.match(h.states[3], /erneut versuchen/); assert.equal(h.timers.size, 0); h.unmount();
});
test('Login and personal pages use the shared design, explicit field labels and private metadata', () => {
  const Login = load('pages/login.js').default;
  const html = renderToStaticMarkup(React.createElement(Login));
  assert.match(html, /class="header"/); assert.match(html, /<label>E-Mail-Adresse/); assert.match(html, /noindex, nofollow/);
  const headers = {}; load('pages/login.js').getServerSideProps({ req: { cookies: {} }, res: { setHeader: (key, value) => headers[key] = value }, query: {} });
  assert.match(headers['Cache-Control'], /private, no-store/);
  const AccountLayout = load('components/AccountLayout.js').default;
  const account = renderToStaticMarkup(React.createElement(AccountLayout, { title: 'Mein Konto', description: 'Dein Lernfortschritt', active: 'account' }));
  assert.equal((account.match(/<h1>/g) || []).length, 1); assert.match(account, /aria-label="Kontomenü"/); assert.match(account, /aria-current="page"/); assert.match(account, /class="header"/);
});
