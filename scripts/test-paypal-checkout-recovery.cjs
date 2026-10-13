const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const EMAIL = 'buyer@example.invalid';
const GENERATION = '11111111-1111-4111-8111-111111111111';
const OTHER_GENERATION = '22222222-2222-4222-8222-222222222222';
const SUBSCRIPTION = 'I-RECOVERY1234';
const SESSION = { email: EMAIL, accountGeneration: GENERATION };
const empty = { subscriptionId: null, status: null, activated: false, accessType: 'none', trialUntil: null };

function ledger(status = 'APPROVAL_PENDING', overrides = {}) {
  return { subscription_id: SUBSCRIPTION, account_email: EMAIL, account_generation: GENERATION,
    account_deleted_at: null, status, ...overrides };
}

function fixture(options = {}) {
  const calls = [];
  const unavailable = () => Object.assign(new Error('Unavailable'), { status: 503 });
  const database = {
    from(table) {
      assert.equal(table, 'paypal_subscriptions');
      const query = { table };
      calls.push({ type: 'ledger', query });
      return { select(columns) { query.columns = columns; return this; },
        eq(column, value) { (query.filters ||= []).push([column, value]); return this; },
        in(column, values) { query.statuses = [column, [...values]]; return this; },
        async limit(value) { query.limit = value; return { data: options.rows || [], error: options.databaseError || null }; },
      };
    },
    async rpc() { throw new Error('Recovery must never begin or reserve a subscription.'); },
  };
  const progress = {
    requireAccountSession() {
      if (options.unsigned) throw Object.assign(new Error('Sign in'), { status: 401 });
      return options.session || SESSION;
    },
    requireSameOriginJson(req) {
      if (req.headers.get('origin') !== new URL(req.url).origin) throw Object.assign(new Error('Origin'), { status: 403 });
      if (req.headers.get('content-type') !== 'application/json') throw Object.assign(new Error('JSON'), { status: 415 });
    },
    async requireCurrentAccount(db, session) {
      assert.equal(db, database);
      calls.push({ type: 'current-account', session });
      if (options.deletedAccount) throw Object.assign(new Error('Sign in'), { status: 401 });
    },
    getAccountDatabase() { calls.push({ type: 'database' }); return database; },
    accountUnavailable: unavailable,
    accountJson: (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } }),
    accountErrorResponse: error => Response.json({ error: 'Unavailable' }, { status: error.status || 503 }),
  };
  const cache = new Map();
  function load(relative) {
    const filename = path.join(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), {
      filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' },
    });
    const mod = { exports: {} }; cache.set(filename, mod);
    new Function('require', 'module', 'exports', code)(id => {
      if (id.endsWith('/course-progress-server')) return progress;
      if (id.endsWith('/account-session')) return { isAccountGenerationEnabled: () => true };
      if (id.endsWith('/paypal-checkout-settings')) return { paypalCheckoutSettings() {
        if (options.invalidConfig) throw unavailable(); return {};
      } };
      if (id.endsWith('/paypal-plan-pricing')) return { paypalPlanPricing() { throw new Error('Recovery must not select or change a tariff.'); } };
      if (id.endsWith('/webhook/_base')) return { paypalRequest() { throw new Error('Recovery must not create, cancel or capture a subscription.'); } };
      if (id.endsWith('/subscription-access')) return {
        validSubscriptionId: value => typeof value === 'string' && /^I-[A-Z0-9]{6,64}$/i.test(value),
        async refreshVerifiedSubscription(id, context) {
          assert.equal(context.database, database); assert.deepEqual(context.expectedAccount, options.session || SESSION);
          calls.push({ type: 'verify', id, expectedAccount: context.expectedAccount });
          if (options.providerError) throw unavailable();
          return Object.hasOwn(options, 'verified') ? options.verified : ledger('ACTIVE');
        },
        accessFromSubscriptions(rows) {
          calls.push({ type: 'access', rows });
          return options.access || { paid: false, accessType: 'none', trialUntil: null };
        },
      };
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), `${id}.js`)));
      return pr(id);
    }, mod, mod.exports);
    return mod.exports;
  }
  const request = (body = {}, overrides = {}) => ({
    url: 'https://jagdlatein.example.invalid/api/paypal/checkout-status',
    headers: new Headers({ origin: 'https://jagdlatein.example.invalid', 'content-type': 'application/json', ...overrides }),
    json: async () => { if (options.malformedJson) throw new SyntaxError('Invalid JSON'); return body; },
  });
  return { calls, run: (body, headers) => load('app/api/paypal/checkout-status/route.js').POST(request(body, headers)) };
}

test('Recovery without an existing agreement does not contact PayPal or create another checkout', async () => {
  const ctx = fixture(); const response = await ctx.run();
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), empty);
  assert.equal(response.headers.get('cache-control'), 'private, no-store'); assert.equal(response.headers.get('vary'), 'Cookie');
  assert.ok(!ctx.calls.some(call => ['verify', 'access'].includes(call.type)));
  const query = ctx.calls.find(call => call.type === 'ledger').query;
  assert.deepEqual(query.filters, [['account_email', EMAIL], ['account_generation', GENERATION]]);
  assert.deepEqual(query.statuses, ['status', ['APPROVAL_PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED']]);
  assert.equal(query.limit, 2);
});

for (const storedStatus of ['APPROVAL_PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED']) {
  test(`Recovery verifies the current account's ${storedStatus} agreement rather than creating a purchase`, async () => {
    const ctx = fixture({ rows: [ledger(storedStatus)], verified: ledger(storedStatus) });
    const response = await ctx.run();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ...empty, subscriptionId: SUBSCRIPTION, status: storedStatus });
    const verifies = ctx.calls.filter(call => call.type === 'verify');
    assert.equal(verifies.length, 1); assert.equal(verifies[0].id, SUBSCRIPTION);
    assert.deepEqual(verifies[0].expectedAccount, SESSION);
  });
}

test('An approval completed before a lost browser callback recovers the verified trial', async () => {
  const trialUntil = '2026-10-16T12:00:00.000Z';
  const ctx = fixture({ rows: [ledger()], verified: ledger('ACTIVE'), access: { paid: true, accessType: 'trial', trialUntil } });
  const response = await ctx.run();
  assert.deepEqual(await response.json(), { subscriptionId: SUBSCRIPTION, status: 'ACTIVE', activated: true, accessType: 'trial', trialUntil });
});

for (const status of ['CANCELLED', 'EXPIRED']) {
  test(`Recovery exposes fresh ${status} provider state so a terminal agreement need not trap the next checkout`, async () => {
    const ctx = fixture({ rows: [ledger()], verified: ledger(status) });
    const response = await ctx.run();
    assert.equal(response.status, 200); assert.deepEqual(await response.json(), { ...empty, subscriptionId: SUBSCRIPTION, status });
  });
}

test('Foreign, deleted, malformed and ambiguous ledger records fail before contacting PayPal', async () => {
  for (const rows of [[ledger('ACTIVE', { account_email: 'another@example.invalid' })],
    [ledger('ACTIVE', { account_generation: OTHER_GENERATION })],
    [ledger('ACTIVE', { account_deleted_at: '2026-10-13T00:00:00Z' })],
    [ledger('ACTIVE', { subscription_id: 'invalid' })], [ledger('CANCELLED')], [null], [ledger(), ledger('ACTIVE')], {}]) {
    const ctx = fixture({ rows }); const response = await ctx.run();
    assert.equal(response.status, 503); assert.ok(!ctx.calls.some(call => call.type === 'verify'));
    assert.doesNotMatch(JSON.stringify(await response.json()), /buyer@|another@|RECOVERY/);
  }
});

test('Provider outages and changed ownership cannot grant access or silently permit a new agreement', async () => {
  for (const options of [{ providerError: true }, { verified: null }, { verified: ledger('ACTIVE', { account_email: 'another@example.invalid' }) },
    { verified: ledger('ACTIVE', { account_generation: OTHER_GENERATION }) }, { verified: ledger('ACTIVE', { subscription_id: 'I-ANOTHER123' }) },
    { verified: ledger('ACTIVE', { account_deleted_at: '2026-10-13T00:00:00Z' }) }, { verified: ledger('UNKNOWN') }]) {
    const ctx = fixture({ rows: [ledger()], ...options }); const response = await ctx.run();
    assert.equal(response.status, 503); assert.ok(!ctx.calls.some(call => call.type === 'access'));
  }
});

test('Recovery requires a current signed account and explicit isolated configuration before ledger lookup', async () => {
  for (const [options, status] of [[{ unsigned: true }, 401], [{ deletedAccount: true }, 401],
    [{ session: { ...SESSION, accountGeneration: OTHER_GENERATION.slice(0, 8) } }, 503], [{ invalidConfig: true }, 503]]) {
    const ctx = fixture(options); assert.equal((await ctx.run()).status, status);
    assert.ok(!ctx.calls.some(call => call.type === 'ledger'));
  }
});

test('Browser-selected IDs, price fields, malformed JSON and cross-origin status requests are rejected', async () => {
  for (const body of [{ subscriptionId: 'I-UNTRUSTED123' }, { planId: 'P-UNTRUSTED123', price: '0.00' }, [], null, '']) {
    const ctx = fixture(); assert.equal((await ctx.run(body)).status, 400);
    assert.ok(!ctx.calls.some(call => call.type === 'ledger'));
  }
  const malformed = fixture({ malformedJson: true }); assert.equal((await malformed.run()).status, 400);
  assert.ok(!malformed.calls.some(call => call.type === 'ledger'));
  for (const [headers, status] of [[{ origin: 'https://untrusted.example.invalid' }, 403], [{ 'content-type': 'text/plain' }, 415]]) {
    const ctx = fixture(); assert.equal((await ctx.run({}, headers)).status, status); assert.deepEqual(ctx.calls, []);
  }
});
