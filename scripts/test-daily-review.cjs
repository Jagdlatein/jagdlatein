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
  if (filename.endsWith(".json")) return JSON.parse(fs.readFileSync(filename, "utf8"));
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(filename), (path.extname(id) ? id : id + '.js')))) : pr(id), mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}
const api = load('lib/daily-review.js');
const DAY = 86400000, now = Date.UTC(2026, 9, 12);
const empty = api.parseReviewHistory(null);
test('Malformed, oversized and poisoned device records cannot invent progress or object properties', () => {
  for (const value of [null, '{', 'x'.repeat(350001), JSON.stringify({version: 2, entries: {}})]) assert.deepEqual(api.parseReviewHistory(value), empty);
  assert.deepEqual(api.parseReviewHistory('{"version":1,"entries":{"__proto__":{"seen":1},"wissen-a":{"seen":1,"mistakes":2}}}'), empty);
});
test('Duplicate feedback and an earlier response do not count twice; mistakes reset intervals', () => {
  const first = api.updateReviewHistory(empty, 'wissen-a', true, now, 'event-a');
  assert.equal(first.entries['wissen-a'].due, now + DAY);
  assert.deepEqual(api.updateReviewHistory(first, 'wissen-a', true, now + 1, 'event-a'), first);
  assert.deepEqual(api.updateReviewHistory(first, 'wissen-a', false, now - 1, 'event-b'), first);
  const wrong = api.updateReviewHistory(first, 'wissen-a', false, now + DAY, 'event-b');
  assert.equal(wrong.entries['wissen-a'].streak, 0); assert.equal(wrong.entries['wissen-a'].mistakes, 1);
  assert.equal(wrong.entries['wissen-a'].due, now + DAY + 600000);
});
test('A round prioritizes due mistakes and due repetitions, excludes other categories and unknown history', () => {
  const pool = [{id:'wissen-a', category:'wildkunde'}, {id:'wissen-b', category:'wildkunde'}, {id:'wissen-c', category:'wildkunde'}, {id:'wissen-d', category:'hundewesen'}];
  let history = api.updateReviewHistory(empty, 'wissen-a', false, now - DAY, 'a');
  history = api.updateReviewHistory(history, 'wissen-b', true, now - 2 * DAY, 'b');
  history = api.updateReviewHistory(history, 'wissen-deleted', false, now - 3 * DAY, 'c');
  const round = api.selectDailyReview(pool, history, {now, category:'wildkunde'});
  assert.deepEqual(round.map(item => item.id), ['wissen-a', 'wissen-b', 'wissen-c']);
  assert.deepEqual(round.map(item => item.reason), ['Fehler wiederholen', 'Fällige Wiederholung', 'Neu entdecken']);
});
test('Repetition never widens regional legal questions and links to a real lesson', () => {
  const modules = load('lib/learning-curriculum.js').learningModules;
  const pool = load('lib/daily-review-pool.js').getDailyReviewPool();
  assert.ok(pool.length > 600); assert.equal(new Set(pool.map(item => item.id)).size, pool.length);
  assert.ok(!pool.some(item => item.id === 'wissen-waffensicherheit-4'));
  for (const item of pool) {
    const course = modules.find(course => course.questions.some(question => question.id === item.id));
    const question = course.questions.find(question => question.id === item.id);
    assert.equal(question.countries.length, 3); assert.notEqual(question.topic, 'Recht');
    assert.ok(item.href.includes('#lesson-')); assert.ok(course.lessons.some(lesson => item.href.endsWith(encodeURIComponent(lesson.id))));
  }
});
test('Storage failure leaves practice available and history clearing does not change server account data', () => {
  global.window = {localStorage: {getItem() {throw Error('denied');}, setItem() {throw Error('denied');}, removeItem() {throw Error('denied');}}};
  assert.deepEqual(api.readReviewHistory(), empty); assert.equal(api.recordReviewAnswer('wissen-a', true, 'a'), false); assert.equal(api.clearReviewHistory(), false);
  let removed; window.localStorage.removeItem = key => {removed = key;};
  assert.equal(api.clearReviewHistory(), true); assert.equal(removed, api.REVIEW_STORAGE_KEY); delete global.window;
});
