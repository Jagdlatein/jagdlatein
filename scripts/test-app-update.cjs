const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const { createAppUpdateCheck, validReleaseId } = createLoader()('lib/app-update.js');
const current = 'dpl_CurrentRelease1234', newer = 'dpl_NewerRelease5678';
function fixture(fetcher) {
  let time = 100000; const changes = [], calls = [], timers = new Map(); let timer = 0;
  const checker = createAppUpdateCheck({ currentRelease: current, now: () => time,
    onChange: value => changes.push(value), fetcher: (...args) => { calls.push(args); return fetcher(...args); },
    setTimer: fn => { timers.set(++timer, fn); return timer; }, clearTimer: id => timers.delete(id) });
  return { checker, changes, calls, timers, advance(value = 60001) { time += value; } };
}
const response = releaseId => ({ ok: true, redirected: false, json: async () => ({ releaseId }) });

test('Release comparison is read-only, same-origin, cookie-free and bounded across repeated focus/menu events', async () => {
  const f = fixture(async () => response(current));
  await f.checker.check(); await f.checker.check();
  assert.deepEqual(f.changes, ['current']); assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0][0], '/api/app-version');
  assert.equal(f.calls[0][1].cache, 'no-store'); assert.equal(f.calls[0][1].credentials, 'omit');
  assert.equal(f.calls[0][1].method, undefined); assert.equal(f.calls[0][1].body, undefined);
  assert.equal(f.timers.size, 0);
  f.advance(); await f.checker.check(); assert.equal(f.calls.length, 2);
  f.advance(-120002); await f.checker.check(); assert.equal(f.calls.length, 3, 'A corrected device clock must not block future checks');
  f.checker.dispose(); f.advance(); await f.checker.check(); assert.equal(f.calls.length, 3);
});

test('An updated release is reported without a reload and stays available if a later network check fails', async () => {
  let fail = false;
  const f = fixture(async () => { if (fail) throw new Error('offline'); return response(newer); });
  await f.checker.check(); assert.deepEqual(f.changes, ['update']);
  fail = true; f.advance(); await f.checker.check(); assert.deepEqual(f.changes, ['update']);
  f.checker.dispose();
});

test('Redirects, malformed metadata, unavailable builds and offline errors never assert that this view is current', async () => {
  for (const fetcher of [async () => ({ ...response(current), redirected: true }), async () => ({ ...response(current), ok: false }), async () => response('secret-or-unavailable'), async () => { throw new Error('offline'); }]) {
    const f = fixture(fetcher); await f.checker.check(); assert.deepEqual(f.changes, ['unavailable']); f.checker.dispose();
  }
  const changes = [];
  const checker = createAppUpdateCheck({ currentRelease: '', fetcher: async () => response(current), onChange: state => changes.push(state) });
  await checker.check(); assert.deepEqual(changes, ['unavailable']); checker.dispose();
  assert.equal(validReleaseId('a'.repeat(40)), true); assert.equal(validReleaseId(current), true);
  assert.equal(validReleaseId('dpl_../other'), false); assert.equal(validReleaseId(null), false);
});

test('A timeout and unmount abort the request; late responses cannot update the departed view', async () => {
  let finish;
  const f = fixture(() => new Promise(resolve => { finish = resolve; }));
  const pending = f.checker.check(); await f.checker.check(); assert.equal(f.calls.length, 1);
  [...f.timers.values()][0](); assert.deepEqual(f.changes, ['unavailable']);
  assert.equal(f.calls[0][1].signal.aborted, true);
  f.checker.dispose(); finish(response(newer)); await pending;
  assert.deepEqual(f.changes, ['unavailable']); assert.equal(f.timers.size, 0);
});

test('The public version endpoint returns only a validated release identifier and never caches or discloses other environment values', async () => {
  const old = process.env.NEXT_PUBLIC_JL_RELEASE_ID;
  try {
    process.env.NEXT_PUBLIC_JL_RELEASE_ID = current;
    const { GET } = createLoader()('app/api/app-version/route.js');
    const result = GET(); assert.equal(result.status, 200); assert.deepEqual(await result.json(), { releaseId: current });
    for (const name of ['Cache-Control', 'CDN-Cache-Control', 'Vercel-CDN-Cache-Control']) assert.match(result.headers.get(name), /no-store/);
    process.env.NEXT_PUBLIC_JL_RELEASE_ID = 'not-a-release';
    const unavailable = GET(); assert.equal(unavailable.status, 503); assert.doesNotMatch(JSON.stringify(await unavailable.json()), /not-a-release/);
  } finally { if (old === undefined) delete process.env.NEXT_PUBLIC_JL_RELEASE_ID; else process.env.NEXT_PUBLIC_JL_RELEASE_ID = old; }
});

test('Build configuration exposes only the chosen public deployment ID, with a safe git fallback and no fabricated current version', () => {
  const keys = ['VERCEL_DEPLOYMENT_ID', 'VERCEL_GIT_COMMIT_SHA'];
  const old = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const file = require.resolve(root + '/next.config.js');
  function configured() { delete require.cache[file]; return require(file).env; }
  try {
    process.env.VERCEL_DEPLOYMENT_ID = current; process.env.VERCEL_GIT_COMMIT_SHA = 'a'.repeat(40);
    assert.deepEqual(configured(), { NEXT_PUBLIC_JL_RELEASE_ID: current });
    process.env.VERCEL_DEPLOYMENT_ID = 'unavailable'; assert.deepEqual(configured(), { NEXT_PUBLIC_JL_RELEASE_ID: 'a'.repeat(40) });
    delete process.env.VERCEL_GIT_COMMIT_SHA; assert.deepEqual(configured(), { NEXT_PUBLIC_JL_RELEASE_ID: '' });
  } finally { for (const key of keys) { if (old[key] === undefined) delete process.env[key]; else process.env[key] = old[key]; } delete require.cache[file]; }
});

test('Update status stays inside the lower menu and a reload occurs only after the explicit user action; observers clean up', () => {
  const oldWindow = global.window, oldDocument = global.document;
  const windowEvents = new Map(), documentEvents = new Map(), menuEvents = new Map();
  let checks = 0, disposed = 0, reloads = 0; const effects = [], ref = { current: null };
  const menu = { open: false, addEventListener: (name, fn) => menuEvents.set(name, fn), removeEventListener: name => menuEvents.delete(name) };
  global.window = { addEventListener: (name, fn) => windowEvents.set(name, fn), removeEventListener: name => windowEvents.delete(name), location: { reload() { reloads++; } } };
  global.document = { visibilityState: 'visible', addEventListener: (name, fn) => documentEvents.set(name, fn), removeEventListener: name => documentEvents.delete(name) };
  const Component = createLoader({ react: { ...React, useState: () => ['update', () => {}], useRef: () => ref, useEffect: fn => effects.push(fn) }, '../lib/app-update': { createAppUpdateCheck: () => ({ check() { checks++; }, dispose() { disposed++; } }) } })('components/AppUpdateStatus.js').default;
  try {
    const tree = Component(); ref.current = { closest: selector => selector === 'details' ? menu : null };
    assert.equal(tree.type, 'section'); assert.equal(tree.props['aria-label'], 'Stand der Website');
    const cleanup = effects[0](); assert.equal(checks, 1); assert.equal(reloads, 0);
    windowEvents.get('focus')(); assert.equal(checks, 2);
    global.document.visibilityState = 'hidden'; documentEvents.get('visibilitychange')(); assert.equal(checks, 2);
    global.document.visibilityState = 'visible'; menu.open = true; menuEvents.get('toggle')(); assert.equal(checks, 3);
    const button = React.Children.toArray(tree.props.children).find(node => node.type === 'button');
    assert.equal(button.props.children, 'Neue Version laden'); button.props.onClick(); assert.equal(reloads, 1);
    cleanup(); assert.equal(disposed, 1); assert.equal(windowEvents.size + documentEvents.size + menuEvents.size, 0);
    const html = renderToStaticMarkup(React.createElement(createLoader()('components/AppUpdateStatus.js').default));
    assert.match(html, /Seite neu laden/); assert.doesNotMatch(html, /Diese Website-Version ist aktuell/);
    const offline = renderToStaticMarkup(React.createElement(createLoader()('components/AppUpdateStatus.js').default, { offline: true }));
    assert.match(offline, /Offline-Kurse behalten ihren Downloadstand/);
  } finally { global.window = oldWindow; global.document = oldDocument; }
});

test('Help describes the actual lower-menu update and community controls instead of retired upper options', () => {
  const Help = createLoader({ 'next/head': { __esModule: true, default: ({ children }) => children }, 'next/link': { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) } })('pages/hilfe.js').default;
  const html = renderToStaticMarkup(React.createElement(Help));
  for (const text of ['Neue Version laden', 'Seite neu laden', 'Auswahl neu herunterladen', 'Community durchsuchen', 'Community auswählen']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /Weitere Optionen|Themen eingrenzen/);
  assert.match(html, /id="aktualisieren"/);
});
