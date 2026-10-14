// Actual isolated PostgreSQL migrations plus fake SMTP/Vercel waitUntil(). No network,
// email, provider account or real database is used by this regression suite.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const pglitePath = process.env.JL_PAYPAL_TEST_PGLITE_PATH || path.join(process.env.LOCALAPPDATA || '', 'Jagdlatein/paypal-sandbox/test-runtime/node_modules/@electric-sql/pglite');
const { PGlite } = require(pglitePath);
const EMAIL = 'trial-customer@example.invalid';
const GENERATION = '11111111-1111-4111-8111-111111111111';
const OTHER_GENERATION = '22222222-2222-4222-8222-222222222222';
const TOKEN = '33333333-3333-4333-8333-333333333333';
const CONTRACT = 'I-TRIALNOTICE1234', ORIGINAL = '2000000001', TRANSACTION = '2000000002';
const LIVE_ENV = { NODE_ENV: 'production', VERCEL_ENV: 'production', SMTP_HOST: 'asmtp.mail.hostpoint.ch', SMTP_PORT: '587',
  SMTP_USER: 'info@jagdlatein.de', SMTP_PASS: 'offline-test-only', MAIL_FROM: 'info@jagdlatein.de', PAYPAL_API_BASE: 'https://api-m.paypal.com' };
const migration = () => fs.readFileSync(path.join(root, 'supabase/migrations/20261014110000_operator_trial_notifications.sql'), 'utf8');
let pg;

function library({ env = LIVE_ENV, failMail = false, rejectRecipient = false, throwWaitUntil = false, noContext = false,
  shortDeadline = false, databaseOverride = null } = {}) {
  const callbacks = [], mails = [], transports = [], logs = [], calls = [];
  const cache = new Map();
  const db = databaseOverride || {
    async rpc(name, args = {}) {
      calls.push([name, args]);
      const names = { queue_operator_trial_notification: ['p_provider', 'p_environment', 'p_contract_id'],
        reconcile_operator_trial_notifications: ['p_limit'], operator_trial_notification_status: [],
        claim_operator_trial_notification: [], operator_trial_notification_claim_current: ['p_id', 'p_lease_token'],
        finish_operator_trial_notification: ['p_id', 'p_lease_token', 'p_state', 'p_diagnostic'] };
      assert.ok(Object.hasOwn(names, name));
      const keys = names[name];
      try {
        const result = await pg.query(`SELECT public.${name}(${keys.map((_, i) => `$${i + 1}`).join(',')}) AS data`, keys.map(key => args[key]));
        return { data: result.rows[0].data, error: null };
      } catch (error) { return { data: null, error }; }
    },
  };
  const context = vm.createContext({ process: { env }, Buffer, Date, URL, Response, AbortSignal, setTimeout, clearTimeout,
    console: { error(...args) { logs.push(args); } } });
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} }; cache.set(filename, mod);
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename,
      jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
    const req = id => {
      if (id === '@vercel/functions') return {
        getDeadline() { return noContext ? undefined : new Date(Date.now() + (shortDeadline ? 1000 : 300000)); },
        waitUntil(task) { if (throwWaitUntil) throw Error('No request context'); callbacks.push(task); },
      };
      if (id === 'nodemailer') return { createTransport(options) {
        transports.push(options);
        return { close() {}, async sendMail(message) {
          mails.push(message);
          if (failMail) throw Object.assign(Error('secret password/customer contents must stay private'), { code: 'EAUTH', command: 'AUTH PLAIN', responseCode: 535 });
          return { accepted: rejectRecipient ? [] : ['info@jagdlatein.de'] };
        } };
      } };
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), `${id}.js`)));
      return pr(id);
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(req, mod, mod.exports);
    return mod.exports;
  }
  return { lib: load('lib/operator-trial-notifications.js'), db, callbacks, mails, transports, logs, calls };
}

test.before(async () => {
  pg = new PGlite();
  await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
  await pg.exec(fs.readFileSync(path.join(root, 'supabase/test-only/paypal-sandbox-bootstrap.sql'), 'utf8'));
  await pg.exec('CREATE TABLE public.push_tokens(token text PRIMARY KEY,platform text,enabled boolean,updated_at timestamptz);');
  for (const file of ['20261003_course_progress.sql','20261003160000_activity_results.sql','20261004100000_ranked_quiz.sql',
    '20261004110000_subscription_access.sql','20261004120000_secure_private_tables.sql','20261004130000_subscription_trial.sql',
    '20261004190000_learning_community.sql','20261007105000_account_registration.sql','20261007110000_apple_subscriptions.sql',
    '20261007120000_account_deletion.sql','20261008120000_apple_refund_ordering.sql','20261008140000_community_blocks.sql',
    '20261008150000_apple_review_login_rate_limits.sql','20261008160000_community_premoderation.sql','20261008170000_community_moderators.sql',
    '20261009210000_paypal_account_generation.sql','20261009220000_complete_account_deletion.sql'])
    await pg.exec(fs.readFileSync(path.join(root, 'supabase/migrations', file), 'utf8'));
  await pg.exec(migration());
});
test.after(async () => { await pg?.close(); });

async function fixture({ historical = false, status = 'ACTIVE', reviewReason = null, trial = true } = {}) {
  await pg.exec('TRUNCATE public.apple_account_tokens,public.userprofile CASCADE;');
  await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation) VALUES(gen_random_uuid(),$1,$2),(gen_random_uuid(),$3,$4)',
    [EMAIL, GENERATION, 'other@example.invalid', OTHER_GENERATION]);
  await pg.exec("UPDATE public.operator_trial_notification_settings SET enabled_since=clock_timestamp()-interval '5 minutes';");
  const now = Date.now(), start = now - (historical ? 86400000 : 60000), end = start + 3 * 86400000;
  await pg.query("INSERT INTO public.paypal_subscriptions(subscription_id,account_email,account_generation,plan_id,status,verified_at,trial_started_at,trial_until,review_reason) VALUES($1,$2,$3,'P-TRIAL123456',$4,now(),$5,$6,$7)",
    [CONTRACT, EMAIL, GENERATION, status, trial ? new Date(start).toISOString() : null, trial ? new Date(end).toISOString() : null, reviewReason]);
  return { start, end };
}
async function seedApple(environment = 'Production', { isTrial = true, revoked = false, upgraded = false } = {}) {
  await pg.query('INSERT INTO public.apple_account_tokens(app_account_token,account_email,account_generation) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [TOKEN, EMAIL, GENERATION]);
  await pg.query('INSERT INTO public.apple_subscriptions(environment,original_transaction_id,app_account_token,latest_transaction_id,status,auto_renew,access_until,is_trial,verified_at) VALUES($1,$2,$3,$4,1,true,now()+interval\'3 days\',$5,now())',
    [environment, ORIGINAL, TOKEN, TRANSACTION, isTrial]);
  await pg.query('INSERT INTO public.apple_subscription_transactions(environment,transaction_id,original_transaction_id,app_account_token,product_id,purchased_at,expires_at,signed_at,revoked_at,is_upgraded,is_trial) VALUES($1,$2,$3,$4,\'de.jagdlatein.premium.monthly\',now()-interval\'1 minute\',now()+interval\'3 days\',now(),$5,$6,$7)',
    [environment, TRANSACTION, ORIGINAL, TOKEN, revoked ? new Date().toISOString() : null, upgraded, isTrial]);
}
async function queue(provider = 'paypal', environment = 'Production', id = CONTRACT) {
  return (await pg.query('SELECT public.queue_operator_trial_notification($1,$2,$3) AS data', [provider, environment, id])).rows[0].data;
}
async function outbox() { return (await pg.query('SELECT * FROM public.operator_trial_notification_outbox ORDER BY created_at,id')).rows; }

test('Migration pins enable time on rerun and exposes no email column or client permissions', async () => {
  const before = (await pg.query('SELECT enabled_since FROM public.operator_trial_notification_settings')).rows[0].enabled_since;
  await pg.exec(migration());
  assert.equal((await pg.query('SELECT enabled_since FROM public.operator_trial_notification_settings')).rows[0].enabled_since.toISOString(), before.toISOString());
  const columns = (await pg.query("SELECT column_name FROM information_schema.columns WHERE table_name='operator_trial_notification_outbox'")).rows.map(row => row.column_name);
  assert.equal(columns.some(name => name.includes('email')), false);
  for (const role of ['anon', 'authenticated']) {
    const permission = (await pg.query("SELECT has_table_privilege($1,'public.operator_trial_notification_outbox','SELECT') AS read,has_function_privilege($1,'public.queue_operator_trial_notification(text,text,text)','EXECUTE') AS queue", [role])).rows[0];
    assert.deepEqual(permission, { read: false, queue: false });
  }
});

test('Queue proves a current production trial in stored ledger and retries create exactly one notice', async () => {
  await fixture();
  assert.deepEqual(await queue(), { queued: true, suppressed: false });
  assert.deepEqual(await queue(), { queued: false, suppressed: false });
  assert.equal((await outbox()).length, 1);
  assert.equal((await outbox())[0].account_generation, GENERATION);
});

test('Historical restoration, pending approval, quarantine, unknown contract and Sandbox cannot enqueue', async () => {
  await fixture({ historical: true });
  assert.equal((await queue()).suppressed, true);
  for (const change of [{ status: 'APPROVAL_PENDING' }, { status: 'SUSPENDED' }, { reviewReason: 'trial_schedule_changed' }, { trial: false }]) {
    await fixture(change);
    assert.equal((await queue()).suppressed, true);
  }
  await fixture();
  assert.equal((await queue('paypal', 'Sandbox')).suppressed, true);
  assert.equal((await queue('paypal', 'Production', 'I-UNKNOWN1234')).suppressed, true);
  assert.equal((await outbox()).length, 0);
});

test('Only verified current Apple free-trial evidence queues; review and TestFlight Sandbox stay excluded', async () => {
  await fixture(); await seedApple();
  assert.equal((await queue('apple', 'Production', ORIGINAL)).queued, true);
  assert.equal((await queue('apple', 'Production', ORIGINAL)).queued, false);
  for (const options of [{ isTrial: false }, { revoked: true }, { upgraded: true }]) {
    await fixture(); await seedApple('Production', options);
    assert.equal((await queue('apple', 'Production', ORIGINAL)).suppressed, true);
  }
  await fixture(); await seedApple('Sandbox');
  assert.equal((await queue('apple', 'Sandbox', ORIGINAL)).suppressed, true);
  assert.equal((await queue('apple', 'Production', ORIGINAL)).suppressed, true);
});

test('Missed PayPal queuing catches a confirmed start after cancellation or paid conversion, but not pending dates', async () => {
  await fixture({ status: 'APPROVAL_PENDING' });
  assert.equal((await pg.query('SELECT trial_activated_at FROM public.paypal_subscriptions')).rows[0].trial_activated_at, null);
  assert.equal((await queue()).suppressed, true);
  await pg.exec("UPDATE public.paypal_subscriptions SET status='ACTIVE',verified_at=clock_timestamp();");
  const first = (await pg.query('SELECT trial_activated_at FROM public.paypal_subscriptions')).rows[0].trial_activated_at;
  assert.ok(first);
  await pg.exec("UPDATE public.paypal_subscriptions SET status='CANCELLED',verified_at=clock_timestamp();");
  const ctx = library(); const cancelled = await ctx.lib.drainOperatorTrialNotifications({ database: ctx.db });
  assert.equal(cancelled.sent, 1); assert.equal((await outbox()).length, 1);
  assert.equal((await pg.query('SELECT trial_activated_at FROM public.paypal_subscriptions')).rows[0].trial_activated_at.toISOString(), first.toISOString());
  await fixture();
  await pg.exec("UPDATE public.paypal_subscriptions SET paid_until=clock_timestamp()+interval'1 month';");
  assert.equal((await queue()).queued, true);
  await fixture({ status: 'APPROVAL_PENDING' });
  await pg.exec("UPDATE public.paypal_subscriptions SET status='CANCELLED',verified_at=clock_timestamp();");
  assert.equal((await queue()).suppressed, true);
});

test('Missed Apple queuing uses verified free-trial history after conversion or expiry, not latest paid metadata', async () => {
  await fixture(); await seedApple();
  await pg.query("INSERT INTO public.apple_subscription_transactions(environment,transaction_id,original_transaction_id,app_account_token,product_id,purchased_at,expires_at,signed_at,is_upgraded,is_trial) VALUES('Production','2000000003',$1,$2,'de.jagdlatein.premium.monthly',now(),now()+interval'1 month',now(),false,false)", [ORIGINAL, TOKEN]);
  await pg.exec("UPDATE public.apple_subscriptions SET latest_transaction_id='2000000003',is_trial=false,access_until=clock_timestamp()+interval'1 month';");
  const ctx = library(); assert.equal((await ctx.lib.drainOperatorTrialNotifications({ database: ctx.db })).sent, 2);
  assert.ok((await outbox()).some(row => row.provider === 'apple'));
  // One PayPal fixture trial is also reconciled, so both provider starts exist.
  assert.equal((await outbox()).length, 2);
  await fixture({ historical: true }); await seedApple();
  await pg.exec("UPDATE public.operator_trial_notification_settings SET enabled_since=clock_timestamp()-interval'7 days';");
  await pg.exec("UPDATE public.apple_subscription_transactions SET purchased_at=clock_timestamp()-interval'4 days',expires_at=clock_timestamp()-interval'1 day';");
  await pg.exec("UPDATE public.apple_subscriptions SET status=2,access_until=NULL,is_trial=false,verified_at=clock_timestamp();");
  assert.equal((await queue('apple', 'Production', ORIGINAL)).queued, true);
  await fixture(); await seedApple();
  await pg.exec("UPDATE public.apple_subscription_transactions SET purchased_at=clock_timestamp()-interval'1 day';");
  assert.equal((await queue('apple', 'Production', ORIGINAL)).suppressed, true);
});

test('Atomic lease stops concurrent normal delivery, rejects stale acknowledgements and can recover expiry', async () => {
  await fixture(); await queue();
  const first = (await pg.query('SELECT public.claim_operator_trial_notification() AS data')).rows[0].data;
  assert.ok(first.lease_token); assert.equal(first.account_email, EMAIL);
  assert.equal((await pg.query('SELECT public.claim_operator_trial_notification() AS data')).rows[0].data, null);
  assert.equal((await pg.query("SELECT public.finish_operator_trial_notification($1,$2,'sent') AS ok", [first.id, OTHER_GENERATION])).rows[0].ok, false);
  await pg.exec("UPDATE public.operator_trial_notification_outbox SET lease_until=clock_timestamp()-interval'1 second';");
  const recovered = (await pg.query('SELECT public.claim_operator_trial_notification() AS data')).rows[0].data;
  assert.notEqual(recovered.lease_token, first.lease_token); assert.equal(recovered.attempt_count, 2);
  assert.equal((await pg.query("SELECT public.finish_operator_trial_notification($1,$2,'sent') AS ok", [first.id, first.lease_token])).rows[0].ok, false);
  assert.equal((await pg.query("SELECT public.finish_operator_trial_notification($1,$2,'sent') AS ok", [recovered.id, recovered.lease_token])).rows[0].ok, true);
  assert.equal((await pg.query('SELECT public.claim_operator_trial_notification() AS data')).rows[0].data, null);
});

test('Status is read only and missing migration or SMTP is shown as not configured', async () => {
  await fixture();
  const ctx = library();
  const status = await ctx.lib.getOperatorTrialNotificationStatus(ctx.db);
  assert.equal(status.configured, true); assert.equal(status.pendingCount, 0); assert.equal(status.sentCount, 0);
  assert.equal(status.recipient, 'info@jagdlatein.de'); assert.ok(status.enabledSince);
  assert.deepEqual(ctx.calls.map(call => call[0]), ['operator_trial_notification_status']);
  assert.equal(ctx.mails.length, 0); assert.equal((await outbox()).length, 0);
  const missing = library({ databaseOverride: { async rpc() { return { error: { code: 'PGRST202', message: 'private server detail' } }; } } });
  const absent = await missing.lib.getOperatorTrialNotificationStatus(missing.db);
  assert.equal(absent.configured, false); assert.equal(absent.enabledSince, null); assert.equal(absent.pendingCount, null);
  const noSmtp = library({ env: { ...LIVE_ENV, SMTP_PASS: '' } });
  assert.equal((await noSmtp.lib.getOperatorTrialNotificationStatus(noSmtp.db)).configured, false);
});

test('Production drain catches up a missed hook and sends only one fixed-recipient TLS email', async () => {
  await fixture();
  const ctx = library();
  const first = await ctx.lib.drainOperatorTrialNotifications({ database: ctx.db });
  assert.deepEqual(JSON.parse(JSON.stringify(first)), { processed: 1, sent: 1, retry: 0, suppressed: 0 });
  assert.equal(ctx.mails.length, 1); assert.equal(ctx.mails[0].to, 'info@jagdlatein.de');
  assert.match(ctx.mails[0].text, /trial-customer@example\.invalid/); assert.match(ctx.mails[0].text, /Europe\/Zurich/);
  assert.equal(Object.hasOwn(ctx.mails[0], 'html'), false); assert.match(ctx.mails[0].messageId, /jagdlatein-trial/);
  assert.equal(ctx.transports[0].requireTLS, true); assert.equal(ctx.transports[0].tls.rejectUnauthorized, true);
  const second = await ctx.lib.drainOperatorTrialNotifications({ database: ctx.db });
  assert.equal(second.sent, 0); assert.equal(ctx.mails.length, 1); assert.equal((await outbox())[0].state, 'sent');
});

test('SMTP failure schedules safe retry and never writes provider message or credentials', async () => {
  await fixture();
  const ctx = library({ failMail: true });
  const result = await ctx.lib.drainOperatorTrialNotifications({ database: ctx.db });
  assert.equal(result.retry, 1); assert.equal(result.sent, 0);
  const row = (await outbox())[0]; assert.equal(row.state, 'retry'); assert.equal(row.lease_token, null);
  assert.equal(row.diagnostic, 'auth:authentication:535'); assert.ok(Date.parse(row.next_attempt_at) > Date.now());
  assert.equal(JSON.stringify(row).includes('secret password'), false); assert.equal(ctx.logs.length, 0);
  await ctx.lib.drainOperatorTrialNotifications({ database: ctx.db });
  assert.equal(ctx.mails.length, 1);
  await pg.exec("UPDATE public.operator_trial_notification_outbox SET next_attempt_at=clock_timestamp()-interval'1 second';");
  const retried = library(); await retried.lib.drainOperatorTrialNotifications({ database: retried.db });
  assert.equal((await outbox())[0].state, 'sent'); assert.equal(retried.mails[0].messageId, ctx.mails[0].messageId);
});

test('A recipient refusal is not recorded as delivered', async () => {
  await fixture(); const ctx = library({ rejectRecipient: true });
  const result = await ctx.lib.drainOperatorTrialNotifications({ database: ctx.db });
  assert.equal(result.retry, 1); assert.equal((await outbox())[0].state, 'retry');
});

test('Sandbox, Preview, development, test mode and sandbox PayPal cannot send customer alerts', async () => {
  await fixture(); await queue();
  for (const change of [{ JL_TEST_ENVIRONMENT: 'paypal-sandbox' }, { VERCEL_ENV: 'preview' }, { VERCEL_ENV: undefined }, { NODE_ENV: 'development' },
    { NODE_ENV: 'test' }, { PAYPAL_API_BASE: 'https://api-m.sandbox.paypal.com' }]) {
    const ctx = library({ env: { ...LIVE_ENV, ...change } });
    ctx.lib.scheduleOperatorTrialNotification(ctx.db, { provider: 'paypal', environment: 'Production', contractId: CONTRACT });
    await ctx.lib.drainOperatorTrialNotifications({ database: ctx.db });
    assert.equal(ctx.callbacks.length, 0); assert.equal(ctx.calls.length, 0); assert.equal(ctx.mails.length, 0);
  }
  const ctx = library(); ctx.lib.scheduleOperatorTrialNotification(ctx.db, { provider: 'apple', environment: 'Sandbox', contractId: ORIGINAL });
  assert.equal(ctx.callbacks.length, 0);
});

test('Vercel waitUntil binds the lazy queue/delivery task; missing infrastructure never rejects successful billing', async () => {
  await fixture(); const ctx = library();
  ctx.lib.scheduleOperatorTrialNotification(ctx.db, { provider: 'paypal', environment: 'Production', contractId: CONTRACT });
  assert.equal(ctx.callbacks.length, 1); assert.equal(ctx.calls.length, 0); assert.equal(ctx.mails.length, 0);
  await ctx.callbacks[0]; assert.equal(ctx.mails.length, 1);
  const queueCall = ctx.calls.find(call => call[0] === 'queue_operator_trial_notification');
  assert.deepEqual(JSON.parse(JSON.stringify(queueCall[1])), { p_provider: 'paypal', p_environment: 'Production', p_contract_id: CONTRACT });
  const unavailable = library({ databaseOverride: { async rpc() { throw Error('private key/email provider message'); } } });
  assert.doesNotThrow(() => unavailable.lib.scheduleOperatorTrialNotification(unavailable.db, { provider: 'paypal', environment: 'Production', contractId: CONTRACT }));
  await unavailable.callbacks[0]; assert.equal(unavailable.mails.length, 0);
  assert.equal(JSON.stringify(unavailable.logs).includes('private key'), false);
  const noRequest = library({ throwWaitUntil: true });
  assert.doesNotThrow(() => noRequest.lib.scheduleOperatorTrialNotification(noRequest.db, { provider: 'paypal', environment: 'Production', contractId: CONTRACT }));
  assert.equal(noRequest.calls.length, 0); assert.equal(noRequest.mails.length, 0);
});

test('Missing runtime context or insufficient deadline never starts detached SMTP or database work', async () => {
  await fixture();
  for (const option of [{ noContext: true }, { shortDeadline: true }, { throwWaitUntil: true }]) {
    const ctx = library(option);
    ctx.lib.scheduleOperatorTrialNotification(ctx.db, { provider: 'paypal', environment: 'Production', contractId: CONTRACT });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(ctx.calls.length, 0); assert.equal(ctx.mails.length, 0); assert.equal(ctx.callbacks.length, 0);
  }
});

test('The actual generation-bound account deletion cascades queued/sent notices and keeps other accounts', async () => {
  await fixture(); await queue(); await seedApple(); await queue('apple', 'Production', ORIGINAL);
  await pg.query("INSERT INTO public.operator_trial_notification_outbox(provider,environment,contract_id,account_generation,trial_started_at,trial_until) VALUES('paypal','Production','I-OTHERTRIAL123',$1,now(),now()+interval'3 days')", [OTHER_GENERATION]);
  const claimed = (await pg.query('SELECT public.claim_operator_trial_notification() AS data')).rows[0].data;
  const result = (await pg.query('SELECT public.delete_jagdlatein_account($1,$2::uuid) AS data', [EMAIL, GENERATION])).rows[0].data;
  assert.equal(result.deleted, true);
  assert.equal((await pg.query('SELECT count(*) AS n FROM public.operator_trial_notification_outbox WHERE account_generation=$1', [GENERATION])).rows[0].n, 0);
  assert.equal((await outbox()).length, 1); assert.equal((await outbox())[0].account_generation, OTHER_GENERATION);
  assert.equal((await pg.query('SELECT public.operator_trial_notification_claim_current($1,$2) AS current', [claimed.id, claimed.lease_token])).rows[0].current, false);
  assert.equal((await queue()).suppressed, true); assert.equal((await queue('apple', 'Production', ORIGINAL)).suppressed, true);
  await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation) VALUES(gen_random_uuid(),$1,gen_random_uuid())', [EMAIL]);
  assert.equal((await queue()).suppressed, true);
});

test('Deletion still rejects any unrelated new FK rather than weakening the existing dependency audit', async () => {
  await fixture();
  await pg.exec('CREATE TABLE public.unreviewed_trial_dependency(account_generation uuid REFERENCES public.userprofile(account_generation) ON DELETE CASCADE);');
  try { await assert.rejects(pg.query('SELECT public.delete_jagdlatein_account($1,$2::uuid)', [EMAIL, GENERATION]), /unreviewed account dependency/); }
  finally { await pg.exec('DROP TABLE public.unreviewed_trial_dependency;'); }
  assert.equal((await pg.query('SELECT count(*) AS n FROM public.userprofile WHERE account_generation=$1', [GENERATION])).rows[0].n, 1);
});

test('An unknown cascade child of the new outbox is also blocked before actual account deletion', async () => {
  await fixture(); await queue();
  await pg.exec('CREATE TABLE public.unreviewed_notice_dependency(notice_id uuid REFERENCES public.operator_trial_notification_outbox(id) ON DELETE CASCADE);');
  try {
    await pg.exec('INSERT INTO public.unreviewed_notice_dependency SELECT id FROM public.operator_trial_notification_outbox;');
    await assert.rejects(pg.query('SELECT public.delete_jagdlatein_account($1,$2::uuid)', [EMAIL, GENERATION]), /unreviewed account dependency/);
    assert.equal((await pg.query('SELECT count(*) AS n FROM public.unreviewed_notice_dependency')).rows[0].n, 1);
  } finally { await pg.exec('DROP TABLE public.unreviewed_notice_dependency;'); }
  assert.equal((await outbox()).length, 1);
});
