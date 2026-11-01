// Actual React/effects with isolated profile snapshots, URL parameters, fetches
// and session storage. No real account, browser profile, network or DB access.
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react'), { renderToString } = local('react-dom/server');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const BASE = Date.parse('2026-11-01T12:00:00Z'), iso = ms => new Date(BASE + ms).toISOString();

async function fixture({ query = 'topic=Recht', ready = false, profile = null, hydrate = false } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://jagdlatein.test/quiz-app/run' });
  const saved = new Map(), requests = [], navigation = [], writes = [], reads = [], frames = [], listeners = new Set(), storage = new Map(), buttonProps = [];
  let snapshot = { ready, profile }, params = query === null ? null : new URLSearchParams(query), mounted = true;
  const serverSnapshot = { ready: false, profile: null }, container = dom.window.document.getElementById('root');
  const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
  const getSnapshot = () => snapshot, getServerSnapshot = () => serverSnapshot;
  Object.defineProperty(dom.window, 'sessionStorage', { configurable: true, value: {
    getItem(key) { reads.push(key); return storage.get(key) ?? null; },
    setItem(key, value) { writes.push(['set', key, value]); storage.set(key, value); },
    removeItem(key) { writes.push(['remove', key]); storage.delete(key); },
  } });
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true,
    fetch: (url, options = {}) => new Promise(resolve => requests.push({ url, options,
      body: options.body ? JSON.parse(options.body) : null,
      respond(data, status = 200) { resolve({ ok: status >= 200 && status < 300, status, async json() { return data; } }); },
    })) })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const router = { push(href) { navigation.push(href); } };
  const useProfile = () => {
    const value = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    // Observe actual committed DOM before passive effects clear old state.
    React.useLayoutEffect(() => { frames.push({ query: params?.toString(), profile: snapshot.profile, ready: snapshot.ready, text: container.textContent }); });
    return value;
  };
  const runtime = local('react/jsx-runtime');
  const capture = name => (type, props, key) => {
    if (type === 'button') buttonProps.push(props);
    return runtime[name](type, props, key);
  };
  const load = createLoader({
    'react/jsx-runtime': { ...runtime, jsx: capture('jsx'), jsxs: capture('jsxs') },
    'next/navigation': { useRouter: () => router, useSearchParams: () => params },
    'next/link': { __esModule: true, default: ({ children, href, prefetch, ...props }) => React.createElement('a', { ...props, href }, children) },
    '../../../components/AppIcon': { __esModule: true, default: () => null },
    '../../../lib/use-exam-profile': { __esModule: true, default: useProfile },
    '../../../lib/daily-review': { recordReviewAnswer() { throw Error('Unexpected review write in isolated asking test'); } },
  });
  const Component = load('app/quiz-app/run/QuizClient.jsx').default, node = () => React.createElement(Component);
  const { createRoot, hydrateRoot } = local('react-dom/client');
  let root, serverHtml = null;
  if (hydrate) {
    serverHtml = renderToString(node()); assert.equal(requests.length, 0); assert.equal(reads.length, 0);
    container.innerHTML = serverHtml;
    await React.act(async () => { root = hydrateRoot(container, node()); });
  } else { root = createRoot(container); await React.act(async () => root.render(node())); }
  async function respond(request, data, status = 200) { await React.act(async () => { request.respond(data, status); }); }
  return { dom, container, requests, navigation, reads, writes, frames, serverHtml,
    text: () => container.textContent,
    capturedAction(label) {
      const handler = buttonProps.filter(props => props.children === label).at(-1)?.onClick;
      assert.equal(typeof handler, 'function', `No actual JSX callback for ${label}`);
      return handler;
    },
    async profile(value, isReady = true) { await React.act(async () => { snapshot = { ready: isReady, profile: value }; [...listeners].forEach(fn => fn()); }); },
    async route(value) { await React.act(async () => { params = value === null ? null : new URLSearchParams(value); root.render(node()); }); },
    respond,
    async identify(request = requests.at(-1), identity = { username: 'synthetic-player', country: 'DE' }) {
      assert.equal(request.url, '/api/quiz/register'); await respond(request, { success: true, identity }); return requests.at(-1);
    },
    async asking(request = requests.at(-1), overrides = {}) {
      assert.equal(request.url, '/api/quiz/round');
      const body = request.body, country = overrides.country || body.country, topic = overrides.topic || body.topic;
      const round = { roundId: body.requestId, phase: 'asking', country, topic, index: 0, total: 2,
        points: 0, correctAnswers: 0, timedOutAnswers: 0, serverNow: iso(0), deadlineAt: iso(30000), finishedAt: null, feedback: null,
        question: { id: `synthetic-${country}-${topic}`, q: `Isolierte ${country}-Frage`, answers: [{ id: 'a', text: 'Antwort A' }, { id: 'b', text: 'Antwort B' }] }, ...overrides };
      await respond(request, { success: true, round }); return round;
    },
    async dispose() { if (mounted) { mounted = false; await React.act(async () => root.unmount()); } dom.window.close();
      for (const [key, value] of saved) { if (value) Object.defineProperty(globalThis, key, value); else delete globalThis[key]; } },
    async unmount() { if (!mounted) return; mounted = false; await React.act(async () => root.unmount()); },
  };
}

test('SSR/hydration of an implicit law run waits for the ready target and never requests a default DE round first', async () => {
  const f = await fixture({ hydrate: true, profile: { country: 'CH', region: 'ZH' } });
  try {
    assert.match(f.serverHtml, /Prüfungsprofil wird geladen/); assert.equal(f.requests.length, 0); assert.deepEqual(f.reads, []);
    await f.profile({ country: 'CH', region: 'ZH' });
    assert.equal(f.requests.length, 1); const request = await f.identify();
    assert.equal(request.body.country, 'CH'); assert.equal(request.body.topic, 'Recht');
    assert.deepEqual(f.reads, ['jagd_quiz_round:CH:Recht']);
    assert.equal(f.container.querySelector('a').getAttribute('href'), '/quiz-app?country=CH&topic=Recht');
    await f.asking(request); assert.match(f.text(), /Schweiz · Recht/); assert.match(f.text(), /Isolierte CH-Frage/);
    assert.ok(f.requests.every(r => !r.body || r.body.country === 'CH'));
  } finally { await f.dispose(); }
});

test('All valid profile countries become the actual law request and return URL; no quiz-identity country replaces them', async () => {
  for (const [country, region] of [['CH', 'GR'], ['AT', 'T'], ['DE', 'BY']]) {
    const f = await fixture({ ready: true, profile: { country, region } });
    try {
      const request = await f.identify(undefined, { username: 'synthetic', country: country === 'CH' ? 'DE' : 'CH' });
      assert.equal(request.body.country, country);
      assert.equal(f.container.querySelector('a').getAttribute('href'), `/quiz-app?country=${country}&topic=Recht`);
      await f.asking(request); assert.match(f.text(), new RegExp(`Isolierte ${country}-Frage`));
    } finally { await f.dispose(); }
  }
});

test('Every explicit URL country, including empty/invalid or repeated values, retains the existing URL policy over a profile', async () => {
  for (const [raw, expected] of [['country=DE', 'DE'], ['country=at', 'AT'], ['country=', 'DE'], ['country=XX', 'DE'], ['country=AT&country=CH', 'AT']]) {
    const f = await fixture({ query: `${raw}&topic=Recht`, ready: false, profile: { country: 'CH', region: 'ZH' } });
    try {
      assert.equal(f.requests.length, 1, 'Explicit selection needs no implicit target hydration');
      const request = await f.identify(); assert.equal(request.body.country, expected);
      await f.profile({ country: 'CH', region: 'ZH' }); assert.equal(f.requests.length, 2);
      await f.asking(request); assert.match(f.text(), new RegExp(`Isolierte ${expected}-Frage`));
    } finally { await f.dispose(); }
  }
});

test('A missing or malformed ready profile keeps the documented default; null URL parameters wait safely', async () => {
  for (const profile of [null, {}, { country: 'CH', region: 'BY' }, { country: ['CH'], region: 'ZH' }]) {
    const f = await fixture({ ready: false, profile });
    try { assert.equal(f.requests.length, 0); await f.profile(profile); const r = await f.identify(); assert.equal(r.body.country, 'DE'); }
    finally { await f.dispose(); }
  }
  const f = await fixture({ query: null, ready: true, profile: { country: 'AT', region: 'T' } });
  try { assert.equal(f.requests.length, 0); await f.route('topic=Recht'); assert.equal((await f.identify()).body.country, 'AT'); }
  finally { await f.dispose(); }
});

test('Shared biology starts independently of target readiness and keeps a COMMON key and country-free return URL', async () => {
  const f = await fixture({ query: 'topic=Wildkunde&country=AT' });
  try {
    const r = await f.identify(); assert.equal(r.body.country, 'DE'); assert.equal(r.body.topic, 'Wildkunde');
    assert.deepEqual(f.reads, ['jagd_quiz_round:COMMON:Wildkunde']);
    assert.equal(f.container.querySelector('a').getAttribute('href'), '/quiz-app?topic=Wildkunde');
    await f.asking(r);
    await f.profile({ country: 'CH', region: 'ZH' }); await f.profile({ country: 'AT', region: 'T' });
    assert.equal(f.requests.length, 2); assert.match(f.text(), /Isolierte DE-Frage/);
  } finally { await f.dispose(); }
});

test('A loaded explicit DE question disappears before passive effects when History restores a bare run with a CH target', async () => {
  const f = await fixture({ query: 'country=DE&topic=Recht', ready: true, profile: { country: 'CH', region: 'ZH' } });
  try {
    await f.asking(await f.identify()); assert.match(f.text(), /Isolierte DE-Frage/);
    await f.route('topic=Recht'); assert.doesNotMatch(f.text(), /Isolierte DE-Frage/);
    assert.ok(f.frames.filter(x => x.query === 'topic=Recht').every(x => !/Isolierte DE-Frage/.test(x.text)), 'No old question in committed DOM before cancellation effects');
    const r = await f.identify(); assert.equal(r.body.country, 'CH'); await f.asking(r); assert.match(f.text(), /Isolierte CH-Frage/);
    await f.route('country=DE&topic=Recht'); const again = await f.identify(); assert.equal(again.body.country, 'DE');
  } finally { await f.dispose(); }
});

test('A superseded profile response cannot publish another jurisdiction, and a region-only target change keeps the same country round', async () => {
  const f = await fixture({ ready: true, profile: { country: 'CH', region: 'ZH' } });
  try {
    const old = await f.identify(); await f.profile({ country: 'AT', region: 'T' });
    assert.equal(old.options.signal.aborted, true); await f.asking(old); assert.doesNotMatch(f.text(), /Isolierte CH-Frage/);
    const r = await f.identify(); assert.equal(r.body.country, 'AT'); await f.asking(r);
    const count = f.requests.length; await f.profile({ country: 'AT', region: 'W' });
    assert.equal(f.requests.length, count); assert.match(f.text(), /Isolierte AT-Frage/);
    await f.profile(null, false); assert.doesNotMatch(f.text(), /Isolierte AT-Frage/); assert.match(f.text(), /Prüfungsprofil wird geladen/);
    assert.equal(f.requests.length, count);
  } finally { await f.dispose(); }
});

test('A valid-shaped response for the wrong country/topic is rejected despite matching round ID', async () => {
  for (const override of [{ country: 'DE' }, { topic: 'Wildkunde' }]) {
    const f = await fixture({ ready: true, profile: { country: 'CH', region: 'ZH' } });
    try { const r = await f.identify(); await f.asking(r, override); assert.doesNotMatch(f.text(), /Isolierte .*Frage/); assert.match(f.text(), /Quizrunde konnte gerade nicht geladen/); }
    finally { await f.dispose(); }
  }
});

test('A missing quiz identity redirects using the chosen target; unmount ignores a late identity without creating a round', async () => {
  const f = await fixture({ ready: true, profile: { country: 'AT', region: 'T' } });
  try { await f.identify(undefined, null); assert.deepEqual(f.navigation, ['/quiz-app/username?country=AT&topic=Recht']); }
  finally { await f.dispose(); }
  const g = await fixture({ ready: true, profile: { country: 'CH', region: 'ZH' } });
  try { const r = g.requests[0]; await g.unmount(); assert.equal(r.options.signal.aborted, true); await g.identify(r); assert.equal(g.requests.length, 1); }
  finally { await g.dispose(); }
});

const mutationSnapshot = f => ({ requests: f.requests.length, reads: f.reads.length,
  writes: f.writes.length, navigation: f.navigation.length, committedFrames: f.frames.length });
async function blockedActions(f, handlers, context) {
  const before = mutationSnapshot(f), text = f.text();
  for (const handler of handlers) await React.act(async () => handler());
  assert.deepEqual(mutationSnapshot(f), before, `${context}: no request, storage mutation, navigation or reload render`);
  assert.equal(f.text(), text, `${context}: retain the committed current view`);
}
async function failedStartActions(f) {
  const request = await f.identify();
  await f.respond(request, { success: false, error: 'Synthetic request failure' }, 409);
  return [f.capturedAction('Erneut versuchen'), f.capturedAction('Neue Runde starten')];
}

test('Retained retry/restart actions stop after a profile A-B-A switch and actual unmount', async () => {
  const f = await fixture({ ready: true, profile: { country: 'CH', region: 'ZH' } });
  try {
    const old = await failedStartActions(f);
    await f.profile({ country: 'AT', region: 'T' }); await f.asking(await f.identify());
    assert.match(f.text(), /Isolierte AT-Frage/);
    await blockedActions(f, old, 'Old CH actions while AT is committed');
    await f.profile({ country: 'CH', region: 'ZH' }); await f.asking(await f.identify());
    assert.match(f.text(), /Isolierte CH-Frage/);
    await blockedActions(f, old, 'The same country code does not revive an older CH selection');

    await React.act(async () => f.container.querySelector('button').click());
    const answer = f.requests.at(-1); assert.equal(answer.url, '/api/quiz/round/answer');
    await f.respond(answer, { success: false, error: 'Synthetic answer failure' }, 409);
    const current = [f.capturedAction('Erneut versuchen'), f.capturedAction('Neue Runde starten')];
    await f.unmount();
    await blockedActions(f, current, 'Current selection actions after actual unmount');
    await blockedActions(f, old, 'Old selection actions after actual unmount');
  } finally { await f.dispose(); }
});

test('Retained retry/restart actions stop after explicit History A-B-A even when the URL country returns', async () => {
  const f = await fixture({ query: 'country=DE&topic=Recht', ready: true, profile: { country: 'CH', region: 'ZH' } });
  try {
    const old = await failedStartActions(f);
    await f.route('country=AT&topic=Recht'); await f.asking(await f.identify());
    assert.match(f.text(), /Isolierte AT-Frage/);
    await blockedActions(f, old, 'Old DE actions after History changes to AT');
    await f.route('country=DE&topic=Recht'); await f.asking(await f.identify());
    assert.match(f.text(), /Isolierte DE-Frage/);
    await blockedActions(f, old, 'Old DE actions after History returns to the same country');
  } finally { await f.dispose(); }
});
