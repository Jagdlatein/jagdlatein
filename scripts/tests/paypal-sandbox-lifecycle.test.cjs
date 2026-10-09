// Actual application routes and PostgreSQL migrations, isolated simulated PayPal responses.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
if (!process.env.JL_PAYPAL_TEST_PGLITE_PATH) throw new Error('Run scripts/setup-paypal-sandbox.ps1 -Step LocalTests. No remote database is used.');
const { PGlite } = require(path.resolve(process.env.JL_PAYPAL_TEST_PGLITE_PATH));
const NOW = Date.now(), DAY = 86400000;
const GENERATION = '11111111-1111-4111-8111-111111111111';
const ID = 'I-SANDBOX1234', PLAN = 'P-BBBBBBBBBBBBBBBBBBBBBBBB', REGULAR = 'P-AAAAAAAAAAAAAAAAAAAAAAAA', EMAIL = 'sandbox-buyer@example.invalid';
const ENV = { NODE_ENV: 'test', JL_SESSION_SECRET: 'isolated-sandbox-regression-secret-at-least-32-bytes',
  ACCOUNT_GENERATION_ENABLED: 'true',
  SUPABASE_URL: 'https://database.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fake-local-only',
  PAYPAL_API_BASE: 'https://api-m.sandbox.paypal.com', PAYPAL_CLIENT_ID: 'fake-sandbox-client',
  NEXT_PUBLIC_PAYPAL_CLIENT_ID: 'fake-sandbox-client', PAYPAL_SECRET: 'fake-local-only', PAYPAL_WEBHOOK_ID: 'fake-webhook',
  NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID: PLAN, PAYPAL_TRIAL_PLAN_IDS: PLAN, PAYPAL_PLAN_IDS: `${PLAN},${REGULAR}` };
const iso = ms => new Date(ms).toISOString();
function trialPlan() { return { id: PLAN, status: 'ACTIVE', billing_cycles: [
  { tenure_type: 'TRIAL', sequence: 1, total_cycles: 1, frequency: { interval_unit: 'DAY', interval_count: 3 },
    pricing_scheme: { fixed_price: { value: '0.00', currency_code: 'EUR' } } },
  { tenure_type: 'REGULAR', sequence: 2, total_cycles: 0, frequency: { interval_unit: 'MONTH', interval_count: 1 },
    pricing_scheme: { fixed_price: { value: '5.00', currency_code: 'EUR' } } },
] }; }
const transaction = (overrides = {}) => ({ id: 'SALE-SANDBOX1234', status: 'COMPLETED', time: iso(NOW - DAY / 2),
  amount_with_breakdown: { gross_amount: { value: '5.00', currency_code: 'EUR' } }, ...overrides });
let pg;
const oldMigrations=['20261003_course_progress.sql','20261003160000_activity_results.sql','20261004100000_ranked_quiz.sql',
  '20261004110000_subscription_access.sql','20261004120000_secure_private_tables.sql','20261004130000_subscription_trial.sql',
  '20261004190000_learning_community.sql','20261007110000_apple_subscriptions.sql','20261007120000_account_deletion.sql'];
const generationMigration=()=>fs.readFileSync(path.join(root,'supabase/migrations/20261009210000_paypal_account_generation.sql'),'utf8');
async function oldDatabase() {
  const database=new PGlite();
  await database.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
  await database.exec(fs.readFileSync(path.join(root,'supabase/test-only/paypal-sandbox-bootstrap.sql'),'utf8'));
  await database.exec('CREATE TABLE public.push_tokens(token text PRIMARY KEY,enabled boolean);');
  for(const file of oldMigrations)await database.exec(fs.readFileSync(path.join(root,'supabase/migrations',file),'utf8'));
  return database;
}
test.before(async () => {
  pg = new PGlite();
  await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
  await pg.exec(fs.readFileSync(path.join(root, 'supabase/test-only/paypal-sandbox-bootstrap.sql'), 'utf8'));
  await pg.exec('CREATE TABLE public.push_tokens(token text PRIMARY KEY,enabled boolean DEFAULT true,updated_at timestamptz DEFAULT now());');
  for (const file of ['20261003_course_progress.sql', '20261003160000_activity_results.sql',
    '20261004100000_ranked_quiz.sql', '20261004110000_subscription_access.sql',
    '20261004120000_secure_private_tables.sql', '20261004130000_subscription_trial.sql', '20261004190000_learning_community.sql',
    '20261007105000_account_registration.sql', '20261007110000_apple_subscriptions.sql', '20261007120000_account_deletion.sql',
    '20261009210000_paypal_account_generation.sql', '20261009220000_complete_account_deletion.sql'])
    await pg.exec(fs.readFileSync(path.join(root, 'supabase/migrations', file), 'utf8'));
});
test.after(async () => { await pg?.close(); });
async function fixture(overrides = {}) {
  await pg.exec('TRUNCATE public.paypal_checkout_requests; TRUNCATE public.paypal_subscriptions CASCADE; TRUNCATE public.userprofile CASCADE;');
  await pg.query('INSERT INTO public.userprofile(user_id,email,is_premium,is_admin,account_generation,updated_at) VALUES(gen_random_uuid(),$1,false,false,$2,now())', [EMAIL, GENERATION]);
  if (!overrides.unknownContract) await pg.query('INSERT INTO public.paypal_subscriptions(subscription_id,account_email,account_generation,plan_id,status,verified_at) VALUES($1,$2,$3,$4,\'APPROVAL_PENDING\',$5)', [ID,EMAIL,GENERATION,PLAN,iso(NOW-DAY)]);
  const state = { status: 'ACTIVE', start: iso(NOW - DAY), nextBilling: iso(NOW + 2 * DAY), subscriptionPlanId: PLAN, merchantPlan: trialPlan(), transactions: [],
    signature: 'SUCCESS', failProvider: false, reads: [], rpcCalls: 0, ...overrides };
  const database = {
    from(table) {
      const q = { filters: [], value: null, select() { return this; }, limit(n) { this.n = n; return this; },
        eq(name, value) { this.filters.push([name, value]); return this; },
        ilike(name, value) { this.filters.push([name, value.replace(/\\([\\%_])/g, '$1')]); return this; },
        insert(value) { this.value = value; return this; },
        async execute(single = false) {
          assert.ok(['userprofile', 'paypal_subscriptions'].includes(table));
          if (this.n === 0) return { data: [], error: null };
          if (this.value) {
            const v = this.value;
            await pg.query('INSERT INTO public.userprofile(user_id,email,is_premium,is_admin,updated_at) VALUES($1,$2,$3,$4,$5)',
              [v.user_id, v.email, v.is_premium, v.is_admin, v.updated_at]);
            return { data: null, error: null };
          }
          const filter = this.filters[0];
          assert.ok(!filter || ['email', 'account_email', 'subscription_id', 'account_generation'].includes(filter[0]));
          if (table === 'paypal_subscriptions' && filter?.[0] === 'subscription_id') {
            if (state.trialLookupError) return { data: null, error: { code: 'isolated-database-error' } };
            if (Object.hasOwn(state, 'trialLookupRow')) return { data: state.trialLookupRow, error: null };
          }
          const result = await pg.query(`SELECT * FROM public.${table}${filter ? ` WHERE ${filter[0]}=$1` : ''}`, filter ? [filter[1]] : []);
          const rows = JSON.parse(JSON.stringify(result.rows));
          return { data: single ? rows[0] || null : rows, error: null };
        }, maybeSingle() { return this.execute(true); }, then(resolve, reject) { return this.execute().then(resolve, reject); },
      }; return q;
    },
    async rpc(name, args) {
      state.rpcCalls++;
      const calls = {
        apply_paypal_subscription_snapshot: ['SELECT public.apply_paypal_subscription_snapshot($1::jsonb) AS data', [JSON.stringify(args.p_snapshot)]],
        begin_paypal_checkout: ['SELECT public.begin_paypal_checkout($1,$2::uuid,$3) AS data', [args.p_email,args.p_account_generation,args.p_plan_id]],
        reserve_paypal_subscription: ['SELECT public.reserve_paypal_subscription($1,$2::uuid,$3::uuid,$4,$5) AS data', [args.p_email,args.p_account_generation,args.p_request_id,args.p_subscription_id,args.p_plan_id]],
      };
      assert.ok(calls[name]);
      try { if (state.beforeRpc) await state.beforeRpc(name); return { data: (await pg.query(...calls[name])).rows[0].data, error: null }; }
      catch (error) { return { data: null, error }; }
    },
  };
  const cache = new Map();
  const fakeFetch = async (target, options) => {
    const url = new URL(target); state.reads.push({ url, options });
    assert.equal(url.origin, ENV.PAYPAL_API_BASE); // Network callback is supplied, global fetch never reached.
    if (state.failProvider) throw new Error('Isolated provider outage');
    if (url.pathname === '/v1/oauth2/token') return Response.json({ access_token: 'fake-token' });
    if (url.pathname === '/v1/notifications/verify-webhook-signature') {
      const input = JSON.parse(options.body);
      assert.equal(input.webhook_id, ENV.PAYPAL_WEBHOOK_ID); assert.equal(input.transmission_id, 'fake-transmission');
      assert.ok(input.webhook_event.event_type);
      return Response.json({ verification_status: state.signature });
    }
    if (url.pathname === '/v1/billing/subscriptions' && options.method === 'POST') {
      assert.equal(JSON.parse(options.body).plan_id, PLAN); assert.match(options.headers['PayPal-Request-Id'], /^[0-9a-f-]{36}$/);
      if (state.onCreate) await state.onCreate();
      return Response.json({ id: state.createdId || ID, plan_id: PLAN, status: 'APPROVAL_PENDING' });
    }
    if (url.pathname === `/v1/billing/subscriptions/${ID}`) { if (state.onProviderRead) await state.onProviderRead(); return Response.json({ id: ID, plan_id: state.subscriptionPlanId, status: state.status,
      start_time: state.start, status_update_time: iso(NOW), subscriber: { email_address: state.payerEmail || EMAIL },
      billing_info: { next_billing_time: state.nextBilling } }); }
    if (url.pathname === `/v1/billing/plans/${state.subscriptionPlanId}`) return Response.json(state.merchantPlan);
    if (url.pathname === `/v1/billing/subscriptions/${ID}/transactions`) {
      const start = Date.parse(url.searchParams.get('start_time')), end = Date.parse(url.searchParams.get('end_time'));
      assert.ok(end - start <= 31 * DAY);
      if (Object.hasOwn(state, 'transactionsResponse')) return Response.json(state.transactionsResponse);
      if (state.transactionPages) return Response.json(state.transactionPages.shift());
      if (state.pagination) return Response.json({ transactions: [], links: [{ rel: 'next', href: state.pagination }] });
      const transactions = state.transactions.filter(row => Date.parse(row.time) >= start && Date.parse(row.time) <= end);
      return Response.json({ transactions, total_pages: 1, total_items: transactions.length });
    }
    if (url.pathname === '/v1/payments/sale/SALE-SANDBOX1234') return Response.json({ id: 'SALE-SANDBOX1234',
      billing_agreement_id: ID, state: state.saleState || 'refunded' });
    throw new Error(`Unexpected isolated endpoint ${url.pathname}`);
  };
  function load(relative) {
    const filename = path.resolve(root, relative); if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename,'utf8')); if (cache.has(filename)) return cache.get(filename).exports;
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022' }, module: { type: 'commonjs' } });
    const mod = { exports: {} }; cache.set(filename, mod);
    new Function('require', 'module', 'exports', 'process', 'fetch', code)(id => {
      if (id === '@supabase/supabase-js') return { createClient: () => database };
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)));
      return pr(id);
    }, mod, mod.exports, { env: ENV }, fakeFetch);
    return mod.exports;
  }
  const initialRow = (await pg.query('SELECT to_jsonb(s) AS data FROM public.paypal_subscriptions s WHERE subscription_id=$1',[ID])).rows[0]?.data;
  const helper = load('lib/subscription-access.js');
  const sessions = load('lib/account-session.js');
  const sessionToken = sessions.createAccountSession(EMAIL,NOW,{ authenticatedAt:Math.floor(NOW/1000), accountGeneration:GENERATION });
  const request = (origin,body,cookie=sessionToken) => ({ url:'https://jagdlatein.test/api/paypal/confirm-subscription',
    headers:new Headers({origin,'content-type':'application/json'}), cookies:{get:name => name === sessions.JL_ACCOUNT_COOKIE && cookie ? {value:cookie} : undefined}, json:async()=>body });
  return { state, database, load, helper, initialRow, refresh: (nowMs = NOW) => helper.refreshVerifiedSubscription(ID, { database, nowMs }),
    webhook: (type, resource = { id: ID }, headers = true) => load('app/api/paypal/webhook/route.js').POST({
      headers: new Headers(headers ? { 'paypal-transmission-id': 'fake-transmission', 'paypal-transmission-time': iso(NOW),
        'paypal-cert-url': 'https://api.sandbox.paypal.com/fake-cert', 'paypal-transmission-sig': 'fake-signature', 'paypal-auth-algo': 'SHA256withRSA' } : {}),
      text: async () => JSON.stringify({ id: 'WH-SANDBOX1234', event_type: type, resource }),
    }),
    confirm: (origin = 'https://jagdlatein.test',body={subscriptionId:ID},cookie=sessionToken) => load('app/api/paypal/confirm-subscription/route.js').POST(request(origin,body,cookie)),
    create: (body={},cookie=sessionToken) => load('app/api/paypal/create-subscription/route.js').POST(request('https://jagdlatein.test',body,cookie)),
    // Match Supabase JSON timestamps; PGlite's raw timestamp decoder returns Date objects.
    row: async () => (await pg.query('SELECT to_jsonb(s) AS data FROM public.paypal_subscriptions s WHERE subscription_id=$1', [ID])).rows[0]?.data,
  };
}
test('Simulated PayPal approval grants exact provider-bound 72-hour trial through the real SQL ledger', async () => {
  const ctx = await fixture(); const response = await ctx.confirm(); assert.equal(response.status, 200);
  const result = await response.json(); assert.equal(result.accessType, 'trial'); assert.equal(result.trialUntil, iso(NOW + 2 * DAY));
  const row = await ctx.row(); assert.equal(row.account_email, EMAIL); assert.equal(row.paid_until, null);
  assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.paypal_subscription_payments')).rows[0].n, 0);
  assert.deepEqual((await pg.query('SELECT email,is_premium,is_admin FROM public.userprofile')).rows[0],
    { email: EMAIL, is_premium: false, is_admin: false });
  const evidence = fs.readFileSync(path.join(root, 'scripts/paypal-sandbox-evidence.sql'), 'utf8')
    .replace('I-ABOIDHIERERSETZEN', ID).replace('P-TRIALPLANIDHIERERSETZEN', PLAN);
  const report = (await pg.query(evidence)).rows[0].sandbox_ledger_report;
  assert.equal(report.subscription_found, true); assert.equal(report.exact_72_hour_window, true);
  assert.equal(report.payments_total, 0); assert.equal(report.status, 'ACTIVE');
  assert.ok(!JSON.stringify(report).includes('@'));
});
test('Trial expires at the exact boundary and checkout/webhook replay cannot restart it', async () => {
  const ctx = await fixture(); const first = await ctx.refresh(); await ctx.confirm(); await ctx.webhook('BILLING.SUBSCRIPTION.ACTIVATED');
  const again = await ctx.row(); assert.equal(Date.parse(again.trial_until), Date.parse(first.trial_until));
  assert.equal(ctx.helper.accessFromSubscriptions([again], NOW + 2 * DAY - 1).paid, true);
  assert.equal(ctx.helper.accessFromSubscriptions([again], NOW + 2 * DAY).paid, false);
});
test('The actual early PayPal billing shape caps free access before the assumed 72-hour deadline', async () => {
  const actualStart = '2026-10-04T19:46:24Z', actualBilling = '2026-10-07T10:00:00Z';
  const earlyBy = (9 * 60 * 60 + 46 * 60 + 24) * 1000;
  const nextBilling = iso(NOW + 2 * DAY - earlyBy);
  const ctx = await fixture({ nextBilling, transactionsResponse: {} });
  assert.deepEqual(ctx.helper.verifiedTrialPeriod({ start_time: actualStart,
    billing_info: { next_billing_time: actualBilling } }, { trial: true }, Date.parse(actualStart) + 600000),
  { startedAt: '2026-10-04T19:46:24.000Z', until: '2026-10-07T10:00:00.000Z' });
  const response = await ctx.confirm(); assert.equal(response.status, 200);
  const result = await response.json(); assert.equal(result.accessType, 'trial'); assert.equal(result.trialUntil, nextBilling);
  const row = await ctx.row(); assert.equal(Date.parse(row.trial_until), Date.parse(nextBilling)); assert.equal(row.paid_until, null);
  assert.equal(ctx.helper.accessFromSubscriptions([row], Date.parse(nextBilling) - 1).paid, true);
  assert.equal(ctx.helper.accessFromSubscriptions([row], Date.parse(nextBilling)).paid, false);
});
test('Repeated verification and later monthly billing preserve the original shorter trial deadline', async () => {
  const ctx = await fixture({ nextBilling: iso(NOW + DAY), transactionsResponse: {} });
  const first = await ctx.refresh(); ctx.state.nextBilling = iso(NOW + 32 * DAY);
  const again = await ctx.refresh(NOW + 1000);
  assert.equal(again.trial_started_at, first.trial_started_at); assert.equal(again.trial_until, first.trial_until);
  assert.equal(again.review_reason, null); assert.equal(again.paid_until, null);
  assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.paypal_subscription_payments')).rows[0].n, 0);
});
test('An expired provider-bound trial cannot return through a later monthly billing schedule', async () => {
  const ctx = await fixture({ start: iso(NOW - 4 * DAY), nextBilling: iso(NOW - 2 * DAY), transactionsResponse: {} });
  const first = await ctx.refresh(); assert.equal(ctx.helper.accessFromSubscriptions([first], NOW).paid, false);
  ctx.state.nextBilling = iso(NOW + 30 * DAY); const again = await ctx.refresh(NOW + 1000);
  assert.equal(again.trial_until, first.trial_until); assert.equal(again.review_reason, null);
  assert.equal(ctx.helper.accessFromSubscriptions([again], NOW + 1000).paid, false);
});
test('Missing, invalid or non-increasing first billing dates cannot activate a trial', async () => {
  for (const nextBilling of [undefined, null, '', 'invalid', 123, iso(NOW - DAY), iso(NOW - 2 * DAY)]) {
    const ctx = await fixture({ nextBilling, transactionsResponse: {} });
    const response = await ctx.confirm(); assert.equal(response.status, 202); assert.equal((await response.json()).activated, false);
    const row = await ctx.row(); assert.equal(row.review_reason, 'trial_schedule_requires_review');
    assert.equal(row.trial_started_at, null); assert.equal(row.trial_until, null); assert.equal(row.paid_until, null);
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.paypal_subscription_payments')).rows[0].n, 0);
  }
});
test('A cancelled trial without next billing still reconciles its actual supported five-euro payment', async () => {
  const ctx = await fixture({ status: 'CANCELLED', start: iso(NOW - 4 * DAY), nextBilling: undefined,
    transactions: [transaction()] });
  const first = await ctx.refresh();
  assert.equal(first.review_reason, 'trial_schedule_requires_review');
  assert.equal(first.trial_started_at, null); assert.equal(first.trial_until, null);
  assert.equal(Date.parse(first.paid_until), Date.parse(ctx.helper.addPlanInterval(transaction().time,
    { interval_unit: 'MONTH', interval_count: 1 })));
  const access = ctx.helper.accessFromSubscriptions([first], NOW);
  assert.equal(access.paid, true); assert.equal(access.accessType, 'paid'); assert.equal(access.status, 'CANCELLED');
  await ctx.refresh(NOW + 1000);
  assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.paypal_subscription_payments')).rows[0].n, 1);
  assert.deepEqual((await pg.query('SELECT is_premium,is_admin FROM public.userprofile')).rows[0], { is_premium: false, is_admin: false });
});
test('An earlier updated billing date is quarantined by the original atomic trial pin', async () => {
  const ctx = await fixture({ nextBilling: iso(NOW + 2 * DAY), transactionsResponse: {} });
  const first = await ctx.refresh(); ctx.state.nextBilling = iso(NOW + DAY);
  const again = await ctx.refresh(NOW + 1000);
  assert.equal(again.trial_started_at, first.trial_started_at); assert.equal(again.trial_until, first.trial_until);
  assert.equal(again.review_reason, 'trial_schedule_changed');
  assert.equal(ctx.helper.accessFromSubscriptions([again], NOW + 1000).paid, false);
});
test('Trial-pin lookup failures and malformed or misassigned rows fail before profile or ledger writes', async () => {
  const pinned = { subscription_id: ID, account_email: EMAIL, trial_started_at: iso(NOW - DAY), trial_until: iso(NOW + DAY) };
  for (const change of [
    { trialLookupError: true }, { trialLookupRow: [] }, { trialLookupRow: {} },
    { trialLookupRow: { ...pinned, subscription_id: 'I-ANOTHER1234' } },
    { trialLookupRow: { ...pinned, account_email: 'other@example.invalid' } },
    { trialLookupRow: { ...pinned, trial_started_at: undefined } },
    { trialLookupRow: { ...pinned, trial_until: null } },
    { trialLookupRow: { ...pinned, trial_until: 'invalid' } },
    { trialLookupRow: { ...pinned, trial_until: iso(NOW + 3 * DAY) } },
  ]) {
    const ctx = await fixture({ transactionsResponse: {}, ...change });
    const response = await ctx.confirm(); assert.equal(response.status, 503); assert.equal(ctx.state.rpcCalls, 0);
    assert.deepEqual(await ctx.row(), ctx.initialRow);
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.userprofile')).rows[0].n, 1);
  }
});
test('Actual PayPal empty-object history activates only a verified trial and replay preserves its fixed end', async () => {
  const ctx = await fixture({ transactionsResponse: {} });
  const response = await ctx.confirm(); assert.equal(response.status, 200);
  const result = await response.json(); assert.equal(result.activated, true); assert.equal(result.accessType, 'trial');
  const first = await ctx.row(); assert.equal(first.review_reason, null); assert.equal(first.paid_until, null);
  assert.equal(Date.parse(first.trial_until), NOW + 2 * DAY);
  await ctx.refresh(NOW + 1000); await ctx.webhook('BILLING.SUBSCRIPTION.ACTIVATED');
  const again = await ctx.row(); assert.equal(again.trial_started_at, first.trial_started_at); assert.equal(again.trial_until, first.trial_until);
  assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.paypal_subscription_payments')).rows[0].n, 0);
  assert.deepEqual((await pg.query('SELECT is_premium,is_admin FROM public.userprofile')).rows[0], { is_premium: false, is_admin: false });
});
test('Empty-object history is no payment proof for an ACTIVE regular subscription', async () => {
  const plan = trialPlan(); plan.id = REGULAR; plan.billing_cycles = [plan.billing_cycles[1]];
  plan.billing_cycles[0].sequence = 1;
  const ctx = await fixture({ transactionsResponse: {}, subscriptionPlanId: REGULAR, merchantPlan: plan });
  const response = await ctx.confirm(); assert.equal(response.status, 202);
  const result = await response.json(); assert.equal(result.activated, false); assert.equal(result.accessType, 'none');
  const row = await ctx.row(); assert.equal(row.status, 'ACTIVE'); assert.equal(row.review_reason, null);
  assert.equal(row.paid_until, null); assert.equal(row.trial_started_at, null); assert.equal(row.trial_until, null);
  assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.paypal_subscription_payments')).rows[0].n, 0);
  assert.deepEqual((await pg.query('SELECT is_premium,is_admin FROM public.userprofile')).rows[0], { is_premium: false, is_admin: false });
});
test('Empty-object history cannot extend an expired trial or turn pending approval into access', async () => {
  for (const change of [{ start: iso(NOW - 3 * DAY) }, { status: 'APPROVAL_PENDING' }]) {
    const ctx = await fixture({ transactionsResponse: {}, ...change });
    const response = await ctx.confirm(); assert.equal(response.status, 202); assert.equal((await response.json()).activated, false);
    assert.equal((await ctx.row()).paid_until, null);
  }
});
test('Null, unknown and malformed transaction histories still fail before profile or ledger writes', async () => {
  for (const transactionsResponse of [null, [], { transactions: null }, { transactions: {} }, { transactions: 'invalid' },
    { total_items: 0 }, { total_items: 0, total_pages: 0 }, { name: 'INTERNAL_SERVER_ERROR' }, { error: 'unavailable' }]) {
    const ctx = await fixture({ transactionsResponse });
    const response = await ctx.confirm(); assert.equal(response.status, 503);
    assert.equal(ctx.state.rpcCalls, 0); assert.deepEqual(await ctx.row(), ctx.initialRow);
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.userprofile')).rows[0].n, 1);
  }
});
test('An empty object on a continuation page cannot hide an incomplete transaction list', async () => {
  const prefix = `${ENV.PAYPAL_API_BASE}/v1/billing/subscriptions/${ID}/transactions`;
  const ctx = await fixture({ transactionPages: [{ transactions: [transaction()], total_items: 2, total_pages: 2,
    links: [{ rel: 'next', href: `${prefix}?page=2`, method: 'GET' }] }, {}] });
  const response = await ctx.confirm(); assert.equal(response.status, 503);
  assert.equal(ctx.state.rpcCalls, 0); assert.deepEqual(await ctx.row(), ctx.initialRow);
});
test('Changed provider start is quarantined and original SQL trial evidence remains pinned', async () => {
  const ctx = await fixture(); const first = await ctx.refresh(); ctx.state.start = iso(NOW - 1000);
  const again = await ctx.refresh(NOW + 1000); assert.equal(again.trial_until, first.trial_until);
  assert.equal(again.review_reason, 'trial_schedule_changed'); assert.equal(ctx.helper.accessFromSubscriptions([again], NOW).paid, false);
});
for (const status of ['APPROVAL_PENDING', 'APPROVED', 'CANCELLED', 'SUSPENDED', 'EXPIRED'])
  test(`Unfunded ${status} cannot grant trial access`, async () => {
    const ctx = await fixture({ status }); const response = await ctx.confirm(); assert.equal(response.status, 202);
    assert.equal((await response.json()).activated, false);
  });
test('Cancellation webhook ends free trial and preserves no fictional payment', async () => {
  const ctx = await fixture(); await ctx.refresh(); ctx.state.status = 'CANCELLED';
  assert.equal((await (await ctx.webhook('BILLING.SUBSCRIPTION.CANCELLED')).json()).premium, false);
  const row = await ctx.row(); assert.equal(row.status, 'CANCELLED'); assert.equal(row.paid_until, null);
});
test('Verified five-euro renewal after trial grants exactly one month; duplicate events create only one payment', async () => {
  const ctx = await fixture({ start: iso(NOW - 4 * DAY), transactions: [transaction()] });
  const response = await ctx.webhook('PAYMENT.SALE.COMPLETED', { id: 'SALE-SANDBOX1234', billing_agreement_id: ID });
  assert.equal((await response.json()).premium, true);
  await ctx.webhook('PAYMENT.SALE.COMPLETED', { id: 'SALE-SANDBOX1234', billing_agreement_id: ID });
  const row = await ctx.row(); assert.equal(ctx.helper.accessFromSubscriptions([row], NOW).accessType, 'paid');
  assert.equal(Date.parse(row.paid_until), Date.parse(ctx.helper.addPlanInterval(transaction().time, { interval_unit: 'MONTH', interval_count: 1 })));
  assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.paypal_subscription_payments')).rows[0].n, 1);
});
test('Cancellation preserves only the already confirmed paid period until its hard expiry', async () => {
  const ctx = await fixture({ start: iso(NOW - 4 * DAY), transactions: [transaction()] }); await ctx.refresh();
  ctx.state.status = 'CANCELLED'; await ctx.webhook('BILLING.SUBSCRIPTION.CANCELLED'); const row = await ctx.row();
  assert.equal(ctx.helper.accessFromSubscriptions([row], NOW).accessType, 'paid');
  assert.equal(ctx.helper.accessFromSubscriptions([row], Date.parse(row.paid_until)).paid, false);
});
for (const status of ['FAILED', 'DECLINED', 'PENDING'])
  test(`A ${status} first payment cannot turn an expired trial into paid coverage`, async () => {
    const ctx = await fixture({ start: iso(NOW - 4 * DAY), transactions: [transaction({ status })] });
    const response = await ctx.webhook('BILLING.SUBSCRIPTION.PAYMENT.FAILED'); assert.equal(response.status, 200);
    assert.equal((await response.json()).premium, false); assert.equal((await ctx.row()).paid_until, null);
  });
test('Failure during an active trial cannot extend its fixed end', async () => {
  const ctx = await fixture({ transactions: [transaction({ status: 'FAILED' })] });
  await ctx.webhook('BILLING.SUBSCRIPTION.PAYMENT.FAILED'); const row = await ctx.row();
  assert.equal(Date.parse(row.trial_until), NOW + 2 * DAY);
  assert.equal(ctx.helper.accessFromSubscriptions([row], NOW + 2 * DAY).paid, false);
});
test('Failed subsequent renewal retains prior funded coverage but never extends it', async () => {
  const ctx = await fixture({ start: iso(NOW - 4 * DAY), transactions: [transaction()] }); const first = await ctx.refresh();
  ctx.state.transactions.push(transaction({ id: 'SALE-FAILED1234', status: 'FAILED', time: iso(NOW - 1000) }));
  await ctx.webhook('BILLING.SUBSCRIPTION.PAYMENT.FAILED'); const row = await ctx.row();
  assert.equal(Date.parse(row.paid_until), Date.parse(first.paid_until));
});
test('Wrong price cannot grant access after the trial', async () => {
  const bad = transaction(); bad.amount_with_breakdown.gross_amount.value = '4.00';
  const ctx = await fixture({ start: iso(NOW - 4 * DAY), transactions: [bad] }); const row = await ctx.refresh();
  assert.equal(row.review_reason, 'payment_amount_requires_review'); assert.equal(row.paid_until, null);
});
test('Current merchant-plan mismatch blocks trial activation despite an ACTIVE subscription', async () => {
  const bad = trialPlan(); bad.billing_cycles[0].frequency.interval_count = 4;
  const ctx = await fixture({ merchantPlan: bad }); const response = await ctx.confirm(); assert.equal(response.status, 202);
  assert.equal((await ctx.row()).review_reason, 'unsupported_trial_plan');
});
test('Full refund removes funded coverage and a stale completion replay cannot restore it', async () => {
  const ctx = await fixture({ start: iso(NOW - 4 * DAY), transactions: [transaction()] }); await ctx.refresh();
  const response = await ctx.webhook('PAYMENT.SALE.REFUNDED', { id: 'REFUND-SANDBOX1234', sale_id: 'SALE-SANDBOX1234' });
  assert.equal((await response.json()).premium, false); await ctx.refresh();
  assert.equal((await ctx.row()).paid_until, null);
  assert.equal((await pg.query('SELECT status FROM public.paypal_subscription_payments')).rows[0].status, 'REFUNDED');
});
test('Invalid or absent webhook signature cannot cause ledger writes', async () => {
  for (const headers of [true, false]) {
    const ctx = await fixture({ signature: 'FAILURE' }); const response = await ctx.webhook('BILLING.SUBSCRIPTION.ACTIVATED', { id: ID }, headers);
    assert.equal(response.status, 401); assert.equal(ctx.state.rpcCalls, 0); assert.deepEqual(await ctx.row(), ctx.initialRow);
  }
});
test('Order approval alone is ignored and cannot activate a subscription', async () => {
  const ctx = await fixture(); const response = await ctx.webhook('CHECKOUT.ORDER.APPROVED');
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { ignored: true }); assert.equal(ctx.state.rpcCalls, 0);
});
test('Cross-origin checkout confirmation is rejected before PayPal reads', async () => {
  const ctx = await fixture(); const response = await ctx.confirm('https://attacker.example.invalid');
  assert.equal(response.status, 403); assert.equal(ctx.state.reads.length, 0);
});
test('Provider outage fails safely and cannot prolong an expired trial', async () => {
  const ctx = await fixture(); await ctx.refresh(NOW - 600000); ctx.state.failProvider = true;
  await assert.rejects(ctx.helper.resolveSubscriptionAccess(ctx.database, EMAIL, { nowMs: NOW }), error => error.status === 503);
  await assert.rejects(ctx.helper.resolveSubscriptionAccess(ctx.database, EMAIL, { nowMs: NOW + 2 * DAY }), error => error.status === 503);
});
test('Pagination cannot send the sandbox token to another host', async () => {
  const ctx = await fixture({ pagination: 'https://api-m.paypal.com/v1/billing/subscriptions/I-SANDBOX1234/transactions' });
  await assert.rejects(ctx.refresh(), error => error.status === 503); assert.equal(ctx.state.rpcCalls, 0);
  assert.ok(ctx.state.reads.every(call => call.url.origin === ENV.PAYPAL_API_BASE));
});
test('Fresh-test bootstrap refuses an existing schema and preserves its account/subscription data', async () => {
  const ctx = await fixture(); await ctx.refresh();
  await assert.rejects(pg.exec(fs.readFileSync(path.join(root, 'supabase/test-only/paypal-sandbox-bootstrap.sql'), 'utf8')), /public schema is not empty/);
  await pg.exec('ROLLBACK;');
  assert.equal((await ctx.row()).account_email, EMAIL);
  assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.userprofile')).rows[0].n, 1);
});

test('Unsigned confirmation and creation fail before any provider request; caller ownership fields are rejected', async () => {
  const ctx = await fixture();
  assert.equal((await ctx.confirm(undefined,{subscriptionId:ID},null)).status,401);
  assert.equal((await ctx.create({},null)).status,401);
  assert.equal((await ctx.confirm(undefined,{subscriptionId:ID,email:EMAIL,accountGeneration:GENERATION})).status,400);
  assert.equal((await ctx.create({planId:PLAN})).status,400);
  assert.equal(ctx.state.reads.length,0); assert.equal(ctx.state.rpcCalls,0);
});

test('Unknown verified contracts are ignored without importing provider email or creating ledger rows', async () => {
  const ctx = await fixture({unknownContract:true});
  assert.equal(await ctx.refresh(),null); assert.equal(ctx.state.reads.length,0);
  const response = await ctx.webhook('BILLING.SUBSCRIPTION.ACTIVATED');
  assert.equal(response.status,200); assert.deepEqual(await response.json(),{ignored:true});
  assert.equal(await ctx.row(),undefined); assert.equal(ctx.state.rpcCalls,0);
  assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.userprofile')).rows[0].n,1);
});

test('A different current account cannot confirm another owner contract', async () => {
  const ctx = await fixture(); const otherGeneration='22222222-2222-4222-8222-222222222222';
  await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation) VALUES(gen_random_uuid(),$1,$2)', ['other@example.invalid',otherGeneration]);
  const token=ctx.load('lib/account-session.js').createAccountSession('other@example.invalid',NOW,{authenticatedAt:Math.floor(NOW/1000),accountGeneration:otherGeneration});
  assert.equal((await ctx.confirm(undefined,{subscriptionId:ID},token)).status,409);
  assert.equal(ctx.state.reads.length,0); assert.equal(ctx.state.rpcCalls,0);
  assert.deepEqual(await ctx.row(),ctx.initialRow);
});

test('Server creation reserves the new provider ID before returning it, with one shared request key', async () => {
  const ctx = await fixture({unknownContract:true});
  const responses=await Promise.all([ctx.create(),ctx.create()]);
  for (const response of responses) { assert.equal(response.status,200); assert.deepEqual(await response.json(),{subscriptionId:ID}); }
  const row=await ctx.row(); assert.equal(row.account_email,EMAIL); assert.equal(row.account_generation,GENERATION); assert.equal(row.status,'APPROVAL_PENDING');
  const creates=ctx.state.reads.filter(read=>read.url.pathname==='/v1/billing/subscriptions');
  assert.ok(creates.length>=1); assert.equal(new Set(creates.map(read=>read.options.headers['PayPal-Request-Id'])).size,1);
  for (const call of creates) { const body=JSON.parse(call.options.body); assert.equal(body.plan_id,PLAN); assert.equal(body.subscriber,undefined); assert.equal(body.plan,undefined); }
  assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.paypal_subscriptions')).rows[0].n,1);
});

test('Malformed provider creation and failed reservation never return an approvable ID', async () => {
  for (const change of [{createdId:'invalid'},{beforeRpc:name=>{if(name==='reserve_paypal_subscription') throw new Error('isolated reservation failure');}}]) {
    const ctx=await fixture({unknownContract:true,...change}); const response=await ctx.create();
    assert.equal(response.status,503); assert.equal((await response.json()).subscriptionId,undefined); assert.equal(await ctx.row(),undefined);
  }
});

test('Provider creation delayed across deletion and same-email registration cannot reserve the old generation', async () => {
  const ctx=await fixture({unknownContract:true});
  ctx.state.onCreate=async()=>{
    await pg.query('SELECT public.delete_jagdlatein_account($1,$2::uuid)',[EMAIL,GENERATION]);
    await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation) VALUES(gen_random_uuid(),$1,$2)',[EMAIL,'22222222-2222-4222-8222-222222222222']);
  };
  const response=await ctx.create(); assert.equal(response.status,503); assert.equal((await response.json()).subscriptionId,undefined);
  assert.equal(await ctx.row(),undefined); assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.paypal_checkout_requests')).rows[0].n,0);
});

test('A late verified refresh cannot recreate the purged contract or bind it to a replacement generation', async () => {
  for (const boundary of ['provider','rpc']) {
    const ctx=await fixture(); let once=false;
    const purge=async()=>{ if(once)return; once=true;
      await pg.query('SELECT public.delete_jagdlatein_account($1,$2::uuid)',[EMAIL,GENERATION]);
      await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation) VALUES(gen_random_uuid(),$1,$2)',[EMAIL,'22222222-2222-4222-8222-222222222222']);
    };
    if(boundary==='provider')ctx.state.onProviderRead=purge;
    else ctx.state.beforeRpc=name=>name==='apply_paypal_subscription_snapshot'?purge():undefined;
    assert.equal(await ctx.refresh(),null); assert.equal(await ctx.row(),undefined);
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.paypal_subscription_payments')).rows[0].n,0);
    const after=await ctx.webhook('BILLING.SUBSCRIPTION.ACTIVATED'); assert.equal(after.status,200); assert.deepEqual(await after.json(),{ignored:true});
    assert.equal((await ctx.confirm()).status,401);
  }
});

test('The payer email cannot transfer the learning-account binding', async () => {
  const ctx=await fixture({payerEmail:'different-payer@example.invalid'}); await ctx.refresh(); assert.equal((await ctx.row()).account_generation,GENERATION);
  // Creation never supplies subscriber identity; snapshot ownership comes only from the existing row.
  assert.equal((await ctx.row()).account_email,EMAIL);
  assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.userprofile')).rows[0].n,1);
});

test('Actual generation backfill preserves canonical funded, trial and cancelled contracts and is stable on rerun', async () => {
  const database=await oldDatabase();
  try {
    await database.query('INSERT INTO public.userprofile(user_id,email,account_generation) VALUES(gen_random_uuid(),$1,$2)',[EMAIL,GENERATION]);
    for(const [id,status] of [['I-BACKFILLACTIVE','ACTIVE'],['I-BACKFILLTRIAL','ACTIVE'],['I-BACKFILLCANCEL','CANCELLED']])
      await database.query('INSERT INTO public.paypal_subscriptions(subscription_id,account_email,plan_id,status,paid_until,verified_at) VALUES($1,$2,$3,$4,now()+interval\'1 day\',now())',[id,EMAIL,PLAN,status]);
    await database.exec("UPDATE public.paypal_subscriptions SET trial_started_at=now(),trial_until=now()+interval'72 hours' WHERE subscription_id='I-BACKFILLTRIAL';");
    await database.query('INSERT INTO public.paypal_subscription_payments(subscription_id,payment_id,status,amount,currency,observed_at) VALUES($1,$2,\'COMPLETED\',\'5.00\',\'EUR\',now())',['I-BACKFILLACTIVE','PAYMENT-BACKFILL']);
    const before=(await database.query('SELECT to_jsonb(s) AS data FROM public.paypal_subscriptions s ORDER BY subscription_id')).rows.map(row=>row.data);
    const paymentsBefore=(await database.query('SELECT to_jsonb(p) AS data FROM public.paypal_subscription_payments p')).rows;
    await database.exec(generationMigration());
    let after=(await database.query('SELECT to_jsonb(s) AS data FROM public.paypal_subscriptions s ORDER BY subscription_id')).rows.map(row=>row.data);
    assert.deepEqual(after,before.map(row=>({...row,account_generation:GENERATION})));
    await database.exec(generationMigration());
    assert.deepEqual((await database.query('SELECT to_jsonb(s) AS data FROM public.paypal_subscriptions s ORDER BY subscription_id')).rows.map(row=>row.data),after);
    assert.deepEqual((await database.query('SELECT to_jsonb(p) AS data FROM public.paypal_subscription_payments p')).rows,paymentsBefore);
  } finally {await database.close();}
});

test('Missing, ambiguous or changed canonical owners abort backfill without assigning a generation', async () => {
  for(const problem of ['missing','ambiguous','changed']) {
    const database=await oldDatabase();
    try {
      await database.query('INSERT INTO public.userprofile(user_id,email,account_generation) VALUES(gen_random_uuid(),$1,$2)',[EMAIL,GENERATION]);
      await database.query('INSERT INTO public.paypal_subscriptions(subscription_id,account_email,plan_id,status,verified_at) VALUES($1,$2,$3,\'ACTIVE\',now())',[ID,EMAIL,PLAN]);
      if(problem==='ambiguous') {
        // Deliberately corrupt the old fixture's normalization constraint: even
        // an out-of-band ambiguous schema must fail rather than select an owner.
        await database.exec('ALTER TABLE public.userprofile DROP CONSTRAINT userprofile_email_check;');
        await database.query('INSERT INTO public.userprofile(user_id,email,account_generation) VALUES(gen_random_uuid(),$1,$2)',[EMAIL.toUpperCase(),'22222222-2222-4222-8222-222222222222']);
      }
      else if(problem==='changed') {
        await database.exec('ALTER TABLE public.paypal_subscriptions ADD COLUMN account_generation uuid;');
        await database.query('UPDATE public.paypal_subscriptions SET account_generation=$1',['22222222-2222-4222-8222-222222222222']);
      }
      else await database.query('DELETE FROM public.userprofile WHERE email=$1',[EMAIL]);
      await assert.rejects(database.exec(generationMigration()),/JL_PAYPAL_SETUP/); await database.exec('ROLLBACK;');
      assert.equal((await database.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema='public' AND table_name='paypal_subscriptions' AND column_name='account_generation'")).rows[0].n,problem==='changed'?1:0);
      if(problem==='changed') assert.equal((await database.query('SELECT account_generation FROM public.paypal_subscriptions')).rows[0].account_generation,'22222222-2222-4222-8222-222222222222');
      assert.equal((await database.query('SELECT count(*)::int AS n FROM public.paypal_subscriptions')).rows[0].n,1);
    } finally {await database.close();}
  }
});

test('Service RPCs reserve and update only a live generation without general profile UPDATE permission', async () => {
  const ctx=await fixture({unknownContract:true});
  await pg.exec('REVOKE ALL ON public.userprofile FROM service_role; GRANT SELECT ON public.userprofile TO service_role; SET ROLE service_role;');
  try {
    assert.equal((await pg.query("SELECT has_table_privilege(current_user,'public.userprofile','UPDATE') AS allowed")).rows[0].allowed,false);
    const begun=(await pg.query('SELECT public.begin_paypal_checkout($1,$2::uuid,$3) AS data',[EMAIL,GENERATION,PLAN])).rows[0].data;
    const reserved=(await pg.query('SELECT public.reserve_paypal_subscription($1,$2::uuid,$3::uuid,$4,$5) AS data',[EMAIL,GENERATION,begun.request_id,ID,PLAN])).rows[0].data;
    assert.equal(reserved.account_generation,GENERATION);
    const applied=(await pg.query('SELECT public.apply_paypal_subscription_snapshot($1::jsonb) AS data',[JSON.stringify({subscription_id:ID,account_email:EMAIL,account_generation:GENERATION,plan_id:PLAN,status:'ACTIVE',observed_at:iso(NOW),payments:[]})])).rows[0].data;
    assert.equal(applied.account_generation,GENERATION);
    await assert.rejects(pg.query('SELECT public.reserve_paypal_subscription($1,$2::uuid,$3::uuid,$4,$5)',[EMAIL,'22222222-2222-4222-8222-222222222222',begun.request_id,ID,PLAN]),/JL_PAYPAL_BINDING_MISSING/);
    for(const role of ['anon','authenticated']) {
      await pg.exec(`RESET ROLE; SET ROLE ${role};`);
      await assert.rejects(pg.query('SELECT public.begin_paypal_checkout($1,$2::uuid,$3)',[EMAIL,GENERATION,PLAN]),/permission denied/);
      await assert.rejects(pg.query('SELECT * FROM public.paypal_checkout_requests'),/permission denied/);
      await assert.rejects(pg.query('DELETE FROM public.paypal_subscriptions'),/permission denied/);
    }
  } finally {await pg.exec('RESET ROLE;');}
});

test('A stale direct profile insertion fails after purge while verified service registration creates a fresh generation', async () => {
  await fixture({unknownContract:true});
  const codeHash=await pr('bcryptjs').hash('synthetic-verified-code',10);
  await pg.exec('SET ROLE service_role;');
  try {
    await pg.query('SELECT public.delete_jagdlatein_account($1,$2::uuid)',[EMAIL,GENERATION]);
    assert.equal((await pg.query("SELECT has_any_column_privilege(current_user,'public.userprofile','INSERT') AS allowed")).rows[0].allowed,false);
    await assert.rejects(pg.query('INSERT INTO public.userprofile(user_id,email,is_premium,is_admin,updated_at) VALUES(gen_random_uuid(),$1,false,false,now())',[EMAIL]),/permission denied/);
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.userprofile WHERE email=$1',[EMAIL])).rows[0].n,0);
    const reservation=(await pg.query('SELECT public.reserve_account_registration_code($1,$2) AS data',[EMAIL,codeHash])).rows[0].data;
    assert.equal(reservation.reserved,true);
    const attempted=(await pg.query('SELECT public.begin_account_registration_attempt($1) AS data',[EMAIL])).rows[0].data;
    assert.equal(attempted.valid,true);
    const consumed=(await pg.query('SELECT public.consume_account_registration_code($1,$2::uuid,$3) AS data',[EMAIL,attempted.registrationId,codeHash])).rows[0].data;
    assert.equal(consumed.consumed,true);
    assert.equal(consumed.profile.email,EMAIL); assert.notEqual(consumed.profile.account_generation,GENERATION);
    assert.equal(consumed.profile.is_premium,false); assert.equal(consumed.profile.is_admin,false);
  } finally {await pg.exec('RESET ROLE;');}
});

test('An inherited legacy profile INSERT privilege aborts the generation migration atomically', async () => {
  const database=await oldDatabase();
  try {
    await database.exec('CREATE ROLE legacy_profile_creator; GRANT INSERT(email,user_id) ON public.userprofile TO legacy_profile_creator; GRANT legacy_profile_creator TO service_role;');
    await assert.rejects(database.exec(generationMigration()),/JL_PAYPAL_SETUP: inherited profile creation privilege/);
    await database.exec('ROLLBACK;');
    assert.equal((await database.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema='public' AND table_name='paypal_subscriptions' AND column_name='account_generation'")).rows[0].n,0);
  } finally {await database.close();}
});
