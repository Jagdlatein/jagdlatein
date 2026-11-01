// Mandatory route gate and editable plan with real React/account store lifetimes.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { createLoader, root: repo } = require('./helpers/project-module.cjs');
const { fixture, A, B, nativeProps, event, React } = require('./helpers/account-exam-dom.cjs');
const CH = { country: 'CH', region: 'ZH' }, AT = { country: 'AT', region: 'NOE' };
const load = createLoader();
const data = load('lib/exam-study-plan-server.js').getExamStudyPlanData({ asOf: '2026-11-01' });
const content = React.createElement('article', { 'data-test-lesson': true }, 'Synthetic protected learning');

test('Route policy requires explicit targets for learning, keeps account/deletion/billing and the offline backpack accessible', () => {
  const { requiresExamProfile: required } = load('components/ExamProfileBoundary.js');
  for (const route of ['/lernen', '/lernen/videos?suche=gans', '/kurse/wissen-abc#lesson-ziel', '/wildkunde/rehwild', '/hundewesen/hunde', '/jagdrecht/ch?region=ZH', '/quiz-app/run', '/meine-kurse', '/auswertungen', '/ebook', '/protected/ebook', '/glossar', '/online-kurse', '/dashboard']) assert.equal(required(route), true, route);
  for (const route of ['/', '/konto', '/konto?loeschen=1', '/preise', '/login', '/registrieren', '/pruefungsziel', '/lernen/offline-rucksack', '/lernen/offline-rucksack?paket=test#offline', '/api/lernen/offline', '/lernen-test', '/kurse-test']) assert.equal(required(route), false, route);
});

test('Required route is a single loading/choice page, then mounts its learning child only after a matching account-confirmed save', async t => {
  const s = await fixture(t, { component: 'components/ExamProfileBoundary.js', deferGet: true, props: { required: true, children: content } });
  assert.equal(s.container.querySelector('[data-test-lesson]'), null); assert.equal(s.container.querySelectorAll('h1').length, 1); assert.equal(s.calls.length, 1);
  await s.respond(0); assert.equal(s.container.querySelector('[data-test-lesson]'), null); assert.equal(s.container.querySelectorAll('form').length, 1);
  await s.choose('AT', 'NOE'); const { task } = await s.submit(); assert.equal(s.container.querySelector('[data-test-lesson]'), null); assert.equal(s.calls.length, 2);
  await s.respond(1, AT); await task; assert.ok(s.container.querySelector('[data-test-lesson]')); assert.equal(s.container.querySelector('form'), null); assert.deepEqual(s.navigations, []);
  await React.act(async () => s.dom.window.dispatchEvent(new s.dom.window.Event('jagdlatein-account-deleted')));
  assert.equal(s.container.querySelector('[data-test-lesson]'), null); assert.equal(s.snapshot.phase, 'signed-out'); assert.deepEqual(s.reads, []); assert.deepEqual(s.writes, []);
});

test('Non-required pages never issue an account request or read a profile, and changing into learning uses the same single gate', async t => {
  const s = await fixture(t, { component: 'components/ExamProfileBoundary.js', props: { required: false, children: content } });
  assert.ok(s.container.querySelector('[data-test-lesson]')); assert.equal(s.calls.length, 0); assert.deepEqual(s.reads, []);
  await s.render({ required: true }); assert.equal(s.container.querySelector('[data-test-lesson]'), null); assert.equal(s.calls.length, 1);
  await s.render({ required: false }); assert.ok(s.container.querySelector('[data-test-lesson]'));
  await s.unmount(); const before = s.snapshot; s.dom.window.dispatchEvent(new s.dom.window.Event('jagdlatein-account-deleted')); assert.equal(s.snapshot, before, 'Deleted listener is removed at real effect cleanup');
});

test('An account reload immediately closes the gate and stale A results cannot unlock a different B session', async t => {
  const s = await fixture(t, { component: 'components/ExamProfileBoundary.js', deferGet: true, props: { required: true, children: content } });
  await s.respond(0, CH, A); assert.ok(s.container.querySelector('[data-test-lesson]'));
  let oldLoad, newLoad;
  await React.act(async () => { oldLoad = s.store.loadAccountExamProfile({ force: true }); newLoad = s.store.loadAccountExamProfile({ force: true }); });
  assert.equal(s.container.querySelector('[data-test-lesson]'), null); await s.respond(2, null, B); await newLoad;
  await s.respond(1, CH, A); await oldLoad; assert.equal(s.container.querySelector('[data-test-lesson]'), null); assert.equal(s.snapshot.accountKey, B); assert.ok(s.container.querySelector('form'));
});

test('App Router pathname changes use the same gate and the real offline-backpack exception without additional windows', async t => {
  let pathname = '/konto';
  const s = await fixture(t, { component: 'components/AppExamProfileBoundary.js', props: { children: content }, overrides: { 'next/navigation': { usePathname: () => pathname } } });
  assert.ok(s.container.querySelector('[data-test-lesson]')); assert.equal(s.calls.length, 0);
  pathname = '/lernen/videos'; await s.render(); assert.equal(s.container.querySelector('[data-test-lesson]'), null); assert.equal(s.calls.length, 1);
  pathname = '/lernen/offline-rucksack'; await s.render(); assert.ok(s.container.querySelector('[data-test-lesson]')); assert.equal(s.calls.length, 1); assert.deepEqual(s.navigations, []);
});

function planOptions(options = {}) {
  const menu = { opened: [], closed: 0 };
  const PageMenu = ({ children }) => React.createElement('aside', { 'data-test-page-menu': true }, children);
  const progress = { phase: 'ready', summary: { total: { answered: 0, due: 0, mistakes: 0 }, byCategory: {} } };
  return { menu, options: { component: 'components/ExamStudyPlan.js', loadAccount: true, profile: CH, props: { data }, ...options, overrides: {
    './PageMenu': { __esModule: true, default: PageMenu, openPageMenu(id) { menu.opened.push(id); }, closePageMenu() { menu.closed++; } },
    '../lib/use-exam-review-progress': { __esModule: true, default: () => progress }, ...options.overrides,
  } } };
}

test('Plan shows the confirmed region while a new draft is pending and changes law links only after successful account persistence', async t => {
  const config = planOptions(), s = await fixture(t, config.options);
  assert.match(s.container.querySelector('#exam-plan-target').textContent, /Zürich/); assert.equal(s.button('Prüfungsziel entfernen'), undefined);
  await s.select('exam-plan-country', 'AT'); await s.select('exam-plan-region', 'NOE');
  const oldSubmit = nativeProps(s.container.querySelector('form')).onSubmit; let task;
  await React.act(async () => { task = oldSubmit(event()); oldSubmit(event()); });
  assert.equal(s.calls.length, 2); assert.equal(s.calls[1].options.headers['X-Jagdlatein-Exam-Account'], A); assert.match(s.container.querySelector('#exam-plan-target').textContent, /Zürich/);
  assert.equal(config.menu.closed, 0); assert.deepEqual(s.scrolls, []);
  assert.equal([...s.container.querySelectorAll('a')].find(node => node.textContent === 'Recht lesen').getAttribute('href'), '/jagdrecht/ch?region=ZH');
  await s.respond(1, AT); await task;
  assert.match(s.container.querySelector('#exam-plan-target').textContent, /Niederösterreich/); assert.equal([...s.container.querySelectorAll('a')].find(node => node.textContent === 'Recht lesen').getAttribute('href'), '/jagdrecht/at?region=NOE');
  assert.deepEqual(s.navigations, []); assert.deepEqual(s.writes, []); assert.deepEqual(s.reads, []); assert.equal(config.menu.closed, 1);
  assert.equal(s.dom.window.document.activeElement, s.container.querySelector('h1')); assert.ok(s.scrolls.length > 0); assert.ok(s.scrolls.every(value => value.top === 0 && value.left === 0));
});

test('Plan retains its confirmed target and editable draft after failed or timed-out saves', async t => {
  for (const timeout of [false, true]) {
    const config = planOptions(), s = await fixture(t, config.options); await s.select('exam-plan-country', 'AT'); await s.select('exam-plan-region', 'NOE');
    const { task } = await s.submit(); if (timeout) await s.timeout(); else await s.respond(1, null, A, 503); await task;
    assert.deepEqual(s.snapshot.profile, CH); assert.match(s.container.querySelector('#exam-plan-target').textContent, /Zürich/); assert.equal(s.container.querySelector('#exam-plan-region').value, 'NOE');
    assert.match(s.container.textContent, /nicht übernommen/); assert.equal(s.button('Prüfungsziel speichern').disabled, false); assert.deepEqual(s.navigations, []); assert.equal(config.menu.closed, 0); assert.deepEqual(s.scrolls, []); await s.close();
  }
});

test('Plan blocks pre-render account-change saves and actual unmount blocks captured actions and late-save focus', async t => {
  const config = planOptions(), s = await fixture(t, { ...config.options, deferReloads: true }); await s.select('exam-plan-country', 'AT'); await s.select('exam-plan-region', 'NOE');
  const oldSave = nativeProps(s.container.querySelector('form')).onSubmit; let reload;
  await React.act(async () => { reload = s.store.loadAccountExamProfile({ force: true }); oldSave(event()); });
  assert.equal(s.calls.length, 2); await s.respond(1, CH, B); await reload; assert.equal(s.snapshot.accountKey, B);
  await React.act(async () => oldSave(event())); assert.equal(s.calls.length, 2);
  await s.select('exam-plan-country', 'AT'); await s.select('exam-plan-region', 'NOE'); const { task } = await s.submit();
  assert.equal(s.calls[2].options.headers['X-Jagdlatein-Exam-Account'], B);
  const currentSave = nativeProps(s.container.querySelector('form')).onSubmit, closed = config.menu.closed; await s.unmount(); currentSave(event());
  await s.respond(2, AT, B); await task; assert.equal(s.calls.length, 3); assert.equal(config.menu.closed, closed); assert.deepEqual(s.navigations, []);
});

test('An old pending plan save cannot report success, close the menu or focus the replacement account', async t => {
  const config = planOptions(), s = await fixture(t, { ...config.options, deferReloads: true });
  await s.select('exam-plan-country', 'AT'); await s.select('exam-plan-region', 'NOE'); const { task } = await s.submit();
  let reload; await React.act(async () => { reload = s.store.loadAccountExamProfile({ force: true }); });
  assert.equal(s.calls[1].options.signal.aborted, true); await s.respond(2, CH, B); await reload;
  await s.respond(1, AT, A); await task;
  assert.equal(s.snapshot.accountKey, B); assert.deepEqual(s.snapshot.profile, CH); assert.match(s.container.querySelector('#exam-plan-target').textContent, /Zürich/);
  assert.doesNotMatch(s.container.textContent, /Prüfungsziel übernommen\./); assert.equal(config.menu.closed, 0); assert.deepEqual(s.scrolls, []); assert.deepEqual(s.navigations, []);
});

test('Setup page preserves server authentication decisions, normalizes unsafe returns and avoids self-navigation loops', () => {
  let result = { props: {} }; const product = createLoader({ '../lib/account-page': { getAccountPageProps: () => result } });
  const setup = product('pages/pruefungsziel.js'); assert.equal(setup.default.examProfileSetup, true);
  for (const [next, target] of [['/lernen/wildjahr?art=rehwild#oben', '/lernen/wildjahr?art=rehwild#oben'], ['https://evil.invalid', '/'], ['/pruefungsziel?next=/konto#form', '/konto']]) assert.deepEqual(setup.getServerSideProps({ query: { next } }), { props: { destination: target } });
  result = { redirect: { destination: '/login?next=%2Fpruefungsziel', permanent: false } }; assert.equal(setup.getServerSideProps({ query: { next: '/lernen' } }), result);
  const app = fs.readFileSync(path.join(repo, 'pages/_app.js'), 'utf8'), layout = fs.readFileSync(path.join(repo, 'app/layout.jsx'), 'utf8');
  assert.match(app, /ExamProfileBoundary/); assert.match(app, /examProfileSetup/); assert.match(layout, /AppExamProfileBoundary/);
});
