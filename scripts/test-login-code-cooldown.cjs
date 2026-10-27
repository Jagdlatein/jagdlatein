const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createLoader } = require('./helpers/project-module.cjs');

const EMAIL = 'login-audit@example.invalid';
const GENERATION = '11111111-1111-4111-8111-111111111111';
const NOW = Date.parse('2026-10-27T12:00:00Z');
function fixture(t, initial = null) {
  const RealDate = Date;
  let now = NOW, row = initial && structuredClone(initial), sequence = 0;
  const mail = [], cookies = [], writes = [], comparisons = [];
  const env = { SUPABASE_URL: 'https://isolated.invalid', SUPABASE_SERVICE_ROLE_KEY: 'isolated-not-a-key',
    JL_SESSION_SECRET: 'isolated-test-session-secret-at-least-32-bytes', ACCOUNT_GENERATION_ENABLED: 'true',
    ACCOUNT_DELETION_ENABLED: 'false', APPLE_SUBSCRIPTIONS_ENABLED: 'false' };
  const previous = Object.fromEntries(Object.keys(env).map(key => [key, process.env[key]]));
  Object.assign(process.env, env);
  global.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } };
  t.after(() => { global.Date = RealDate; for (const [key, value] of Object.entries(previous)) value === undefined ? delete process.env[key] : process.env[key] = value; });
  function from(table) {
    let operation = 'read', values, filters = [], columns = '';
    const query = {
      select(value) { columns = value; return query; },
      eq(key, value) { filters.push([key, value]); return query; },
      is(key, value) { filters.push([key, value]); return query; },
      ilike(key, value) { filters.push([key, value]); return query; },
      update(value) { operation = 'update'; values = value; return query; },
      insert(value) { operation = 'insert'; values = value; return query; },
      delete() { operation = 'delete'; return query; },
      async maybeSingle() {
        if (table === 'userprofile') return { data: { email: EMAIL, is_admin: false, is_premium: false, account_generation: GENERATION }, error: null };
        assert.equal(table, 'login_codes');
        const matches = row && filters.every(([key, value]) => row[key] === value);
        const project = data => data && Object.fromEntries(columns.split(',').map(key => key.trim()).map(key => [key, data[key]]));
        if (operation === 'read') return { data: project(matches ? { ...row } : null), error: null };
        if (operation === 'insert') {
          if (row) return { data: null, error: { code: '23505' } };
          row = { ...values };
        } else {
          if (!matches) return { data: null, error: null };
          if (operation === 'update') row = { ...row, ...values }; else row = null;
        }
        writes.push({ operation, filters: structuredClone(filters) });
        return { data: { email: EMAIL }, error: null };
      },
      then(resolve, reject) { return query.maybeSingle().then(resolve, reject); },
    };
    return query;
  }
  const load = createLoader({
    '@supabase/supabase-js': { createClient: () => ({ from }) },
    'crypto': { ...crypto, randomInt: () => ++sequence },
    'bcryptjs': { hash: async code => `isolated:${code}`, compare: async (code, hash) => { comparisons.push(code); return hash === `isolated:${code}`; } },
    'next/headers': { cookies: async () => ({ set: value => cookies.push(value) }) },
    '../../../../lib/email': { sendLoginCode: async (email, code) => { assert.equal(email, EMAIL); mail.push({ code }); }, TestLoginMailError: class extends Error {}, safeLoginMailDiagnostic: () => 'isolated' },
    '../../../../lib/test-environment': { isLoginMailRecipientAllowed: () => true },
    '../../../../lib/subscription-access': { resolveSubscriptionAccess: async () => ({ paid: false, paidUntil: null }) },
  });
  const request = load('app/api/auth/request-code/route.js').POST;
  const verify = load('app/api/auth/verify-code/route.js').POST;
  const req = (endpoint, body) => new Request(`https://jagdlatein.de/api/auth/${endpoint}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { mail, cookies, writes, comparisons, load, row: () => row && structuredClone(row), advance: value => { now += value; },
    request: () => request(req('request-code', { email: EMAIL })),
    verify: (code = '999999') => verify(req('verify-code', { email: EMAIL, code })) };
}

test('The actual request route sends once and keeps an immediate resend neutral', async t => {
  const h = fixture(t);
  const first = await h.request(), blocked = await h.request();
  assert.equal(first.status, 200); assert.equal(blocked.status, 200);
  assert.deepEqual(await first.json(), await blocked.json());
  assert.equal(h.mail.length, 1); assert.equal(h.row().attempts, 0);
});

test('Five wrong attempts and repeated lockout retain the reservation and cannot trigger another mail', async t => {
  const h = fixture(t); await h.request(); const original = h.row();
  for (let attempt = 0; attempt < 5; attempt++) assert.equal((await h.verify()).status, 400);
  for (let attempt = 0; attempt < 3; attempt++) assert.equal((await h.verify()).status, 429);
  assert.deepEqual(h.row(), { ...original, attempts: 5 });
  assert.equal(h.comparisons.length, 5, 'locked codes never enter bcrypt again');
  assert.equal(h.writes.some(write => write.operation === 'delete'), false);
  assert.equal((await h.request()).status, 200); assert.equal(h.mail.length, 1);
  assert.deepEqual(h.row(), { ...original, attempts: 5 });
});

test('An exhausted reservation is replaced exactly at 60 seconds, not before, and starts fresh attempts', async t => {
  const h = fixture(t); await h.request(); const original = h.row();
  for (let attempt = 0; attempt < 6; attempt++) await h.verify();
  h.advance(59_999); await h.request(); assert.equal(h.mail.length, 1);
  h.advance(1); await h.request(); assert.equal(h.mail.length, 2);
  assert.equal(h.row().attempts, 0); assert.notEqual(h.row().code_hash, original.code_hash);
  assert.equal(h.row().requested_at, '2026-10-27T12:01:00.000Z');
  await h.request(); assert.equal(h.mail.length, 2);
  const replacement = h.writes.find(write => write.operation === 'update' && write.filters.some(([key]) => key === 'requested_at'));
  assert.ok(replacement.filters.some(([key, value]) => key === 'requested_at' && value === original.requested_at), 'resend keeps compare-and-swap reservation');
});

test('Parallel initial and replacement reservations each allow only one mail', async t => {
  const h = fixture(t);
  assert.ok((await Promise.all(Array.from({ length: 8 }, () => h.request()))).every(response => response.status === 200));
  assert.equal(h.mail.length, 1); const original = h.row();
  h.advance(60_000);
  assert.ok((await Promise.all(Array.from({ length: 8 }, () => h.request()))).every(response => response.status === 200));
  assert.equal(h.mail.length, 2); assert.notEqual(h.row().code_hash, original.code_hash);
});

test('Parallel wrong attempts cannot exceed the five stored attempts or bypass CAS', async t => {
  const h = fixture(t); await h.request();
  for (let round = 0; round < 5; round++) {
    const statuses = (await Promise.all(Array.from({ length: 8 }, () => h.verify()))).map(response => response.status);
    assert.equal(statuses.filter(status => status === 400).length, 1);
    assert.equal(statuses.filter(status => status === 429).length, 7);
  }
  assert.equal(h.row().attempts, 5); assert.equal(h.comparisons.length, 5);
  assert.equal((await h.verify()).status, 429); await h.request(); assert.equal(h.mail.length, 1);
  assert.ok(h.writes.filter(write => write.operation === 'update').every(write => write.filters.some(([key]) => key === 'attempts')));
});

test('A successful code remains single use and the signed session retains the current account generation', async t => {
  const h = fixture(t); await h.request(); const code = h.mail[0].code;
  const first = await h.verify(code); assert.equal(first.status, 200);
  assert.equal(h.row(), null, 'only successfully consumed or expired codes are deleted');
  const account = h.load('lib/account-session.js');
  const signed = h.cookies.find(cookie => cookie.name === account.JL_ACCOUNT_COOKIE);
  const session = account.readAccountSession(signed.value);
  assert.equal(session.email, EMAIL); assert.equal(session.accountGeneration, GENERATION);
  assert.equal(session.admin, false); assert.equal(session.paid, false);
  const cookieCount = h.cookies.length;
  assert.equal((await h.verify(code)).status, 400); assert.equal(h.cookies.length, cookieCount);
  const consume = h.writes.find(write => write.operation === 'delete');
  assert.ok(consume.filters.some(([key]) => key === 'code_hash'));
});

test('Expired exhausted codes still use the existing hash-scoped cleanup without setting cookies', async t => {
  const h = fixture(t); await h.request();
  for (let attempt = 0; attempt < 5; attempt++) await h.verify();
  h.advance(10 * 60_000);
  assert.equal((await h.verify()).status, 400); assert.equal(h.row(), null); assert.equal(h.cookies.length, 0);
  const cleanup = h.writes.find(write => write.operation === 'delete');
  assert.ok(cleanup.filters.some(([key]) => key === 'email'));
  assert.ok(cleanup.filters.some(([key]) => key === 'code_hash'));
});
