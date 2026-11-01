// Mandatory account welcome: actual React/JSDOM effects and isolated RAM/HTTP.
const test = require('node:test'), assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { fixture, A, B, nativeProps, event, React } = require('./helpers/account-exam-dom.cjs');
const CH = { country: 'CH', region: 'ZH' }, AT = { country: 'AT', region: 'NOE' };
// styled-jsx must initialize in a server environment, before a minimal window
// double is attached. The real layout still renders the actual SSR heading.
const ServerLayout = createLoader()('components/LearningToolLayout.js').default;

test('Actual SSR is one loading page without reading browser preferences, fetching, or painting a choice form', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window'); let reads = 0;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { get localStorage() { reads++; throw new Error('No SSR storage'); } } });
  try {
    const Welcome = createLoader({ './LearningToolLayout': { __esModule: true, default: ServerLayout } })('components/ExamProfileWelcome.js').default;
    const html = local('react-dom/server').renderToStaticMarkup(React.createElement(Welcome, { destination: '/lernen' }));
    assert.equal(reads, 0); assert.equal((html.match(/<h1\b/g) || []).length, 1); assert.match(html, /Dein Prüfungsziel wird geladen/); assert.doesNotMatch(html, /<form|<select|<dialog/);
  } finally { if (previous) Object.defineProperty(globalThis, 'window', previous); else delete globalThis.window; }
});

test('Actual hydration starts from the neutral server snapshot even when a confirmed account is already in RAM', async t => {
  const s = await fixture(t, { hydrate: true, loadAccount: true, profile: CH, denyStorage: true, props: { destination: '/lernen#start' } });
  assert.match(s.serverHtml, /Dein Prüfungsziel wird geladen/); assert.doesNotMatch(s.serverHtml, /<form|<select|gespeichertes Prüfungsziel ist bereit/);
  assert.deepEqual(s.recoverableErrors, []); assert.deepEqual(s.navigations, ['/lernen#start']); assert.deepEqual(s.reads, []); assert.deepEqual(s.writes, []);
});

test('Loading has no local fallback or skip; all51 explicit choices are offered empty without saving a draft', async t => {
  const s = await fixture(t, { deferGet: true, values: { jl_exam_profile_v1: JSON.stringify(CH) } });
  assert.equal(s.container.querySelector('form'), null); assert.deepEqual(s.navigations, []); await s.respond(0);
  assert.equal(s.container.querySelector('#exam-welcome-country').value, ''); assert.equal(s.container.querySelector('#exam-welcome-region').value, '');
  assert.doesNotMatch(s.container.textContent, /Später auswählen|Trotzdem weiter/);
  const { examCountries } = s.product('lib/exam-profile.js'); let count = 0;
  for (const country of examCountries) {
    await s.select('exam-welcome-country', country.code);
    const select = s.container.querySelector('#exam-welcome-region'); assert.equal(select.value, '');
    const options = [...select.options].filter(node => node.value); assert.deepEqual(options.map(node => [node.value, node.textContent]), country.regions.map(region => [region.code, region.name])); count += options.length;
  }
  assert.equal(count, 51); assert.equal(s.calls.length, 1); assert.deepEqual(s.writes, []); assert.deepEqual(s.reads, []);
});

test('Only confirmed account persistence unlocks continuation; duplicate captured submits do not duplicate PUT or optimistically navigate', async t => {
  const target = '/preise?next=%2Fkurse%2Fwildkunde#paypal-subscribe-preise'; const s = await fixture(t, { props: { destination: target } });
  await s.choose('AT', 'NOE'); const submit = nativeProps(s.container.querySelector('form')).onSubmit;
  let task; await React.act(async () => { task = submit(event()); submit(event()); });
  assert.equal(s.calls.length, 2); assert.equal(s.calls[1].options.headers['X-Jagdlatein-Exam-Account'], A); assert.deepEqual(JSON.parse(s.calls[1].options.body), AT);
  assert.equal(s.snapshot.profile, null); assert.equal(s.container.querySelector('form').getAttribute('aria-busy'), 'true'); assert.deepEqual(s.navigations, []);
  await s.respond(1, AT); await task; assert.deepEqual(s.navigations, [target]); assert.deepEqual(s.snapshot.profile, AT); assert.deepEqual(s.writes, []); assert.deepEqual(s.reads, []);
  await s.render(); await s.render(); assert.equal(s.navigations.length, 1);
});

test('A server-restored account target continues once to the exact safe destination without a draft flash or device write', async t => {
  const target = '/kurse/wissen-jagdrecht-ch#lesson-rahmen'; const s = await fixture(t, { profile: CH, props: { destination: target } });
  assert.equal(s.container.querySelector('form'), null); assert.deepEqual(s.navigations, [target]); assert.deepEqual(s.writes, []); assert.deepEqual(s.reads, []);
  await s.render(); assert.deepEqual(s.navigations, [target]);
});

test('Failed or timed-out saves retain the selected draft and offer retry without a session-only bypass', async t => {
  for (const timeout of [false, true]) {
    const s = await fixture(t, { denyStorage: true }); await s.choose('AT', 'NOE'); const { task } = await s.submit();
    if (timeout) await s.timeout(); else await s.respond(1, null, A, 503); await task;
    assert.equal(s.snapshot.profile, null); assert.deepEqual(s.navigations, []); assert.equal(s.container.querySelector('#exam-welcome-region').value, 'NOE');
    assert.match(s.container.textContent, /erneut|nicht übernommen/i); assert.equal(s.button('Prüfungsziel speichern').disabled, false); assert.doesNotMatch(s.container.textContent, /Trotzdem weiter|Später auswählen/);
    assert.deepEqual(s.reads, []); assert.deepEqual(s.writes, []); await s.close();
  }
});

test('A GET error offers an explicit reload; expired account sessions offer safe login and never local fallback', async t => {
  const target = '/kurse/wildkunde?modus=test#quiz'; const s = await fixture(t, { deferGet: true, props: { destination: target } });
  await s.respond(0, null, A, 503); assert.equal(s.container.querySelector('form'), null); assert.ok(s.button('Erneut laden'));
  await s.click('Erneut laden'); assert.equal(s.calls.length, 2); await s.respond(1, null, A, 401);
  assert.equal(s.container.querySelector('a').getAttribute('href'), `/login?next=${encodeURIComponent(target)}`); assert.equal(s.container.querySelector('form'), null); assert.deepEqual(s.navigations, []);
});

test('The first confirmed empty account focuses the actual page heading once; changing country and region does not repeatedly scroll', async t => {
  const s = await fixture(t); await React.act(async () => new Promise(resolve => setTimeout(resolve, 10)));
  assert.equal(s.dom.window.document.activeElement, s.container.querySelector('h1')); assert.ok(s.scrolls.length > 0); assert.ok(s.scrolls.every(value => value.top === 0 && value.left === 0));
  const count = s.scrolls.length; await s.choose(); assert.equal(s.scrolls.length, count);
});

test('Captured handlers are invalid after draft revision, destination change and parent authorization loss before passive cleanup', async t => {
  const s = await fixture(t, { props: { destination: '/lernen' } }), oldRegion = nativeProps(s.container.querySelector('#exam-welcome-region')).onChange;
  await React.act(async () => { nativeProps(s.container.querySelector('#exam-welcome-country')).onChange({ target: { value: 'AT' } }); oldRegion({ target: { value: 'ZH' } }); });
  assert.equal(s.container.querySelector('#exam-welcome-region').value, ''); await s.select('exam-welcome-region', 'NOE');
  const oldSave = nativeProps(s.container.querySelector('form')).onSubmit;
  await s.render({ destination: '/konto' }, () => oldSave(event())); assert.equal(s.calls.length, 1); assert.deepEqual(s.navigations, []);
  const currentSave = nativeProps(s.container.querySelector('form')).onSubmit; s.parent(false); await React.act(async () => currentSave(event())); assert.equal(s.calls.length, 1);
  await s.load(CH); assert.deepEqual(s.navigations, []);
});

test('A fresh login reloads the account rather than trusting a prior ready RAM profile', async t => {
  const s = await fixture(t, { loadAccount: true, profile: CH, deferReloads: true, props: { freshLogin: true } });
  assert.equal(s.calls.length, 2); assert.equal(s.snapshot.ready, false); assert.equal(s.snapshot.profile, null); assert.deepEqual(s.navigations, []);
  await s.respond(1, null, B); assert.ok(s.container.querySelector('form')); assert.deepEqual(s.navigations, []); assert.equal(s.snapshot.accountKey, B);
});

test('Account replacement clears the previous draft and blocks captured old-account Save both before render and after commit', async t => {
  const s = await fixture(t, { deferGet: true }); await s.respond(0); await s.choose('AT', 'NOE');
  const oldSave = nativeProps(s.container.querySelector('form')).onSubmit;
  let load;
  await React.act(async () => { load = s.store.loadAccountExamProfile({ force: true }); oldSave(event()); });
  assert.equal(s.calls.length, 2, 'Old Save is blocked while current account is loading');
  await React.act(async () => { s.calls[1].resolve(Response.json({ profile: null, accountKey: B })); await load; oldSave(event()); });
  assert.equal(s.calls.length, 2, 'An A draft cannot be PUT to the newly confirmed B before React commits its replacement');
  assert.equal(s.container.querySelector('#exam-welcome-country').value, ''); assert.equal(s.container.querySelector('#exam-welcome-region').value, '');
  await React.act(async () => oldSave(event())); assert.equal(s.calls.length, 2); assert.deepEqual(s.navigations, []);
});

test('A real unmount blocks captured form/reload handlers and late save completion cannot navigate', async t => {
  const s = await fixture(t); await s.choose(); const oldSave = nativeProps(s.container.querySelector('form')).onSubmit;
  const { task } = await s.submit(); await s.unmount(); await React.act(async () => oldSave(event())); assert.equal(s.calls.length, 2);
  await s.respond(1, CH); await task; assert.deepEqual(s.navigations, []); await s.close();
  const second = await fixture(t, { deferGet: true }); await second.respond(0, null, A, 503);
  const reload = nativeProps(second.button('Erneut laden')).onClick; await second.unmount(); reload(); assert.equal(second.calls.length, 1);
});

test('Blocked document transition is not retried by ordinary renders and explicit retries retain origin and unmount guards', async t => {
  const s = await fixture(t, { profile: CH, failNavigation: true, props: { destination: '/konto' } });
  assert.deepEqual(s.navigations, ['/konto']); assert.match(s.container.textContent, /Die nächste Seite konnte nicht geöffnet werden/);
  await s.render(); await s.render(); assert.equal(s.navigations.length, 1);
  const retry = nativeProps(s.button('Erneut weiter')).onClick; s.parent(false); retry(); assert.equal(s.navigations.length, 1); s.parent(true);
  s.failNavigation = false; await React.act(async () => { retry(); retry(); }); assert.equal(s.navigations.length, 2, 'One rendered retry can attempt document navigation only once before React commits');
  await s.unmount(); retry(); assert.equal(s.navigations.length, 2);
});

test('A rendered Reload action cannot duplicate or supersede its already pending retry before the next render', async t => {
  const s = await fixture(t, { deferGet: true }); await s.respond(0, null, A, 503);
  const reload = nativeProps(s.button('Erneut laden')).onClick;
  await React.act(async () => { reload(); reload(); });
  assert.equal(s.calls.length, 2); assert.equal(s.calls[1].options.signal.aborted, false); await s.respond(1);
});

test('Unsafe return destinations remain internal and inline boundary mode never performs document navigation', async t => {
  for (const destination of ['https://evil.invalid', '//evil.invalid', '/\\evil.invalid', '/login?next=/konto', '/%2F%2Fevil.invalid', '/registrieren', '/%5Cevil']) {
    const s = await fixture(t, { profile: CH, props: { destination } }); assert.deepEqual(s.navigations, ['/']); await s.close();
  }
  const s = await fixture(t, { profile: CH, props: { destination: '/lernen', inline: true } }); assert.deepEqual(s.navigations, []); assert.equal(s.container.querySelector('form'), null);
});
