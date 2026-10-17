// Synthetic capacity fixtures are transport tests, never published learning inventory.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const load = createLoader();
const { getFlashcardSnapshot } = load('lib/flashcard-snapshot.js');
const { packFlashcards, unpackFlashcards } = load('lib/flashcard-payload.js');
const { fetchFlashcardDeck } = load('lib/flashcard-fetch.js');
const { readFlashcardPageRequest, validFlashcardManifest, FLASHCARD_PAGE_BYTES } = load('lib/flashcard-paging.js');

function exampleDeck(count, selection) {
  return { version: 1, title: 'Transport-Testbestand', ...(selection ? { selection } : {}),
    categories: [{ id: 'hundewesen', title: 'Hundewesen', count }],
    cards: Array.from({ length: count }, (_, i) => ({ id: `test-only-${i}`, question: `Transport-Testfrage ${i}?`, answer: 'Prüfantwort, kein Lerninhalt.',
      explanation: 'Nur eine synthetische Testdatei.', categoryId: 'hundewesen', categoryTitle: 'Hundewesen', moduleId: 'test-course', lessonId: 'test-lesson',
      courseHref: '/kurse/test-course#lesson-test-lesson', learningHref: '/kurse/test-course#lesson-test-lesson',
      sources: [{ label: 'Erste Prüfquelle', url: 'https://example.org/a' }, { label: i % 2 ? 'Abweichende Quellenbezeichnung' : 'Zweite Prüfquelle', url: 'https://example.net/b' }] })) };
}
function fixture(count = 700, selection) {
  const deck = exampleDeck(count, selection);
  const snapshot = getFlashcardSnapshot(deck);
  const initial = unpackFlashcards(packFlashcards({ ...deck, cards: deck.cards.slice(0, 24), paging: snapshot.manifest }));
  return { deck, snapshot, initial };
}
function responder(snapshot, change = body => body) {
  return async url => {
    const query = new URL(url, 'https://jagdlatein.test').searchParams;
    assert.equal(query.get('revision'), snapshot.manifest.revision);
    const part = Number(query.get('part'));
    return Response.json(change(structuredClone(snapshot.parts[part]), part));
  };
}
function getDeck(initial, fetcher, signal = new AbortController().signal) { return fetchFlashcardDeck(initial, initial.paging.total, { fetcher, signal }); }
const tick = () => new Promise(resolve => setImmediate(resolve));

test('Request parser rejects duplicate, orphan, unbounded and non-canonical part/revision parameters', () => {
  const revision = 'a'.repeat(64);
  assert.equal(readFlashcardPageRequest(new URLSearchParams()), null);
  assert.deepEqual(readFlashcardPageRequest(new URLSearchParams({ part: '0', revision })), { part: 0, revision });
  for (const query of [`part=0`, `revision=${revision}`, `part=0&part=1&revision=${revision}`, `part=0&revision=${revision}&revision=${revision}`,
    ...['-1', '00', '1.1', '1e2', '2048', '99999', '', 'x'].map(part => new URLSearchParams({ part, revision }).toString()),
    ...['', 'a'.repeat(63), 'g'.repeat(64), 'A'.repeat(64)].map(revision => new URLSearchParams({ part: '0', revision }).toString())]) assert.deepEqual(readFlashcardPageRequest(new URLSearchParams(query)), { invalid: true }, query);
});

test('Actual source-preserving content and a synthetic 10,000-card bank round-trip through bounded packages', async () => {
  const actual = load('lib/learning-flashcards.js').getFlashcardExport();
  for (const deck of [actual, exampleDeck(10000)]) {
    const snapshot = getFlashcardSnapshot(deck);
    const initial = unpackFlashcards(packFlashcards({ ...deck, cards: deck.cards.slice(0, 24), paging: snapshot.manifest }));
    assert.ok(validFlashcardManifest(snapshot.manifest, deck.cards.length));
    assert.equal(getFlashcardSnapshot(deck), snapshot, 'unchanged content snapshot is reused');
    assert.ok(snapshot.parts.every(part => Buffer.byteLength(JSON.stringify(part), 'utf8') <= FLASHCARD_PAGE_BYTES));
    assert.ok(Buffer.byteLength(JSON.stringify(packFlashcards(initial)), 'utf8') < 128 * 1024);
    const restored = await getDeck(initial, responder(snapshot));
    assert.deepEqual(restored, deck, 'all text, sources, labels, images and ordering survive');
  }
});

test('Package boundaries adapt to large records and even one oversized record fails before delivery', () => {
  const deck = exampleDeck(600);
  for (const card of deck.cards) card.explanation = 'ä'.repeat(1500);
  const snapshot = getFlashcardSnapshot(deck);
  assert.ok(snapshot.parts.length > 3, 'byte bounds split nominal 256-card chunks');
  assert.ok(snapshot.parts.every(part => Buffer.byteLength(JSON.stringify(part), 'utf8') <= FLASHCARD_PAGE_BYTES));
  assert.equal(snapshot.manifest.sizes.reduce((a, b) => a + b, 0), 600);
  const oversized = exampleDeck(1); oversized.cards[0].answer = 'x'.repeat(FLASHCARD_PAGE_BYTES);
  assert.throws(() => getFlashcardSnapshot(oversized), /Transportlimit/);
});

test('Revision changes for changed answers, labels, category metadata and exact lesson scope', () => {
  const deck = exampleDeck(25), original = getFlashcardSnapshot(deck).manifest.revision;
  for (const edit of [d => d.cards[0].answer += 'neu', d => d.cards[0].sources[0].label += 'neu', d => d.categories[0].title += 'neu', d => d.selection = { courseId: 'test-course', lessonId: 'test-lesson' }]) {
    const changed = structuredClone(deck); edit(changed);
    assert.notEqual(getFlashcardSnapshot(changed).manifest.revision, original);
  }
});

test('Three bounded parallel requests preserve catalog order when packages arrive in reverse order', async () => {
  const { initial, snapshot, deck } = fixture(1500);
  let active = 0, maximum = 0; const pending = [];
  const result = getDeck(initial, (url, options) => new Promise(resolve => {
    active++; maximum = Math.max(maximum, active);
    const part = Number(new URL(url, 'https://example.org').searchParams.get('part'));
    pending.push(() => { active--; resolve(Response.json(snapshot.parts[part])); });
  }));
  await tick(); assert.equal(pending.length, 3);
  while (pending.length) { pending.pop()(); await tick(); }
  assert.equal(maximum, 3);
  assert.deepEqual((await result).cards, deck.cards);
});

test('Every package must match revision, scope, category counts, index, manifest and card count', async () => {
  const scope = { courseId: 'test-course', lessonId: 'test-lesson' };
  const { initial, snapshot } = fixture(700, scope);
  const changes = [body => body.paging.revision = 'b'.repeat(64), body => body.paging.part = 99,
    body => body.paging.sizes.reverse(), body => body.paging.total++, body => body.paging.format = 'unknown',
    body => body.cards.pop(), body => body.selection.lessonId = 'other-lesson', body => delete body.selection,
    body => body.categories[0].count++, body => body.cards[0].a = '', body => body.cards[0].context = 99999];
  for (const change of changes) await assert.rejects(() => getDeck(initial, responder(snapshot, (body, part) => { if (part === 1) change(body); return body; })));
});

test('Cross-package duplicate IDs, foreign lesson cards and seed edits never become a complete bank', async () => {
  const scope = { courseId: 'test-course', lessonId: 'test-lesson' };
  const { initial, snapshot } = fixture(700, scope);
  for (const change of [
    (body, part) => { if (part === 1) body.cards[0].id = snapshot.parts[0].cards[0].id; },
    (body, part) => { if (part === 1) body.contextTable[0].metadata.lessonId = 'other-lesson'; },
    (body, part) => { if (part === 0) body.cards[0].a += ' changed'; },
  ]) await assert.rejects(() => getDeck(initial, responder(snapshot, (body, part) => { change(body, part); return body; })), /unvollständig/);
});

test('Malformed manifests fail without fetching and cancellation aborts all in-flight packages', async () => {
  const { initial, snapshot } = fixture();
  for (const edit of [m => m.sizes = [], m => m.sizes = [0, 700], m => m.sizes[0]++, m => m.revision = 'bad', m => m.total--]) {
    const changed = structuredClone(initial); edit(changed.paging);
    await assert.rejects(() => fetchFlashcardDeck(changed, 700, { signal: new AbortController().signal, fetcher: () => { throw new Error('must not fetch'); } }), /unvollständig/);
  }
  const controller = new AbortController(), signals = [];
  const pending = getDeck(initial, (url, { signal }) => new Promise((resolve, reject) => {
    signals.push(signal); signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })), { once: true });
  }), controller.signal);
  assert.equal(signals.length, 3); controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.ok(signals.every(signal => signal.aborted));
});

test('One failed package aborts its siblings; expired access and deployment changes have actionable errors', async () => {
  const { initial } = fixture();
  for (const [status, message] of [[401, /erneut an/], [403, /aktiver Zugang/], [409, /aktualisiert/], [503, /nicht erreichbar/]]) {
    const signals = [];
    await assert.rejects(() => getDeck(initial, (url, { signal }) => {
      signals.push(signal);
      return signals.length === 2 ? Promise.resolve(Response.json({}, { status })) : new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })), { once: true }));
    }), message);
    assert.ok(signals.every(signal => signal.aborted));
  }
});

test('Private API authorizes before content, enforces revision/index and preserves legacy requests', async () => {
  const { deck, snapshot } = fixture(); let reads = 0;
  const api = account => createLoader({ '../../../../lib/account-access': { getSignedAccountAccess: async () => account },
    '../../../../lib/learning-flashcards': { getFlashcardExport: () => { reads++; return deck; } } })('app/api/lernen/lernkarten/route.js');
  const url = (params = {}) => new Request('https://jagdlatein.test/api/lernen/lernkarten?' + new URLSearchParams(params));
  for (const [account, status] of [[null, 401], [{ paid: false }, 403]]) {
    const before = reads; const response = await api(account).GET(url({ part: '0', revision: snapshot.manifest.revision }));
    assert.equal(response.status, status); assert.equal(reads, before); assert.equal((await response.json()).cards, undefined);
  }
  for (const account of [{ paid: true }, { admin: true }]) {
    const route = api(account);
    for (const [params, status] of [[{ part: '0', revision: snapshot.manifest.revision }, 200], [{ part: '0', revision: 'c'.repeat(64) }, 409], [{ part: '9', revision: snapshot.manifest.revision }, 400], [{ part: '0' }, 400]]) {
      const result = await route.GET(url(params));
      assert.equal(result.status, status); assert.match(result.headers.get('Cache-Control'), /private, no-store/); assert.equal(result.headers.get('Vary'), 'Cookie');
      const body = await result.json();
      if (status === 200) assert.deepEqual(body, snapshot.parts[0]); else assert.equal(body.cards, undefined);
    }
    assert.deepEqual(unpackFlashcards(await (await route.GET(url())).json()), deck);
  }
});

test('Large legacy responses return a refresh message instead of exceeding a platform response limit', async () => {
  const deck = exampleDeck(10000);
  for (const card of deck.cards) card.answer = `Transport ${card.id}: ` + 'x'.repeat(400);
  const route = createLoader({ '../../../../lib/account-access': { getSignedAccountAccess: async () => ({ paid: true }) },
    '../../../../lib/learning-flashcards': { getFlashcardExport: () => deck } })('app/api/lernen/lernkarten/route.js');
  const response = await route.GET(new Request('https://jagdlatein.test/api/lernen/lernkarten'));
  assert.equal(response.status, 409); const body = await response.json();
  assert.match(body.message, /neu/); assert.equal(body.cards, undefined);
});
