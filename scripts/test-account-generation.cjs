// Synthetic identities only. These checks never open a real account database.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { webcrypto } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const { NextRequest, NextResponse } = pr('next/server');
const GENERATION = 'ac111111-1111-4111-8111-111111111111';
const OTHER = 'ac222222-2222-4222-8222-222222222222';
const EMAIL = 'generation-test@example.invalid';
const NOW = Date.now();

function fixture(extraEnv = {}, overrides = {}) {
  const env = { JL_SESSION_SECRET: 'synthetic-account-generation-secret-at-least-32-characters',
    SUPABASE_URL: 'https://database.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fake-test-key', ...extraEnv };
  const cache = new Map();
  const context = vm.createContext({ process: { env }, Buffer, crypto: webcrypto, atob,
    TextEncoder, TextDecoder, URL, Date, Response, AbortSignal, fetch: overrides.fetch });
  function load(relative) {
    const file = path.join(root, relative);
    if (cache.has(file)) return cache.get(file).exports;
    const { code } = swc.transformSync(fs.readFileSync(file, 'utf8'), { filename: file,
      jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
    const mod = { exports: {} }; cache.set(file, mod);
    const requireLocal = id => {
      if (Object.hasOwn(overrides, id)) return overrides[id];
      if (id === 'next/server') return { NextResponse };
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(file), `${id}.js`)));
      return pr(id);
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(requireLocal, mod, mod.exports);
    return mod.exports;
  }
  return { env, load, session: load('lib/account-session.js'), edge: load('lib/account-session-edge.js') };
}

test('Fresh email verification produces a generation-bound session accepted equally by Node and Edge', async () => {
  const ctx = fixture({ ACCOUNT_DELETION_ENABLED: 'true' });
  const token = ctx.session.createAccountSession(EMAIL, NOW, {
    paid: true, admin: false, authenticatedAt: Math.floor(NOW / 1000), accountGeneration: GENERATION,
  });
  const node = ctx.session.readAccountSession(token, NOW);
  const edge = await ctx.edge.readAccountSessionEdge(token, NOW);
  assert.equal(node.accountGeneration, GENERATION);
  assert.equal(edge.accountGeneration, GENERATION);
  assert.equal(node.authenticatedAt, edge.authenticatedAt);
  assert.equal(node.paid, true);
  assert.equal(await ctx.edge.readAccountSessionEdge(token.slice(0, -10) + 'forgedxxxx', NOW), null);
});

test('Refreshing access never restarts proof of email verification or the forty-day login lifetime', () => {
  const ctx = fixture();
  const authenticatedAt = Math.floor((NOW - 39 * 86400000) / 1000);
  const old = ctx.session.createAccountSession(EMAIL, NOW - 20 * 60000, {
    paid: false, admin: false, authenticatedAt, accountGeneration: GENERATION,
  });
  const parsed = ctx.session.readAccountSession(old, NOW);
  const renewed = ctx.session.readAccountSession(ctx.session.createAccountSession(EMAIL, NOW, { ...parsed, paid: true }), NOW);
  assert.equal(renewed.authenticatedAt, authenticatedAt);
  assert.equal(renewed.expiresAt, authenticatedAt + ctx.session.ACCOUNT_SESSION_MAX_AGE);
  assert.ok(NOW / 1000 - renewed.authenticatedAt > 600);
  const legacy = ctx.session.readAccountSession(ctx.session.createAccountSession(EMAIL, NOW, { paid: true, admin: false }), NOW);
  assert.equal(legacy.authenticatedAt, undefined);
  assert.equal(ctx.session.readAccountSession(ctx.session.createAccountSession(EMAIL, NOW, legacy), NOW).authenticatedAt, undefined);
});

test('The auth/status route preserves original authentication when issuing a renewed cookie', async () => {
  const written = [];
  const authenticatedAt = Math.floor((NOW - 3600000) / 1000);
  const access = { email: EMAIL, paid: true, admin: false, authenticatedAt, accountGeneration: GENERATION };
  const ctx = fixture({}, {
    'next/headers': { cookies: async () => ({ set: value => written.push(value) }) },
    '../../../../lib/account-access': { getSignedAccountAccess: async () => access },
  });
  const response = await ctx.load('app/api/auth/status/route.js').GET();
  assert.equal(response.status, 200);
  const session = ctx.session.readAccountSession(written[0].value);
  assert.equal(session.authenticatedAt, authenticatedAt);
  assert.equal(session.accountGeneration, GENERATION);
});

test('Refreshing a legacy cookie preserves its original deadline instead of adding another forty days', async () => {
  const written = [];
  const issuedAt = Math.floor((NOW - 86400000) / 1000);
  const access = { email: EMAIL, paid: false, admin: false, issuedAt,
    expiresAt: issuedAt + 40 * 86400 };
  const ctx = fixture({}, {
    'next/headers': { cookies: async () => ({ set: value => written.push(value) }) },
    '../../../../lib/account-access': { getSignedAccountAccess: async () => access },
  });
  assert.equal((await ctx.load('app/api/auth/status/route.js').GET()).status, 200);
  const refreshed = ctx.session.readAccountSession(written[0].value);
  assert.equal(refreshed.authenticatedAt, issuedAt);
  assert.equal(refreshed.expiresAt, access.expiresAt);
  assert.equal(refreshed.accountGeneration, undefined);
});

test('A slow provider response cannot renew access after deletion and same-email recreation', async () => {
  let reads = 0;
  const profile = { email: EMAIL, is_premium: false, is_admin: false, account_generation: GENERATION };
  const ctx = fixture({ ACCOUNT_GENERATION_ENABLED: 'true' }, {
    '@supabase/supabase-js': { createClient: () => ({ from() { return {
      select() { return this; }, ilike() { return this; },
      maybeSingle: async () => { reads++; return { data: { ...profile }, error: null }; },
    }; } }) },
    './subscription-access': { resolveSubscriptionAccess: async () => {
      profile.account_generation = OTHER;
      return { paid: true, paidUntil: new Date(NOW + 86400000).toISOString(), accessType: 'paid' };
    } },
  });
  const token = ctx.session.createAccountSession(EMAIL, NOW, { paid: false, admin: false,
    authenticatedAt: Math.floor(NOW / 1000), accountGeneration: GENERATION });
  const request = new NextRequest('https://jagdlatein.test/api/auth/status', { headers: { cookie: `jl_account_session=${token}` } });
  assert.equal(await ctx.load('lib/account-access.js').getSignedAccountAccess(request, { refresh: true }), null);
  assert.equal(reads, 2);
});

for (const enabled of ['ACCOUNT_GENERATION_ENABLED', 'ACCOUNT_DELETION_ENABLED', 'APPLE_SUBSCRIPTIONS_ENABLED']) {
  test(`${enabled}: cached paid cookies cannot enter a recreated account with the same email`, async () => {
    let queries = 0; let clientOptions;
    const ctx = fixture({ [enabled]: 'true' }, {
      '@supabase/supabase-js': { createClient: (url, key, options) => {
        clientOptions = options;
        return { from() { queries++; return { select() { return this; }, ilike() { return this; },
          maybeSingle: async () => ({ data: { email: EMAIL, is_premium: true, is_admin: false, account_generation: OTHER }, error: null }),
        }; } };
      } },
      './subscription-access': { resolveSubscriptionAccess: async () => { throw new Error('Must not grant access'); } },
    });
    const token = ctx.session.createAccountSession(EMAIL, NOW, { paid: true, admin: false,
      authenticatedAt: Math.floor(NOW / 1000), accountGeneration: GENERATION });
    const request = new NextRequest('https://jagdlatein.test/lernen/wildkunde', { headers: { cookie: `jl_account_session=${token}` } });
    const access = ctx.load('lib/account-access.js');
    assert.equal(access.hasSignedPaidAccess(request), false);
    assert.equal(await access.getSignedAccountAccess(request), null);
    assert.equal(queries, 1);
    assert.equal(clientOptions.global.headers['x-jagdlatein-account-generation'], GENERATION);
    assert.equal(clientOptions.global.headers['x-jagdlatein-account-email'], EMAIL);
  });
}

test('Deletion-enabled middleware rechecks a fresh paid cookie before serving protected learning content', async () => {
  let checked = 0;
  const ctx = fixture({ ACCOUNT_DELETION_ENABLED: 'true' }, {
    fetch: async () => { checked++; return Response.json({ loggedIn: false, paid: false, admin: false }); },
  });
  const token = ctx.session.createAccountSession(EMAIL, NOW, { paid: true, admin: false,
    authenticatedAt: Math.floor(NOW / 1000), accountGeneration: GENERATION });
  const request = new NextRequest('https://jagdlatein.test/lernen/wildkunde', { headers: { cookie: `jl_account_session=${token}` } });
  const response = await ctx.load('middleware.js').middleware(request);
  assert.equal(checked, 1);
  assert.equal(new URL(response.headers.get('location')).pathname, '/preise');
});
