// Real React/JSDOM handoffs with synthetic OTP responses and device storage.
// No email, authentication service, real account or browser data is accessed.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const EXAM_KEY = 'jl_exam_profile_v1';
const LEGAL_KEY = 'jl_legal_region_v1';
const event = () => ({ preventDefault() {} });
const nativeProps = node => node?.[Object.keys(node).find(key => key.startsWith('__reactProps$'))];
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

async function fixture(t, { props = {}, query = {}, account = { paid: false, admin: false }, values = {}, verify, realFocus = false } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://example.invalid/login' });
  for (const [key, value] of Object.entries(values)) dom.window.localStorage.setItem(key, value);
  const calls = [], navigations = [], writes = [], removes = [], listeners = new Set(), timers = new Map(), globals = new Map();
  const scrolls = [];
  dom.window.scrollTo = value => scrolls.push(value);
  let timerId = 1000000, currentProps = props, disposed = false, storageBlocked = false, probeRevision = 0, layoutAction = null;
  const location = { href: null, pathname: '/login', search: '', hash: '',
    replace(href) { navigations.push({ method: 'replace', href }); },
    assign(href) { navigations.push({ method: 'assign', href }); },
  };
  const browser = new Proxy(dom.window, { get(target, key) {
    if (key === 'location') return location;
    const value = Reflect.get(target, key, target);
    return ['addEventListener', 'removeEventListener', 'setTimeout', 'clearTimeout'].includes(key) ? value.bind(target) : value;
  } });
  const originalSet = dom.window.Storage.prototype.setItem, originalRemove = dom.window.Storage.prototype.removeItem;
  dom.window.Storage.prototype.setItem = function (key, value) { writes.push([key, value]); if (storageBlocked && key === EXAM_KEY) throw new Error('Isolated storage denial'); return originalSet.call(this, key, value); };
  dom.window.Storage.prototype.removeItem = function (key) { removes.push(key); return originalRemove.call(this, key); };
  const add = dom.window.addEventListener.bind(dom.window), remove = dom.window.removeEventListener.bind(dom.window);
  dom.window.addEventListener = (name, callback, options) => { if (name === 'storage') listeners.add(callback); add(name, callback, options); };
  dom.window.removeEventListener = (name, callback, options) => { if (name === 'storage') listeners.delete(callback); remove(name, callback, options); };
  const realSetTimeout = global.setTimeout, realClearTimeout = global.clearTimeout;
  const fakeSetTimeout = (callback, delay, ...args) => {
    if (![500, 1000, 18000].includes(delay)) return realSetTimeout(callback, delay, ...args);
    const id = ++timerId; timers.set(id, { callback, delay, args }); return id;
  };
  const fakeClearTimeout = id => { if (!timers.delete(id)) realClearTimeout(id); };
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    assert.match(url, /^\/api\/auth\/(?:register-request|register-verify|request-code|verify-code)$/);
    assert.equal(options.method, 'POST'); assert.equal(options.credentials, 'same-origin');
    if (/verify/.test(url)) return verify ? verify(url, options) : Response.json({ success: true, ...account });
    return Response.json({ success: true, message: 'Synthetic neutral OTP response' });
  };
  for (const [key, value] of Object.entries({ window: browser, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement,
    MutationObserver: dom.window.MutationObserver, IS_REACT_ACT_ENVIRONMENT: true, fetch: fetcher, setTimeout: fakeSetTimeout, clearTimeout: fakeClearTimeout })) {
    globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const router = { query, isReady: true, pathname: '/login' };
  const Link = ({ href, children, prefetch, shallow, scroll, ...rest }) => React.createElement('a', { href, ...rest }, children);
  const Layout = ({ title, description, children }) => React.createElement('main', {}, React.createElement('h1', { tabIndex: -1, 'data-learning-page-start': true }, title), React.createElement('p', {}, description), children);
  const wrap = value => ({ __esModule: true, default: value });
  const product = createLoader({ 'next/router': { useRouter: () => router }, 'next/link': wrap(Link),
    '../components/LearningToolLayout': wrap(Layout), './LearningToolLayout': wrap(Layout),
    './AppIcon': wrap(() => null), ...(!realFocus ? { '../hooks/useSelectionPageStart': wrap(() => ({ focusSelection() {}, cancelSelectionFocus() {} })) } : {}),
  });
  const Login = product('pages/login.js').default;
  const root = local('react-dom/client').createRoot(dom.window.document.getElementById('root'));
  function Probe({ revision }) { React.useLayoutEffect(() => { layoutAction?.(); }, [revision]); return null; }
  const tree = () => React.createElement(React.Fragment, {}, React.createElement(Login, currentProps), React.createElement(Probe, { revision: probeRevision }));
  async function close() {
    if (disposed) return;
    disposed = true;
    try { await React.act(async () => root.unmount()); assert.equal(listeners.size, 0, 'No shared-store listener survives actual React unmount'); }
    finally { timers.clear(); dom.window.close(); for (const [key, descriptor] of globals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } }
  }
  t.after(close);
  await React.act(async () => root.render(tree()));
  const container = dom.window.document.getElementById('root');
  const findButton = label => [...container.querySelectorAll('button')].find(button => button.textContent.includes(label));
  async function edit(value) { const input = container.querySelector('input'); assert.ok(input); await React.act(async () => nativeProps(input).onChange({ target: { value } })); }
  async function submit() { const form = container.querySelector('form'); assert.ok(form); await React.act(async () => { await nativeProps(form).onSubmit(event()); }); }
  return { container, dom, product, router, calls, navigations, writes, removes, timers, location, scrolls, edit, submit, close,
    get storedProfile() { return dom.window.localStorage.getItem(EXAM_KEY); },
    blockStorage() { storageBlocked = true; },
    async render(nextProps = {}, nextQuery = router.query, beforePassiveCleanup = null) {
      currentProps = { ...currentProps, ...nextProps }; router.query = nextQuery;
      layoutAction = beforePassiveCleanup; probeRevision++;
      await React.act(async () => root.render(tree())); layoutAction = null;
    },
    async advanceRedirect() {
      const pending = [...timers].filter(([, timer]) => timer.delay === 500);
      await React.act(async () => { for (const [id, timer] of pending) { timers.delete(id); timer.callback(...timer.args); } });
    },
    async login() { await edit('member@example.invalid'); await submit(); await edit('123456'); await submit(); await this.advanceRedirect(); },
    async select(id, value) { const select = container.querySelector(`#${id}`); assert.ok(select, id); await React.act(async () => nativeProps(select).onChange({ target: { value } })); },
    async click(label) { const button = findButton(label); assert.ok(button, label); await React.act(async () => nativeProps(button).onClick?.(event())); },
    async save(country = 'CH', region = 'SG') {
      await this.select('exam-welcome-country', country); await this.select('exam-welcome-region', region);
      const form = container.querySelector('form[aria-label="Prüfungsziel wählen"]'); assert.ok(form);
      await React.act(async () => nativeProps(form).onSubmit(event()));
    },
  };
}

test('The first inline exam selection focuses its actual heading and scrolls to the top without interrupting later selection', async t => {
  const s = await fixture(t, { realFocus: true });
  await s.login();
  await React.act(async () => new Promise(resolve => setTimeout(resolve, 10)));
  assert.equal(s.dom.window.document.activeElement, s.container.querySelector('h1'));
  assert.equal(s.container.querySelector('h1').textContent, 'Dein Prüfungsziel');
  assert.ok(s.scrolls.length > 0);
  assert.ok(s.scrolls.every(value => value.top === 0 && value.left === 0));
  const before = s.scrolls.length;
  await s.select('exam-welcome-country', 'CH'); await s.select('exam-welcome-region', 'SG');
  assert.equal(s.scrolls.length, before, 'Choosing country and region must not repeatedly move the page');
});

test('A newly signed-in unpaid learner selects the exam target inline before the exact existing checkout destination', async t => {
  const next = '/kurse/wissen-ausbau-rechtsquellen?land=CH#lerntext';
  const s = await fixture(t, { query: { next }, values: { [LEGAL_KEY]: JSON.stringify({ country: 'DE', region: 'BY' }), jagd_country: 'AT', journal: 'Synthetic draft' } });
  await s.login();
  assert.ok(s.container.querySelector('#exam-welcome-country')); assert.ok(s.container.querySelector('#exam-welcome-region'));
  assert.deepEqual(s.navigations, []); assert.equal(s.location.href, null);
  assert.deepEqual(s.calls.map(call => call.url), ['/api/auth/request-code', '/api/auth/verify-code']);
  assert.deepEqual(JSON.parse(s.calls[0].options.body), { email: 'member@example.invalid' });
  assert.deepEqual(JSON.parse(s.calls[1].options.body), { email: 'member@example.invalid', code: '123456' });
  await s.save('AT', 'NOE');
  assert.deepEqual(JSON.parse(s.storedProfile), { country: 'AT', region: 'NOE' });
  assert.deepEqual(s.navigations, [{ method: 'replace', href: `/preise?next=${encodeURIComponent(next)}#paypal-subscribe-preise` }]);
  assert.deepEqual(s.writes.map(([key]) => key), [EXAM_KEY]); assert.deepEqual(s.removes, []);
  assert.equal(s.dom.window.localStorage.getItem('jagd_country'), 'AT'); assert.equal(s.dom.window.localStorage.getItem('journal'), 'Synthetic draft');
  assert.deepEqual(JSON.parse(s.dom.window.localStorage.getItem(LEGAL_KEY)), { country: 'DE', region: 'BY' });
  assert.doesNotMatch(s.container.textContent, /Lesbare Originalpassagen|Eigene freigegebene Rechtsfragen/);
});

test('Registration and unified existing-member sign-in use the same welcome handoff without adding profile fields to OTP requests', async t => {
  for (const props of [{ registration: true, allowRegistration: true }, { allowRegistration: true }]) {
    const s = await fixture(t, { props }); await s.login();
    assert.deepEqual(s.calls.map(call => call.url), ['/api/auth/register-request', '/api/auth/register-verify']);
    assert.ok(s.container.querySelector('#exam-welcome-country'));
    assert.equal(s.calls.length, 2); assert.deepEqual(Object.keys(JSON.parse(s.calls[1].options.body)), ['email', 'code']);
    await s.save('DE', 'BY');
    assert.deepEqual(s.navigations, [{ method: 'replace', href: props.registration ? '/konto' : '/preise?next=%2F#paypal-subscribe-preise' }]);
    await s.close();
  }
});

test('Existing valid device targets skip welcome without writes and preserve paid/admin/free/checkout return query and hash', async t => {
  const cases = [
    { account: { paid: true, admin: false }, next: '/lernen/wildjahr?art=rehwild&monat=10#wildjahr-top', target: '/lernen/wildjahr?art=rehwild&monat=10#wildjahr-top' },
    { account: { paid: false, admin: true }, next: '/admin?bereich=kurse#oben', target: '/admin?bereich=kurse#oben' },
    { account: { paid: false, admin: false }, next: '/community?category=hundewesen#frage', target: '/community?category=hundewesen#frage' },
    { account: { paid: false, admin: false }, next: '/preise?next=%2Flernen%3Fsuche%3Dgams#paypal-subscribe-preise', target: '/preise?next=%2Flernen%3Fsuche%3Dgams#paypal-subscribe-preise' },
    { account: { paid: false, admin: false }, next: '/kurse/hundewesen?modus=test#quiz', target: '/preise?next=%2Fkurse%2Fhundewesen%3Fmodus%3Dtest%23quiz#paypal-subscribe-preise' },
  ];
  const raw = JSON.stringify({ country: 'CH', region: 'ZH' });
  for (const item of cases) {
    const s = await fixture(t, { account: item.account, query: { next: item.next }, values: { [EXAM_KEY]: raw } });
    await s.login();
    assert.equal(s.container.querySelector('#exam-welcome-country'), null);
    assert.deepEqual(s.navigations, [{ method: 'replace', href: item.target }]);
    assert.equal(s.storedProfile, raw); assert.deepEqual(s.writes, []); assert.deepEqual(s.removes, []);
    assert.equal(s.calls.length, 2); await s.close();
  }
});

test('Confirmed welcome stops the resend countdown and ignores its captured callback after real elapsed time', async t => {
  const s = await fixture(t, { values: { [EXAM_KEY]: JSON.stringify({ country: 'CH', region: 'ZH' }) } });
  await s.edit('member@example.invalid'); await s.submit();
  const countdown = [...s.timers.values()].find(timer => timer.delay === 1000);
  assert.ok(countdown, 'The actual login request scheduled its existing resend countdown');
  await s.edit('123456'); await s.submit(); await s.advanceRedirect();
  assert.equal(s.navigations.length, 1);
  assert.equal([...s.timers.values()].some(timer => timer.delay === 1000), false);
  const originalNow = Date.now, elapsed = originalNow() + 2100;
  try {
    Date.now = () => elapsed;
    await React.act(async () => countdown.callback(...countdown.args));
  } finally { Date.now = originalNow; }
  assert.equal(s.navigations.length, 1, 'A former countdown cannot retry document navigation');
  assert.equal(s.calls.length, 2); assert.deepEqual(s.writes, []);
});

test('Ordinary parent renders retain one welcome navigation attempt, including a blocked document transition', async t => {
  for (const failNavigation of [false, true]) {
    const s = await fixture(t, { values: { [EXAM_KEY]: JSON.stringify({ country: 'DE', region: 'BY' }) } });
    if (failNavigation) {
      const replace = s.location.replace;
      s.location.replace = href => { replace(href); throw new Error('Synthetic blocked transition'); };
    }
    await s.login(); assert.equal(s.navigations.length, 1);
    await s.render(); await s.render({}, { ...s.router.query });
    assert.equal(s.navigations.length, 1, 'A new parent render must not create a new navigation origin');
    if (failNavigation) assert.match(s.container.textContent, /Die nächste Seite konnte nicht geöffnet werden/);
    else assert.ok([...s.container.querySelectorAll('a')].some(link => link.textContent === 'Weiter'));
    assert.equal(s.calls.length, 2); assert.deepEqual(s.writes, []);
    await s.close();
  }
});

test('Malformed stored targets are not silently replaced; explicit later selection skips without changing any preference', async t => {
  const raw = JSON.stringify({ country: 'CH', region: 'BY' });
  const s = await fixture(t, { account: { paid: true }, query: { next: '/lernen?category=wildkunde#arten' }, values: { [EXAM_KEY]: raw, jagd_country: 'DE' } });
  await s.login(); assert.ok(s.container.querySelector('#exam-welcome-country'));
  assert.equal(s.container.querySelector('#exam-welcome-country').value, '');
  assert.equal(s.container.querySelector('#exam-welcome-region').value, '');
  await s.click('Später auswählen');
  assert.deepEqual(s.navigations, [{ method: 'replace', href: '/lernen?category=wildkunde#arten' }]);
  assert.equal(s.storedProfile, raw); assert.deepEqual(s.writes, []); assert.deepEqual(s.removes, []);
});

test('Storage denial keeps the explicit session choice visible until the learner confirms continuation', async t => {
  const s = await fixture(t, { query: { next: '/preise?next=%2Flernen#paypal-subscribe-preise' } });
  await s.login(); s.blockStorage(); await s.save('AT', 'T');
  assert.deepEqual(s.navigations, []); assert.equal(s.storedProfile, null);
  assert.match(s.container.textContent, /Sitzung|dauerhaft/i);
  await s.click('Trotzdem weiter');
  assert.deepEqual(s.navigations, [{ method: 'replace', href: '/preise?next=%2Flernen#paypal-subscribe-preise' }]);
  assert.deepEqual(s.writes.map(([key]) => key), [EXAM_KEY]);
});

test('A stale welcome action cannot save or navigate after the parent flow changes, before passive cleanup', async t => {
  for (const props of [{ registration: true, allowRegistration: true }, {}]) {
    const s = await fixture(t, { account: { paid: true }, query: { next: '/lernen#start' } });
    await s.login(); await s.select('exam-welcome-country', 'CH'); await s.select('exam-welcome-region', 'SG');
    const oldSave = nativeProps(s.container.querySelector('form[aria-label="Prüfungsziel wählen"]')).onSubmit;
    const oldSkip = nativeProps([...s.container.querySelectorAll('button')].find(button => button.textContent.includes('Später auswählen'))).onClick;
    let layoutCalls = 0;
    await s.render(props, { next: '/konto' }, () => { layoutCalls++; oldSave(event()); oldSkip(event()); });
    assert.equal(layoutCalls, 1, 'Captured actions run in the actual layout phase before passive unmount cleanup');
    assert.deepEqual(s.writes, []); assert.deepEqual(s.navigations, []); assert.equal(s.location.href, null);
    assert.equal(s.calls.length, 2); await s.close();
  }
});

test('A late successful OTP response cannot open welcome, save a profile or navigate after actual parent unmount', async t => {
  const pending = deferred();
  const s = await fixture(t, { verify: () => pending.promise });
  await s.edit('member@example.invalid'); await s.submit(); await s.edit('123456');
  let submission;
  await React.act(async () => { submission = nativeProps(s.container.querySelector('form')).onSubmit(event()); });
  const request = s.calls[1]; assert.equal(request.options.signal.aborted, false);
  await s.close(); assert.equal(request.options.signal.aborted, true);
  pending.resolve(Response.json({ success: true, paid: true, admin: false })); await submission;
  assert.deepEqual(s.writes, []); assert.deepEqual(s.navigations, []); assert.equal(s.location.href, null);
});

test('Existing signed-session and explicit reauthentication server flows preserve safe next without trusting a device exam target', async () => {
  const product = createLoader({
    '../lib/account-session': { JL_ACCOUNT_COOKIE: 'synthetic-cookie', readAccountSession: value => value === 'signed-synthetic' ? { email: 'member@example.invalid' } : null },
    '../lib/test-environment': { getTestLoginMailMode: () => null },
    '../lib/apple-review-login-policy': { reviewLoginConfiguration: () => false },
  });
  const page = product('pages/login.js');
  const headers = {}, res = { setHeader: (key, value) => { headers[key] = value; } };
  const signed = await page.getServerSideProps({ req: { cookies: { 'synthetic-cookie': 'signed-synthetic' } }, res, query: { next: '/kurse/hundewesen?modus=test#quiz' } });
  assert.deepEqual(signed, { redirect: { destination: '/kurse/hundewesen?modus=test#quiz', permanent: false } });
  const reauth = await page.getServerSideProps({ req: { cookies: { 'synthetic-cookie': 'signed-synthetic' } }, res, query: { next: '/konto', reauth: '1' } });
  assert.ok(reauth.props); assert.equal(reauth.redirect, undefined);
  const unsigned = await page.getServerSideProps({ req: { cookies: {} }, res, query: { next: '/konto' } });
  assert.ok(unsigned.props); assert.equal(unsigned.redirect, undefined);
  assert.equal(headers['Cache-Control'], 'private, no-store, max-age=0');
});
