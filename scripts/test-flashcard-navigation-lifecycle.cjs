// Navigation-only isolated doubles. No learner account, local profile or file is read.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const { readFlashcardRoute, flashcardRouteIsReady, flashcardNavigationURL, createFlashcardURLSync } = createLoader()('lib/flashcard-navigation.js');
const categories = [{ id: 'wildkunde' }, { id: 'hundewesen' }];
const base = '/lernen/lernkarten?kategorie=wildkunde&karte=test-reh';
const initial = { category: 'wildkunde', query: '', mode: 'pending', cardId: 'test-reh' };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const tick = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
function routeQuery(href) {
  const params = new URL(href, 'https://jagdlatein.de').searchParams;
  return Object.fromEntries([...new Set(params.keys())].map(key => {
    const values = params.getAll(key); return [key, values.length === 1 ? values[0] : values];
  }));
}
function harness() {
  let desired = { ...initial }, nextTimer = 0;
  const calls = [], commits = [], errors = [], restores = [], timers = new Map();
  const router = { isReady: true, asPath: base, get query() { return routeQuery(this.asPath); } };
  for (const kind of ['push', 'replace']) router[kind] = href => { const task = deferred(); calls.push({ kind, href, task }); return task.promise; };
  const sync = createFlashcardURLSync({ getRouter: () => router, getState: () => desired, getContext: () => ({ categories }), onCommit: href => commits.push(href), onError: (...args) => errors.push(args), onRestore: state => { desired = state; restores.push(state); }, setTimer(fn) { const id = ++nextTimer; timers.set(id, fn); return id; }, clearTimer(id) { timers.delete(id); } });
  return { sync, calls, commits, errors, restores, timers, router,
    desire(next) { desired = { ...desired, ...next }; },
    commit(i) { router.asPath = calls[i].href; sync.route(router.asPath); },
    async accept(i, value = true) { calls[i].task.resolve(value); await tick(); },
  };
}

test('Navigation fields distinguish absent, explicit empty, repeated arrays and contradictory aliases', () => {
  assert.deepEqual(readFlashcardRoute({}, categories), { valid: true, navigation: { category: null, query: '', mode: 'pending', cardId: null } });
  for (const fields of [{ kategorie: '' }, { kategorie: ['wildkunde'] }, { category: [] }, { kategorie: 'wildkunde', category: 'hundewesen' }, { q: ['Reh'] }, { modus: '' }, { modus: 'offen' }, { modus: ['alle'] }, { karte: '' }, { karte: ['test-reh'] }]) assert.equal(readFlashcardRoute(fields, categories).valid, false, JSON.stringify(fields));
  for (const fields of ['kategorie=wildkunde&kategorie=wildkunde', 'q=Reh&q=Reh', 'karte=test-reh&karte=test-reh']) assert.equal(readFlashcardRoute(new URLSearchParams(fields), categories).valid, false, fields);
  assert.equal(readFlashcardRoute({ kategorie: 'wildkunde', category: 'wildkunde', q: '' }, categories).valid, true);
  assert.equal(readFlashcardRoute({ category: 'wildkunde', modus: 'alle' }, categories).navigation.category, 'wildkunde');
});

test('A ready router agrees exactly with its raw category, search, mode and card selection', () => {
  const query = { kategorie: 'wildkunde', karte: 'test-reh' };
  assert.equal(flashcardRouteIsReady({ isReady: false, asPath: base, query }, categories), false);
  assert.equal(flashcardRouteIsReady({ isReady: true, asPath: base, query }, categories), true);
  for (const next of [{ ...query, q: 'Reh' }, { ...query, modus: 'alle' }, { ...query, karte: 'test-gams' }, { ...query, kategorie: 'hundewesen' }]) assert.equal(flashcardRouteIsReady({ isReady: true, asPath: base, query: next }, categories), false);
});

test('Course and lesson props match the URL in both directions before any card may appear', () => {
  const selection = { courseId: 'test-kurs', lessonId: 'test-lektion' }, query = { kurs: 'test-kurs', lektion: 'test-lektion' };
  assert.equal(readFlashcardRoute(query, categories, selection).valid, true);
  assert.equal(readFlashcardRoute(query, categories, null).valid, false);
  assert.equal(readFlashcardRoute({}, categories, selection).valid, false);
  assert.equal(readFlashcardRoute({ ...query, lektion: 'andere-lektion' }, categories, selection).valid, false);
  assert.equal(readFlashcardRoute({ kurs: 'test-kurs' }, categories, { courseId: 'test-kurs', lessonId: '' }).valid, true);
});

test('Serialization cleans legacy selection fields and never copies answers or review data from local state', () => {
  const href = flashcardNavigationURL('/lernen/lernkarten?category=wildkunde&hinweis=behalten#lesestelle', { ...initial, category: 'hundewesen', answer: 'Privat', review: { account: 'Privat' }, notes: 'Privat' }, categories, null);
  const url = new URL(href, 'https://jagdlatein.de');
  assert.equal(url.searchParams.has('category'), false);
  assert.equal(url.searchParams.get('kategorie'), 'hundewesen');
  assert.equal(url.searchParams.get('hinweis'), 'behalten'); assert.equal(url.hash, '#lesestelle');
  assert.doesNotMatch(href, /Privat|answer|review|account|notes/);
});

test('Flush waits for the newest queued actual URL commit, including commit before acceptance', async () => {
  const h = harness();
  try {
    h.desire({ query: 'Reh', cardId: null }); h.sync.schedule(0);
    h.desire({ query: 'Gams', cardId: 'test-gams' }); let settled = false;
    const flushed = h.sync.flush().then(value => { settled = true; return value; });
    h.commit(0); await h.accept(0); assert.equal(h.calls.length, 2); assert.equal(settled, false);
    assert.equal(new URL(h.calls[1].href, 'https://jagdlatein.de').searchParams.get('q'), 'Gams');
    h.commit(1); await tick(); assert.equal(settled, false);
    await h.accept(1); assert.equal(await flushed, true); assert.equal(h.sync.busy(), false);
  } finally { h.sync.dispose(); }
});

test('A queued explicit mode change remains a push after an earlier search failure', async () => {
  const h = harness();
  try {
    h.desire({ query: 'Reh', cardId: null }); h.sync.schedule(0);
    h.desire({ mode: 'all' }); h.sync.schedule(0, 'push');
    await h.accept(0, false);
    assert.equal(h.calls.length, 2); assert.equal(h.calls[1].kind, 'push');
    assert.equal(h.errors[0][1], true, 'the failed request reports its newer queued intent');
    h.commit(1); await h.accept(1); assert.equal(h.sync.busy(), false);
  } finally { h.sync.dispose(); }
});

test('An obsolete successful promise cannot clear or release a newer in-flight category choice', async () => {
  const h = harness();
  try {
    h.desire({ category: 'hundewesen', cardId: null }); h.sync.schedule(0, 'push');
    h.router.asPath = '/lernen/lernkarten?kategorie=wildkunde&karte=test-gams'; h.sync.restore(h.router.asPath);
    h.desire({ category: 'hundewesen', cardId: null }); h.sync.schedule(0, 'push');
    assert.equal(h.calls.length, 2); await h.accept(0);
    assert.equal(h.sync.busy(), true); assert.equal(h.commits.length, 0);
    h.commit(1); await h.accept(1); assert.equal(h.commits.length, 1); assert.equal(h.sync.busy(), false);
  } finally { h.sync.dispose(); }
});

test('An obsolete rejection for the same URL cannot remove the newer request ownership', async () => {
  const h = harness();
  try {
    h.desire({ category: 'hundewesen', cardId: null }); h.sync.schedule(0, 'push');
    h.router.asPath = '/lernen/lernkarten?kategorie=wildkunde&karte=test-gams'; h.sync.restore(h.router.asPath);
    h.desire({ category: 'hundewesen', cardId: null }); h.sync.schedule(0, 'push');
    h.calls[0].task.reject(new Error('obsolete rejection')); await tick();
    h.commit(1); await h.accept(1);
    assert.equal(h.restores.length, 1, 'the current commit is still recognized as owned');
    assert.equal(h.commits.length, 1); assert.equal(h.errors.length, 0); assert.equal(h.sync.busy(), false);
  } finally { h.sync.dispose(); }
});

test('A raw external URL supersedes an earlier committed-but-unaccepted request and its queued writes', async () => {
  const h = harness();
  try {
    h.desire({ category: 'hundewesen', cardId: null }); h.sync.schedule(0, 'push'); h.commit(0);
    h.desire({ query: 'Hund' }); h.sync.schedule(0);
    h.router.asPath = '/lernen/lernkarten?kategorie=wildkunde&karte=test-gams#anderer-kontext';
    await h.accept(0);
    assert.equal(h.calls.length, 1); assert.equal(h.restores.at(-1).cardId, 'test-gams');
    assert.equal(h.sync.busy(), false); assert.equal(h.commits.length, 0);
  } finally { h.sync.dispose(); }
});

test('Disposal cancels a debounced write and resolves an outstanding flush without callbacks or further writes', async () => {
  const h = harness();
  h.desire({ query: 'Reh' }); h.sync.schedule(220); assert.equal(h.timers.size, 1);
  h.sync.dispose(); assert.equal(h.timers.size, 0); assert.equal(h.calls.length, 0);
  h.sync.resume(); h.sync.schedule(0); const flush = h.sync.flush();
  h.sync.dispose(); assert.equal(await flush, false); await h.accept(0);
  assert.equal(h.commits.length, 0); assert.equal(h.errors.length, 0); assert.equal(h.calls.length, 1);
});
