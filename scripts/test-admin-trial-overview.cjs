const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const NOW = Date.parse('2026-10-14T12:00:00.000Z');
const ACTOR = 'operator@example.invalid';
const ACTOR_GENERATION = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const EMAIL = 'learner@example.invalid';
const GENERATION = '11111111-1111-4111-8111-111111111111';
const NEW_GENERATION = '22222222-2222-4222-8222-222222222222';
const TOKEN = '33333333-3333-4333-8333-333333333333';
const SESSION = { email: ACTOR, accountGeneration: ACTOR_GENERATION, admin: true };
const notifications = { configured: true, recipient: 'info@jagdlatein.de', enabledSince: '2026-10-14T10:00:00.000Z', pendingCount: 1, sentCount: 2 };
const iso = value => new Date(value).toISOString();
function paypal(overrides = {}) {
  return { subscription_id: 'I-TRIAL12345', account_email: EMAIL, account_generation: GENERATION, account_deleted_at: null,
    plan_id: 'P-TEST12345', status: 'ACTIVE', paid_until: null, trial_started_at: '2026-10-13T12:00:00.000Z',
    trial_until: '2026-10-16T12:00:00.000Z', review_reason: null, verified_at: iso(NOW), created_at: iso(NOW - 1000), ...overrides };
}
function appleTransaction(overrides = {}) {
  return { environment: 'Production', transaction_id: '202', original_transaction_id: '101', app_account_token: TOKEN,
    purchased_at: '2026-10-13T12:00:00.000Z', expires_at: '2026-11-13T12:00:00.000Z', is_trial: false,
    revoked_at: null, is_upgraded: false, ...overrides };
}
function apple(overrides = {}) {
  return { environment: 'Production', original_transaction_id: '101', app_account_token: TOKEN, latest_transaction_id: '202',
    status: 1, auto_renew: true, access_until: '2026-11-13T12:00:00.000Z', is_trial: false, grace_until: null,
    verified_at: iso(NOW), created_at: iso(NOW - 2000), owner: { account_email: EMAIL, account_generation: GENERATION, deleted_at: null },
    ...overrides };
}
function history() {
  return [appleTransaction({ transaction_id: '201', is_trial: true, purchased_at: '2026-10-10T12:00:00.000Z', expires_at: '2026-10-13T12:00:00.000Z' }), appleTransaction()];
}
function payment(overrides = {}) {
  return { subscription_id: 'I-TRIAL12345', payment_id: 'PAYMENT12345', status: 'COMPLETED', paid_at: '2026-10-13T12:00:00.000Z',
    period_until: '2026-11-13T12:00:00.000Z', amount: '10.00', currency: 'EUR', ...overrides };
}

function fixture(options = {}) {
  const calls = [], cache = new Map(); let actorReads = 0, profileReads = 0;
  const actor = { email: ACTOR, account_generation: ACTOR_GENERATION, is_admin: true, is_community_moderator: true, ...options.actor };
  const sources = { paypal_subscriptions: options.paypal || [], apple_subscriptions: options.apple || [], apple_subscription_transactions: options.transactions || [] };
  const profileRows = options.profiles || [{ email: EMAIL, account_generation: GENERATION }];
  const database = {
    from(table) {
      const query = { table, filters: [], orders: [], limits: [] }; calls.push(query);
      const builder = {
        select(columns) { query.columns = columns; return this; },
        eq(column, value) { query.filters.push(['eq', column, value]); return this; },
        is(column, value) { query.filters.push(['is', column, value]); return this; },
        not(column, operator, value) { query.filters.push(['not', column, value, operator]); return this; },
        in(column, values) { query.filters.push(['in', column, [...values]]); return this; },
        ilike(column, value) { query.filters.push(['ilike', column, value]); return this; },
        order(column, spec = {}) { query.orders.push([column, spec]); return this; },
        limit(value, spec = {}) { query.limits.push([value, spec]); return this; },
        insert() { throw new Error('Read-only overview must not insert.'); },
        update() { throw new Error('Read-only overview must not update.'); },
        delete() { throw new Error('Read-only overview must not delete.'); },
        async maybeSingle() { const result = execute(); return { ...result, data: result.data?.[0] || null }; },
        then(resolve, reject) { return Promise.resolve().then(execute).then(resolve, reject); },
      };
      function execute() {
        if (options.databaseError && table === options.databaseError.table) return { data: null, error: { code: options.databaseError.code } };
        let data;
        if (table === 'userprofile' && query.columns.includes('is_admin')) {
          actorReads++;
          data = [options.revokeAdminAfterFirstRead && actorReads > 1 ? { ...actor, is_admin: false } : actor];
        } else if (table === 'userprofile') {
          profileReads++;
          data = options.deleteAfterInitialProfiles && profileReads > 1 ? [] : profileRows;
        } else {
          data = sources[table];
          assert.ok(Array.isArray(data), `Unexpected table ${table}`);
          data = data.map(row => ({ ...row }));
          if (query.columns.includes('trial:')) data = data.map(row => ({ ...row, trial: sources.apple_subscription_transactions
            .filter(value => value.original_transaction_id === row.original_transaction_id && value.environment === row.environment) }));
          if (query.columns.includes('regular:')) data = data.map(row => ({ ...row, regular: table === 'paypal_subscriptions'
            ? (options.payments || []).filter(value => value.subscription_id === row.subscription_id)
            : sources.apple_subscription_transactions.filter(value => value.original_transaction_id === row.original_transaction_id && value.environment === row.environment) }));
        }
        const matches = (row, [operation, column, value]) => {
          const actual = row[column];
          if (operation === 'not') return value === null ? actual != null : actual !== value;
          if (operation === 'in') return value.includes(actual);
          if (operation === 'ilike') return String(actual).toLowerCase() === value.replace(/\\([\\%_])/g, '$1').toLowerCase();
          return actual === value;
        };
        for (const filter of query.filters) {
          const [operation, column, value] = filter;
          if (column.includes('.')) {
            const [name, nestedColumn] = column.split('.');
            data = data.map(row => ({ ...row, [name]: Array.isArray(row[name])
              ? row[name].filter(valueRow => matches(valueRow, [operation, nestedColumn, value])) : row[name] }));
            if (name === 'owner') data = data.filter(row => matches(row.owner || {}, [operation, nestedColumn, value]));
          } else data = data.filter(row => matches(row, filter));
        }
        if (query.columns.includes('trial:')) data = data.filter(row => row.trial.length > 0);
        for (const [column, spec] of query.orders.slice().reverse()) {
          const sort = (a, b) => String(a[column] || '').localeCompare(String(b[column] || '')) * (spec.ascending === false ? -1 : 1);
          if (spec.referencedTable) data = data.map(row => ({ ...row, [spec.referencedTable]: [...(row[spec.referencedTable] || [])].sort(sort) }));
          else data = [...data].sort(sort);
        }
        for (const [limit, spec] of query.limits) {
          if (spec.referencedTable) data = data.map(row => ({ ...row, [spec.referencedTable]: (row[spec.referencedTable] || []).slice(0, limit) }));
          else data = data.slice(0, limit);
        }
        return { data, error: null };
      }
      return builder;
    },
    rpc() { throw new Error('Read-only overview must not execute write RPCs.'); },
  };
  const progress = {
    requireAccountSession() {
      if (options.unsigned) throw Object.assign(new Error('Sign in'), { status: 401 });
      return options.session || SESSION;
    },
    async requireCurrentAccount(db, session) {
      assert.equal(db, database); assert.equal(session.email, (options.session || SESSION).email);
      if (options.deletedAdmin) throw Object.assign(new Error('Deleted'), { status: 401 });
    },
    getAccountDatabase() { return database; },
    accountUnavailable: () => Object.assign(new Error('Unavailable'), { status: 503 }),
    sessionRenewalRequired: () => Object.assign(new Error('Sign in'), { status: 401 }),
  };
  function load(relative) {
    const filename = path.join(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
    const mod = { exports: {} }; cache.set(filename, mod);
    new Function('require', 'module', 'exports', code)(id => {
      if (id.endsWith('/course-progress-server')) return progress;
      if (id.endsWith('/account-session')) return { normalizeAccountEmail: value => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? value.trim().toLowerCase() : '' };
      if (id.endsWith('/test-environment')) return { isPayPalSandboxTestEnvironment: env => {
        if (env.JL_TEST_ENVIRONMENT && env.JL_TEST_ENVIRONMENT !== 'paypal-sandbox') throw Object.assign(new Error('Config'), { status: 503 });
        return env.JL_TEST_ENVIRONMENT === 'paypal-sandbox';
      } };
      if (id.endsWith('/operator-trial-notifications')) return { getOperatorTrialNotificationStatus: async db => {
        assert.equal(db, database); if (options.notificationError) throw new Error('Not configured'); return options.notifications || notifications;
      } };
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), `${id}.js`)));
      throw new Error(`Unexpected dependency ${id}: provider calls are forbidden in this read-only overview.`);
    }, mod, mod.exports);
    return mod.exports;
  }
  const helper = load('lib/admin-trial-overview.js');
  const request = query => ({ url: `https://jagdlatein.example.invalid/api/admin/trials${query ? `?${query}` : ''}`, cookies: { get() {} } });
  return { calls, helper, database,
    run: query => load('app/api/admin/trials/route.js').GET(request(query)),
    overview: async query => helper.getAdminTrialOverview(database, helper.readTrialOverviewOptions(request(query).url,
      { PAYPAL_TRIAL_PLAN_IDS: 'P-TEST12345', ...options.env }), { nowMs: NOW }) };
}

test('GET is private, non-indexable and returns notification configuration without granting roles', async () => {
  const f = fixture(); const response = await f.run(); const body = await response.json();
  assert.equal(response.status, 200); assert.deepEqual(body.items, []); assert.deepEqual(body.notifications, notifications);
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  assert.equal(response.headers.get('vary'), 'Cookie'); assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal(body.limit, 25); assert.equal(body.offset, 0); assert.equal(body.windowLimit, 200); assert.equal(body.hasMore, false);
  assert.equal(f.calls.filter(call => call.columns?.includes('is_admin')).length, 2, 'Admin privilege is read again before returning rows.');
});

for (const [name, options, status] of [
  ['unsigned', { unsigned: true }, 401], ['deleted account', { deletedAdmin: true }, 401],
  ['old session lacking generation', { session: { email: ACTOR, admin: true } }, 401],
  ['recreated account', { actor: { account_generation: NEW_GENERATION } }, 401],
  ['moderator without admin privilege', { actor: { is_admin: false } }, 403],
]) test(`${name} cannot read other accounts' trial records`, async () => {
  const f = fixture(options); const response = await f.run(); assert.equal(response.status, status);
  assert.ok(!f.calls.some(call => call.table !== 'userprofile'));
});

test('Revoking the admin role during a read blocks the completed response', async () => {
  const f = fixture({ revokeAdminAfterFirstRead: true, paypal: [paypal()] });
  const response = await f.run(); assert.equal(response.status, 403); assert.equal((await response.json()).items, undefined);
});

test('A verified PayPal free period is shown without calling providers or exposing binding secrets', async () => {
  const f = fixture({ paypal: [paypal()] }); const result = await f.overview(); const row = result.items[0];
  assert.equal(row.stage, 'trial'); assert.equal(row.renewal, true); assert.equal(row.environment, 'Production');
  assert.equal(row.trialStartedAt, '2026-10-13T12:00:00.000Z'); assert.equal(row.trialUntil, row.accessUntil); assert.equal(row.firstRegularAt, null);
  assert.equal(JSON.stringify(row).includes(GENERATION), false); assert.equal(JSON.stringify(row).includes(TOKEN), false);
  assert.deepEqual(Object.keys(row).sort(), ['accessUntil', 'createdAt', 'email', 'environment', 'firstRegularAt', 'id', 'provider', 'renewal', 'stage', 'trialStartedAt', 'trialUntil', 'verifiedAt'].sort());
});

test('A cancelled PayPal subscription retains its actually funded regular interval and trial history', async () => {
  const result = await fixture({ paypal: [paypal({ status: 'CANCELLED', paid_until: '2026-11-13T12:00:00.000Z' })], payments: [payment()] }).overview();
  assert.equal(result.items[0].stage, 'regular'); assert.equal(result.items[0].renewal, false);
  assert.equal(result.items[0].firstRegularAt, '2026-10-13T12:00:00.000Z'); assert.equal(result.items[0].trialUntil, '2026-10-16T12:00:00.000Z');
});

for (const [label, pp, payments, expected] of [
  ['cancelled free period', { status: 'CANCELLED' }, [], 'cancelled'],
  ['paused free period', { status: 'SUSPENDED' }, [], 'paused'],
  ['ended trial without payment', { trial_started_at: '2026-10-10T12:00:00.000Z', trial_until: '2026-10-13T12:00:00.000Z' }, [], 'ended'],
  ['unverified trial schedule', { review_reason: 'trial_schedule_changed' }, [], 'review'],
  ['unknown status', { status: 'WHATEVER' }, [], 'review'],
  ['extended unsupported trial', { trial_until: '2027-10-16T12:00:00.000Z' }, [], 'review'],
  ['zero trial event pretending to fund access', { paid_until: '2026-11-13T12:00:00.000Z' }, [payment({ amount: '0.00' })], 'review'],
  ['refunded payment pretending to fund access', { paid_until: '2026-11-13T12:00:00.000Z' }, [payment({ status: 'REFUNDED' })], 'review'],
]) test(`PayPal ${label} is not confused with a successfully paid renewal`, async () => {
  const result = await fixture({ paypal: [paypal(pp)], payments }).overview();
  assert.equal(result.items[0].stage, expected); assert.equal(result.items[0].accessUntil, null);
});

test('Apple preserves the original free period after transitioning to regular access', async () => {
  const result = await fixture({ apple: [apple({ auto_renew: false })], transactions: history() }).overview(); const row = result.items[0];
  assert.equal(row.stage, 'regular'); assert.equal(row.renewal, false); assert.equal(row.trialStartedAt, '2026-10-10T12:00:00.000Z');
  assert.equal(row.trialUntil, '2026-10-13T12:00:00.000Z'); assert.equal(row.firstRegularAt, '2026-10-13T12:00:00.000Z');
  assert.equal(row.accessUntil, '2026-11-13T12:00:00.000Z');
  assert.ok(!Object.keys(row).some(key => /amount|price|currency|token|generation/i.test(key)));
});

test('An Apple trial cancelled for its next renewal remains accessible until expiry', async () => {
  const tx = appleTransaction({ transaction_id: '201', is_trial: true, expires_at: '2026-10-16T12:00:00.000Z' });
  const result = await fixture({ apple: [apple({ latest_transaction_id: '201', is_trial: true, auto_renew: false, access_until: tx.expires_at })], transactions: [tx] }).overview();
  assert.equal(result.items[0].stage, 'trial'); assert.equal(result.items[0].renewal, false); assert.equal(result.items[0].firstRegularAt, null);
});

test('Apple billing grace is separate from a freshly paid regular period', async () => {
  const result = await fixture({ apple: [apple({ status: 4, access_until: '2026-11-20T12:00:00.000Z', grace_until: '2026-11-20T12:00:00.000Z' })], transactions: history() }).overview();
  assert.equal(result.items[0].stage, 'grace'); assert.equal(result.items[0].accessUntil, '2026-11-20T12:00:00.000Z');
});

test('A revoked or mismatched latest Apple transaction cannot manufacture regular access', async () => {
  for (const overrides of [{ revoked_at: iso(NOW) }, { app_account_token: NEW_GENERATION }, { is_upgraded: true }]) {
    const result = await fixture({ apple: [apple()], transactions: [history()[0], appleTransaction(overrides)] }).overview();
    assert.equal(result.items[0].stage, 'review'); assert.equal(result.items[0].accessUntil, null);
  }
});

test('Production and Sandbox Apple purchases remain separate; PayPal live rows never appear in sandbox selection', async () => {
  const sbApple = apple({ environment: 'Sandbox' }); const sbHistory = history().map(row => ({ ...row, environment: 'Sandbox' }));
  const f = fixture({ paypal: [paypal()], apple: [apple(), sbApple], transactions: [...history(), ...sbHistory] });
  const live = await f.overview(); assert.equal(live.items.length, 2); assert.ok(live.items.every(row => row.environment === 'Production'));
  const sandbox = await f.overview('environment=sandbox'); assert.equal(sandbox.items.length, 1); assert.equal(sandbox.items[0].provider, 'apple');
  assert.equal(sandbox.items[0].environment, 'Sandbox');
});

test('An isolated test project defaults to test-only records and rejects a live selection', async () => {
  const f = fixture({ env: { JL_TEST_ENVIRONMENT: 'paypal-sandbox' }, paypal: [paypal()] });
  assert.equal((await f.overview()).items[0].environment, 'Sandbox');
  await assert.rejects(() => f.overview('environment=live'), error => error.code === 'INVALID_TRIAL_ENVIRONMENT' && error.status === 400);
});

test('Current ownership generation filters stale, deleted and recreated email records before paging', async () => {
  const deleted = paypal({ subscription_id: 'I-DELETED1234', account_deleted_at: iso(NOW), created_at: iso(NOW + 1000) });
  const stale = paypal({ subscription_id: 'I-STALE12345', account_generation: NEW_GENERATION, created_at: iso(NOW + 500) });
  const wrong = apple({ owner: { account_email: 'other@example.invalid', account_generation: GENERATION, deleted_at: null } });
  const f = fixture({ paypal: [deleted, stale, paypal()], apple: [wrong], transactions: history() });
  const first = await f.overview('limit=1'); assert.equal(first.items.length, 1); assert.equal(first.items[0].id, 'paypal:Production:I-TRIAL12345');
  assert.equal(first.hasMore, false); assert.deepEqual((await f.overview('limit=1&offset=1')).items, []);
});

test('Deletion during detail reads prevents the response from exposing the old owner email', async () => {
  const f = fixture({ paypal: [paypal()], deleteAfterInitialProfiles: true });
  assert.deepEqual((await f.overview()).items, []);
});

test('The combined page is stable, bounded and does not assert an unbounded total', async () => {
  const f = fixture({ paypal: [paypal()], apple: [apple()], transactions: history() });
  const first = await f.overview('limit=1'); const second = await f.overview('limit=1&offset=1');
  assert.equal(first.items[0].provider, 'paypal'); assert.equal(first.hasMore, true);
  assert.equal(second.items[0].provider, 'apple'); assert.equal(second.hasMore, false); assert.equal(first.total, undefined);
  assert.ok(f.calls.every(call => call.limits.every(([limit, spec]) => spec.referencedTable ? [1, 21].includes(limit) : limit <= 101)));
  assert.ok(f.calls.filter(call => call.table === 'userprofile').every(call => call.filters.filter(filter => filter[0] === 'in').every(filter => filter[2].length <= 25)));
});

test('An overfull source explicitly reports older records outside the fixed 200-contract window', async () => {
  const values = Array.from({ length: 102 }, (_, index) => paypal({ subscription_id: `I-TRIAL${String(index).padStart(7, '0')}`, created_at: iso(NOW - index * 1000) }));
  const f = fixture({ paypal: values }); const result = await f.overview('limit=50&offset=50');
  assert.equal(result.items.length, 50); assert.equal(result.windowLimited, true); assert.equal(result.olderRecordsAvailable, true);
  assert.equal(result.hasMore, false, 'hasMore describes the inspected window, not hidden older rows.');
  assert.deepEqual((await f.overview('offset=10000')).items, []);
});

test('Exact email search is applied before source limits without accepting PostgREST filter expressions', async () => {
  const f = fixture({ paypal: [paypal(), paypal({ subscription_id: 'I-OTHER12345', account_email: 'someone@example.invalid' })] });
  const result = await f.overview(`q=${encodeURIComponent(' Learner@Example.Invalid ')}`);
  assert.equal(result.items.length, 1); assert.equal(result.items[0].email, EMAIL);
  const source = f.calls.find(call => call.table === 'paypal_subscriptions' && !call.columns.includes('regular:'));
  assert.ok(source.filters.some(filter => filter[0] === 'eq' && filter[1] === 'account_email' && filter[2] === EMAIL));
  await assert.rejects(() => f.overview('q=learner'), error => error.code === 'INVALID_TRIAL_SEARCH');
  await assert.rejects(() => f.overview('q=%28email.eq.other%29'), error => error.status === 400);
});

for (const query of ['limit=0', 'limit=51', 'offset=10001', 'offset=-1', 'limit=2.5', 'environment=unknown'])
  test(`Invalid bounded query ${query} is rejected`, () => {
    const f = fixture(); assert.throws(() => f.helper.readTrialOverviewOptions(`https://example.invalid/?${query}`), error => error.status === 400);
  });

test('Missing notification setup never hides an available trial ledger', async () => {
  const result = await fixture({ paypal: [paypal()], notificationError: true }).overview();
  assert.equal(result.items.length, 1); assert.equal(result.notifications.configured, false); assert.equal(result.notifications.pendingCount, null);
});

test('An earlier malformed zero-value payment cannot hide a later supported regular payment', async () => {
  const result = await fixture({ paypal: [paypal({ paid_until: '2026-11-13T12:00:00.000Z' })], payments: [
    payment({ payment_id: 'ZERO12345', amount: '0.00', paid_at: '2026-10-13T12:00:00.000Z' }),
    payment({ paid_at: '2026-10-14T11:00:00.000Z' }),
  ] }).overview();
  assert.equal(result.items[0].stage, 'regular'); assert.equal(result.items[0].firstRegularAt, '2026-10-14T11:00:00.000Z');
});

test('An unknown plan with stored dates is displayed for review and grants no reported trial coverage', async () => {
  const result = await fixture({ paypal: [paypal({ plan_id: 'P-UNKNOWN12345' })] }).overview();
  assert.equal(result.items[0].stage, 'review'); assert.equal(result.items[0].accessUntil, null);
});

test('Missing provider tables produce a safe setup error rather than an apparently empty overview', async () => {
  const f = fixture({ databaseError: { table: 'apple_subscriptions', code: 'PGRST205' } });
  const response = await f.run(); assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'TRIAL_OVERVIEW_NOT_CONFIGURED');
});

test('Actual Supabase query encoding retains alias child limits without replacing the bounded parent window', async () => {
  const f = fixture({ paypal: [paypal({ paid_until: '2026-11-13T12:00:00.000Z' })], payments: [payment()], apple: [apple()], transactions: history() });
  await f.overview();
  const captured = [];
  const { createClient } = pr('@supabase/supabase-js');
  const client = createClient('https://database.example.invalid', 'test-placeholder-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async url => { captured.push(new URL(url)); return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }); } },
  });
  for (const call of f.calls.filter(query => query.table !== 'userprofile')) {
    let query = client.from(call.table).select(call.columns);
    for (const [operation, column, value, comparator] of call.filters) query = operation === 'not'
      ? query.not(column, comparator, value) : query[operation](column, value);
    for (const [column, spec] of call.orders) query = query.order(column, spec);
    for (const [count, spec] of call.limits) query = query.limit(count, spec);
    await query;
  }
  const appleSource = captured.find(url => url.searchParams.get('select').includes('trial:'));
  assert.equal(appleSource.searchParams.get('limit'), '101'); assert.equal(appleSource.searchParams.get('trial.limit'), '1');
  assert.equal(appleSource.searchParams.get('trial.is_trial'), 'eq.true');
  assert.equal(appleSource.searchParams.get('trial.order'), 'purchased_at.asc');
  assert.ok(appleSource.searchParams.get('select').includes('trial:apple_subscription_transactions!inner('));
  const paypalPayments = captured.find(url => url.searchParams.get('select').includes('regular:paypal'));
  assert.equal(paypalPayments.searchParams.get('regular.limit'), '21'); assert.equal(paypalPayments.searchParams.get('limit'), '1');
  assert.equal(paypalPayments.searchParams.get('regular.period_until'), 'not.is.null');
  assert.equal(paypalPayments.searchParams.has('regular.amount'), false, 'Numeric evidence must never use lexicographic text amount filtering.');
});
