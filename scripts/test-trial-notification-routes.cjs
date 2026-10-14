const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');

function load(relative, mocks = {}) {
  const filename = path.join(root, relative);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' },
  });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => mocks[id] || pr(id), mod, mod.exports);
  return mod.exports;
}
const worker = load('lib/operator-trial-worker.js');
const key = 'test-worker-key-12345678901234567890';
const headers = value => new Headers(value);
const request = (overrides = {}) => ({ url: 'https://local.invalid/api/admin/trials',
  headers: headers({ origin: 'https://local.invalid', 'content-type': 'application/json' }),
  text: async () => '{}', ...overrides });
const env = { NODE_ENV: 'production', VERCEL_ENV: 'production', CRON_SECRET: key };

test('Scheduled retry fails closed outside the production project and requires its separate exact credential', () => {
  const req = { headers: headers({ authorization: `Bearer ${key}` }) };
  assert.equal(worker.isOperatorTrialWorkerAuthorized(req, env), true);
  for (const override of [{ CRON_SECRET: '' }, { CRON_SECRET: 'short' }, { CRON_SECRET: key + '\n' },
    { NODE_ENV: 'development' }, { VERCEL_ENV: 'preview' }, { VERCEL_ENV: undefined }, { JL_TEST_ENVIRONMENT: 'paypal-sandbox' }]) {
    assert.equal(worker.isOperatorTrialWorkerAuthorized(req, { ...env, ...override }), false);
  }
  for (const authorization of ['', key, `Bearer ${key}wrong`, `bearer ${key}`, 'x'.repeat(301)])
    assert.equal(worker.isOperatorTrialWorkerAuthorized({ headers: headers({ authorization }) }, env), false);
});

class TrialError extends Error { constructor(code, status, message) { super(message); this.code = code; this.status = status; } }
const notifications = { configured: true, recipient: 'info@jagdlatein.de', pendingCount: 1, sentCount: 0 };
const delivery = { processed: 1, sent: 1, retry: 0, suppressed: 0 };
function adminHarness({ guardError = null, configured = true, mailError = null, revokeOnSecond = false } = {}) {
  const calls = [];
  const database = {};
  const route = load('app/api/admin/trials/route.js', {
    '../../../../lib/admin-trial-overview': {
      TrialOverviewError: TrialError,
      requireCurrentTrialAdmin: async () => { calls.push('guard');
        if (guardError || (revokeOnSecond && calls.filter(x => x === 'guard').length > 1))
          throw guardError || new TrialError('TRIAL_OVERVIEW_FORBIDDEN', 403, 'No access');
        return { database }; },
      readTrialOverviewOptions: () => ({}), getAdminTrialOverview: async () => { calls.push('read'); return { items: [] }; },
      trialOverviewJson: (data, status = 200) => Response.json(data, { status }),
      trialOverviewErrorResponse: error => Response.json({ code: error.code || 'UNAVAILABLE' }, { status: error.status || 503 }),
    },
    '../../../../lib/operator-trial-notifications': {
      getOperatorTrialNotificationStatus: async db => { assert.equal(db, database); calls.push('status'); return { ...notifications, configured }; },
      drainOperatorTrialNotifications: async value => { calls.push('drain'); assert.equal(value.database, database); assert.equal(value.limit, 2);
        if (mailError) throw mailError; return delivery; },
    },
  });
  return { route, calls };
}

test('Private overview GET never triggers notification delivery', async () => {
  const h = adminHarness();
  assert.equal((await h.route.GET(request())).status, 200);
  assert.deepEqual(h.calls, ['guard', 'read', 'guard']);
});
test('Only current admins can request delivery; unauthorized callers never touch the outbox', async () => {
  for (const status of [401, 403]) {
    const h = adminHarness({ guardError: new TrialError('DENIED', status, 'Denied') });
    assert.equal((await h.route.POST(request())).status, status);
    assert.deepEqual(h.calls, ['guard']);
  }
});
test('Operator delivery rejects foreign origins, non-JSON, oversized bodies and recipient overrides', async () => {
  for (const [override, status] of [
    [{ headers: headers({ origin: 'https://foreign.invalid', 'content-type': 'application/json' }) }, 403],
    [{ headers: headers({ 'content-type': 'application/json' }) }, 403],
    [{ headers: headers({ origin: 'https://local.invalid', 'content-type': 'text/plain' }) }, 415],
    [{ text: async () => '{"recipient":"other@example.invalid"}' }, 400],
    [{ text: async () => '{"limit":1000}' }, 400],
    [{ text: async () => 'x'.repeat(129) }, 400],
    [{ text: async () => 'null' }, 400], [{ text: async () => '[]' }, 400],
  ]) {
    const h = adminHarness();
    assert.equal((await h.route.POST(request(override))).status, status);
    assert.deepEqual(h.calls, ['guard']);
  }
});
test('Empty operator POST performs bounded work, rechecks admin access and returns delivery separately', async () => {
  const h = adminHarness(); const result = await h.route.POST(request());
  assert.equal(result.status, 200); assert.deepEqual(await result.json(), { notifications, delivery });
  assert.deepEqual(h.calls, ['guard', 'status', 'drain', 'guard', 'status']);
  const revoked = adminHarness({ revokeOnSecond: true });
  assert.equal((await revoked.route.POST(request())).status, 403);
});
test('Missing mail setup and SMTP errors return safe errors without changing the read-only overview', async () => {
  const missing = adminHarness({ configured: false });
  assert.equal((await missing.route.POST(request())).status, 503);
  assert.equal(missing.calls.includes('drain'), false);
  const failing = adminHarness({ mailError: new Error('private provider information') });
  const result = await failing.route.POST(request()); assert.equal(result.status, 503);
  assert.equal(JSON.stringify(await result.json()).includes('private provider'), false);
  assert.equal((await failing.route.GET(request())).status, 200);
});
test('The cron route reveals no customer information and cannot bypass authorization or missing setup', async () => {
  let allowed = false, configured = true, reads = 0, sends = 0;
  const route = load('app/api/internal/trial-notifications/route.js', {
    '../../../../lib/course-progress-server': { getAccountDatabase: () => { reads++; return {}; } },
    '../../../../lib/operator-trial-worker': { isOperatorTrialWorkerAuthorized: () => allowed },
    '../../../../lib/operator-trial-notifications': {
      getOperatorTrialNotificationStatus: async () => ({ configured }),
      drainOperatorTrialNotifications: async ({ limit }) => { sends++; assert.equal(limit, 10); return delivery; },
    },
  });
  assert.equal((await route.GET(request())).status, 401); assert.equal(reads, 0); assert.equal(sends, 0);
  allowed = true; configured = false;
  assert.equal((await route.GET(request())).status, 503); assert.equal(sends, 0);
  configured = true; const response = await route.GET(request());
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { delivery });
  assert.match(response.headers.get('cache-control'), /no-store/); assert.equal(response.headers.get('vary'), 'Authorization');
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
});
