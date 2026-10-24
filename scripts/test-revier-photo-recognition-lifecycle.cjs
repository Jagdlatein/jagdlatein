// Independent callback/lifetime regressions. All photos, fetches and crypto are
// isolated doubles; these tests never contact a service or read browser data.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const LABEL = 'Foto mit OpenAI erkennen';
const RETRY = 'Verfügbarkeit erneut prüfen';
const json = (status, value) => ({ status, ok: status >= 200 && status < 300, json: async () => value });
const ready = () => json(200, { available: true, configured: true, dailyLimit: 5 });
const photo = name => new Blob([name], { type: 'image/jpeg' });
const success = title => json(200, { ok: true, result: { status: 'suggestion', title, answer: 'Vorhandener Lerntext', category: { title: 'Wildkunde', href: '/lernen/wildkunde' }, candidate: null, notice: 'Bildvorschlag' } });
const settle = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function words(node) {
  if (Array.isArray(node)) return node.map(words).join(' ');
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'object' && typeof node.type === 'function') return words(node.type(node.props));
  return typeof node === 'object' ? words(node.props?.children) : String(node);
}
function all(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => all(child, predicate));
  if (!node || typeof node !== 'object') return [];
  if (typeof node.type === 'function') return all(node.type(node.props), predicate);
  return [...(predicate(node) ? [node] : []), ...all(node.props?.children, predicate)];
}
function hookEngine() {
  const slots = [];
  let cursor = 0, pending = [], mounted = true, writes = 0;
  const hooks = { ...React,
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, value => {
        assert.ok(mounted, 'No state write after real effect cleanup/unmount');
        writes++;
        slots[index].value = typeof value === 'function' ? value(slots[index].value) : value;
      }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: { current: initial } };
      return slots[index].value;
    },
    useEffect(setup, dependencies) {
      const index = cursor++, previous = slots[index];
      if (!previous || dependencies.some((value, position) => !Object.is(value, previous.dependencies[position]))) {
        const slot = previous || {};
        slot.dependencies = dependencies;
        slots[index] = slot;
        pending.push(() => { slot.cleanup?.(); slot.cleanup = setup(); });
      }
    },
  };
  return {
    hooks,
    render(fn) { assert.ok(mounted); cursor = 0; return fn(); },
    commit() { const effects = pending; pending = []; effects.forEach(effect => effect()); },
    unmount() { if (!mounted) return; mounted = false; pending = []; slots.forEach(slot => slot?.cleanup?.()); },
    get writes() { return writes; },
  };
}
function fixture(network = () => ready()) {
  const e = hookEngine(), calls = [], timers = new Map();
  const globals = ['fetch', 'crypto', 'setTimeout', 'clearTimeout'];
  const previous = new Map(globals.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  let timerId = 0, draws = 0, selectedPhoto = photo('A'), tree;
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: { randomUUID() { draws++; return `10000000-0000-4000-8000-${String(draws).padStart(12, '0')}`; } } });
  Object.defineProperty(globalThis, 'setTimeout', { configurable: true, value(fn, delay) { const id = ++timerId; timers.set(id, { fn, delay }); return id; } });
  Object.defineProperty(globalThis, 'clearTimeout', { configurable: true, value(id) { timers.delete(id); } });
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value(url, options = {}) { const call = { url, options }; calls.push(call); return Promise.resolve(network(call, calls.length - 1)); } });
  const Component = createLoader({ react: e.hooks, 'next/link': ({ children, ...props }) => React.createElement('a', props, children) })('components/RevierPhotoRecognition.js').default;
  const f = {
    e, calls, timers,
    get photo() { return selectedPhoto; }, get draws() { return draws; },
    render() { tree = e.render(() => Component({ photo: selectedPhoto })); return tree; },
    commit() { e.commit(); this.render(); },
    async settled() { await settle(); this.render(); this.commit(); },
    change(value, commit = true) { selectedPhoto = value; this.render(); if (commit) this.commit(); },
    nodes(predicate) { return all(tree, predicate); },
    button(label = LABEL) { const value = this.nodes(node => node.type === 'button' && words(node).trim() === label)[0]; assert.ok(value, label); return value; },
    get text() { return words(this.nodes(node => node.type === 'section')[0]); },
    posts() { return calls.filter(call => call.options.method === 'POST'); },
    get gets() { return calls.filter(call => call.options.method !== 'POST'); },
    cleanup() { e.unmount(); for (const name of globals) { const descriptor = previous.get(name); if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; } },
  };
  f.render(); f.commit();
  return f;
}

test('A retained ready action cannot draw an ID, send a photo or write state after unmount', async () => {
  const f = fixture();
  try {
    await f.settled(); const old = f.button().props.onClick; const writes = f.e.writes;
    f.e.unmount(); await old();
    assert.equal(f.draws, 0); assert.equal(f.posts().length, 0); assert.equal(f.e.writes, writes);
  } finally { f.cleanup(); }
});

test('A retained A action cannot upload A while a ready B photo is displayed', async () => {
  const f = fixture(call => call.options.method === 'POST' ? success('Current B') : ready());
  try {
    await f.settled(); const old = f.button().props.onClick;
    f.change(photo('B')); await f.settled(); const writes = f.e.writes;
    await old(); f.render();
    assert.equal(f.draws, 0); assert.equal(f.posts().length, 0); assert.equal(f.e.writes, writes);
    assert.ok(f.button());
    await f.button().props.onClick(); f.render();
    assert.equal(f.posts().length, 1); assert.equal(f.posts()[0].options.body, f.photo);
    assert.match(f.text, /Current B/);
  } finally { f.cleanup(); }
});

test('A -> B -> the same A blob creates a new scope even before effect cleanup', async () => {
  const f = fixture();
  try {
    await f.settled(); const firstA = f.photo, old = f.button().props.onClick;
    f.change(photo('B'), false); f.change(firstA, false);
    const writes = f.e.writes; await old();
    assert.equal(f.posts().length, 0); assert.equal(f.draws, 0); assert.equal(f.e.writes, writes);
    assert.match(f.text, /Bilderkennung wird vorbereitet/);
    f.commit(); await f.settled(); assert.ok(f.button());
  } finally { f.cleanup(); }
});

test('An old error retry cannot start another attempt or erase a successful result for the same photo', async () => {
  let attempt = 0;
  const f = fixture(call => call.options.method !== 'POST' ? ready() : ++attempt === 1 ? json(503, {}) : success('Completed result'));
  try {
    await f.settled(); await f.button().props.onClick(); f.render();
    const retry = f.button().props.onClick;
    await retry(); f.render(); assert.match(f.text, /Completed result/);
    const writes = f.e.writes; await retry(); f.render();
    assert.equal(f.posts().length, 2); assert.equal(f.draws, 2); assert.equal(f.e.writes, writes);
    assert.match(f.text, /Completed result/);
  } finally { f.cleanup(); }
});

test('An exhausted limit can be checked again using only GET, and a double check is ignored', async () => {
  let checks = 0;
  const f = fixture(() => ++checks === 1 ? json(429, { code: 'photo_daily_limit' }) : ready());
  try {
    await f.settled(); const old = f.button(RETRY).props.onClick;
    old(); old(); f.render(); f.commit(); await f.settled();
    assert.equal(f.gets.length, 2); assert.equal(f.posts().length, 0); assert.equal(f.draws, 0);
    assert.ok(f.button());
  } finally { f.cleanup(); }
});

test('A stale availability action cannot erase a later report or request another check', async () => {
  let checks = 0;
  const f = fixture(call => call.options.method === 'POST' ? success('Preserved report') : ++checks === 1 ? json(503, {}) : ready());
  try {
    await f.settled(); const old = f.button(RETRY).props.onClick;
    old(); f.render(); f.commit(); await f.settled();
    await f.button().props.onClick(); f.render(); const writes = f.e.writes;
    old(); f.render();
    assert.equal(f.gets.length, 2); assert.equal(f.posts().length, 1); assert.equal(f.e.writes, writes);
    assert.match(f.text, /Preserved report/);
  } finally { f.cleanup(); }
});

test('Availability and error retry handlers are blocked after unmount and after a photo switch before effects', async () => {
  for (const mode of ['unavailable', 'error']) for (const transition of ['unmount', 'photo-before-effect']) {
    const f = fixture(call => mode === 'unavailable' || call.options.method === 'POST' ? json(503, {}) : ready());
    try {
      await f.settled();
      if (mode === 'error') { await f.button().props.onClick(); f.render(); }
      const old = f.button(mode === 'unavailable' ? RETRY : LABEL).props.onClick;
      if (transition === 'unmount') f.e.unmount(); else f.change(photo('replacement'), false);
      const before = { calls: f.calls.length, draws: f.draws, writes: f.e.writes };
      await old();
      assert.deepEqual({ calls: f.calls.length, draws: f.draws, writes: f.e.writes }, before, `${mode}/${transition}`);
    } finally { f.cleanup(); }
  }
});

test('Superseded POST completion cannot clear the newer busy state or expose its old result', async () => {
  const first = deferred(), second = deferred(); let posts = 0;
  const f = fixture(call => call.options.method !== 'POST' ? ready() : ++posts === 1 ? first.promise : second.promise);
  try {
    await f.settled(); const oldJob = f.button().props.onClick(); f.render();
    f.change(photo('B')); await f.settled(); const current = f.button().props.onClick;
    const job = current(); f.render();
    first.resolve(success('Obsolete A')); await oldJob; f.render();
    assert.match(f.text, /Dein Foto wird ausgewertet/); assert.doesNotMatch(f.text, /Obsolete A/);
    await current(); assert.equal(f.posts().length, 2);
    second.resolve(success('Current B')); await job; f.render(); assert.match(f.text, /Current B/);
  } finally { f.cleanup(); }
});

test('Only allowlisted service-limit/configuration codes get fixed guidance and a GET check', async () => {
  for (const code of ['photo_recognition_provider_capacity', 'photo_recognition_provider_configuration']) {
    const f = fixture(call => call.options.method === 'POST' ? json(503, { code, message: 'PRIVATE UPSTREAM DETAIL' }) : ready());
    try {
      await f.settled(); await f.button().props.onClick(); f.render();
      assert.equal(f.nodes(node => node.type === 'button' && words(node).trim() === LABEL).length, 0);
      assert.ok(f.button(RETRY)); assert.doesNotMatch(f.text, /PRIVATE|persönliches Tageslimit ist erreicht|Zugang ansehen/);
      assert.match(f.text, code.endsWith('capacity') ? /Limit des Erkennungsdienstes/ : /Einrichtung gerade nicht starten/);
      assert.match(f.text, /anderes Foto behebt/);
      f.button(RETRY).props.onClick(); f.render(); f.commit(); await f.settled();
      assert.equal(f.posts().length, 1); assert.equal(f.gets.length, 2);
    } finally { f.cleanup(); }
  }
});

test('An allowlisted service problem reported by GET is rechecked without transmitting the photo', async () => {
  for (const code of ['photo_recognition_provider_capacity', 'photo_recognition_provider_configuration']) {
    let checks = 0;
    const f = fixture(() => ++checks === 1 ? json(503, { code, message: 'PRIVATE STATUS DETAIL' }) : ready());
    try {
      await f.settled(); assert.ok(f.button(RETRY));
      assert.doesNotMatch(f.text, /PRIVATE|Zugang ansehen/);
      assert.equal(f.nodes(node => node.type === 'button' && words(node).trim() === LABEL).length, 0);
      f.button(RETRY).props.onClick(); f.render(); f.commit(); await f.settled();
      assert.equal(f.gets.length, 2); assert.equal(f.posts().length, 0); assert.equal(f.draws, 0);
      assert.ok(f.button());
    } finally { f.cleanup(); }
  }
});

test('A completed report displays the exact server-mapped learning links without another request or saved classification', async () => {
  const links = [
    { id: 'venison-cuts', title: 'Teilstücke vergleichen', href: '/lernen/wildbret-stuecke' },
    { id: 'venison-hygiene', title: 'Hygienefälle üben', href: '/lernen/wildbret-fallwerkstatt' },
  ];
  const f = fixture(call => call.options.method !== 'POST' ? ready() : json(200, { ok: true, result: {
    status: 'suggestion', title: 'Bildvorschlag: Fleisch / Wildbret', answer: 'Vorhandene Lernangebote zum Vergleich',
    candidate: null, category: { title: 'Wildbret & Gesundheit', href: '/lernen/wildbret-gesundheit' }, readingLinks: links,
    observations: [], notice: 'Bildvorschlag',
  } }));
  try {
    await f.settled(); assert.equal(f.posts().length, 0);
    await f.button().props.onClick(); f.render();
    const rendered = f.nodes(node => node.type === 'a').map(node => ({ href: node.props.href, title: words(node).replace(/\s+/g, ' ').trim() }));
    for (const link of links) assert.ok(rendered.some(node => node.href === link.href && node.title === `${link.title} →`));
    assert.match(f.text, /Passender Lernbereich:.*Wildbret & Gesundheit/);
    assert.match(f.text, /nicht automatisch als eigene Einordnung/);
    assert.equal(f.posts().length, 1); assert.equal(f.gets.length, 1);
  } finally { f.cleanup(); }
});

test('Untrusted codes or server messages cannot become service guidance or override quota handling', async () => {
  for (const [status, code] of [[503, '__proto__'], [503, 'constructor'], [503, 'invented'], [429, 'photo_recognition_provider_capacity']]) {
    const f = fixture(call => call.options.method === 'POST' ? json(status, { code, message: 'PRIVATE UNTRUSTED MESSAGE' }) : ready());
    try {
      await f.settled(); await f.button().props.onClick(); f.render();
      assert.doesNotMatch(f.text, /PRIVATE|Limit des Erkennungsdienstes|Einrichtung gerade nicht starten/);
      if (status === 429) { assert.match(f.text, /Erkennungslimit ist erreicht/); assert.ok(f.button(RETRY)); }
      else { assert.match(f.text, /konnte gerade nicht ausgewertet/); assert.ok(f.button()); }
    } finally { f.cleanup(); }
  }
});

test('A temporary provider rate limit remains distinct and never triggers an automatic second POST', async () => {
  const f = fixture(call => call.options.method === 'POST' ? json(503, { code: 'photo_recognition_rate_limited', message: 'PRIVATE LIMIT DETAIL' }) : ready());
  try {
    await f.settled(); await f.button().props.onClick(); f.render(); await f.settled();
    assert.match(f.text, /gerade ausgelastet/); assert.doesNotMatch(f.text, /PRIVATE|Dienstlimit prüfen/);
    assert.ok(f.button()); assert.equal(f.posts().length, 1);
    assert.equal(f.posts()[0].options.headers['X-Jagdlatein-Photo-Consent'], 'openai-v1');
    assert.equal(f.posts()[0].options.body, f.photo);
  } finally { f.cleanup(); }
});
