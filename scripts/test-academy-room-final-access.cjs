// Actual signed identity, paid-access checks, room handler and ordinary response.
// Only synthetic database/provider/clock doubles; no accounts, rooms or network.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), local = require('node:module').createRequire(path.join(root, 'package.json'));
const swc = local('next/dist/build/swc');
const email = 'member@example.invalid', g1 = '11111111-1111-4111-8111-111111111111', g2 = '22222222-2222-4222-8222-222222222222';
const schoolId = '33333333-3333-4333-8333-333333333333', offerId = '44444444-4444-4444-8444-444444444444', sessionId = '55555555-5555-4555-8555-555555555555';
const room = 'jagdlatein-66666666-6666-4666-8666-666666666666', initialTime = Date.parse('2026-10-27T16:00:00Z');
const stages = ['final:session', 'final:offer', 'final:school'];

function fixture({ change, at = 'final:school', startGeneration = g1, recordChange, readError, finalAccessError, endDuringFinalAccess = false } = {}) {
  const syntheticProcess = { env: { NODE_ENV: 'production', ACCOUNT_GENERATION_ENABLED: 'true', SUPABASE_URL: 'https://database.example.invalid',
    SUPABASE_SERVICE_ROLE_KEY: 'isolated-not-a-service-key', JL_SESSION_SECRET: 'isolated-academy-room-session-signing-secret-only' } };
  let exists = true, generation = startGeneration, paid = true, profileReads = 0, subscriptionReads = 0, clock = initialTime;
  class SyntheticDate extends Date { constructor(...args) { super(...(args.length ? args : [clock])); } static now() { return clock; } }
  const cache = new Map(), records = [], dbOptions = [], tableReads = new Map();
  const names = { online_academy_schools: 'school', online_academy_offers: 'offer', online_academy_sessions: 'session' };
  const rows = {
    online_academy_schools: { id: schoolId, name: 'Synthetic school', status: 'approved' },
    online_academy_offers: { id: offerId, school_id: schoolId, status: 'published' },
    online_academy_sessions: { id: sessionId, offer_id: offerId, status: 'scheduled', room_name: room,
      starts_at: '2026-10-27T15:30:00.000Z', ends_at: '2026-10-27T16:30:00.000Z' },
  };
  function invalidate() { if (change === 'delete') exists = false; else if (change === 'recreate') generation = g2; else if (change === 'revoke') paid = false; }
  const database = { from(table) { let filter; return {
    select() { return this; }, ilike(key, value) { filter = { key, value }; return this; }, eq(key, value) { filter = { key, value }; return this; },
    async maybeSingle() {
      if (table === 'userprofile') {
        profileReads++; assert.equal(filter.key, 'email'); assert.equal(filter.value, email);
        if (finalAccessError === 'profile' && profileReads >= 5) return { data: null, error: { message: 'Isolated profile unavailable' } };
        return { data: exists ? { email, is_admin: false, is_premium: false, account_generation: generation } : null, error: null };
      }
      assert.ok(rows[table], table); assert.equal(filter.key, 'id'); assert.equal(filter.value, rows[table].id);
      const count = (tableReads.get(table) || 0) + 1; tableReads.set(table, count);
      const stage = (count === 1 ? 'initial:' : 'final:') + names[table]; records.push(stage);
      if (stage === at) invalidate();
      if (stage === readError) return { data: null, error: { code: 'ISOLATED_UNAVAILABLE' } };
      if (count === 2) recordChange?.(names[table], rows[table]);
      return { data: { ...rows[table] }, error: null };
    },
  }; } };
  const overrides = {
    'lib/subscription-access.js': { async resolveSubscriptionAccess() {
      subscriptionReads++;
      if (subscriptionReads === 3 && finalAccessError === 'subscription') throw Object.assign(Error('Isolated provider unavailable'), { status: 503 });
      if (subscriptionReads === 3 && endDuringFinalAccess) clock = Date.parse(rows.online_academy_sessions.ends_at);
      return { paid, paidUntil: paid ? '2026-10-28T16:00:00Z' : null, accessType: paid ? 'subscription' : 'none' };
    } },
    'lib/apple-review-login.js': { ReviewLoginError: class ReviewLoginError extends Error {}, requireReviewSessionIdentity: async () => {} },
    'lib/course-catalog.js': { courses: [] }, 'lib/my-course-catalog.js': { getMyCourseCatalog: () => [] },
    'lib/admin-trial-overview.js': { requireCurrentTrialAdmin() { throw Error('No administrator path is authorized in this room test'); } },
  };
  function load(file) {
    file = file.replace(/\\/g, '/');
    if (Object.hasOwn(overrides, file)) return overrides[file];
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} }; cache.set(file, mod);
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    if (file.endsWith('.json')) return (mod.exports = JSON.parse(text));
    const { code } = swc.transformSync(text, { filename: file, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', 'process', 'Date', code)(id => {
      if (id === '@supabase/supabase-js') return { createClient(_url, _key, options) { dbOptions.push(options); return database; } };
      if (id === 'node:crypto' || id === 'crypto') return require(id);
      if (id.startsWith('.')) return load(path.posix.normalize(path.posix.join(path.posix.dirname(file), path.posix.extname(id) ? id : id + '.js')));
      throw Error('Unexpected dependency ' + id);
    }, mod, mod.exports, syntheticProcess, SyntheticDate);
    return mod.exports;
  }
  const sessions = load('lib/account-session.js');
  const token = sessions.createAccountSession(email, clock, { paid: true, paidUntil: '2099-01-01T00:00:00Z', authenticatedAt: Math.floor(clock / 1000), accountGeneration: g1 });
  assert.ok(token); assert.equal(sessions.readAccountSession(token, clock).accountGeneration, g1);
  const request = { url: 'https://jagdlatein.invalid/api/online-academy/room?id=' + sessionId,
    cookies: { get: name => name === sessions.JL_ACCOUNT_COOKIE ? { value: token } : undefined }, headers: new Headers() };
  return { records, dbOptions, get profileReads() { return profileReads; }, get subscriptionReads() { return subscriptionReads; },
    async get() { const response = await load('app/api/online-academy/room/route.js').GET(request); return { response, body: await response.json() }; } };
}

function privateResponse(response) {
  assert.match(response.headers.get('cache-control'), /private/); assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal(response.headers.get('vary'), 'Cookie');
}
function originalGeneration(h) {
  assert.ok(h.dbOptions.length > 0);
  assert.ok(h.dbOptions.every(options => options.global.headers['x-jagdlatein-account-generation'] === g1));
  assert.ok(h.dbOptions.every(options => options.global.headers['x-jagdlatein-account-email'] === email));
}

test('A current signed g1 member receives the exact existing room after three refreshed access checks', async () => {
  const h = fixture(), { response, body } = await h.get();
  assert.equal(response.status, 200); assert.deepEqual(body, { host: 'meet.jit.si', roomName: room, sessionId, endsAt: '2026-10-27T16:30:00.000Z' });
  assert.equal(h.profileReads, 6); assert.equal(h.subscriptionReads, 3); assert.equal(h.records.length, 6); privateResponse(response); originalGeneration(h);
});

test('An already recreated g2 account cannot reuse the signed g1 identity or reach room records', async () => {
  const h = fixture({ startGeneration: g2 }), { response, body } = await h.get();
  assert.equal(response.status, 401); assert.equal(body.roomName, undefined); assert.equal(h.records.length, 0); privateResponse(response); originalGeneration(h);
});

for (const change of ['delete', 'recreate', 'revoke']) for (const at of stages)
test(`${change} during ${at} blocks the final room response without rebinding the signed generation`, async () => {
  const h = fixture({ change, at }), { response, body } = await h.get();
  assert.equal(response.status, change === 'revoke' ? 403 : 401); assert.equal(body.roomName, undefined); assert.equal(h.records.length, 6);
  assert.equal(body.endsAt, undefined); privateResponse(response); originalGeneration(h);
});

for (const change of ['delete', 'recreate', 'revoke'])
test(`The existing earlier access checkpoint still blocks ${change} before the final three record reads`, async () => {
  const h = fixture({ change, at: 'initial:school' }), { response, body } = await h.get();
  assert.equal(response.status, change === 'revoke' ? 403 : 401); assert.equal(body.roomName, undefined); assert.equal(h.records.length, 3); privateResponse(response);
});

for (const [name, recordChange] of [
  ['cancelled session', (type, row) => { if (type === 'session') row.status = 'cancelled'; }],
  ['unpublished offer', (type, row) => { if (type === 'offer') row.status = 'draft'; }],
  ['unapproved school', (type, row) => { if (type === 'school') row.status = 'pending'; }],
  ['reassigned session parent', (type, row) => { if (type === 'session') row.offer_id = schoolId; }],
  ['reassigned offer parent', (type, row) => { if (type === 'offer') row.school_id = sessionId; }],
  ['replaced room identity', (type, row) => { if (type === 'session') row.room_name = 'jagdlatein-77777777-7777-4777-8777-777777777777'; }],
]) test(`The final ${name} check is preserved`, async () => {
  const h = fixture({ recordChange }), { response, body } = await h.get();
  assert.equal(response.status, 404); assert.equal(body.roomName, undefined); privateResponse(response);
});

for (const readError of stages) test(`A failure reading ${readError} cannot expose a room`, async () => {
  const { response, body } = await fixture({ readError }).get(); assert.equal(response.status, 503); assert.equal(body.roomName, undefined); privateResponse(response);
});

for (const finalAccessError of ['profile', 'subscription']) test(`Final ${finalAccessError} outage returns private 503 without room metadata`, async () => {
  const { response, body } = await fixture({ finalAccessError }).get(); assert.equal(response.status, 503); assert.equal(body.roomName, undefined); privateResponse(response);
});

test('A room ending during the final asynchronous access check is evaluated at the later clock', async () => {
  const h = fixture({ endDuringFinalAccess: true }), { response, body } = await h.get();
  assert.equal(response.status, 404); assert.equal(body.roomName, undefined); assert.equal(h.subscriptionReads, 3); privateResponse(response);
});
