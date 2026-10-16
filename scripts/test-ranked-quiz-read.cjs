const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const { NextRequest } = pr('next/server');
const EMAIL = 'ranked-reader@example.invalid';
const GENERATION = '11111111-1111-4111-8111-111111111111';

// Isolated in-memory provider responses: these tests never contact Supabase or
// create a quiz identity, round, answer or score. The real signed-account guard
// still verifies the cookie, live profile and account generation.
function fixture(overrides = {}) {
  const calls = [];
  const cache = new Map();
  const state = { paid: true, profile: { email: EMAIL, is_premium: true, is_admin: false,
    account_generation: GENERATION }, rows: [
    { username: 'berta', country: 'CH', total_points: 1000, account_email: 'private-b@example.invalid' },
    { username: 'anna', country: 'DE', total_points: 1000, account_email: 'private-a@example.invalid' },
    { username: 'carl', country: 'AT', total_points: 1500, account_email: 'private-c@example.invalid' },
  ], ...overrides };
  const env = { JL_SESSION_SECRET: 'ranked-read-synthetic-secret-at-least-32-characters',
    SUPABASE_URL: 'https://database.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'isolated-fake-key',
    ACCOUNT_GENERATION_ENABLED: 'true' };
  const database = {
    from(table) {
      calls.push({ table });
      let columns; const orders = [];
      const query = {
        select(value) { columns = value; calls.push({ table, select: value }); return query; },
        ilike(field, value) { calls.push({ table, field, value }); return query; },
        order(field, options) { orders.push({ field, ...options }); calls.push({ table, order: field, ...options }); return query; },
        async maybeSingle() {
          assert.equal(table, 'userprofile');
          return { data: state.profile, error: state.profileError || null };
        },
        async limit(value) {
          calls.push({ table, limit: value });
          assert.equal(table, 'verified_quiz_scores');
          if (state.rankThrown) throw state.rankThrown;
          const data = state.rows === null ? null : [...state.rows].sort((a, b) => {
            for (const order of orders) {
              const result = typeof a[order.field] === 'number' ? a[order.field] - b[order.field]
                : a[order.field].localeCompare(b[order.field]);
              if (result) return order.ascending ? result : -result;
            }
            return 0;
          }).slice(0, value).map(row => Object.fromEntries(columns.split(',').map(field => [field, row[field]])));
          return { data, error: state.rankError || null };
        },
      };
      return query;
    },
  };
  function load(relative) {
    const filename = path.join(root, relative);
    if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (cache.has(filename)) return cache.get(filename).exports;
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022' }, module: { type: 'commonjs' } });
    const mod = { exports: {} }; cache.set(filename, mod);
    new Function('require', 'module', 'exports', 'process', code)(id => {
      if (id === '@supabase/supabase-js') return { createClient: (url, key, options) => {
        calls.push({ clientOptions: options }); return database;
      } };
      if (id.startsWith('.')) {
        const target = path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js'));
        if (target === path.join('lib', 'subscription-access.js')) return {
          async resolveSubscriptionAccess(db, email) {
            calls.push({ entitlement: email }); assert.equal(db, database);
            return { paid: state.paid, paidUntil: null };
          },
        };
        if (target === path.join('lib', 'apple-review-login.js')) return {
          ReviewLoginError: class ReviewLoginError extends Error {}, async requireReviewSessionIdentity() {},
        };
        return load(target);
      }
      return pr(id);
    }, mod, mod.exports, { env });
    return mod.exports;
  }
  const session = load('lib/account-session.js');
  const token = session.createAccountSession(EMAIL, Date.now(), { authenticatedAt: Math.floor(Date.now() / 1000),
    accountGeneration: GENERATION, paid: true });
  return { calls, state, api: load('app/api/quiz/leaderboard-week/route.js'),
    request(cookie = token) { return new NextRequest('https://jagdlatein.test/api/quiz/leaderboard-week?email=other@example.invalid',
      { headers: { cookie: `jl_account_session=${cookie}` } }); },
  };
}

test('The ranking uses live paid access, public fields, points then stable names, and at most 100 rows', async () => {
  const ctx = fixture(); const response = await ctx.api.GET(ctx.request());
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(await response.json(), { data: [
    { username: 'carl', country: 'AT', total_points: 1500 },
    { username: 'anna', country: 'DE', total_points: 1000 },
    { username: 'berta', country: 'CH', total_points: 1000 },
  ] });
  assert.ok(ctx.calls.findIndex(call => call.entitlement === EMAIL) < ctx.calls.findIndex(call => call.table === 'verified_quiz_scores'));
  const ranking = ctx.calls.filter(call => call.table === 'verified_quiz_scores');
  assert.deepEqual(ranking, [{ table: 'verified_quiz_scores' },
    { table: 'verified_quiz_scores', select: 'username,country,total_points' },
    { table: 'verified_quiz_scores', order: 'total_points', ascending: false },
    { table: 'verified_quiz_scores', order: 'username', ascending: true },
    { table: 'verified_quiz_scores', limit: 100 }]);
  assert.ok(ctx.calls.filter(call => call.clientOptions).every(call =>
    call.clientOptions.global.headers['x-jagdlatein-account-generation'] === GENERATION));
});

test('An empty ranking is a successful empty list with private no-store caching', async () => {
  const ctx = fixture({ rows: null }); const response = await ctx.api.GET(ctx.request());
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { data: [] });
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});

for (const [name, state, cookie, expected] of [
  ['unsigned account', {}, 'fake.signature', 401],
  ['deleted account', { profile: null }, undefined, 401],
  ['recreated account', { profile: { email: EMAIL, is_premium: true, is_admin: false,
    account_generation: '22222222-2222-4222-8222-222222222222' } }, undefined, 401],
  ['unpaid account despite a paid cookie', { paid: false }, undefined, 403],
]) {
  test(`${name} cannot query the ranking`, async () => {
    const ctx = fixture(state); const response = await ctx.api.GET(ctx.request(cookie));
    assert.equal(response.status, expected); assert.equal((await response.json()).success, false);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.ok(!ctx.calls.some(call => call.table === 'verified_quiz_scores'));
    if (cookie) assert.equal(ctx.calls.length, 0);
  });
}

for (const failure of [
  { profileError: { message: 'sensitive profile provider detail' } },
  { rankError: { message: 'sensitive ranking provider detail' } },
  { rankThrown: new Error('sensitive thrown provider detail') },
]) {
  test(`Provider failure is 503 without private implementation details (${Object.keys(failure)[0]})`, async () => {
    const ctx = fixture(failure); const response = await ctx.api.GET(ctx.request());
    assert.equal(response.status, 503); assert.equal(response.headers.get('cache-control'), 'private, no-store');
    const body = await response.json(); assert.equal(body.success, false);
    assert.ok(!JSON.stringify(body).includes('sensitive'));
  });
}
