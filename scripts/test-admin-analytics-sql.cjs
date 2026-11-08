// Independently exercise SQL -> server allowlist DTO -> actual UI validator/CSV.
// No real database, connection, account, payment, browser or notification.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createAdminAnalyticsFixture, ADMIN, MEMBER, ADMIN_GENERATION, MEMBER_GENERATION, TOKEN } = require('./helpers/admin-analytics-fixture.cjs');
const UI_PERIOD = { from: '2026-10-25', to: '2026-10-25', environment: 'live' };
let f;
test.before(async () => { f = await createAdminAnalyticsFixture(); });
test.after(async () => { if (f) await f.close(); });
const metric = (data, section, key) => data.sections.find(item => item.id === section).metrics.find(item => item.key === key).value;

test('Actual migration is stable/security-definer with fixed search path; neither browser role may execute it', async () => {
  await f.pg.exec(f.migration);
  const result = await f.pg.query(`SELECT provolatile,prosecdef,proconfig FROM pg_proc WHERE oid='public.get_admin_overview(text,uuid,date,date,text,text)'::regprocedure`);
  assert.equal(result.rows[0].provolatile, 's'); assert.equal(result.rows[0].prosecdef, true); assert.ok(result.rows[0].proconfig.includes('search_path=pg_catalog, public'));
  for (const role of ['anon', 'authenticated', 'service_role']) {
    const check = (await f.pg.query("SELECT has_function_privilege($1,'public.get_admin_overview(text,uuid,date,date,text,text)','EXECUTE') AS allowed", [role])).rows[0];
    assert.equal(check.allowed, role === 'service_role');
    if (role === 'service_role') continue;
    await f.pg.exec(`SET ROLE ${role}`);
    try { await assert.rejects(f.raw(), error => error.code === '42501'); await assert.rejects(f.pg.query('SELECT * FROM userprofile'), error => error.code === '42501'); }
    finally { await f.pg.exec('RESET ROLE'); }
  }
  const policies = (await f.pg.query("SELECT count(*)::integer AS n,bool_and(relrowsecurity) AS all_private FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r'")).rows[0];
  assert.equal(policies.n, 16); assert.equal(policies.all_private, true);
});

test('Service bypass alone is insufficient: both exact actor headers and the current admin are mandatory', async () => {
  await f.pg.exec('SET ROLE service_role');
  try {
    await f.headers({}); await f.pg.query('SELECT public.require_current_request_actor()');
    await assert.rejects(f.raw(), error => error.code === '42501');
    for (const headers of [{}, { 'x-jagdlatein-account-email': ADMIN }, { 'x-jagdlatein-account-generation': ADMIN_GENERATION }, { 'x-jagdlatein-account-email': MEMBER, 'x-jagdlatein-account-generation': ADMIN_GENERATION }, { 'x-jagdlatein-account-email': ADMIN, 'x-jagdlatein-account-generation': MEMBER_GENERATION }]) {
      await f.headers(headers); await assert.rejects(f.raw(), error => error.code === '42501');
    }
    await f.headers({ 'x-jagdlatein-account-email': MEMBER, 'x-jagdlatein-account-generation': MEMBER_GENERATION });
    await assert.rejects(f.raw({ email: MEMBER, generation: MEMBER_GENERATION }), error => error.code === '42501');
    await f.headers(); assert.equal((await f.raw()).sections.accounts.status, 'ready');
  } finally { await f.pg.exec('RESET ROLE'); await f.headers(); }
  await f.pg.query('UPDATE userprofile SET is_admin=false WHERE email=$1', [ADMIN]);
  try { await assert.rejects(f.raw(), error => error.code === '42501'); }
  finally { await f.pg.query('UPDATE userprofile SET is_admin=true WHERE email=$1', [ADMIN]); }
});

test('Actual SQL empty and unconfigured aggregates pass the real UI contract without turning unknown into zero', async () => {
  const data = await f.dto(); assert.equal(f.client.validAdminOverview(data, UI_PERIOD), true); assert.equal(data.sections.length, 8);
  assert.equal(metric(data, 'learning', 'rounds'), 0); assert.equal(metric(data, 'learning', 'accuracy'), null);
  const usage = data.sections.find(item => item.id === 'usage'); assert.equal(usage.status, 'not_recorded'); assert.ok(usage.metrics.every(item => item.value === null));
  const csv = f.client.adminOverviewCsv(data, UI_PERIOD); assert.ok(csv.startsWith('\uFEFF')); assert.match(csv, /"Europe\/Zurich"/); assert.match(csv, /"not_recorded"/);
  assert.doesNotMatch(JSON.stringify(data) + csv, /@example\.invalid|a1111111|b2222222|c3333333|account_generation|account_email|app_account_token/);
});

test('Weighted exercise outcomes, snapshot courses and exact multi-currency gross flow through SQL/DTO/UI/CSV unchanged', async () => {
  await f.pg.exec(`INSERT INTO activity_results VALUES('${MEMBER}',gen_random_uuid(),'quiz','CH','private-free-text',1,1,0,100,20,'2026-10-25T12:00Z','server_verified'),
    ('${MEMBER}',gen_random_uuid(),'ansitz',NULL,'private-free-text',9,0,0,0,80,'2026-10-25T13:00Z','self_reported');
    INSERT INTO course_progress VALUES('${MEMBER}','fixture-course','completed','2026-09-01T12:00Z','2026-10-25T12:00Z'),
      ('${MEMBER}','unknown@example.invalid','started',NULL,'2026-10-25T12:00Z');
    INSERT INTO paypal_subscriptions VALUES('fixture-paypal','${MEMBER}','${MEMBER_GENERATION}',NULL,'fixture-plan','CANCELLED',now()+interval '2 days',NULL,NULL,NULL,now());
    INSERT INTO paypal_subscription_payments VALUES('fixture-paypal','fixture-eur','COMPLETED','2026-10-25T12:00Z',now()+interval '3 days','10.005','EUR'),
      ('fixture-paypal','fixture-chf','COMPLETED','2026-10-25T12:00Z',NULL,'20.000','CHF'),
      ('fixture-paypal','fixture-partial','PARTIALLY_REFUNDED','2026-10-25T12:00Z',NULL,'8.50','EUR');
    INSERT INTO apple_account_tokens VALUES('${TOKEN}','${MEMBER}','${MEMBER_GENERATION}',NULL);
    INSERT INTO apple_subscriptions VALUES('Production','fixture-original','${TOKEN}','fixture-apple',1,false,now()+interval '1 day',false,NULL,now());
    INSERT INTO apple_subscription_transactions VALUES('Production','fixture-apple','fixture-original','${TOKEN}','2026-10-25T12:00Z',now()+interval '2 days',NULL,false,false);
    INSERT INTO usage_collection_settings VALUES(true,'2026-10-25T00:00Z');
    INSERT INTO usage_daily_counts VALUES('2026-10-25','lernen','action',5,'2026-10-25T12:00Z');`);
  const data = await f.dto(); assert.equal(f.client.validAdminOverview(data, UI_PERIOD), true);
  assert.equal(metric(data, 'learning', 'accuracy'), 10); assert.equal(metric(data, 'learning', 'verified'), 1); assert.equal(metric(data, 'learning', 'selfReported'), 1);
  assert.equal(metric(data, 'courses', 'pairs'), 2); assert.equal(metric(data, 'courses', 'completed'), 1); assert.equal(metric(data, 'courses', 'firstCompletions'), 0);
  assert.equal(metric(data, 'subscriptions', 'contracts'), 2); assert.equal(metric(data, 'subscriptions', 'coveredAccounts'), 1);
  assert.equal(metric(data, 'payments', 'appleTransactions'), 1);
  const money = data.sections.find(item => item.id === 'payments'); assert.deepEqual(money.rows.map(row => [row.currency, row.state, row.amount]), [['CHF', 'Abgeschlossen', '20.000'], ['EUR', 'Abgeschlossen', '10.005'], ['EUR', 'Teilweise zurückgezahlt', '8.50']]);
  const csv = f.client.adminOverviewCsv(data, UI_PERIOD); assert.match(csv, /"10\.005"/); assert.match(csv, /"8\.50"/); assert.match(csv, /"CHF"/); assert.match(csv, /Teilrückzahlungen/);
  assert.doesNotMatch(JSON.stringify(data) + csv, /@example\.invalid|private-free-text|fixture-paypal|fixture-eur|fixture-apple|fixture-original|c3333333/);
});

test('Current actor read-only transactions preserve all source counts; optional failure affects only its section', async () => {
  const before = await f.sourceCounts();
  await f.pg.exec('BEGIN READ ONLY; SET LOCAL ROLE service_role');
  try { assert.equal((await f.raw()).sections.subscriptions.status, 'ready'); }
  finally { await f.pg.exec('ROLLBACK'); }
  const data = await f.dto(); assert.equal(f.client.validAdminOverview(data, UI_PERIOD), true); assert.deepEqual(await f.sourceCounts(), before);
  await f.pg.exec('ALTER TABLE community_reports RENAME TO temporarily_missing_reports');
  try {
    const missing = await f.dto(); assert.equal(f.client.validAdminOverview(missing, UI_PERIOD), true);
    const community = missing.sections.find(item => item.id === 'community'); assert.equal(community.status, 'not_configured'); assert.ok(community.metrics.every(item => item.value === null));
    assert.equal(missing.sections.find(item => item.id === 'learning').status, 'ready'); assert.match(f.client.adminOverviewCsv(missing, UI_PERIOD), /"not_configured"/);
  } finally { await f.pg.exec('ALTER TABLE temporarily_missing_reports RENAME TO community_reports'); }
});

test('Server-bound Sandbox selection remains a valid UI snapshot with no cross-environment PayPal money', async () => {
  const options = f.server.readAdminOverviewOptions('https://example.invalid/api/admin/overview?from=2026-10-25&to=2026-10-25&environment=sandbox', { PAYPAL_API_BASE: 'https://api-m.paypal.com' });
  const data = await f.dto(options); assert.equal(f.client.validAdminOverview(data, { ...UI_PERIOD, environment: 'sandbox' }), true);
  assert.equal(data.environment, 'Sandbox'); assert.equal(metric(data, 'payments', 'paypalCompleted'), null); assert.equal(data.sections.find(item => item.id === 'payments').rows.length, 0);
  assert.equal(f.client.validAdminOverview(data, UI_PERIOD), false); assert.throws(() => f.client.adminOverviewCsv(data, UI_PERIOD));
});
