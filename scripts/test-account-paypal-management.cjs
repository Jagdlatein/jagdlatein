const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');
const LIVE = 'https://www.paypal.com/myaccount/autopay/';
const SANDBOX = 'https://www.sandbox.paypal.com/myaccount/autopay/';

function load(relative, overrides, context) {
  const filename = path.join(root, relative);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' } });
  const mod = { exports: {} };
  const requireLocal = id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), `${id}.js`)), overrides, context);
    return pr(id);
  };
  vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(requireLocal, mod, mod.exports);
  return mod.exports;
}

function accountRoute(env = {}, options = {}) {
  const state = { databaseCalls: 0, subscriptionCalls: 0 };
  const unavailable = () => Object.assign(new Error('Unavailable'), { status: 503 });
  const renewed = () => Object.assign(new Error('Renew session'), { status: 401 });
  const progress = {
    requireAccountSession() { if (options.unsigned) throw renewed(); return { email: 'buyer@example.invalid' }; },
    getAccountDatabase() {
      state.databaseCalls++;
      return { from(table) {
        assert.equal(table, 'userprofile');
        return { select() { return this; }, ilike(column, email) {
          assert.equal(column, 'email'); assert.equal(email, 'buyer@example.invalid'); return this;
        }, async maybeSingle() { return { data: options.missingProfile ? null : {
          email: 'buyer@example.invalid', is_premium: false, is_admin: false,
        }, error: null }; } };
      } };
    },
    accountJson: data => Response.json(data),
    accountErrorResponse: error => Response.json({ error: 'Account unavailable' }, { status: error.status || 503 }),
    accountUnavailable: unavailable, sessionRenewalRequired: renewed,
  };
  const context = vm.createContext({ process: { env }, Response });
  const route = load('app/api/account/route.js', {
    '../../../lib/course-progress-server': progress,
    '../../../lib/subscription-access': { async resolveSubscriptionAccess() {
      state.subscriptionCalls++; return { paid: true, paidUntil: null, accessType: 'trial', status: 'ACTIVE' };
    } },
  }, context);
  return { state, run: () => route.GET({}) };
}

function renderAccount(paypalManagementUrl, overrides = {}) {
  const account = { email: 'buyer@example.invalid', paid: true, admin: false,
    accessType: 'trial', subscriptionStatus: 'ACTIVE', paypalManagementUrl, ...overrides };
  const context = vm.createContext({ Date });
  const Page = load('pages/konto.js', {
    'next/link': ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
    '../components/AccountLayout': { __esModule: true, default: ({ children }) => React.createElement(React.Fragment, null, children),
      AccountError: () => null, ProgressError: () => null },
    '../hooks/useAccountOverview': () => ({ account, progress: [], accountError: null, progressError: null,
      loading: false, progressLoading: false, reload() {} }),
    '../lib/account-page': { getAccountPageProps() {} },
    '../lib/course-catalog': { courses: [] },
    '../styles/Account.module.css': { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) },
  }, context).default;
  return renderToStaticMarkup(React.createElement(Page));
}

test('Account API chooses the Sandbox administration target only from private test mode', async () => {
  for (const [env, expected] of [[{}, LIVE], [{ JL_TEST_ENVIRONMENT: 'paypal-sandbox' }, SANDBOX],
    [{ NEXT_PUBLIC_TEST_ENVIRONMENT: 'paypal-sandbox', NEXT_PUBLIC_PAYMENT_URL: SANDBOX }, LIVE]]) {
    const ctx = accountRoute(env); const response = await ctx.run();
    assert.equal(response.status, 200); const data = await response.json();
    assert.equal(data.account.paypalManagementUrl, expected);
    assert.equal(data.account.email, 'buyer@example.invalid'); assert.equal(data.account.accessType, 'trial');
    assert.equal(ctx.state.subscriptionCalls, 1);
  }
});

test('Unknown private mode fails closed and ordinary account access checks remain required', async () => {
  const unknown = accountRoute({ JL_TEST_ENVIRONMENT: 'unexpected' });
  assert.equal((await unknown.run()).status, 503); assert.equal(unknown.state.databaseCalls, 0);
  for (const options of [{ unsigned: true }, { missingProfile: true }]) {
    const ctx = accountRoute({ JL_TEST_ENVIRONMENT: 'paypal-sandbox' }, options);
    const response = await ctx.run(); assert.equal(response.status, 401);
    assert.equal(ctx.state.subscriptionCalls, 0); assert.equal((await response.json()).account, undefined);
  }
});

test('Account page renders either exact server target without redirecting Sandbox learners to live PayPal', () => {
  for (const url of [LIVE, SANDBOX]) {
    const html = renderAccount(url);
    assert.ok(html.includes(`href="${url}"`)); assert.match(html, /Abo bei PayPal verwalten/);
    assert.ok(!html.includes(`href="${url === LIVE ? SANDBOX : LIVE}"`));
  }
});

test('Missing or untrusted account target never creates a live fallback administration link', () => {
  for (const url of [undefined, null, '', 'javascript:alert(1)', '//www.paypal.com/myaccount/autopay/',
    'https://www.paypal.com/myaccount/autopay/?next=unsafe', 'https://www.sandbox.paypal.com.evil.invalid/myaccount/autopay/']) {
    assert.doesNotMatch(renderAccount(url), /Abo bei PayPal verwalten/);
  }
  assert.doesNotMatch(renderAccount(SANDBOX, { admin: true }), /Abo bei PayPal verwalten/);
});
