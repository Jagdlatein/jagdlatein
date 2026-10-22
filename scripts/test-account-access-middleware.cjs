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
const secret = 'account-route-isolated-test-secret-at-least-32-bytes';
const communityPath = '/community/11111111-1111-4111-8111-111111111111';

function harness() {
  const cache = new Map(); const requests = [];
  const env = { JL_SESSION_SECRET: secret };
  const context = vm.createContext({ process: { env }, Buffer, crypto: webcrypto, TextEncoder, TextDecoder,
    atob, URL, AbortSignal, Date,
    fetch: async (url) => { requests.push(String(url)); throw new Error('Isolated provider outage'); },
  });
  function load(relative) {
    const filename = path.join(root, relative);
    if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (cache.has(filename)) return cache.get(filename).exports;
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
    const module = { exports: {} }; cache.set(filename, module);
    const localRequire = id => {
      if (id === 'next/server') return { NextResponse };
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)));
      return pr(id);
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(localRequire, module, module.exports);
    return module.exports;
  }
  const session = load('lib/account-session.js'); const { middleware } = load('middleware.js');
  return { requests, session, load, run: (pathname, token) => middleware(new NextRequest(`https://jagdlatein.test${pathname}`, {
    headers: token ? { cookie: `jl_account_session=${token}` } : {},
  })) };
}

test('Free account and community pages need only signed identity during a subscription outage', async () => {
  const ctx = harness();
  // Identity remains valid for 40 days; its paid-access snapshot has expired.
  const token = ctx.session.createAccountSession('learner@example.invalid', Date.now() - 3600000, { paid: false, admin: false });
  for (const route of ['/konto', '/meine-kurse', '/auswertungen', '/dashboard', '/quiz-app/stats', '/quiz/stats', communityPath]) {
    const response = await ctx.run(route, token);
    assert.equal(response.status, 200, route); assert.equal(response.headers.get('x-middleware-next'), '1', route);
  }
  assert.equal(ctx.requests.length, 0, 'Free pages must not request a subscription refresh');
});

test('Legacy signed identity can open a community thread without refreshing premium', async () => {
  const ctx = harness(); const token = ctx.session.createAccountSession('learner@example.invalid', Date.now() - 3600000);
  assert.equal((await ctx.run(`${communityPath}?page=2`, token)).headers.get('x-middleware-next'), '1');
  assert.equal(ctx.requests.length, 0);
});

test('No signed identity still sends a private community thread to login with its return path', async () => {
  const ctx = harness(); const response = await ctx.run(`${communityPath}?page=2`);
  assert.equal(response.status, 307); const target = new URL(response.headers.get('location'));
  assert.equal(target.pathname, '/login'); assert.equal(target.searchParams.get('next'), `${communityPath}?page=2`);
  assert.equal(ctx.requests.length, 0);
});

test('A forged paid/admin cookie cannot open an account page', async () => {
  const ctx = harness(); const token = ctx.session.createAccountSession('learner@example.invalid', Date.now(), { paid: true, admin: true });
  const response = await ctx.run('/konto', `${token.slice(0, -8)}forgedxx`);
  assert.equal(new URL(response.headers.get('location')).pathname, '/login'); assert.equal(ctx.requests.length, 0);
});

test('An expired identity cannot open an account or community thread', async () => {
  const ctx = harness(); const token = ctx.session.createAccountSession('learner@example.invalid', Date.now() - 41 * 86400000);
  for (const route of ['/konto', communityPath]) assert.equal(new URL((await ctx.run(route, token)).headers.get('location')).pathname, '/login');
});

test('Protected learning pages still refresh expired permissions and fail closed on an outage', async () => {
  const ctx = harness(); const token = ctx.session.createAccountSession('learner@example.invalid', Date.now() - 3600000, { paid: true, admin: false });
  const response = await ctx.run('/lernen/wildkunde', token);
  assert.equal(response.status, 503); assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(ctx.requests, ['https://jagdlatein.test/api/auth/status']);
});

test('An unpaid fresh session cannot use a learning page or gain an admin entitlement', async () => {
  const ctx = harness(); const token = ctx.session.createAccountSession('learner@example.invalid', Date.now(), { paid: false, admin: false });
  const learning = await ctx.run('/lernen/wildkunde', token);
  assert.equal(new URL(learning.headers.get('location')).pathname, '/preise');
  // The admin page now owns its authoritative SSR guard. Middleware may hand
  // over a signed identity without granting the private page or an admin role.
  const admin = await ctx.run('/admin', token);
  assert.equal(admin.headers.get('x-middleware-next'), '1');
  const headers = {};
  const result = await ctx.load('lib/account-access.js').getPaidPageProps({
    req: new NextRequest('https://jagdlatein.test/admin', { headers: { cookie: `jl_account_session=${token}` } }),
    res: { setHeader(name, value) { headers[name.toLowerCase()] = value; } }, resolvedUrl: '/admin',
  }, { adminOnly: true });
  assert.equal(result.props, undefined);
  assert.equal(result.redirect.destination, '/konto');
  assert.equal(headers['cache-control'], 'private, no-store, max-age=0');
  assert.equal(ctx.requests.length, 0);
});

test('The new local photo tool is public without opening nested or protected learning routes', async () => {
  const ctx = harness();
  assert.equal((await ctx.run('/fotohelfer')).headers.get('x-middleware-next'), '1');
  for (const route of ['/fotohelfer/private', '/wildkunde/rehwild', '/lernen/spurenwerkstatt']) {
    assert.equal(new URL((await ctx.run(route)).headers.get('location')).pathname, '/preise', route);
  }
  assert.equal(ctx.requests.length, 0, 'The local photo tool does not fetch personal account data');
});

test('The public community landing remains available without a cookie', async () => {
  const ctx = harness(); assert.equal((await ctx.run('/community')).headers.get('x-middleware-next'), '1');
  assert.equal(ctx.requests.length, 0);
});
