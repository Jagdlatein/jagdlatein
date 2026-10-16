const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
function load(relative, cache = new Map()) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
  const mod = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  new Function('require', 'module', 'exports', code)(id => id.endsWith('.module.css') ? { __esModule: true, default: {} } : id.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')), cache) : pr(id), mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}

test('Packed real deck restores every card, label, image, editorial date and source exactly', () => {
  const actual = load('lib/learning-flashcards.js').getFlashcardExport();
  const { packFlashcards, unpackFlashcards } = load('lib/flashcard-payload.js');
  const untouched = JSON.stringify(actual);
  const packed = packFlashcards(actual);
  const restored = unpackFlashcards(JSON.parse(JSON.stringify(packed)));
  assert.deepEqual(restored, actual);
  assert.equal(JSON.stringify(actual), untouched);
  assert.equal(new Set(packed.sourceTable.map(source => source.url)).size, packed.sourceTable.length);
  assert.ok(packed.contextTable.length < actual.cards.length);
  for (const card of packed.cards) {
    assert.equal(typeof card.context, 'number');
    assert.equal(card.sources, undefined);
    assert.equal(card.moduleTitle, undefined);
    assert.equal(card.reviewedOn, undefined);
  }
});

test('Both page props stay below 128 KB and materially smaller than duplicate-rich input', () => {
  const actual = load('lib/learning-flashcards.js').getFlashcardExport();
  const { packFlashcards } = load('lib/flashcard-payload.js');
  const rawBytes = Buffer.byteLength(JSON.stringify({ cards: actual.cards, categories: actual.categories }));
  const packedBytes = Buffer.byteLength(JSON.stringify({ deck: packFlashcards(actual) }));
  assert.ok(packedBytes <= 128 * 1024, `${packedBytes} bytes`);
  assert.ok(packedBytes < rawBytes * 0.75, `${rawBytes} → ${packedBytes} bytes`);
  console.log(`Lernkarten-Daten: ${rawBytes} → ${packedBytes} Bytes (${Math.round((1 - packedBytes / rawBytes) * 100)} % weniger)`);
  for (const file of ['pages/lernen/lernkarten.js', 'pages/lernen/lernkarten-drucken.js']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(source, /props:\s*\{\s*deck:\s*packFlashcards\(getFlashcardExport\(\)\)/);
    assert.match(source, /unpackFlashcards\(deck\)/);
  }
  const pure = fs.readFileSync(path.join(root, 'lib/flashcard-payload.js'), 'utf8');
  assert.doesNotMatch(pure, /\bimport\s/);
});

test('Shared source URLs keep context-specific labels and distinct secondary hrefs', () => {
  const { packFlashcards, unpackFlashcards } = load('lib/flashcard-payload.js');
  const base = { categoryId: 'wildkunde', question: 'Frage', answer: 'Antwort', explanation: 'Erklärung', courseHref: '/eins', learningHref: '/eins' };
  const deck = { version: 1, categories: [], cards: [
    { ...base, id: 'flash-one', sources: [{ label: 'Erster Titel', url: 'https://example.org/source' }] },
    { ...base, id: 'flash-two', learningHref: '/anders', sources: [{ label: 'Anderer Titel', url: 'https://example.org/source' }] },
  ] };
  const packed = packFlashcards(deck);
  assert.equal(packed.sourceTable.length, 1);
  assert.deepEqual(unpackFlashcards(JSON.parse(JSON.stringify(packed))), deck);
  const broken = structuredClone(packed); broken.cards[0].context = 999;
  assert.throws(() => unpackFlashcards(broken), /Kontextverweis/);
});
