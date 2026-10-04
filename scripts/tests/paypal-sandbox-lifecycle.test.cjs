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
const ID = 'I-SANDBOX1234', PLAN = 'P-BBBBBBBBBBBBBBBBBBBBBBBB', REGULAR = 'P-AAAAAAAAAAAAAAAAAAAAAAAA', EMAIL = 'sandbox-buyer@example.invalid';
const ENV = { NODE_ENV: 'test', JL_SESSION_SECRET: 'isolated-sandbox-regression-secret-at-least-32-bytes',
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
test.before(async () => {
  pg = new PGlite();
  await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
  await pg.exec(fs.readFileSync(path.join(root, 'supabase/test-only/paypal-sandbox-bootstrap.sql'), 'utf8'));
  for (const file of ['20261003_course_progress.sql', '20261003160000_activity_results.sql',
    '20261004100000_ranked_quiz.sql', '20261004110000_subscription_access.sql',
    '20261004120000_secure_private_tables.sql', '20261004130000_subscription_trial.sql', '20261004190000_learning_community.sql'])
    await pg.exec(fs.readFileSync(path.join(root, 'supabase/migrations', file), 'utf8'));
});
test.after(async () => { await pg?.close(); });
async function fixture(overrides = {}) {
  await pg.exec('TRUNCATE public.paypal_subscriptions CASCADE; TRUNCATE public.userprofile;');
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
          assert.ok(!filter || ['email', 'account_email', 'subscription_id'].includes(filter[0]));
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
    async rpc(name, { p_snapshot }) {
      assert.equal(name, 'apply_paypal_subscription_snapshot'); state.rpcCalls++;
      try { return { data: (await pg.query('SELECT public.apply_paypal_subscription_snapshot($1::jsonb) AS data', [JSON.stringify(p_snapshot)])).rows[0].data, error: null }; }
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
    if (url.pathname === `/v1/billing/subscriptions/${ID}`) return Response.json({ id: ID, plan_id: state.subscriptionPlanId, status: state.status,
      start_time: state.start, status_update_time: iso(NOW), subscriber: { email_address: EMAIL },
      billing_info: { next_billing_time: state.nextBilling } });
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
    const filename = path.resolve(root, relative); if (cache.has(filename)) return cache.get(filename).exports;
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
  const helper = load('lib/subscription-access.js');
  return { state, database, load, helper, refresh: (nowMs = NOW) => helper.refreshVerifiedSubscription(ID, { database, nowMs }),
    webhook: (type, resource = { id: ID }, headers = true) => load('app/api/paypal/webhook/route.js').POST({
      headers: new Headers(headers ? { 'paypal-transmission-id': 'fake-transmission', 'paypal-transmission-time': iso(NOW),
        'paypal-cert-url': 'https://api.sandbox.paypal.com/fake-cert', 'paypal-transmission-sig': 'fake-signature', 'paypal-auth-algo': 'SHA256withRSA' } : {}),
      text: async () => JSON.stringify({ id: 'WH-SANDBOX1234', event_type: type, resource }),
    }),
    confirm: (origin = 'https://jagdlatein.test') => load('app/api/paypal/confirm-subscription/route.js').POST({
      url: 'https://jagdlatein.test/api/paypal/confirm-subscription', headers: new Headers({ origin }),
      json: async () => ({ subscriptionId: ID, email: 'forged@example.invalid' }),
    }),
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
    assert.equal(await ctx.row(), undefined);
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.userprofile')).rows[0].n, 0);
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
    assert.equal(ctx.state.rpcCalls, 0); assert.equal(await ctx.row(), undefined);
    assert.equal((await pg.query('SELECT count(*)::int AS n FROM public.userprofile')).rows[0].n, 0);
  }
});
test('An empty object on a continuation page cannot hide an incomplete transaction list', async () => {
  const prefix = `${ENV.PAYPAL_API_BASE}/v1/billing/subscriptions/${ID}/transactions`;
  const ctx = await fixture({ transactionPages: [{ transactions: [transaction()], total_items: 2, total_pages: 2,
    links: [{ rel: 'next', href: `${prefix}?page=2`, method: 'GET' }] }, {}] });
  const response = await ctx.confirm(); assert.equal(response.status, 503);
  assert.equal(ctx.state.rpcCalls, 0); assert.equal(await ctx.row(), undefined);
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
    assert.equal(response.status, 401); assert.equal(ctx.state.rpcCalls, 0); assert.equal(await ctx.row(), undefined);
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
