// Actual POST, current-admin guard and notification drain. No real DB, SMTP or accounts.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), local = require('node:module').createRequire(path.join(root, 'package.json'));
const swc = local('next/dist/build/swc');
const email = 'operator@example.invalid', generation = '11111111-1111-4111-8111-111111111111';
const syntheticProcess = { env: { NODE_ENV: 'production', VERCEL_ENV: 'production', PAYPAL_API_BASE: 'https://api-m.paypal.com' } };

function fixture({ invalidateAt, deletion = false, initialAdmin = true, failRelease = false, failMail = false, suppress = false } = {}) {
  let admin = initialAdmin, exists = true, claimed = 0, current = 0, profiles = 0;
  const mails = [], rpcCalls = [], finishes = [], events = [], cache = new Map();
  function step(name) { events.push(name); if (name === invalidateAt) { if (deletion) exists = false; else admin = false; } }
  const database = {
    from(table) {
      assert.equal(table, 'userprofile');
      return { select() { return this; }, ilike() { return this; }, async maybeSingle() {
        profiles++; step('profile:' + profiles);
        return { data: exists ? { email, account_generation: generation, is_admin: admin } : null, error: null };
      } };
    },
    async rpc(name, args) {
      rpcCalls.push(name);
      if (name === 'operator_trial_notification_status') { step('status'); return { data: { enabled_since: '2026-10-27T08:00:00Z', pending_count: 2, sent_count: 0 }, error: null }; }
      if (name === 'reconcile_operator_trial_notifications') { step('reconcile'); return { data: {}, error: null }; }
      if (name === 'claim_operator_trial_notification') {
        if (claimed >= 2) return { data: null, error: null };
        step('claim:' + ++claimed);
        return { data: { id: `22222222-2222-4222-8222-${String(claimed).padStart(12, '0')}`, lease_token: '33333333-3333-4333-8333-333333333333',
          account_generation: generation, account_email: 'synthetic-customer@example.invalid', provider: 'paypal', environment: 'Production',
          trial_started_at: '2026-10-27T08:00:00Z', trial_until: '2026-10-30T08:00:00Z' }, error: null };
      }
      if (name === 'operator_trial_notification_claim_current') { step('current:' + ++current); return { data: !suppress, error: null }; }
      if (name === 'finish_operator_trial_notification') {
        finishes.push(args); step('finish:' + finishes.length);
        return { data: !failRelease, error: failRelease ? { message: 'Isolated unavailable database' } : null };
      }
      throw Error('Unexpected RPC ' + name);
    },
  };
  const overrides = {
    'lib/course-progress-server.js': { requireAccountSession() { return { email, accountGeneration: generation }; }, getAccountDatabase() { return database; },
      accountUnavailable: () => Object.assign(Error('Unavailable'), { status: 503 }), sessionRenewalRequired: () => Object.assign(Error('Renewal'), { status: 401 }) },
    'lib/account-session.js': { normalizeAccountEmail: value => typeof value === 'string' ? value.trim().toLowerCase() : '' },
    'lib/apple-review-login.js': { ReviewLoginError: class ReviewLoginError extends Error {}, requireReviewSessionIdentity: async () => {} },
    'lib/test-environment.js': { isPayPalSandboxTestEnvironment: () => false, loginMailSenderAddress: () => 'noreply@example.invalid',
      loginMailTransportOptions: () => ({ host: 'smtp.example.invalid', port: 587, auth: { user: 'synthetic', pass: 'synthetic' } }) },
    'lib/email.js': { safeLoginMailDiagnostic: () => ({ category: 'synthetic', stage: 'delivery' }) },
  };
  function load(file) {
    file = file.replace(/\\/g, '/');
    if (Object.hasOwn(overrides, file)) return overrides[file];
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} }; cache.set(file, mod);
    const { code } = swc.transformSync(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', 'process', code)(id => {
      if (id === '@vercel/functions') return { getDeadline: () => null, waitUntil() { throw Error('No background work allowed in this test'); } };
      if (id === 'nodemailer') return { createTransport() { return { close() {}, async sendMail(message) {
        step('smtp:' + (mails.length + 1)); mails.push(message);
        if (failMail) throw Object.assign(Error('Isolated SMTP failure'), { code: 'EAUTH' });
        return { accepted: ['info@jagdlatein.de'] };
      } }; } };
      if (id.startsWith('.')) return load(path.posix.normalize(path.posix.join(path.posix.dirname(file), path.posix.extname(id) ? id : id + '.js')));
      throw Error('Unexpected external dependency ' + id);
    }, mod, mod.exports, syntheticProcess);
    return mod.exports;
  }
  return { mails, finishes, rpcCalls, events, get profiles() { return profiles; },
    drain: options => load('lib/operator-trial-notifications.js').drainOperatorTrialNotifications({ database, limit: 2, ...options }),
    async post() { return load('app/api/admin/trials/route.js').POST(new Request('https://jagdlatein.invalid/api/admin/trials', {
      method: 'POST', headers: { origin: 'https://jagdlatein.invalid', 'content-type': 'application/json' }, body: '{}',
    })); },
  };
}

test('A current administrator sends two existing notices with fresh role reads immediately before each SMTP call', async () => {
  const h = fixture(), response = await h.post(), body = await response.json();
  assert.equal(response.status, 200); assert.equal(h.mails.length, 2); assert.equal(h.profiles, 4);
  assert.deepEqual(body.delivery, { processed: 2, sent: 2, retry: 0, suppressed: 0 });
  assert.ok(h.mails.every(message => message.to === 'info@jagdlatein.de'));
  assert.deepEqual(h.finishes.map(item => item.p_state), ['sent', 'sent']);
  for (const [index, event] of h.events.entries()) if (event.startsWith('smtp:')) assert.match(h.events[index - 1], /^profile:/);
});

test('An already revoked administrator cannot read or mutate the outbox', async () => {
  const h = fixture({ initialAdmin: false }); assert.equal((await h.post()).status, 403);
  assert.equal(h.mails.length, 0); assert.equal(h.rpcCalls.length, 0);
});

for (const deletion of [false, true]) for (const invalidateAt of ['status', 'reconcile', 'claim:1', 'current:1'])
test(`${deletion ? 'Deletion' : 'Role revocation'} at ${invalidateAt} blocks the first SMTP call and propagates authorization failure`, async () => {
  const h = fixture({ invalidateAt, deletion }), response = await h.post();
  assert.equal(response.status, deletion ? 401 : 403); assert.equal(h.mails.length, 0); assert.equal(h.profiles, 2);
  assert.deepEqual(h.finishes.map(item => item.p_state), ['retry']);
  assert.equal(h.finishes[0].p_diagnostic, 'authorization:unavailable');
  assert.equal(h.rpcCalls.filter(name => name === 'claim_operator_trial_notification').length, 1);
});

for (const deletion of [false, true]) for (const invalidateAt of ['finish:1', 'claim:2', 'current:2'])
test(`${deletion ? 'Deletion' : 'Role revocation'} at ${invalidateAt} cannot dispatch the second notice`, async () => {
  const h = fixture({ invalidateAt, deletion }), response = await h.post();
  assert.equal(response.status, deletion ? 401 : 403); assert.equal(h.mails.length, 1);
  assert.deepEqual(h.finishes.map(item => item.p_state), ['sent', 'retry']);
  assert.equal(h.finishes[1].p_diagnostic, 'authorization:unavailable');
});

test('A failed claim release cannot hide the original authorization error or acknowledge an unsent mail', async () => {
  const h = fixture({ invalidateAt: 'current:1', deletion: true, failRelease: true });
  assert.equal((await h.post()).status, 401); assert.equal(h.mails.length, 0);
  assert.deepEqual(h.finishes.map(item => item.p_state), ['retry']);
});

test('A non-user worker without the optional callback retains its existing two-notice delivery and counts', async () => {
  const h = fixture(), result = await h.drain();
  assert.deepEqual(result, { processed: 2, sent: 2, retry: 0, suppressed: 0 }); assert.equal(h.mails.length, 2); assert.equal(h.profiles, 0);
});

test('Current-account suppression and ordinary SMTP failure preserve existing claim/finish/retry behavior', async () => {
  const suppressed = fixture({ suppress: true }), first = await suppressed.drain({ authorizeSend() { throw Error('No send boundary for a suppressed claim'); } });
  assert.deepEqual(first, { processed: 2, sent: 0, retry: 0, suppressed: 2 }); assert.equal(suppressed.mails.length, 0);
  assert.deepEqual(suppressed.finishes.map(item => item.p_state), ['suppressed', 'suppressed']);
  const failure = fixture({ failMail: true }), second = await failure.drain();
  assert.deepEqual(second, { processed: 1, sent: 0, retry: 1, suppressed: 0 }); assert.equal(failure.mails.length, 1);
  assert.deepEqual(failure.finishes.map(item => [item.p_state, item.p_diagnostic]), [['retry', 'synthetic:delivery']]);
});

test('An authorization outage propagates its original error after retry release; invalid callback types do no outbox work', async () => {
  const h = fixture(), error = Object.assign(Error('Synthetic authorization outage'), { status: 503 });
  await assert.rejects(h.drain({ authorizeSend: async () => { throw error; } }), failure => failure === error);
  assert.equal(h.mails.length, 0); assert.deepEqual(h.finishes.map(item => item.p_state), ['retry']);
  const invalid = fixture(); await assert.rejects(invalid.drain({ authorizeSend: true }), failure => failure.status === 503);
  assert.equal(invalid.rpcCalls.length, 0);
});
