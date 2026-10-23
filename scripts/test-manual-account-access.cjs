// Isolated PostgreSQL plus provider/database fakes only. No remote account,
// payment, email or real access grant is changed by this suite.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const { PGlite } = require(process.env.JL_PAYPAL_TEST_PGLITE_PATH || path.join(process.env.LOCALAPPDATA, 'Jagdlatein/paypal-sandbox/test-runtime/node_modules/@electric-sql/pglite'));
const EMAIL = 'courtesy@example.invalid', OTHER_EMAIL = 'other@example.invalid';
const GENERATION = '11111111-1111-4111-8111-111111111111', OTHER = '22222222-2222-4222-8222-222222222222';
const END = Date.parse('2026-10-31T23:00:00.000Z'), NOW = END - 86400000;
const migrationFile = '20261023210000_manual_account_access.sql';
const migration = () => fs.readFileSync(path.join(root, 'supabase/migrations', migrationFile), 'utf8');
const row = (changes = {}) => ({ account_generation: GENERATION, starts_at: new Date(NOW - 86400000).toISOString(),
  expires_at: new Date(END).toISOString(), owner: { email: EMAIL, account_generation: GENERATION }, ...changes });

function library({ apple = false, appleAccess = null } = {}) {
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} }; cache.set(filename, mod);
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename,
      jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
    const req = id => {
      if (id === '@supabase/supabase-js') return { createClient() { throw Error('No remote database allowed'); } };
      if (id.endsWith('/account-session')) return { normalizeAccountEmail(value) { return typeof value === 'string' ? value.trim().toLowerCase() : ''; } };
      if (id.endsWith('/operator-trial-notifications')) return { scheduleOperatorTrialNotification() { throw Error('No notification allowed'); } };
      if (id.endsWith('/webhook/_base')) return { paypalRequest() { throw Error('No provider allowed'); } };
      if (id.endsWith('/apple-subscriptions')) return { async resolveAppleSubscriptionAccess() { return appleAccess; } };
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), `${id}.js`)));
      return pr(id);
    };
    vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {
      process: { env: { APPLE_SUBSCRIPTIONS_ENABLED: apple ? 'true' : 'false', JL_SESSION_SECRET: 'offline-test-only-session-secret-at-least-32-bytes' } }, Date, Buffer, URL,
      console: { error() {} },
    })(req, mod, mod.exports);
    return mod.exports;
  }
  return { manual: load('lib/manual-account-access.js'), subscription: load('lib/subscription-access.js'), session: load('lib/account-session.js') };
}
function database({ grant = row(), grantError = null, paypal = [], paypalError = null } = {}) {
  const calls = [];
  return { calls, from(table) {
    calls.push(table); assert.ok(['account_access_grants', 'paypal_subscriptions'].includes(table));
    const result = table === 'account_access_grants' ? { data: grant, error: grantError } : { data: paypal, error: paypalError };
    const query = { select(columns) { calls.push(columns); return this; },
      ilike(key, value) { assert.equal(key, 'owner.email'); assert.equal(value, EMAIL); return this; },
      eq(key, value) { assert.equal(key, 'account_email'); assert.equal(value, EMAIL); return this; },
      async maybeSingle() { return result; }, then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); } };
    return query;
  } };
}

test('Courtesy access has a finite hard boundary at midnight 1 November in Zurich, without a trial or payment', () => {
  const { manual } = library();
  const access = manual.manualAccountAccessFromRow(row(), EMAIL, END - 1);
  assert.equal(access.paid, true); assert.equal(access.paidUntil, '2026-10-31T23:00:00.000Z');
  assert.equal(access.accessType, 'courtesy'); assert.equal(access.source, 'manual_grant');
  assert.equal(access.trialUntil, null); assert.equal(access.status, null);
  assert.equal(manual.manualAccountAccessFromRow(row(), EMAIL, END).paid, false);
  assert.equal(manual.manualAccountAccessFromRow(row(), EMAIL, END + 1).paid, false);
  assert.equal(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', dateStyle: 'short', timeStyle: 'short' }).format(END), '01/11/2026, 00:00');
});
test('A future, absent or expired interval grants nothing; malformed owner/generation/deadline fails closed', () => {
  const { manual } = library();
  assert.equal(manual.manualAccountAccessFromRow(null, EMAIL, NOW).paid, false);
  assert.equal(manual.manualAccountAccessFromRow(row({ starts_at: new Date(NOW + 1).toISOString() }), EMAIL, NOW).paid, false);
  for (const bad of [row({ expires_at: 'infinity' }), row({ expires_at: 'invalid' }), row({ expires_at: row().starts_at }),
    row({ account_generation: OTHER }), row({ owner: { email: OTHER_EMAIL, account_generation: GENERATION } }), row({ owner: [] }), undefined])
    assert.throws(() => manual.manualAccountAccessFromRow(bad, EMAIL, NOW), error => error.status === 503);
});
test('The real signed session caps its access snapshot at the courtesy deadline', () => {
  const { manual, session } = library();
  const access = manual.manualAccountAccessFromRow(row(), EMAIL, END - 1000);
  const token = session.createAccountSession(EMAIL, END - 1000, { ...access, admin: false });
  const parsed = session.readAccountSession(token, END - 1000);
  assert.equal(parsed.paid, true); assert.equal(parsed.admin, false);
  assert.equal(parsed.accessExpiresAt, END / 1000);
  assert.ok(parsed.accessExpiresAt <= END / 1000);
});
test('Only a missing optional relation falls back; outages, ambiguity and permission errors never grant', async () => {
  const { manual } = library();
  for (const code of ['42P01', 'PGRST205']) assert.equal((await manual.resolveManualAccountAccess(database({ grantError: { code } }), EMAIL)).paid, false);
  for (const code of ['42501', 'PGRST116', '08006', 'PGRST200'])
    await assert.rejects(manual.resolveManualAccountAccess(database({ grantError: { code } }), EMAIL), error => error.status === 503);
  const db = database(); assert.equal((await manual.resolveManualAccountAccess(db, EMAIL, { nowMs: NOW })).paid, true);
  assert.ok(db.calls.some(value => value.includes('owner:userprofile!inner(email,account_generation)')));
});
test('Resolver works for web/Android and Apple, keeps longer provider coverage and does not contact a provider', async () => {
  for (const apple of [false, true]) {
    const appleAccess = { paid: false, paidUntil: null, accessType: 'none', trialUntil: null, source: 'none', status: null };
    const { subscription } = library({ apple, appleAccess });
    const result = await subscription.resolveSubscriptionAccess(database(), EMAIL, { nowMs: NOW, refresh: false });
    assert.equal(result.accessType, 'courtesy'); assert.equal(result.paidUntil, new Date(END).toISOString());
    const longer = new Date(END + 86400000).toISOString();
    const resultPaid = await subscription.resolveSubscriptionAccess(database({ paypal: [{ account_email: EMAIL,
      status: 'CANCELLED', paid_until: longer, verified_at: new Date(NOW).toISOString() }] }), EMAIL, { nowMs: NOW, refresh: false });
    assert.equal(resultPaid.source, 'paypal'); assert.equal(resultPaid.paidUntil, longer);
  }
});
test('Provider outage cannot hide valid courtesy coverage; absent coverage fails closed; legacy flags stay untouched', async () => {
  const { subscription } = library();
  assert.equal((await subscription.resolveSubscriptionAccess(database({ paypalError: { code: '08006' } }), EMAIL,
    { nowMs: NOW, refresh: false })).accessType, 'courtesy');
  await assert.rejects(subscription.resolveSubscriptionAccess(database({ grant: null, paypalError: { code: '08006' } }), EMAIL,
    { nowMs: NOW, refresh: false }), error => error.status === 503);
  const db = { from() { assert.fail('Legacy coverage must not change'); } };
  const access = await subscription.resolveSubscriptionAccess(db, EMAIL, { legacyPaid: true });
  assert.equal(access.source, 'legacy_or_manual'); assert.equal(access.paidUntil, null);
});

let pg;
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
    '20261009210000_paypal_account_generation.sql','20261009220000_complete_account_deletion.sql','20261014110000_operator_trial_notifications.sql'])
    await pg.exec(fs.readFileSync(path.join(root, 'supabase/migrations', file), 'utf8'));
  await pg.exec(migration());
});
test.after(async () => { await pg?.close(); });
async function seed() {
  await pg.exec('TRUNCATE public.userprofile CASCADE;');
  await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation,is_admin,is_premium,is_community_moderator) VALUES(gen_random_uuid(),$1,$2,false,false,false)', [EMAIL, GENERATION]);
}
test('Migration creates zero grants and service-only read access, preserving all account flags', async () => {
  await seed(); await pg.exec(migration());
  assert.equal((await pg.query('SELECT count(*) AS total FROM public.account_access_grants')).rows[0].total, 0);
  for (const role of ['anon', 'authenticated', 'service_role']) {
    const rights = (await pg.query("SELECT has_table_privilege($1,'public.account_access_grants','SELECT') AS read,has_table_privilege($1,'public.account_access_grants','INSERT,UPDATE,DELETE') AS write", [role])).rows[0];
    assert.equal(rights.read, role === 'service_role'); assert.equal(rights.write, false);
  }
  assert.deepEqual((await pg.query('SELECT is_admin,is_premium,is_community_moderator FROM public.userprofile')).rows[0],
    { is_admin: false, is_premium: false, is_community_moderator: false });
});
test('SQL refuses missing accounts, infinite/reversed dates and duplicate generations', async () => {
  await seed();
  const insert = 'INSERT INTO public.account_access_grants(account_generation,starts_at,expires_at,reason) VALUES($1,$2,$3,$4)';
  for (const args of [[OTHER, '2026-10-23Z', '2026-10-31T23:00Z', 'test'], [GENERATION, '2026-10-23Z', 'infinity', 'test'],
    [GENERATION, '2026-10-23Z', '2026-10-22Z', 'test'], [GENERATION, '2026-10-23Z', '2026-10-31T23:00Z', ' ']])
    await assert.rejects(pg.query(insert, args));
  await pg.query(insert, [GENERATION, '2026-10-23Z', '2026-10-31T23:00Z', 'Existing October coverage']);
  await assert.rejects(pg.query(insert, [GENERATION, '2026-10-23Z', '2026-10-31T23:00Z', 'Duplicate']));
});
test('Actual complete account deletion cascades the grant; same-email recreation inherits no coverage', async () => {
  await seed();
  await pg.query("INSERT INTO public.account_access_grants(account_generation,expires_at,reason) VALUES($1,clock_timestamp()+interval'1 day','Temporary access')", [GENERATION]);
  await pg.query('SELECT public.delete_jagdlatein_account($1,$2)', [EMAIL, GENERATION]);
  assert.equal((await pg.query('SELECT count(*) AS total FROM public.account_access_grants')).rows[0].total, 0);
  await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation,is_admin,is_premium) VALUES(gen_random_uuid(),$1,$2,false,false)', [EMAIL, OTHER]);
  assert.equal((await pg.query('SELECT count(*) AS total FROM public.account_access_grants g JOIN public.userprofile p USING(account_generation) WHERE p.email=$1', [EMAIL])).rows[0].total, 0);
});
test('Deletion dependency guard still refuses new unreviewed tables referencing grants', async () => {
  await pg.exec('CREATE TABLE public.unreviewed_grant_dependency(generation uuid REFERENCES public.account_access_grants(account_generation));');
  await assert.rejects(pg.query('SELECT public.require_complete_account_deletion_dependencies()'), /unreviewed account dependency/);
  await pg.exec('DROP TABLE public.unreviewed_grant_dependency;');
  await pg.query('SELECT public.require_complete_account_deletion_dependencies()');
});
