const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const cache = new Map();
function load(relative) {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} }; cache.set(filename, mod.exports);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  function resolve(id) { return id.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`))) : pr(id); }
  new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports); cache.set(filename, mod.exports); return mod.exports;
}
const { packDailyReviewCatalog: pack, unpackDailyReviewCatalog: unpack } = load('lib/daily-review-catalog.js');
const maintained = load('lib/daily-review-pool.js');

test('The complete maintained metadata survives JSON transport with exact order and substantial size reduction', () => {
  const original = maintained.getDailyReviewCatalog();
  const packed = pack(original), transported = JSON.parse(JSON.stringify(packed));
  assert.deepEqual(unpack(transported), original);
  assert.deepEqual(maintained.getPackedDailyReviewCatalog(), packed);
  const before = Buffer.byteLength(JSON.stringify({ pool: original })), after = Buffer.byteLength(JSON.stringify({ catalog: packed }));
  assert.ok(after < 64 * 1024, `${after} bytes must fit under 64 KiB`);
  assert.ok(after < before * 0.4, `${before} -> ${after} bytes must save at least 60%`);
  console.log(`Daily-review page props: ${before} -> ${after} bytes; ${original.length} IDs retained`);
});

test('Irregular prefixes, interleaved categories, duplicate IDs and an empty catalog roundtrip without sorting or omission', () => {
  const values = [
    { id: 'ab', category: 'wildkunde' },
    { id: 'ab-extra', category: 'hundewesen' },
    { id: 'z-last-course-q32', category: 'wildkunde' },
    { id: 'ab', category: 'pruefung-sprache' },
    { id: 'ab', category: 'pruefung-sprache' },
    { id: `q-${'x'.repeat(158)}`, category: 'hundewesen' },
  ];
  assert.deepEqual(unpack(JSON.parse(JSON.stringify(pack(values)))), values);
  assert.deepEqual(unpack(pack([])), []);
});

test('Only ID/category metadata is packed; answers, sources and arbitrary input fields never enter page props', () => {
  const packed = pack([{ id: 'wissen-fixture-q1', category: 'wildkunde', q: 'PRIVATE QUESTION', explain: 'PRIVATE SOLUTION', sources: [{ url: 'https://private.test/' }], answers: ['PRIVATE ANSWER'] }]);
  assert.deepEqual(Object.keys(packed).sort(), ['categories', 'rows', 'version']);
  assert.doesNotMatch(JSON.stringify(packed), /PRIVATE|private\.test|sources|answers|explain/);
  assert.deepEqual(unpack(packed), [{ id: 'wissen-fixture-q1', category: 'wildkunde' }]);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'lib/daily-review-catalog.js'), 'utf8'), /(?:^|\n)\s*import\s|\brequire\s*\(/);
});

test('Malformed compact data is rejected as a whole instead of returning a valid prefix', () => {
  const valid = pack([{ id: 'wissen-fixture-q1', category: 'wildkunde' }]);
  for (const invalid of [null, {}, { ...valid, version: 2 }, { ...valid, categories: ['wildkunde', 'wildkunde'] },
    { ...valid, categories: ['__proto__'] }, { ...valid, rows: [[1, 'wissen-fixture-q1', 0]] },
    { ...valid, rows: [...valid.rows, [1.5, 'suffix', 0]] }, { ...valid, rows: [...valid.rows, [-1, 'suffix', 0]] },
    { ...valid, rows: [...valid.rows, [1000, 'suffix', 0]] }, { ...valid, rows: [...valid.rows, [0, 'bad id', 0]] },
    { ...valid, rows: [...valid.rows, [0, 'valid-id', 1]] }, { ...valid, rows: [...valid.rows, [0, 'valid-id', 0, 'extra']] },
    { ...valid, rows: [...valid.rows, [0, 42, 0]] }, { ...valid, rows: [...valid.rows, [0, 'x'.repeat(161), 0]] }]) assert.deepEqual(unpack(invalid), []);
  for (const invalid of [null, [{}], [{ id: 'bad id', category: 'wildkunde' }], [{ id: 'valid-id', category: '__proto__' }]]) assert.throws(() => pack(invalid));
});

test('A larger synthetic catalog preserves every item without a hardcoded course or category mapping', () => {
  const values = Array.from({ length: 30000 }, (_, i) => ({ id: `wissen-future-course-${Math.floor(i / 32)}-lesson-${i % 4}-q${i % 32}`, category: i % 2 ? 'wildkunde' : 'hundewesen' }));
  assert.deepEqual(unpack(JSON.parse(JSON.stringify(pack(values)))), values);
});
