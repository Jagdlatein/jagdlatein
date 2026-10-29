// Local hooks, real effect cleanups and synthetic fetches only. No mail, server
// account, authentication code or payment is sent to an external service.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const React = local('react');
const swc = local('next/dist/build/swc');
const find = (node, predicate) => {
  if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } return null; }
  if (!node || typeof node !== 'object') return null;
  return predicate(node) ? node : find(node.props?.children, predicate);
};
const words = node => Array.isArray(node) ? node.map(words).join('') : node && typeof node === 'object' ? words(node.props?.children) : node == null || typeof node === 'boolean' ? '' : String(node);
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const response = (data = { success: true }, status = 200) => ({ ok: status >= 200 && status < 300, json: async () => data });
const event = () => ({ preventDefault() {} });

function fixture(fetcher = () => response(), initialProps = {}, query = { next: '/konto' }) {
  const slots = [], effects = [], pendingEffects = new Map(), timers = new Map(), calls = [];
  let cursor = 0, effectCursor = 0, tree, props = initialProps, dirty = false, disposed = false, writes = 0, sequence = 0, now = 1780000000000;
  const hooks = { ...React,
    useState(initial) {
      const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => { writes++; if (disposed) return; const next = typeof value === 'function' ? value(slots[index]) : value; dirty ||= !Object.is(next, slots[index]); slots[index] = next; }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
    useEffect(callback, deps) {
      const index = effectCursor++, previous = effects[index];
      if (!previous || !deps || deps.some((value, n) => !Object.is(value, previous.deps[n]))) pendingEffects.set(index, { callback, deps });
    },
  };
  const window = { location: { href: null } };
  class ClockDate extends Date { static now() { return now; } }
  const overrides = { react: hooks, 'next/router': { useRouter: () => ({ query }) },
    'next/link': ({ href, children }) => React.createElement('a', { href }, children),
    '../components/LearningToolLayout': { __esModule: true, default: ({ children }) => children },
  };
  const loader = createLoader(overrides), filename = path.join(root, 'pages/login.js');
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'fetch', 'window', 'setTimeout', 'clearTimeout', 'Date', code)(id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.endsWith('.module.css')) return { __esModule: true, default: {} };
    return id.startsWith('.') ? loader(path.resolve(path.dirname(filename), `${id}.js`)) : local(id);
  }, mod, mod.exports, async (...args) => { calls.push(args); return fetcher(...args); }, window,
  (callback, delay) => { const id = ++sequence; timers.set(id, { callback, delay, due: now + delay }); return id; }, id => timers.delete(id), ClockDate);
  function render(next = props, commit = true) {
    props = next; cursor = 0; effectCursor = 0; dirty = false;
    tree = mod.exports.default(props);
    if (commit) flush();
    return tree;
  }
  function flush() {
    for (let round = 0; round < 12; round++) {
      const jobs = [...pendingEffects]; pendingEffects.clear();
      for (const [index, job] of jobs) { effects[index]?.cleanup?.(); effects[index] = { deps: job.deps, cleanup: job.callback() }; }
      if (!dirty) return;
      render(props, false);
    }
    throw new Error('Unexpected fixture render loop');
  }
  function unmount() { for (const effect of effects) effect?.cleanup?.(); disposed = true; pendingEffects.clear(); }
  render();
  const input = () => find(tree, node => node.type === 'input');
  const button = label => find(tree, node => node.type === 'button' && words(node) === label);
  return { calls, timers, window, render, flush, unmount,
    input, button, text: () => words(tree), snapshot: () => ({ email: slots[0], code: slots[1], step: slots[2], message: slots[3], loading: slots[4], resend: slots[5] }), writes: () => writes,
    submit: () => find(tree, node => node.type === 'form').props.onSubmit,
    edit(value) { input().props.onChange({ target: { value } }); render(); },
    click(label) { const node = button(label); assert.ok(node, label); node.props.onClick(event()); render(); },
    async send() { await find(tree, node => node.type === 'form').props.onSubmit(event()); render(); },
    advance(elapsed) { now += elapsed; for (const [id, timer] of [...timers]) if (timer.due <= now) { timers.delete(id); timer.callback(); } render(); },
  };
}

test('Disposed submit, resend, input and email-change handlers do nothing before any state or network action', async () => {
  const h = fixture(); h.edit('member@example.invalid'); await h.send(); h.edit('123456');
  const submit = h.submit(), input = h.input().props.onChange, resend = h.button('Neuen Code senden').props.onClick, change = h.button('E-Mail ändern').props.onClick;
  h.unmount(); const before = h.snapshot(), writes = h.writes();
  await submit(event()); await resend(event()); input({ target: { value: '999999' } }); change();
  assert.equal(h.calls.length, 1); assert.deepEqual(h.snapshot(), before); assert.equal(h.writes(), writes); assert.equal(h.timers.size, 0);
});

test('A rendered flow change blocks outgoing and not-yet-committed incoming actions before effect cleanup', async () => {
  const h = fixture(undefined, { allowRegistration: true }); h.edit('member@example.invalid');
  const oldSubmit = h.submit(), oldInput = h.input().props.onChange;
  h.render({ allowRegistration: false }, false); const before = h.snapshot(), writes = h.writes();
  await oldSubmit(event()); oldInput({ target: { value: 'old@example.invalid' } }); await h.submit()(event());
  assert.equal(h.calls.length, 0); assert.deepEqual(h.snapshot(), before); assert.equal(h.writes(), writes);
  h.flush(); h.render(); await h.send(); assert.equal(h.calls.length, 1); assert.equal(h.calls[0][0], '/api/auth/request-code'); h.unmount();
});

test('A–B–A before cleanup creates a new identity instead of reviving a former A handler', async () => {
  const h = fixture(undefined, { allowRegistration: true }); h.edit('member@example.invalid'); const oldSubmit = h.submit(), oldInput = h.input().props.onChange;
  h.render({ allowRegistration: false }, false); h.render({ allowRegistration: true }, false);
  const writes = h.writes(); await oldSubmit(event()); oldInput({ target: { value: 'stale@example.invalid' } }); await h.submit()(event());
  assert.equal(h.calls.length, 0); assert.equal(h.writes(), writes);
  h.flush(); h.render(); assert.equal(h.snapshot().email, 'member@example.invalid'); await h.send();
  assert.equal(h.calls[0][0], '/api/auth/register-request'); h.unmount();
});

test('Current same-step input handlers remain combinable while old step fields cannot overwrite their replacements', async () => {
  const h = fixture(), emailInput = h.input().props.onChange;
  emailInput({ target: { value: 'first@example.invalid' } }); emailInput({ target: { value: 'member@example.invalid' } }); h.render();
  assert.equal(h.snapshot().email, 'member@example.invalid'); await h.send();
  const oldCode = h.input().props.onChange, oldChange = h.button('E-Mail ändern').props.onClick, oldResend = h.button('Neuen Code senden').props.onClick;
  h.click('E-Mail ändern'); h.edit('new@example.invalid');
  const before = h.snapshot(), writes = h.writes(); oldCode({ target: { value: '999999' } }); oldChange(); await oldResend(event());
  assert.deepEqual(h.snapshot(), before); assert.equal(h.writes(), writes); assert.equal(h.calls.length, 1);
  await h.send(); assert.deepEqual(JSON.parse(h.calls[1][1].body), { email: 'new@example.invalid' }); h.unmount();
});

test('A captured submit cannot send the previous address, including an address A–B–A edit before repaint', async () => {
  const h = fixture(); h.edit('first@example.invalid'); const oldSubmit = h.submit(), emailInput = h.input().props.onChange;
  emailInput({ target: { value: 'second@example.invalid' } });
  const writes = h.writes(); await oldSubmit(event()); assert.equal(h.calls.length, 0); assert.equal(h.writes(), writes);
  emailInput({ target: { value: 'first@example.invalid' } }); await oldSubmit(event()); assert.equal(h.calls.length, 0);
  h.render(); await h.send(); assert.deepEqual(JSON.parse(h.calls[0][1].body), { email: 'first@example.invalid' }); h.unmount();
});

test('A captured code submit cannot verify an earlier code or revive after code A–B–A', async () => {
  const h = fixture(); h.edit('member@example.invalid'); await h.send(); h.edit('123456');
  const oldSubmit = h.submit(), codeInput = h.input().props.onChange;
  codeInput({ target: { value: '654321' } }); await oldSubmit(event()); assert.equal(h.calls.length, 1);
  codeInput({ target: { value: '123456' } }); await oldSubmit(event()); assert.equal(h.calls.length, 1);
  h.render(); await h.send(); assert.equal(h.calls[1][0], '/api/auth/verify-code'); assert.equal(JSON.parse(h.calls[1][1].body).code, '123456'); h.unmount();
});

test('A queued former-address countdown cannot clear or change the current address countdown', async () => {
  const h = fixture(); h.edit('first@example.invalid'); await h.send();
  const oldCountdown = [...h.timers.values()].find(timer => timer.delay === 1000).callback;
  h.click('E-Mail ändern'); h.edit('second@example.invalid'); await h.send(); h.edit('654321');
  const currentCountdown = [...h.timers.values()].find(timer => timer.delay === 1000), before = h.snapshot(), writes = h.writes();
  oldCountdown(); assert.deepEqual(h.snapshot(), before); assert.equal(h.writes(), writes); assert.ok([...h.timers.values()].includes(currentCountdown));
  h.advance(1000); assert.equal(h.snapshot().resend, 59); assert.equal(h.snapshot().code, '654321'); h.unmount();
});

test('Late former-flow promise and timeout callbacks cannot overwrite or unlock the current request', async () => {
  const old = deferred(), fresh = deferred(); let count = 0;
  const h = fixture(() => ++count === 1 ? old.promise : fresh.promise, { allowRegistration: true }); h.edit('member@example.invalid');
  const oldRequest = h.submit()(event()), oldTimeout = [...h.timers.values()].find(timer => timer.delay === 18000).callback;
  h.render({ allowRegistration: false }); assert.equal(h.calls[0][1].signal.aborted, true);
  const current = h.submit()(event()); h.render(); oldTimeout(); assert.equal(h.calls[1][1].signal.aborted, false);
  old.resolve(response({ success: true, message: 'stale response' })); await oldRequest; h.render();
  assert.equal(h.snapshot().loading, true); assert.doesNotMatch(h.text(), /stale response/);
  await h.submit()(event()); assert.equal(h.calls.length, 2);
  fresh.resolve(response({ success: true, message: 'neutral current response' })); await current; h.render();
  assert.equal(h.snapshot().loading, false); assert.equal(h.snapshot().step, 'code'); assert.equal(h.snapshot().message, 'neutral current response'); h.unmount();
});

test('An old redirect/countdown cannot navigate or mutate state after a flow switch and return', async () => {
  const h = fixture(() => response({ success: true, paid: true }), { allowRegistration: true }); h.edit('member@example.invalid'); await h.send(); h.edit('123456'); await h.send();
  const redirect = [...h.timers.values()].find(timer => timer.delay === 500).callback;
  const countdown = [...h.timers.values()].find(timer => timer.delay === 1000).callback;
  h.render({ allowRegistration: false }, false); h.render({ allowRegistration: true }, false);
  const writes = h.writes(); redirect(); countdown(); assert.equal(h.window.location.href, null); assert.equal(h.writes(), writes);
  h.flush(); h.render(); assert.equal(h.snapshot().code, ''); assert.equal(h.snapshot().step, 'email'); h.unmount();
});

test('Current failed codes remain correctable and successful checkout navigation preserves its exact safe destination', async () => {
  let count = 0;
  const h = fixture(() => ++count === 2 ? response({ success: false, message: 'Code erneut prüfen.' }, 400) : response({ success: true, paid: false }), { allowRegistration: true }, { next: '/preise?next=%2Flernen#paypal-subscribe-preise' });
  h.edit('member@example.invalid'); await h.send(); const codeInput = h.input().props.onChange;
  codeInput({ target: { value: '12 3' } }); codeInput({ target: { value: '123-456' } }); h.render(); assert.equal(h.snapshot().code, '123456');
  await h.send(); assert.equal(h.snapshot().loading, false); assert.equal(h.snapshot().code, '123456'); assert.match(h.text(), /Code erneut prüfen/);
  h.edit('654321'); await h.send(); assert.equal(h.calls[2][0], '/api/auth/register-verify');
  assert.deepEqual(JSON.parse(h.calls[2][1].body), { email: 'member@example.invalid', code: '654321' });
  assert.equal(h.snapshot().loading, true); [...h.timers.values()].find(timer => timer.delay === 500).callback();
  assert.equal(h.render().props.destination, '/preise?next=%2Flernen#paypal-subscribe-preise'); h.unmount();
});

test('A current stalled request still aborts at its existing deadline and offers another attempt', async () => {
  const h = fixture((url, init) => new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('isolated timeout')), { once: true })));
  h.edit('member@example.invalid'); const request = h.submit()(event()); h.advance(18000); await request; h.render();
  assert.equal(h.calls[0][1].signal.aborted, true); assert.equal(h.snapshot().loading, false); assert.match(h.text(), /erneut versuchen/); h.unmount();
});

test('Real React unmount cleanup blocks a captured submit, while current edits keep the same input mounted', async t => {
  const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
  const dom = new JSDOM('<html><body><div id="root"></div></body></html>', { url: 'https://jagdlatein.invalid/login' });
  const previous = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const oldFetch = globalThis.fetch, calls = []; globalThis.fetch = async (...args) => { calls.push(args); return Response.json({ success: false }, { status: 400 }); };
  const wrap = value => ({ __esModule: true, default: value });
  const Login = createLoader({ 'next/router': { useRouter: () => ({ query: {} }) }, 'next/link': ({ children }) => children,
    '../components/LearningToolLayout': wrap(({ children }) => React.createElement('main', null, children)) })('pages/login.js').default;
  let reactRoot = local('react-dom/client').createRoot(document.getElementById('root'));
  const props = node => node[Object.keys(node).find(key => key.startsWith('__reactProps$'))];
  t.after(async () => {
    if (reactRoot) await React.act(async () => reactRoot.unmount()); globalThis.fetch = oldFetch; dom.window.close();
    for (const [key, descriptor] of previous) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key];
  });
  await React.act(async () => reactRoot.render(React.createElement(Login)));
  const input = document.querySelector('input');
  await React.act(async () => props(input).onChange({ target: { value: 'first@example.invalid' } }));
  await React.act(async () => props(input).onChange({ target: { value: 'member@example.invalid' } }));
  assert.equal(document.querySelector('input'), input); assert.equal(input.value, 'member@example.invalid');
  const submit = props(document.querySelector('form')).onSubmit;
  await React.act(async () => reactRoot.unmount()); reactRoot = null;
  await React.act(async () => submit(event())); assert.equal(calls.length, 0);
});
