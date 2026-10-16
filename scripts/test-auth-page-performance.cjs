// Synthetic identities and local route execution only. No provider, mailbox or
// remote database is contacted; access is never cached between requests.
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
const EMAIL = 'performance-test@example.invalid';
const GENERATION = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

function fixture(options = {}) {
  const calls = { profile: 0, subscription: 0, middleware: 0, review: 0 };
  const state = { profile: { email: EMAIL, account_generation: GENERATION, is_premium: false,
    is_admin: false, ...options.profile }, paid: options.paid === true,
    deleted: options.deleted === true, databaseError: options.databaseError === true,
    reviewError: null };
  const env = { JL_SESSION_SECRET: 'synthetic-page-performance-secret-at-least-32-characters',
    SUPABASE_URL: 'https://database.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'test-placeholder',
    ACCOUNT_GENERATION_ENABLED: 'true', ACCOUNT_DELETION_ENABLED: 'true', APPLE_SUBSCRIPTIONS_ENABLED: 'true' };
  class ReviewLoginError extends Error { constructor(status) { super('Synthetic review failure'); this.status = status; } }
  const review = { ReviewLoginError, async requireReviewSessionIdentity() {
    calls.review++;
    if (state.reviewError) throw state.reviewError;
  } };
  const database = { from(table) {
    assert.equal(table, 'userprofile', 'Private guard must not load customer or provider rows.');
    return { select() { return this; }, ilike() { return this; }, async maybeSingle() {
      calls.profile++;
      return { data: state.deleted ? null : { ...state.profile }, error: state.databaseError ? { code: 'FAILED' } : null };
    } };
  } };
  const cache = new Map();
  const context = vm.createContext({ process: { env }, Buffer, crypto: webcrypto, atob, TextEncoder,
    TextDecoder, URL, Date, Response, AbortSignal, console,
    fetch: async () => {
      calls.middleware++;
      if (options.failMiddleware) throw Error('Unexpected redundant middleware lookup');
      return Response.json({ loggedIn: !state.deleted, paid: state.paid, admin: state.profile.is_admin });
    } });
  function load(relative) {
    const file = path.join(root, relative);
    if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
    if (cache.has(file)) return cache.get(file).exports;
    const { code } = swc.transformSync(fs.readFileSync(file, 'utf8'), { filename: file,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022' }, module: { type: 'commonjs' } });
    const mod = { exports: {} }; cache.set(file, mod);
    const requireLocal = id => {
      if (id === 'next/server') return { NextResponse };
      if (id === '@supabase/supabase-js') return { createClient: () => database };
      if (id.endsWith('/apple-review-login')) return review;
      if (id.endsWith('/subscription-access')) return { resolveSubscriptionAccess: async () => {
        calls.subscription++;
        if (options.afterSubscription) options.afterSubscription(state);
        return { paid: state.paid, paidUntil: null, accessType: state.paid ? 'paid' : 'none' };
      } };
      if (id.endsWith('/course-progress-server')) return {
        requireAccountSession: req => {
          const session = load('lib/account-access.js').readRequestAccountSession(req);
          if (!session) throw Object.assign(new Error('Signed identity required'), { status: 401 });
          return session;
        },
        getAccountDatabase: () => database,
        requireCurrentAccount: () => assert.fail('A duplicate profile read must not precede the role read.'),
        accountUnavailable: () => Object.assign(new Error('Unavailable'), { status: 503 }),
        sessionRenewalRequired: () => Object.assign(new Error('Login required'), { status: 401 }),
      };
      if (id.endsWith('/operator-trial-notifications')) return {};
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(file), path.extname(id) ? id : `${id}.js`)));
      return pr(id);
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(requireLocal, mod, mod.exports);
    return mod.exports;
  }
  const session = load('lib/account-session.js');
  const token = session.createAccountSession(EMAIL, Date.now(), { paid: options.claimPaid === true,
    admin: options.claimAdmin === true, accountGeneration: GENERATION, authenticatedAt: Math.floor(Date.now() / 1000) });
  const request = (url, cookie = token) => new NextRequest(`https://jagdlatein.example.invalid${url}`,
    cookie ? { headers: { cookie: `jl_account_session=${cookie}` } } : {});
  const middleware = req => load('middleware.js').middleware(req);
  async function server(url, guard = {}) {
    const req = request(url); const responseHeaders = {};
    const result = await load('lib/account-access.js').getPaidPageProps({ req,
      res: { setHeader(name, value) { responseHeaders[name.toLowerCase()] = value; } }, resolvedUrl: url }, guard);
    return { result, responseHeaders };
  }
  return { calls, state, database, ReviewLoginError, request, middleware, server, load, token };
}

const guardedPages = ['/ebook', '/protected/ebook', '/glossar', '/glossar/windkante', '/lernen/lernkarten', '/lernen/lernkarten-drucken', '/admin',
  '/admin/glossar', '/admin/glossar-import', '/admin/import', '/admin/push', '/admin/quiz', '/admin/testabos'];

for (const pathname of ['/lernen/lernkarten', '/lernen/lernkarten-drucken']) test(`Scoped cards at ${pathname} retain paid access checks and their selected return route`, async () => {
  const f = fixture({ claimPaid: true, failMiddleware: true });
  const url = `${pathname}?kurs=wissen-beispiel&lektion=erste-lektion`;
  assert.equal((await f.middleware(f.request(url))).headers.get('x-middleware-next'), '1');
  assert.equal((await f.server(url)).result.redirect.destination, `/preise?next=${encodeURIComponent(url)}`);
  f.state.deleted = true;
  assert.equal((await f.server(url)).result.redirect.destination, `/login?next=${encodeURIComponent(url)}`);
});

for (const pathname of guardedPages) test(`Server guard owns ${pathname} without a duplicate middleware status request`, async () => {
  const f = fixture({ paid: true, profile: { is_admin: true }, failMiddleware: true });
  const url = `${pathname}?thema=ein%20Test`;
  const response = await f.middleware(f.request(url));
  assert.equal(response.headers.get('x-middleware-next'), '1');
  const { result, responseHeaders } = await f.server(url, { adminOnly: pathname.startsWith('/admin') });
  assert.ok(result.props);
  assert.equal(responseHeaders['cache-control'], 'private, no-store, max-age=0');
  assert.equal(f.calls.middleware, 0);
  assert.equal(f.calls.profile, 2, 'One live SSR access resolution still rechecks generation/role after its reads.');
});

test('A formerly unpaid signed session reaches fresh paid coverage without a second authentication lookup', async () => {
  const f = fixture({ paid: true, failMiddleware: true });
  assert.equal((await f.middleware(f.request('/ebook'))).headers.get('x-middleware-next'), '1');
  assert.ok((await f.server('/ebook')).result.props);
  assert.deepEqual(f.calls, { profile: 2, subscription: 1, middleware: 0, review: 2 });
});

test('A stale paid cookie is denied by live SSR, with the full original query retained for checkout', async () => {
  const f = fixture({ claimPaid: true, failMiddleware: true });
  const url = '/ebook?thema=spuren&quelle=lernbereich';
  assert.equal((await f.middleware(f.request(url))).headers.get('x-middleware-next'), '1');
  assert.equal((await f.server(url)).result.redirect.destination, `/preise?next=${encodeURIComponent(url)}`);
  assert.equal(f.calls.subscription, 1);
});

test('Cookie admin claims cannot bypass current SSR admin revocation', async () => {
  const f = fixture({ claimAdmin: true, paid: true, failMiddleware: true });
  assert.equal((await f.middleware(f.request('/admin/testabos'))).headers.get('x-middleware-next'), '1');
  assert.equal((await f.server('/admin/testabos', { adminOnly: true })).result.redirect.destination, '/konto');
});

for (const [name, options] of [['deleted', { deleted: true }], ['recreated', { profile: { account_generation: OTHER } }]])
  test(`A ${name} account is rejected by authoritative SSR despite an unexpired signed paid cookie`, async () => {
    const f = fixture({ claimPaid: true, failMiddleware: true, ...options });
    assert.equal((await f.middleware(f.request('/ebook'))).headers.get('x-middleware-next'), '1');
    assert.equal((await f.server('/ebook')).result.redirect.destination, '/login?next=%2Febook');
    assert.equal(f.calls.subscription, 0);
  });

test('Deletion during a slow entitlement lookup still blocks the final SSR render', async () => {
  const f = fixture({ paid: true, failMiddleware: true, afterSubscription: state => { state.profile.account_generation = OTHER; } });
  assert.equal((await f.middleware(f.request('/ebook'))).headers.get('x-middleware-next'), '1');
  assert.equal((await f.server('/ebook')).result.redirect.destination, '/login?next=%2Febook');
  assert.equal(f.calls.profile, 2);
});

test('Disabled review identity and database failures still fail closed after the middleware hand-off', async () => {
  const f = fixture({ paid: true, failMiddleware: true });
  f.state.reviewError = new f.ReviewLoginError(401);
  assert.equal((await f.server('/ebook')).result.redirect.destination, '/login?next=%2Febook');
  f.state.reviewError = null; f.state.databaseError = true;
  assert.equal((await f.server('/ebook')).result.redirect.destination, '/konto?access=unavailable');
});

test('Unauthenticated and forged requests retain the payment redirect and selected destination', async () => {
  const f = fixture();
  for (const token of [null, f.token.slice(0, -8) + 'forgedxx']) {
    const response = await f.middleware(f.request('/admin/testabos?environment=sandbox', token));
    const target = new URL(response.headers.get('location'));
    assert.equal(target.pathname, '/preise'); assert.equal(target.hash, '#paypal-subscribe-preise');
    assert.equal(target.searchParams.get('next'), '/admin/testabos?environment=sandbox');
  }
  assert.equal(f.calls.middleware, 0);
});

for (const pathname of ['/lernen/wildkunde', '/lernen/lernkarten/private', '/lernen/lernkarten-drucken/private', '/lernen/lernkarten/jagdlatein-lernkarten.pdf', '/ebook.pdf', '/admin/not-a-reviewed-route', '/admin/testabos/private', '/glossar/windkante/private'])
  test(`Protected route ${pathname} still resolves current middleware access`, async () => {
    const f = fixture({ claimPaid: true });
    const response = await f.middleware(f.request(`${pathname}?weiter=1`));
    assert.equal(f.calls.middleware, 1);
    const target = new URL(response.headers.get('location'));
    assert.equal(target.pathname, '/preise'); assert.equal(target.searchParams.get('next'), `${pathname}?weiter=1`);
  });

test('The private operator guard checks current identity and role in one read per request, never a cached prior result', async () => {
  const f = fixture({ profile: { is_admin: true }, claimAdmin: true });
  const helper = f.load('lib/admin-trial-overview.js');
  await helper.requireCurrentTrialAdmin(f.request('/api/admin/trials'));
  assert.equal(f.calls.profile, 1); assert.equal(f.calls.review, 1); assert.equal(f.calls.subscription, 0);
  f.state.profile.is_admin = false;
  await assert.rejects(helper.requireCurrentTrialAdmin(f.request('/api/admin/trials'), { database: f.database }), error => error.status === 403);
  assert.equal(f.calls.profile, 2);
});

test('The operator guard keeps review revocation, generation checks and service failures fail closed', async () => {
  const f = fixture({ profile: { is_admin: true } });
  const helper = f.load('lib/admin-trial-overview.js'); const req = f.request('/api/admin/trials');
  f.state.reviewError = new f.ReviewLoginError(401);
  await assert.rejects(helper.requireCurrentTrialAdmin(req), error => error.status === 401);
  f.state.reviewError = new f.ReviewLoginError(503);
  await assert.rejects(helper.requireCurrentTrialAdmin(req), error => error.status === 503);
  f.state.reviewError = null; f.state.profile.account_generation = OTHER;
  await assert.rejects(helper.requireCurrentTrialAdmin(req), error => error.status === 401);
  f.state.profile.account_generation = GENERATION; f.state.databaseError = true;
  await assert.rejects(helper.requireCurrentTrialAdmin(req), error => error.status === 503);
  assert.equal(f.calls.subscription, 0);
});
