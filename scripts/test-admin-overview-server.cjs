const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, root } = require('./helpers/project-module.cjs');
const runtime = process.env.JL_PAYPAL_TEST_PGLITE_PATH || path.join(process.env.LOCALAPPDATA || '', 'Jagdlatein/paypal-sandbox/test-runtime/node_modules/@electric-sql/pglite');
if (!fs.existsSync(runtime)) throw Error('The isolated SQL runtime is required; real databases must not be used.');
const { PGlite } = require(runtime);
const ACTOR = 'operator@example.invalid', GENERATION = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const LEARNER = 'learner@example.invalid', OWNER = '11111111-1111-4111-8111-111111111111';
const NOW = Date.parse('2026-11-08T12:00:00Z');
const env = {};
const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie', 'X-Robots-Tag': 'noindex, nofollow' } });
const overrides = {
  './course-catalog': { courses: [{ id: 'fixture-course', title: 'Synthetischer Kurs' }] },
  './usage-analytics': { USAGE_PAGES: { lernen: 'Lernbereich' } },
  './admin-trial-overview': { trialOverviewJson: json },
};
const api = createLoader(overrides)('lib/admin-overview-server.js');
const options = query => api.readAdminOverviewOptions('https://example.invalid/api/admin/overview?' + query, env, { nowMs: NOW });
let pg;

test('Overview query uses Swiss civil dates, inclusive366-day limit and a server-selected PayPal environment', () => {
  assert.deepEqual(options(''), { from: '2026-10-10', to: '2026-11-08', environment: 'Production', paypalEnvironment: 'Production' });
  assert.equal(api.readAdminOverviewOptions('https://example.invalid/', {}, { nowMs: Date.parse('2026-11-07T23:30:00Z') }).to, '2026-11-08');
  assert.equal(options('from=2024-01-01&to=2024-12-31').from, '2024-01-01');
  assert.equal(options('environment=sandbox').environment, 'Sandbox');
  assert.equal(api.readAdminOverviewOptions('https://example.invalid/?environment=sandbox', { JL_TEST_ENVIRONMENT: 'paypal-sandbox' }, { nowMs: NOW }).paypalEnvironment, 'Sandbox');
});

test('Overview rejects roll-over dates, duplicates, unknown fields, future/reversed/oversized ranges and environment confusion', () => {
  for (const query of ['to=2026-02-30', 'to=garbage', 'from=2026-02-29', 'from=2024-01-01&to=2025-01-01',
    'from=2026-11-09&to=2026-11-08', 'to=2026-11-09', 'from=', 'from=2026-01-01&from=2026-02-01',
    'environment=Production', 'environment=live&environment=sandbox', 'email=learner%40example.invalid']) {
    assert.throws(() => options(query), error => error.status === 400, query);
  }
  assert.throws(() => api.readAdminOverviewOptions('https://example.invalid/?environment=live', { JL_TEST_ENVIRONMENT: 'paypal-sandbox' }, { nowMs: NOW }), error => error.status === 400);
  assert.throws(() => api.readAdminOverviewOptions('https://example.invalid/', { JL_TEST_ENVIRONMENT: 'paypal-sandbox', PAYPAL_API_BASE: 'https://api-m.paypal.com' }, { nowMs: NOW }), error => error.status === 503);
});

test.before(async () => {
  pg = new PGlite();
  await pg.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE TABLE userprofile(email text PRIMARY KEY,account_generation uuid UNIQUE,is_admin boolean,is_premium boolean,exam_country text,exam_region text);
    INSERT INTO userprofile VALUES('${ACTOR}','${GENERATION}',true,false,NULL,NULL),('${LEARNER}','${OWNER}',false,true,'CH','ZH');
    CREATE TABLE activity_results(account_email text,event_id uuid,type text,country text,topic text,total_questions integer,correct_answers integer,timed_out_answers integer,points integer,duration_seconds integer,finished_at timestamptz,verification text);
    CREATE TABLE course_progress(account_email text,course_id text,status text,completed_at timestamptz,updated_at timestamptz);
    CREATE TABLE paypal_subscriptions(subscription_id text,account_email text,account_generation uuid,account_deleted_at timestamptz,plan_id text,status text,paid_until timestamptz,trial_started_at timestamptz,trial_until timestamptz,review_reason text,verified_at timestamptz);
    CREATE TABLE paypal_subscription_payments(subscription_id text,payment_id text,status text,paid_at timestamptz,period_until timestamptz,amount text,currency text);
    CREATE TABLE apple_account_tokens(app_account_token uuid,account_email text,account_generation uuid,deleted_at timestamptz);
    CREATE TABLE apple_subscriptions(environment text,original_transaction_id text,app_account_token uuid,latest_transaction_id text,status integer,auto_renew boolean,access_until timestamptz,is_trial boolean,grace_until timestamptz,verified_at timestamptz);
    CREATE TABLE apple_subscription_transactions(environment text,transaction_id text,original_transaction_id text,app_account_token uuid,purchased_at timestamptz,expires_at timestamptz,revoked_at timestamptz,is_upgraded boolean,is_trial boolean);
    CREATE TABLE account_access_grants(account_generation uuid,starts_at timestamptz,expires_at timestamptz);
    CREATE TABLE usage_collection_settings(singleton boolean PRIMARY KEY,started_at timestamptz);
    CREATE TABLE usage_daily_counts(day date,page_key text,event_kind text,events bigint,last_at timestamptz);
    CREATE TABLE community_posts(account_email text,parent_id uuid,created_at timestamptz);
    CREATE TABLE community_reports(resolved_at timestamptz);
    CREATE TABLE photo_recognition_requests(created_at timestamptz);
    CREATE TABLE photo_recognition_months(month_start date,attempts integer);
    CREATE TABLE operator_trial_notification_outbox(state text);
  `);
  await pg.exec(fs.readFileSync(path.join(root, 'supabase/migrations/20261108130000_admin_overview.sql'), 'utf8'));
  await pg.query(`SELECT set_config('request.headers',$1,false)`, [JSON.stringify({ 'x-jagdlatein-account-email': ACTOR, 'x-jagdlatein-account-generation': GENERATION })]);
});
test.after(async () => { if (pg) await pg.close(); });

async function raw(from = '2026-10-25', to = from, environment = 'Production', paypal = 'Production') {
  return (await pg.query('SELECT public.get_admin_overview($1,$2,$3,$4,$5,$6) AS value', [ACTOR, GENERATION, from, to, environment, paypal])).rows[0].value;
}
const db = { rpc: async (name, args) => {
  assert.equal(name, 'get_admin_overview');
  return { data: await raw(args.p_from, args.p_to, args.p_environment, args.p_paypal_environment), error: null };
} };
const actor = { email: ACTOR, accountGeneration: GENERATION };

test('Actual isolated RPC returns all eight ready/unknown groups; true empty data has zero counts and null accuracy', async () => {
  const data = await raw();
  assert.equal(Object.keys(data.sections).length, 8);
  for (const id of ['accounts', 'learning', 'courses', 'subscriptions', 'payments', 'community', 'system']) assert.equal(data.sections[id].status, 'ready', id);
  assert.equal(data.sections.usage.status, 'not_recorded');
  assert.equal(data.sections.accounts.metrics.current, 2);
  assert.equal(data.sections.learning.metrics.rounds, 0);
  assert.equal(data.sections.learning.metrics.accuracy, null);
  const normalized = await api.getAdminOverview(db, actor, options('from=2026-10-25&to=2026-10-25'));
  assert.equal(normalized.sections.length, 8);
  assert.equal(normalized.sections.find(s => s.id === 'usage').metrics[0].value, null);
  assert.equal(normalized.sections.find(s => s.id === 'learning').status, 'ready');
});

test('RPC denies absent/stale/non-admin actors and browser roles independently of the API cookie guard', async () => {
  await pg.query(`SELECT set_config('request.headers','{}',false)`);
  await assert.rejects(raw(), error => error.code === '42501');
  await pg.query(`SELECT set_config('request.headers',$1,false)`, [JSON.stringify({ 'x-jagdlatein-account-email': ACTOR, 'x-jagdlatein-account-generation': GENERATION })]);
  await pg.exec(`UPDATE userprofile SET is_admin=false WHERE email='${ACTOR}'`);
  await assert.rejects(raw(), error => error.code === '42501');
  await pg.exec(`UPDATE userprofile SET is_admin=true WHERE email='${ACTOR}'`);
  await pg.exec('SET ROLE anon');
  try { await assert.rejects(raw(), error => error.code === '42501'); }
  finally { await pg.exec('RESET ROLE'); }
  await assert.rejects(pg.query('SELECT public.get_admin_overview($1,$2,$3,$4,$5,$6)', [ACTOR, OWNER, '2026-10-25', '2026-10-25', 'Production', 'Production']), error => error.code === '42501');
});

test('Actual aggregates exceed REST row windows and use weighted accuracy without exposing user identifiers', async () => {
  await pg.exec(`INSERT INTO activity_results SELECT '${LEARNER}',gen_random_uuid(),'quiz','CH','fixture',10,5,0,500,30,'2026-10-25T12:00Z','server_verified' FROM generate_series(1,1201)`);
  const data = await raw();
  assert.equal(data.sections.learning.metrics.rounds, 1201);
  assert.equal(data.sections.learning.metrics.learners, 1);
  assert.equal(data.sections.learning.metrics.accuracy, 50);
  assert.equal(data.sections.learning.metrics.verified, 1201);
  assert.ok(!JSON.stringify(data).includes(LEARNER));
  await pg.exec('TRUNCATE activity_results');
});

test('Swiss autumn and spring boundary queries include the exact local start and exclude next midnight', async () => {
  for (const [date, start, inside, end] of [['2026-10-25', '2026-10-24T22:00Z', '2026-10-25T01:30Z', '2026-10-25T23:00Z'], ['2026-03-29', '2026-03-28T23:00Z', '2026-03-29T01:30Z', '2026-03-29T22:00Z']]) {
    await pg.exec('TRUNCATE activity_results');
    for (const at of [start, inside, end]) await pg.query(`INSERT INTO activity_results VALUES($1,gen_random_uuid(),'quiz','DE','fixture',2,1,0,100,20,$2,'server_verified')`, [LEARNER, at]);
    const data = await raw(date);
    assert.equal(data.sections.learning.metrics.rounds, 2, date);
    assert.deepEqual(data.sections.learning.series, [{ date, value: 2 }]);
  }
  await pg.exec('TRUNCATE activity_results');
});

test('Contract coverage deduplicates accounts, preserves cancelled paid coverage and separates Apple Sandbox', async () => {
  await pg.exec(`
    INSERT INTO paypal_subscriptions VALUES('p-paid','${LEARNER}','${OWNER}',NULL,'fixture','CANCELLED',now()+interval '2 days',NULL,NULL,NULL,now()),
      ('p-trial','${LEARNER}','${OWNER}',NULL,'fixture','ACTIVE',NULL,now()-interval '1 hour',now()+interval '1 day',NULL,now()),
      ('p-suspended','${LEARNER}','${OWNER}',NULL,'fixture','SUSPENDED',now()+interval '2 days',NULL,NULL,'provider_review_required',now()),
      ('p-old','${LEARNER}','22222222-2222-4222-8222-222222222222',NULL,'fixture','ACTIVE',now()+interval '2 days',NULL,NULL,NULL,now());
    INSERT INTO paypal_subscription_payments VALUES('p-paid','pay1','COMPLETED',now()-interval '1 hour',now()+interval '2 days','10.00','EUR');
    INSERT INTO apple_account_tokens VALUES('33333333-3333-4333-8333-333333333333','${LEARNER}','${OWNER}',NULL);
    INSERT INTO apple_subscriptions VALUES('Production','app1','33333333-3333-4333-8333-333333333333','tx1',4,true,now()+interval '2 days',false,now()+interval '3 days',now()),
      ('Sandbox','app2','33333333-3333-4333-8333-333333333333','tx2',1,true,now()+interval '2 days',false,NULL,now());
    INSERT INTO apple_subscription_transactions VALUES('Production','tx1','app1','33333333-3333-4333-8333-333333333333',now()-interval '1 day',now()+interval '1 day',NULL,false,false),
      ('Sandbox','tx2','app2','33333333-3333-4333-8333-333333333333',now()-interval '1 day',now()+interval '2 days',NULL,false,false);
    INSERT INTO account_access_grants VALUES('${OWNER}',now()-interval '1 hour',now()+interval '3 days');
  `);
  const production = (await raw()).sections.subscriptions;
  assert.equal(production.status, 'ready');
  assert.equal(production.metrics.contracts, 4);
  assert.equal(production.metrics.paid, 2); assert.equal(production.metrics.trial, 1); assert.equal(production.metrics.grace, 1);
  assert.equal(production.metrics.review, 1, 'Recorded funded coverage remains visible while its independent review flag is counted');
  assert.equal(production.metrics.coveredAccounts, 1); assert.equal(production.metrics.courtesy, 1); assert.equal(production.metrics.legacy, 1);
  const sandbox = (await raw('2026-10-25', '2026-10-25', 'Sandbox')).sections;
  assert.equal(sandbox.subscriptions.metrics.contracts, 1);
  assert.equal(sandbox.subscriptions.paypal_applicable, false);
  assert.equal(sandbox.payments.metrics.paypalCompleted, null);
  await pg.exec('TRUNCATE paypal_subscriptions,paypal_subscription_payments,apple_account_tokens,apple_subscriptions,apple_subscription_transactions,account_access_grants');
});

test('Original gross is grouped by currency and partial refunds separately; invalid amounts are counted, never cast or mixed', async () => {
  await pg.exec(`INSERT INTO paypal_subscriptions VALUES('p-money','${LEARNER}','${OWNER}',NULL,'fixture','ACTIVE',NULL,NULL,NULL,NULL,now());
    INSERT INTO paypal_subscription_payments VALUES('p-money','e1','COMPLETED','2026-10-25T12:00Z',NULL,'10.00','EUR'),
      ('p-money','c1','COMPLETED','2026-10-25T12:00Z',NULL,'20.00','CHF'),
      ('p-money','p1','PARTIALLY_REFUNDED','2026-10-25T12:00Z',NULL,'8.00','EUR'),
      ('p-money','bad','COMPLETED','2026-10-25T12:00Z',NULL,'not-money','EUR');`);
  const data = (await raw()).sections.payments;
  assert.equal(data.status, 'ready'); assert.equal(data.metrics.paypalReview, 1);
  assert.deepEqual(data.rows.map(row => [row.currency, row.state, Number(row.amount)]), [['CHF', 'COMPLETED', 20], ['EUR', 'COMPLETED', 10], ['EUR', 'PARTIALLY_REFUNDED', 8]]);
  await pg.exec('TRUNCATE paypal_subscriptions,paypal_subscription_payments');
});

test('Usage does not fabricate pre-collection days; a missing source remains unknown without hiding healthy learning data', async () => {
  await pg.exec(`INSERT INTO usage_collection_settings VALUES(true,'2026-10-25T10:00Z');
    INSERT INTO usage_daily_counts VALUES('2026-10-24','lernen','action',100,'2026-10-24T12:00Z'),
      ('2026-10-25','lernen','action',3,'2026-10-25T12:00Z'),('2026-10-25','lernen','page_view',7,'2026-10-25T12:00Z');`);
  assert.equal((await raw('2026-10-24')).sections.usage.status, 'not_recorded');
  const data = (await raw('2026-10-24', '2026-10-25')).sections.usage;
  assert.equal(data.metrics.clicks, 3); assert.equal(data.metrics.pageViews, 7);
  assert.deepEqual(data.series, [{ date: '2026-10-24', value: null }, { date: '2026-10-25', value: 3 }]);
  await pg.exec('ALTER TABLE usage_daily_counts RENAME TO temporarily_missing_usage');
  const missing = await raw();
  assert.equal(missing.sections.usage.status, 'not_configured');
  assert.equal(missing.sections.learning.status, 'ready');
  const normalized = await api.getAdminOverview({ rpc: async () => ({ data: missing }) }, actor, options('from=2026-10-25&to=2026-10-25'));
  assert.equal(normalized.sections.find(s => s.id === 'usage').metrics[0].value, null);
  await pg.exec('ALTER TABLE temporarily_missing_usage RENAME TO usage_daily_counts');
});

test('Missing RPC never becomes an empty dashboard and malformed rows cannot carry PII or coercible counts', async () => {
  const missing = await api.getAdminOverview({ rpc: async () => ({ error: { code: 'PGRST202', message: 'private SQL detail' } }) }, actor, options(''), { nowMs: NOW });
  assert.ok(missing.sections.every(s => s.status === 'not_configured' && s.metrics.every(m => m.value === null)));
  const data = await raw();
  data.sections.courses.rows = [{ course_id: 'unknown@example.invalid', learners: 1, completed: 0, last_updated: null, email: LEARNER }];
  data.sections.accounts.metrics.current = '2';
  const normalized = await api.getAdminOverview({ rpc: async () => ({ data }) }, actor, options('from=2026-10-25&to=2026-10-25'));
  assert.equal(normalized.sections.find(s => s.id === 'accounts').status, 'unavailable');
  assert.equal(normalized.sections.find(s => s.id === 'accounts').metrics[0].value, null);
  assert.equal(normalized.sections.find(s => s.id === 'courses').rows[0].course, 'Kursbezeichnung nicht verfügbar');
  assert.ok(!JSON.stringify(normalized).includes('@example.invalid'));
  await assert.rejects(api.getAdminOverview({ rpc: async () => ({ error: { code: '08006', message: LEARNER } }) }, actor, options('')), error => error.status === 503 && !error.message.includes(LEARNER));
});

test('Usage retention distinguishes unknown days older than399days from real zero within the known400-day window', async () => {
  await pg.exec(`TRUNCATE usage_collection_settings,usage_daily_counts;
    INSERT INTO usage_collection_settings VALUES(true,now()-interval '500 days');
    INSERT INTO usage_daily_counts SELECT (now() AT TIME ZONE 'Europe/Zurich')::date-450,'lernen','action',999,now()-interval '450 days';`);
  const dates = (await pg.query(`SELECT ((now() AT TIME ZONE 'Europe/Zurich')::date-450)::text AS old,
    ((now() AT TIME ZONE 'Europe/Zurich')::date-400)::text AS before,
    ((now() AT TIME ZONE 'Europe/Zurich')::date-399)::text AS first`)).rows[0];
  const historical = (await raw(dates.old)).sections.usage;
  assert.equal(historical.status, 'not_recorded', 'Even an old row not yet cleaned cannot turn the unsupported past into a known count');
  const mixed = (await raw(dates.before, dates.first)).sections.usage;
  assert.equal(mixed.status, 'ready'); assert.equal(mixed.metrics.clicks, 0);
  assert.deepEqual(mixed.series, [{ date: dates.before, value: null }, { date: dates.first, value: 0 }]);
  const normalized = await api.getAdminOverview({ rpc: async () => ({ data: { as_of: new Date().toISOString(), sections: { usage: mixed } } }) }, actor,
    { from: dates.before, to: dates.first, environment: 'Production', paypalEnvironment: 'Production' });
  assert.deepEqual(normalized.sections.find(section => section.id === 'usage').series, mixed.series);
});

test('Actual route guards before and after the single RPC, preserves no-store and blocks revoked access', async () => {
  let guards = 0, reads = 0, revoke = false;
  const service = { ...api, getAdminOverview: async () => { reads++; return { aggregate: true }; } };
  const route = createLoader({
    '../../../../lib/admin-overview-server': service,
    '../../../../lib/admin-trial-overview': { trialOverviewJson: json, requireCurrentTrialAdmin: async () => {
      guards++; if (revoke && guards % 2 === 0) throw Object.assign(new Error('private detail'), { status: 403 });
      return { database: {}, session: actor };
    } },
  })('app/api/admin/overview/route.js');
  assert.equal(route.POST, undefined);
  const req = new Request('https://example.invalid/api/admin/overview?from=2026-10-25&to=2026-10-25');
  const response = await route.GET(req);
  assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal(guards, 2); assert.equal(reads, 1);
  revoke = true;
  const denied = await route.GET(req);
  assert.equal(denied.status, 403); assert.ok(!(await denied.text()).includes('private detail'));
});
