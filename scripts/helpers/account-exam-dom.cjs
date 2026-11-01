// Actual React effects/unmounts against synthetic account HTTP and JSDOM only.
const assert = require('node:assert/strict'), path = require('node:path');
const { createLoader, local } = require('./project-module.cjs');
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222';
const nativeProps = node => node?.[Object.keys(node).find(key => key.startsWith('__reactProps$'))];
const event = () => ({ preventDefault() {} });
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
async function fixture(t, options = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://example.invalid/pruefungsziel' });
  for (const [key, value] of Object.entries(options.values || {})) dom.window.localStorage.setItem(key, value);
  const calls = [], navigations = [], writes = [], reads = [], scrolls = [], timers = new Map(), descriptors = new Map();
  let currentProps = options.props || {}, timerId = 0, disposed = false, closed = false, failNavigation = options.failNavigation || false, parentLive = true, probe = 0, layoutAction;
  const location = { href: 'https://example.invalid/pruefungsziel', pathname: '/pruefungsziel', search: '', hash: '', replace(href) { navigations.push(href); if (failNavigation) throw new Error('Isolated blocked navigation'); } };
  dom.window.scrollTo = value => scrolls.push(value);
  const storage = dom.window.localStorage, get = storage.getItem.bind(storage), set = storage.setItem.bind(storage);
  const storageDouble = { getItem(key) { reads.push(key); if (options.denyStorage) throw new Error('Isolated storage denial'); return get(key); }, setItem(key, value) { writes.push([key, value]); if (options.denyStorage) throw new Error('Isolated storage denial'); return set(key, value); }, removeItem(key) { writes.push([key, null]); if (options.denyStorage) throw new Error('Isolated storage denial'); return storage.removeItem(key); } };
  const browser = new Proxy(dom.window, { get(target, key) { if (key === 'location') return location; if (key === 'localStorage' || key === 'sessionStorage') { reads.push(`access:${key}`); if (options.denyStorage) throw new Error('Isolated storage denial'); return storageDouble; } const value = Reflect.get(target, key, target); return ['addEventListener', 'removeEventListener', 'setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'].includes(key) && typeof value === 'function' ? value.bind(target) : value; } });
  const realSetTimeout = global.setTimeout, realClearTimeout = global.clearTimeout;
  const fakeSetTimeout = (callback, delay, ...args) => { if (delay !== 18000) return realSetTimeout(callback, delay, ...args); const id = --timerId; timers.set(id, { callback, delay, args }); return id; };
  const fakeClearTimeout = id => { if (!timers.delete(id)) realClearTimeout(id); };
  const fetcher = (url, request = {}) => {
    assert.equal(url, '/api/account/exam-profile'); assert.equal(request.credentials, 'same-origin'); assert.equal(request.cache, 'no-store');
    const task = deferred(), call = { url, options: request, ...task }; calls.push(call);
    if (!request.method && !options.deferGet && (!options.deferReloads || calls.length === 1)) task.resolve(Response.json({ profile: options.profile || null, accountKey: options.accountKey || A }));
    return task.promise;
  };
  for (const [key, value] of Object.entries({ window: browser, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, MutationObserver: dom.window.MutationObserver, IS_REACT_ACT_ENVIRONMENT: true, fetch: fetcher, setTimeout: fakeSetTimeout, clearTimeout: fakeClearTimeout })) {
    descriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const Layout = ({ title, description, children }) => React.createElement('main', {}, React.createElement('h1', { tabIndex: -1, 'data-learning-page-start': true }, title), React.createElement('p', {}, description), children);
  const wrap = value => ({ __esModule: true, default: value });
  const Link = ({ href, children, prefetch, ...rest }) => React.createElement('a', { href, ...rest }, children);
  const product = createLoader({ 'next/link': wrap(Link), './LearningToolLayout': wrap(Layout), '../components/LearningToolLayout': wrap(Layout), ...options.overrides });
  const store = product('lib/account-exam-profile-client.js');
  const Component = product(options.component || 'components/ExamProfileWelcome.js').default;
  let root; const recoverableErrors = []; let serverHtml = '';
  const guard = () => parentLive;
  function Probe({ revision }) { React.useLayoutEffect(() => { layoutAction?.(); }, [revision]); return null; }
  const tree = () => React.createElement(React.Fragment, {}, React.createElement(Component, { isCurrent: guard, ...currentProps }), React.createElement(Probe, { revision: probe }));
  const container = dom.window.document.getElementById('root');
  async function unmount() { if (!disposed) { await React.act(async () => root.unmount()); disposed = true; } }
  async function close() { if (closed) return; closed = true; await unmount(); timers.clear(); dom.window.close(); for (const [key, descriptor] of descriptors) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } }
  t.after(close);
  if (options.loadAccount) await React.act(async () => store.loadAccountExamProfile());
  if (options.hydrate) {
    serverHtml = local('react-dom/server').renderToString(tree()); container.innerHTML = serverHtml;
    await React.act(async () => { root = local('react-dom/client').hydrateRoot(container, tree(), { onRecoverableError: error => recoverableErrors.push(error) }); });
  } else { root = local('react-dom/client').createRoot(container); await React.act(async () => root.render(tree())); }
  return { product, store, container, dom, calls, navigations, writes, reads, scrolls, timers, nativeProps, event, unmount, close, location, serverHtml, recoverableErrors,
    get snapshot() { return store.getAccountExamSnapshot(); }, get failNavigation() { return failNavigation; }, set failNavigation(value) { failNavigation = value; }, parent(value) { parentLive = value; },
    button(label) { return [...container.querySelectorAll('button')].find(node => node.textContent.includes(label)); },
    async render(props = {}, beforePassiveCleanup) { currentProps = { ...currentProps, ...props }; layoutAction = beforePassiveCleanup; probe++; await React.act(async () => root.render(tree())); layoutAction = null; },
    async select(id, value) { const node = container.querySelector(`#${id}`); assert.ok(node, id); await React.act(async () => nativeProps(node).onChange({ target: { value } })); },
    async choose(country = 'CH', region = 'ZH') { await this.select('exam-welcome-country', country); await this.select('exam-welcome-region', region); },
    async submit() { const form = container.querySelector('form'); assert.ok(form); let task; await React.act(async () => { task = nativeProps(form).onSubmit(event()); }); return { task }; },
    async respond(index, profile = null, accountKey = A, status = 200) { assert.ok(calls[index], `HTTP request ${index}`); await React.act(async () => calls[index].resolve(Response.json({ profile, accountKey }, { status }))); },
    async click(label) { const node = this.button(label); assert.ok(node, label); await React.act(async () => nativeProps(node).onClick?.(event())); },
    async timeout() { const entries = [...timers]; assert.equal(entries.length, 1); await React.act(async () => entries[0][1].callback(...entries[0][1].args)); },
    async load(profile, accountKey = A) { let task; await React.act(async () => { task = store.loadAccountExamProfile({ force: true }); }); await this.respond(calls.length - 1, profile, accountKey); await task; },
  };
}
module.exports = { fixture, A, B, nativeProps, event, React, deferred };
