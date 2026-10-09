// Offline provider fakes exercise application boundaries; PGlite executes the
// actual ledger migration. No Apple account, payment or remote database is used.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { generateKeyPairSync } = require('node:crypto');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const NOW = Date.now();
const DAY = 86400000;
const EMAIL = 'apple-buyer@example.invalid';
const GENERATION = 'a916cb07-1d89-4a81-b942-69a9bf0cd9ac';
const TOKEN = 'fcce3364-6e32-42c3-8b86-2dbd46e82c43';
const PRODUCT = 'de.jagdlatein.premium.monthly';
const CONFIG = { environment: 'Sandbox', bundleId: 'de.jagdlatein.app', appAppleId: 6819820561, productIds: [PRODUCT] };
const ENV = { APPLE_SUBSCRIPTIONS_ENABLED: 'true', APPLE_STORE_ENVIRONMENT: 'Sandbox',
  JL_TEST_ENVIRONMENT: 'paypal-sandbox', APPLE_BUNDLE_ID: CONFIG.bundleId, APPLE_APP_ID: String(CONFIG.appAppleId), APPLE_PRODUCT_IDS: PRODUCT };
const JWS = { device: 'e30.ZGV2aWNl.c2ln', current: 'e30.Y3VycmVudA.c2ln', renewal: 'e30.cmVuZXdhbA.c2ln',
  notice: 'e30.bm90aWNl.c2ln', event: 'e30.ZXZlbnQ.c2ln' };

function load(relative, env = {}, overrides = {}) {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename,
    jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  const module = { exports: {} };
  const localRequire = id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), id.endsWith('.json') ? id : `${id}.js`)), env, overrides);
    return pr(id);
  };
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, { process: { env }, Buffer, Date, Response, URL })
    (localRequire, module, module.exports);
  return module.exports;
}
const lib = load('lib/apple-subscriptions.js');
const transaction = (override = {}) => ({ bundleId: CONFIG.bundleId, environment: CONFIG.environment,
  productId: PRODUCT, type: 'Auto-Renewable Subscription', inAppOwnershipType: 'PURCHASED', quantity: 1,
  transactionId: '20000001', originalTransactionId: '10000001', appAccountToken: TOKEN,
  purchaseDate: NOW - DAY, expiresDate: NOW + 29 * DAY, signedDate: NOW, ...override });
const renewal = (override = {}) => ({ environment: CONFIG.environment, originalTransactionId: '10000001',
  productId: PRODUCT, signedDate: NOW, autoRenewStatus: 1, appAccountToken: TOKEN, ...override });
function provider({ device = transaction(), current = transaction(), notificationTransaction = current,
  renewalInfo = renewal(), status = 1,
  notice = {}, failApi = false, invalidSignature = false } = {}) {
  let apiReads = 0;
  const verifier = {
    async verifyAndDecodeTransaction(signed) { if (invalidSignature) throw new Error('invalid signature');
      return signed === JWS.device ? device : signed === JWS.event ? notificationTransaction : current; },
    async verifyAndDecodeRenewalInfo() { return renewalInfo; },
    async verifyAndDecodeNotification() { if (invalidSignature) throw new Error('invalid signature');
      return { notificationUUID: 'c815a0bb-d432-40c6-bf2a-e97fb877b195',
      version: '2.0', signedDate: NOW, notificationType: 'DID_RENEW',
      data: { bundleId: CONFIG.bundleId, environment: CONFIG.environment, appAppleId: CONFIG.appAppleId,
        signedTransactionInfo: JWS.current }, ...notice }; },
  };
  const apiClient = { async getAllSubscriptionStatuses(id) {
    apiReads++; assert.equal(id, '10000001'); if (failApi) throw new Error('offline fake');
    return { environment: CONFIG.environment, bundleId: CONFIG.bundleId, appAppleId: CONFIG.appAppleId,
      data: [{ lastTransactions: [{ originalTransactionId: id, status, signedTransactionInfo: JWS.current,
        signedRenewalInfo: JWS.renewal }] }] };
  } };
  return { verifier, apiClient, get apiReads() { return apiReads; } };
}
function fakeDatabase({ email = EMAIL, generation = GENERATION, deleted = false, seededRows = [] } = {}) {
  const snapshots = [];
  const database = {
    from(table) { const filters = [];
      return { select() { return this; }, eq(name, value) { filters.push([name, value]); return this; },
        async maybeSingle() {
          assert.equal(table, 'apple_account_tokens');
          return { data: { app_account_token: TOKEN, account_email: email, account_generation: generation,
            deleted_at: deleted ? new Date(NOW).toISOString() : null }, error: null };
        }, then(resolve, reject) {
          assert.equal(table, 'apple_subscriptions');
          return Promise.resolve({ data: snapshots.length ? [{ ...snapshots.at(-1),
            status: snapshots.at(-1).transactions[0].revoked_at ? 5 : snapshots.at(-1).status,
            access_until: snapshots.at(-1).status === 1 && !snapshots.at(-1).transactions[0].revoked_at ? new Date(NOW + DAY).toISOString() : null,
            is_trial: false, verified_at: snapshots.at(-1).observed_at }] : seededRows, error: null }).then(resolve, reject);
        },
      };
    },
    async rpc(name, args) { assert.equal(name, 'apply_apple_subscription_snapshot'); snapshots.push(args.p_snapshot);
      return { data: args.p_snapshot, error: null }; },
  };
  return { database, snapshots };
}

test('Apple feature is disabled by default; sandbox configuration cannot target production or unknown environments', () => {
  assert.equal(lib.appleSubscriptionConfig({}), null);
  assert.equal(lib.appleSubscriptionConfig({ ...ENV, APPLE_SUBSCRIPTIONS_ENABLED: 'false' }), null);
  assert.equal(lib.appleSubscriptionConfig(ENV).environment, 'Sandbox');
  for (const env of [{ ...ENV, JL_TEST_ENVIRONMENT: '' }, { ...ENV, APPLE_STORE_ENVIRONMENT: 'LocalTesting' },
    { ...ENV, APPLE_STORE_ENVIRONMENT: 'Production' }, { ...ENV, APPLE_PRODUCT_IDS: '' }, { ...ENV, APPLE_BUNDLE_ID: 'other.app' },
    { ...ENV, APPLE_APP_ID: '1' }, { ...ENV, APPLE_SUBSCRIPTIONS_ENABLED: 'yes' }])
    assert.throws(() => lib.appleSubscriptionConfig(env), error => error.status === 503);
});

test('Only verified exact app, environment, account-token, purchased auto-renewable transactions are accepted', () => {
  assert.equal(lib.verifiedAppleTransactionRecord(transaction(), CONFIG, NOW).app_account_token, TOKEN);
  for (const change of [{ bundleId: 'other.app' }, { environment: 'Production' }, { productId: 'unknown' },
    { type: 'Consumable' }, { inAppOwnershipType: 'FAMILY_SHARED' }, { quantity: 2 }, { appAccountToken: undefined },
    { transactionId: 'bad/id' }, { purchaseDate: NOW + 6 * 60000 }, { signedDate: NOW + 6 * 60000 },
    { expiresDate: NOW - DAY }, { revocationDate: 'invalid' }])
    assert.throws(() => lib.verifiedAppleTransactionRecord(transaction(change), CONFIG, NOW), error => error.status === 400);
});

test('Checkout requires a separate valid P-256 In-App Purchase key and never substitutes a build credential', () => {
  assert.throws(() => lib.createAppleApiClient(CONFIG, {}), error => error.status === 503);
  const credential = { APPLE_IAP_KEY_ID: 'TESTKEY001', APPLE_IAP_ISSUER_ID: GENERATION,
    APPLE_IAP_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\ninvalid\n-----END PRIVATE KEY-----' };
  assert.throws(() => lib.createAppleApiClient(CONFIG, credential), error => error.status === 503);
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  credential.APPLE_IAP_PRIVATE_KEY = privateKey.export({ type: 'pkcs8', format: 'pem' });
  assert.equal(typeof lib.createAppleApiClient(CONFIG, credential).getAllSubscriptionStatuses, 'function');
});

test('Client signed data is cryptographically verified before owner lookup or any ledger write', async () => {
  const data = fakeDatabase(); const apple = provider({ invalidSignature: true });
  await assert.rejects(lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
    { database: data.database, config: CONFIG, nowMs: NOW, ...apple }), error => error.status === 400);
  assert.equal(data.snapshots.length, 0); assert.equal(apple.apiReads, 0);
  const realVerifier = lib.createAppleVerifier(CONFIG);
  const forged = `${Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')}.${Buffer.from(JSON.stringify(transaction())).toString('base64url')}.c2ln`;
  await assert.rejects(realVerifier.verifyAndDecodeTransaction(forged));
});

test('Purchase verification rejects cross-account, deleted identities and same-email recreated generations', async () => {
  for (const options of [{ email: 'another@example.invalid' }, { deleted: true }, { generation: '3b454fd3-7e8d-4a7a-b8aa-1f4d98fd31f9' }]) {
    const data = fakeDatabase(options); const apple = provider();
    await assert.rejects(lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
      { database: data.database, config: CONFIG, nowMs: NOW, ...apple }), error => error.status === 403);
    assert.equal(data.snapshots.length, 0); assert.equal(apple.apiReads, 0);
  }
});

test('A still-unexpired replay cannot grant after current Apple status reports revocation; outages fail closed', async () => {
  const data = fakeDatabase(); const apple = provider({ current: transaction({ revocationDate: NOW - 60000 }), status: 5 });
  const result = await lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
    { database: data.database, config: CONFIG, nowMs: NOW, ...apple });
  assert.equal(result.paid, false); assert.equal(data.snapshots[0].status, 5);
  const outage = fakeDatabase();
  await assert.rejects(lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
    { database: outage.database, config: CONFIG, nowMs: NOW, ...provider({ failApi: true }) }), error => error.status === 503);
  assert.equal(outage.snapshots.length, 0);
});

test('Stale access refresh checks Apple again and never grants cached access through a current-status outage', async () => {
  const row = { original_transaction_id: '10000001', app_account_token: TOKEN, environment: 'Sandbox',
    status: 1, access_until: new Date(NOW + DAY).toISOString(), is_trial: false, auto_renew: true,
    verified_at: new Date(NOW - 61000).toISOString() };
  const stale = fakeDatabase({ seededRows: [row] });
  await assert.rejects(lib.resolveAppleSubscriptionAccess(stale.database, EMAIL, { config: CONFIG,
    nowMs: NOW, ...provider({ failApi: true }) }), error => error.status === 503);
  const recent = fakeDatabase({ seededRows: [{ ...row, verified_at: new Date(NOW - 1000).toISOString() }] });
  const apple = provider({ failApi: true });
  assert.equal((await lib.resolveAppleSubscriptionAccess(recent.database, EMAIL, { config: CONFIG, nowMs: NOW, ...apple })).paid, true);
  assert.equal(apple.apiReads, 0);
});

test('Signed revocation cannot be masked by a lagging positive current-status endpoint', async t => {
  if (!sqlAvailable) { t.skip('Local isolated PGlite runtime unavailable; set JL_APPLE_TEST_PGLITE_PATH.'); return; }
  const ledger = await lifecycleLedger(t); const now = Date.now(); const snapshots = [];
  const rpc = ledger.database.rpc.bind(ledger.database);
  ledger.database.rpc = async (name, args) => { snapshots.push(args.p_snapshot); return rpc(name, args); };
  const current = transaction({ appAccountToken: ledger.token, purchaseDate: now - DAY, expiresDate: now + DAY, signedDate: now });
  const device = { ...current, revocationDate: now - 60000, signedDate: now - 30000 };
  const apple = provider({ device, current, renewalInfo: renewal({ appAccountToken: ledger.token, signedDate: now }) });
  const result = await lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
    { database: ledger.database, config: CONFIG, nowMs: now, ...apple });
  assert.equal(result.paid, false);
  assert.equal(current.revocationDate, undefined);
  assert.equal(snapshots[0].transactions.length, 2);
  assert.equal(snapshots[0].transactions[0].revoked_at, null);
  assert.equal(snapshots[0].transactions[0].signed_at, new Date(current.signedDate).toISOString());
  assert.equal(snapshots[0].transactions[1].revoked_at, new Date(device.revocationDate).toISOString());
  assert.equal(snapshots[0].transactions[1].signed_at, new Date(device.signedDate).toISOString());
  const stored = (await ledger.pg.query('SELECT revoked_at FROM public.apple_subscription_transactions')).rows[0];
  assert.equal(new Date(stored.revoked_at).getTime(), device.revocationDate);
});

test('Apple introductory free trial comes only from signed offer evidence and hard expiry is enforced', () => {
  assert.equal(lib.verifiedAppleTransactionRecord(transaction(), CONFIG, NOW).is_trial, false);
  assert.equal(lib.verifiedAppleTransactionRecord(transaction({ offerType: 1, offerDiscountType: 'FREE_TRIAL' }), CONFIG, NOW).is_trial, true);
  const row = { status: 1, access_until: new Date(NOW + DAY).toISOString(), is_trial: true, auto_renew: true, verified_at: new Date(NOW).toISOString() };
  assert.equal(lib.appleAccessFromSubscriptions([row], NOW).accessType, 'trial');
  assert.equal(lib.appleAccessFromSubscriptions([row], NOW + DAY).paid, false);
  assert.equal(lib.appleAccessFromSubscriptions([row], NOW + DAY).source, 'apple');
  assert.equal(lib.appleAccessFromSubscriptions([{ ...row, status: 3 }], NOW).paid, false);
  assert.equal(lib.appleAccessFromSubscriptions([{ ...row, status: 5, access_until: null }], NOW).source, 'apple');
  assert.equal(lib.appleAccessFromSubscriptions([], NOW).source, 'none');
  assert.equal(lib.appleAccessFromSubscriptions([{ ...row, auto_renew: false }], NOW).status, 'CANCELLED');
});

test('Notification verification binds outer app metadata, current inner transaction and current provider status', async () => {
  const data = fakeDatabase();
  const result = await lib.applyVerifiedAppleNotification(JWS.notice, { database: data.database, config: CONFIG,
    nowMs: NOW, ...provider() });
  assert.equal(result.ok, true); assert.equal(data.snapshots[0].notification_id, 'c815a0bb-d432-40c6-bf2a-e97fb877b195');
  const noId = fakeDatabase();
  const noIdApple = provider({ notice: { data: { bundleId: CONFIG.bundleId, environment: 'Sandbox',
    signedTransactionInfo: JWS.current } } });
  assert.equal((await lib.applyVerifiedAppleNotification(JWS.notice, { database: noId.database, config: CONFIG,
    nowMs: NOW, ...noIdApple })).ok, true);
  assert.equal(noId.snapshots.length, 1); assert.equal(noIdApple.apiReads, 1);
  const bad = fakeDatabase();
  await assert.rejects(lib.applyVerifiedAppleNotification(JWS.notice, { database: bad.database, config: CONFIG,
    nowMs: NOW, ...provider({ notice: { data: { appAppleId: 1, bundleId: CONFIG.bundleId, environment: 'Sandbox' } } }) }),
    error => error.status === 400);
  assert.equal(bad.snapshots.length, 0);
  const summary = fakeDatabase();
  const ignored = await lib.applyVerifiedAppleNotification(JWS.notice, { database: summary.database, config: CONFIG,
    nowMs: NOW, ...provider({ notice: { data: undefined, notificationType: 'RENEWAL_EXTENSION',
      summary: { appAppleId: CONFIG.appAppleId, bundleId: CONFIG.bundleId, environment: CONFIG.environment } } }) });
  assert.equal(ignored.ignored, true); assert.equal(summary.snapshots.length, 0);
});

test('Verified Sandbox TEST accepts omitted appAppleId without account reads or entitlement writes', async () => {
  const database = { from() { assert.fail('TEST must not read accounts'); }, rpc() { assert.fail('TEST must not grant access'); } };
  const apple = provider({ notice: { notificationType: 'TEST',
    data: { bundleId: CONFIG.bundleId, environment: 'Sandbox' } } });
  const result = await lib.applyVerifiedAppleNotification(JWS.notice,
    { database, config: CONFIG, nowMs: NOW, ...apple });
  assert.equal(result.ok, true); assert.equal(result.test, true); assert.equal(apple.apiReads, 0);
});

test('Sandbox TEST still rejects supplied wrong IDs, cross-app/environment and invalid signed metadata', async () => {
  const database = { from() { assert.fail('invalid TEST must not read accounts'); }, rpc() { assert.fail('invalid TEST must not grant access'); } };
  const metadata = { bundleId: CONFIG.bundleId, environment: 'Sandbox' };
  for (const change of [{ appAppleId: 1 }, { appAppleId: null }, { appAppleId: String(CONFIG.appAppleId) },
    { bundleId: 'other.app' }, { environment: 'Production' }]) {
    const apple = provider({ notice: { notificationType: 'TEST', data: { ...metadata, ...change } } });
    await assert.rejects(lib.applyVerifiedAppleNotification(JWS.notice,
      { database, config: CONFIG, nowMs: NOW, ...apple }), error => error.status === 400);
    assert.equal(apple.apiReads, 0);
  }
  for (const options of [{ invalidSignature: true },
    { notice: { version: '1.0' } }, { notice: { notificationUUID: 'invalid' } },
    { notice: { signedDate: 0 } }, { notice: { signedDate: NOW + 6 * 60000 } }]) {
    const apple = provider({ ...options, notice: { notificationType: 'TEST', data: metadata, ...options.notice } });
    await assert.rejects(lib.applyVerifiedAppleNotification(JWS.notice,
      { database, config: CONFIG, nowMs: NOW, ...apple }), error => error.status === 400);
    assert.equal(apple.apiReads, 0);
  }
});

test('Production TEST requires the exact configured appAppleId even when no purchase is present', async () => {
  const config = { ...CONFIG, environment: 'Production' };
  const database = { from() { assert.fail('TEST must not read accounts'); }, rpc() { assert.fail('TEST must not grant access'); } };
  const metadata = { bundleId: CONFIG.bundleId, environment: 'Production' };
  const accepted = provider({ notice: { notificationType: 'TEST', data: { ...metadata, appAppleId: CONFIG.appAppleId } } });
  assert.equal((await lib.applyVerifiedAppleNotification(JWS.notice,
    { database, config, nowMs: NOW, ...accepted })).test, true);
  assert.equal(accepted.apiReads, 0);
  for (const change of [{}, { appAppleId: 1 }, { appAppleId: null }]) {
    const apple = provider({ notice: { notificationType: 'TEST', data: { ...metadata, ...change } } });
    await assert.rejects(lib.applyVerifiedAppleNotification(JWS.notice,
      { database, config, nowMs: NOW, ...apple }), error => error.status === 400);
    assert.equal(apple.apiReads, 0);
  }
});

test('Bounded JSON parsing rejects wrong fields, multiple fields, non-JSON and oversized raw payloads', async () => {
  const request = (body, type = 'application/json') => new Request('https://jagdlatein.de/api/apple/transactions', {
    method: 'POST', headers: { 'Content-Type': type }, body });
  assert.equal(await lib.readAppleJson(request(JSON.stringify({ signedTransactionInfo: JWS.device })), 'signedTransactionInfo'), JWS.device);
  for (const req of [request(JSON.stringify({ signedTransaction: JWS.device })),
    request(JSON.stringify({ signedTransactionInfo: JWS.device, email: EMAIL })), request('{}'), request('invalid'),
    request(' '.repeat(66000)), request(JSON.stringify({ signedTransactionInfo: JWS.device }), 'text/plain')])
    await assert.rejects(lib.readAppleJson(req, 'signedTransactionInfo'), error => error.status === 400);
});

test('Disabled routes never initialize databases or Apple keys', async () => {
  let reads = 0;
  const common = { getAccountDatabase() { reads++; throw new Error('must not run'); }, accountJson: Response.json,
    accountErrorResponse: () => Response.json({}, { status: 503 }) };
  const overrides = { '../../../../lib/course-progress-server': common };
  const context = load('app/api/apple/context/route.js', {}, overrides);
  assert.equal((await (await context.GET({})).json()).enabled, false);
  const transactionRoute = load('app/api/apple/transactions/route.js', {}, overrides);
  assert.equal((await transactionRoute.POST({})).status, 503);
  const notificationRoute = load('app/api/apple/notifications/route.js', {}, overrides);
  assert.equal((await notificationRoute.POST({})).status, 503);
  assert.equal(reads, 0);
});

const pglitePath = process.env.JL_APPLE_TEST_PGLITE_PATH || process.env.JL_PAYPAL_TEST_PGLITE_PATH ||
  (process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Jagdlatein/paypal-sandbox/test-runtime/node_modules/@electric-sql/pglite'));
const sqlAvailable = pglitePath && fs.existsSync(path.join(pglitePath, 'package.json'));
const lifecycleSql = { skip: sqlAvailable ? false : 'Local isolated PGlite runtime unavailable; set JL_APPLE_TEST_PGLITE_PATH.' };
const refundOrderingMigration = () => fs.readFileSync(path.join(root, 'supabase/migrations/20261008120000_apple_refund_ordering.sql'), 'utf8');

// Exercise the application and real ledger together. This adapter only replaces
// Supabase's query transport; entitlement decisions remain in application/SQL.
async function lifecycleLedger(t, { applyRefundOrdering = true } = {}) {
  const { PGlite } = require(path.resolve(pglitePath)); const pg = new PGlite();
  t.after(() => pg.close());
  await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE TABLE public.userprofile(email text PRIMARY KEY);');
  await pg.exec(fs.readFileSync(path.join(root, 'supabase/migrations/20261007110000_apple_subscriptions.sql'), 'utf8'));
  if (applyRefundOrdering) await pg.exec(refundOrderingMigration());
  await pg.query('INSERT INTO public.userprofile(email,account_generation) VALUES($1,$2)', [EMAIL, GENERATION]);
  const columns = {
    apple_account_tokens: new Set(['app_account_token', 'account_email']),
    apple_subscriptions: new Set(['app_account_token', 'environment']),
  };
  const database = {
    from(table) {
      assert.ok(Object.hasOwn(columns, table)); const filters = [];
      const read = async () => {
        const where = filters.map(([column], i) => `${column}=$${i + 1}`).join(' AND ');
        const result = await pg.query(`SELECT * FROM public.${table}${where ? ` WHERE ${where}` : ''}`,
          filters.map(([, value]) => value));
        // Supabase JSON contains ISO timestamps rather than PostgreSQL Date objects.
        return { data: JSON.parse(JSON.stringify(result.rows)), error: null };
      };
      return {
        select() { return this; },
        eq(column, value) { assert.ok(columns[table].has(column)); filters.push([column, value]); return this; },
        async maybeSingle() { const result = await read(); assert.ok(result.data.length <= 1);
          return { data: result.data[0] || null, error: null }; },
        then(resolve, reject) { return read().then(resolve, reject); },
      };
    },
    async rpc(name, args) {
      if (name === 'ensure_apple_account_token') {
        return { data: (await pg.query('SELECT public.ensure_apple_account_token($1,$2) AS v',
          [args.p_email, args.p_account_generation])).rows[0].v, error: null };
      }
      assert.equal(name, 'apply_apple_subscription_snapshot');
      return { data: (await pg.query('SELECT public.apply_apple_subscription_snapshot($1::jsonb) AS v',
        [JSON.stringify(args.p_snapshot)])).rows[0].v, error: null };
    },
  };
  const token = await lib.ensureAppleAccountToken(database, EMAIL, GENERATION);
  return { database, pg, token };
}

async function lifecycleNotification(ledger, { type, id, event, current, status, observedAt, renewalInfo }) {
  return lib.applyVerifiedAppleNotification(JWS.notice, { database: ledger.database, config: CONFIG, nowMs: observedAt,
    ...provider({ current, notificationTransaction: event, status,
      renewalInfo: renewalInfo || renewal({ appAccountToken: ledger.token, signedDate: current.signedDate }),
      notice: { notificationUUID: id, notificationType: type, signedDate: event.signedDate,
        data: { bundleId: CONFIG.bundleId, environment: CONFIG.environment, appAppleId: CONFIG.appAppleId,
          signedTransactionInfo: JWS.event } } }) });
}

test('Verified cancellation preserves the signed remaining period, then expiry and old-receipt restoration deny access', lifecycleSql, async t => {
  const { database, pg, token } = await lifecycleLedger(t); const now = Date.now();
  // Short synthetic periods permit clock-boundary checks without sleeping or
  // inventing a production trial duration. They stay within the RPC clock skew.
  const expires = now + 120000;
  const purchased = transaction({ appAccountToken: token, purchaseDate: now - DAY, expiresDate: expires, signedDate: now });
  const active = provider({ device: purchased, current: purchased,
    renewalInfo: renewal({ appAccountToken: token, signedDate: now }) });
  const bought = await lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
    { database, config: CONFIG, nowMs: now, ...active });
  assert.equal(bought.paid, true); assert.equal(bought.status, 'ACTIVE');
  assert.equal(bought.paidUntil, new Date(expires).toISOString());

  const cancelledTransaction = { ...purchased, signedDate: now + 1 };
  const cancelledRenewal = renewal({ appAccountToken: token, autoRenewStatus: 0, signedDate: now + 1 });
  const cancellation = provider({ current: cancelledTransaction, renewalInfo: cancelledRenewal,
    notice: { notificationType: 'DID_CHANGE_RENEWAL_STATUS', subtype: 'AUTO_RENEW_DISABLED', signedDate: now + 1 } });
  assert.equal((await lib.applyVerifiedAppleNotification(JWS.notice,
    { database, config: CONFIG, nowMs: now + 1, ...cancellation })).ok, true);
  const access = await lib.resolveAppleSubscriptionAccess(database, EMAIL, { config: CONFIG, nowMs: now + 1, refresh: false });
  assert.equal(access.paid, true); assert.equal(access.status, 'CANCELLED');
  assert.equal(access.paidUntil, bought.paidUntil);
  const [cancelled] = (await pg.query('SELECT * FROM public.apple_subscriptions')).rows;
  assert.equal(cancelled.status, 1); assert.equal(cancelled.auto_renew, false);
  assert.equal(new Date(cancelled.access_until).getTime(), expires);

  const boundary = await lib.resolveAppleSubscriptionAccess(database, EMAIL, { config: CONFIG, nowMs: expires, refresh: false });
  assert.equal(boundary.paid, false); assert.equal(boundary.paidUntil, null);
  // Even a lagging active provider status cannot stretch the signed expiry.
  const staleRestore = provider({ device: purchased, current: cancelledTransaction, renewalInfo: cancelledRenewal, status: 1 });
  const restored = await lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
    { database, config: CONFIG, nowMs: expires + 1, ...staleRestore });
  assert.equal(restored.paid, false); assert.equal(restored.paidUntil, null); assert.equal(restored.accessType, 'none');
  assert.equal(staleRestore.apiReads, 1);

  const expiredTransaction = { ...purchased, signedDate: expires + 2 };
  const expiry = provider({ current: expiredTransaction, status: 2,
    renewalInfo: renewal({ appAccountToken: token, autoRenewStatus: 0, signedDate: expires + 2 }),
    notice: { notificationUUID: '12489806-610e-40ec-9ad4-c5121d6f9a16', notificationType: 'EXPIRED', signedDate: expires + 2 } });
  assert.equal((await lib.applyVerifiedAppleNotification(JWS.notice,
    { database, config: CONFIG, nowMs: expires + 2, ...expiry })).ok, true);
  const afterExpiry = await lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
    { database, config: CONFIG, nowMs: expires + 3, ...provider({ device: purchased, current: expiredTransaction,
      status: 2, renewalInfo: renewal({ appAccountToken: token, autoRenewStatus: 0, signedDate: expires + 2 }) }) });
  assert.equal(afterExpiry.paid, false); assert.equal(afterExpiry.status, 'EXPIRED');
  const rows = (await pg.query('SELECT * FROM public.apple_subscriptions')).rows;
  assert.equal(rows.length, 1); assert.equal(rows[0].status, 2); assert.equal(rows[0].access_until, null);
  assert.equal((await pg.query('SELECT count(*)::integer AS n FROM public.apple_subscription_transactions')).rows[0].n, 1);
});

test('A verified renewal replaces trial access with paid access under the same contract and survives an old trial receipt', lifecycleSql, async t => {
  const { database, pg, token } = await lifecycleLedger(t); const now = Date.now();
  const trialExpires = now + 60000; const paidExpires = now + 30 * DAY;
  const trial = transaction({ appAccountToken: token, purchaseDate: now - DAY, expiresDate: trialExpires,
    signedDate: now, offerType: 1, offerDiscountType: 'FREE_TRIAL' });
  const first = await lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
    { database, config: CONFIG, nowMs: now, ...provider({ device: trial, current: trial,
      renewalInfo: renewal({ appAccountToken: token, signedDate: now }) }) });
  assert.equal(first.paid, true); assert.equal(first.accessType, 'trial');
  assert.equal(first.trialUntil, new Date(trialExpires).toISOString());
  const initial = (await pg.query('SELECT * FROM public.apple_subscriptions')).rows;
  assert.equal(initial.length, 1); assert.equal(initial[0].is_trial, true);

  const paid = transaction({ appAccountToken: token, transactionId: '20000002', purchaseDate: trialExpires,
    expiresDate: paidExpires, signedDate: trialExpires });
  const paidRenewal = renewal({ appAccountToken: token, signedDate: trialExpires });
  const renewalNotice = provider({ current: paid, renewalInfo: paidRenewal,
    notice: { notificationType: 'DID_RENEW', signedDate: trialExpires } });
  assert.equal((await lib.applyVerifiedAppleNotification(JWS.notice,
    { database, config: CONFIG, nowMs: trialExpires, ...renewalNotice })).ok, true);
  const renewed = await lib.resolveAppleSubscriptionAccess(database, EMAIL,
    { config: CONFIG, nowMs: trialExpires, refresh: false });
  assert.equal(renewed.paid, true); assert.equal(renewed.accessType, 'paid');
  assert.equal(renewed.trialUntil, null); assert.equal(renewed.paidUntil, new Date(paidExpires).toISOString());
  assert.ok(Date.parse(renewed.paidUntil) > Date.parse(first.paidUntil));

  const restored = await lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
    { database, config: CONFIG, nowMs: trialExpires + 1, ...provider({ device: trial, current: paid, renewalInfo: paidRenewal }) });
  assert.equal(restored.paid, true); assert.equal(restored.accessType, 'paid');
  assert.equal(restored.paidUntil, renewed.paidUntil); assert.equal(restored.trialUntil, null);
  const subscriptions = (await pg.query('SELECT * FROM public.apple_subscriptions')).rows;
  assert.equal(subscriptions.length, 1);
  assert.equal(subscriptions[0].original_transaction_id, initial[0].original_transaction_id);
  assert.equal(subscriptions[0].app_account_token, token); assert.equal(subscriptions[0].latest_transaction_id, paid.transactionId);
  assert.equal(subscriptions[0].is_trial, false); assert.equal(new Date(subscriptions[0].access_until).getTime(), paidExpires);
  const transactions = (await pg.query('SELECT transaction_id,original_transaction_id,app_account_token,is_trial FROM public.apple_subscription_transactions ORDER BY transaction_id')).rows;
  assert.equal(transactions.length, 2);
  assert.deepEqual(transactions.map(row => row.transaction_id), [trial.transactionId, paid.transactionId]);
  assert.deepEqual(transactions.map(row => row.is_trial), [true, false]);
  for (const row of transactions) {
    assert.equal(row.original_transaction_id, initial[0].original_transaction_id); assert.equal(row.app_account_token, token);
  }
  assert.equal((await pg.query('SELECT count(*)::integer AS n FROM public.apple_subscription_notifications')).rows[0].n, 1);
});

test('An older refund reversal cannot undo a newer refund even when the API issues a fresh positive transaction', lifecycleSql, async t => {
  for (const duplicate of [true, false]) await t.test(duplicate ? 'previously processed notification UUID' : 'previously unseen notification UUID', async child => {
    const ledger = await lifecycleLedger(child); const now = Date.now();
    const initial = transaction({ appAccountToken: ledger.token, purchaseDate: now - DAY,
      expiresDate: now + DAY, signedDate: now });
    const readAccess = at => lib.resolveAppleSubscriptionAccess(ledger.database, EMAIL, { config: CONFIG, nowMs: at, refresh: false });
    assert.equal((await lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
      { database: ledger.database, config: CONFIG, nowMs: now, ...provider({ device: initial, current: initial,
        renewalInfo: renewal({ appAccountToken: ledger.token, signedDate: now }) }) })).paid, true);
    const firstRefund = { ...initial, signedDate: now + 10, revocationDate: now + 10 };
    await lifecycleNotification(ledger, { type: 'REFUND', id: '11111111-1111-4111-8111-111111111111',
      event: firstRefund, current: firstRefund, status: 5, observedAt: now + 10 });
    assert.equal((await readAccess(now + 10)).paid, false);
    const reversed = { ...initial, signedDate: now + 20 };
    const reversalId = '22222222-2222-4222-8222-222222222222';
    await lifecycleNotification(ledger, { type: 'REFUND_REVERSED', id: reversalId,
      event: reversed, current: reversed, status: 1, observedAt: now + 20 });
    assert.equal((await readAccess(now + 20)).paid, true);
    const newerRefund = { ...initial, signedDate: now + 30, revocationDate: now + 30 };
    await lifecycleNotification(ledger, { type: 'REFUND', id: '33333333-3333-4333-8333-333333333333',
      event: newerRefund, current: newerRefund, status: 5, observedAt: now + 30 });
    assert.equal((await readAccess(now + 30)).paid, false);

    // The original reversal evidence remains old; a fresh API signature is
    // merely a later observation and must not become a new reversal event.
    await lifecycleNotification(ledger, { type: 'REFUND_REVERSED',
      id: duplicate ? reversalId : '44444444-4444-4444-8444-444444444444',
      event: reversed, current: { ...initial, signedDate: now + 40 }, status: 1, observedAt: now + 40 });
    const after = await readAccess(now + 40);
    assert.equal(after.paid, false, 'Old reversal evidence must not clear the newer refund');
    const subscription = (await ledger.pg.query('SELECT status,access_until FROM public.apple_subscriptions')).rows[0];
    assert.equal(subscription.status, 5); assert.equal(subscription.access_until, null);
    const record = (await ledger.pg.query('SELECT revoked_at FROM public.apple_subscription_transactions')).rows[0];
    assert.equal(new Date(record.revoked_at).getTime(), newerRefund.revocationDate);
  });
});

test('An older refund cannot revoke a valid later reversal merely because the API transaction was newly signed', lifecycleSql, async t => {
  for (const duplicate of [true, false]) await t.test(duplicate ? 'previously processed notification UUID' : 'previously unseen notification UUID', async child => {
    const ledger = await lifecycleLedger(child); const now = Date.now();
    const initial = transaction({ appAccountToken: ledger.token, purchaseDate: now - DAY,
      expiresDate: now + DAY, signedDate: now });
    const readAccess = at => lib.resolveAppleSubscriptionAccess(ledger.database, EMAIL, { config: CONFIG, nowMs: at, refresh: false });
    assert.equal((await lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
      { database: ledger.database, config: CONFIG, nowMs: now, ...provider({ device: initial, current: initial,
        renewalInfo: renewal({ appAccountToken: ledger.token, signedDate: now }) }) })).paid, true);
    const refunded = { ...initial, signedDate: now + 10, revocationDate: now + 10 };
    const refundId = '11111111-1111-4111-8111-111111111111';
    await lifecycleNotification(ledger, { type: 'REFUND', id: refundId,
      event: refunded, current: refunded, status: 5, observedAt: now + 10 });
    assert.equal((await readAccess(now + 10)).paid, false);
    const reversed = { ...initial, signedDate: now + 20 };
    await lifecycleNotification(ledger, { type: 'REFUND_REVERSED', id: '22222222-2222-4222-8222-222222222222',
      event: reversed, current: reversed, status: 1, observedAt: now + 20 });
    const validReversal = await readAccess(now + 20);
    assert.equal(validReversal.paid, true);

    // Preserve the refund's own signed time even when the current positive
    // transaction was re-signed after the legitimate reversal.
    await lifecycleNotification(ledger, { type: 'REFUND',
      id: duplicate ? refundId : '44444444-4444-4444-8444-444444444444',
      event: refunded, current: { ...initial, signedDate: now + 30 }, status: 1, observedAt: now + 30 });
    const after = await readAccess(now + 30);
    assert.equal(after.paid, true, 'Old refund evidence must not undo a later valid reversal');
    assert.equal(after.paidUntil, validReversal.paidUntil);
    const subscription = (await ledger.pg.query('SELECT status FROM public.apple_subscriptions')).rows[0];
    assert.equal(subscription.status, 1);
    const record = (await ledger.pg.query('SELECT revoked_at,revocation_reversed_at FROM public.apple_subscription_transactions')).rows[0];
    assert.equal(record.revoked_at, null); assert.equal(new Date(record.revocation_reversed_at).getTime(), reversed.signedDate);
  });
});

test('A legitimate reversal follows the actual refund date even when revoked API data was re-signed later', lifecycleSql, async t => {
  const ledger = await lifecycleLedger(t); const now = Date.now();
  const initial = transaction({ appAccountToken: ledger.token, purchaseDate: now - DAY,
    expiresDate: now + DAY, signedDate: now });
  const first = await lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
    { database: ledger.database, config: CONFIG, nowMs: now, ...provider({ device: initial, current: initial,
      renewalInfo: renewal({ appAccountToken: ledger.token, signedDate: now }) }) });
  const refund = { ...initial, signedDate: now + 10, revocationDate: now + 10 };
  await lifecycleNotification(ledger, { type: 'REFUND', id: '11111111-1111-4111-8111-111111111111',
    event: refund, current: { ...refund, signedDate: now + 40 }, status: 5, observedAt: now + 40 });
  assert.equal((await lib.resolveAppleSubscriptionAccess(ledger.database, EMAIL,
    { config: CONFIG, nowMs: now + 40, refresh: false })).paid, false);
  const reversed = { ...initial, signedDate: now + 20 };
  await lifecycleNotification(ledger, { type: 'REFUND_REVERSED', id: '22222222-2222-4222-8222-222222222222',
    event: reversed, current: { ...initial, signedDate: now + 50 }, status: 1, observedAt: now + 50 });
  const after = await lib.resolveAppleSubscriptionAccess(ledger.database, EMAIL,
    { config: CONFIG, nowMs: now + 50, refresh: false });
  assert.equal(after.paid, true, 'A later valid reversal with positive provider status must regain access');
  assert.equal(after.paidUntil, first.paidUntil);
  assert.equal((await ledger.pg.query('SELECT revoked_at FROM public.apple_subscription_transactions')).rows[0].revoked_at, null);
});

test('A valid reversal retries the same notification after provider lag without reserving its UUID or writing premature access', lifecycleSql, async t => {
  const ledger = await lifecycleLedger(t); const now = Date.now();
  const initial = transaction({ appAccountToken: ledger.token, purchaseDate: now - DAY,
    expiresDate: now + DAY, signedDate: now });
  await lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
    { database: ledger.database, config: CONFIG, nowMs: now, ...provider({ device: initial, current: initial,
      renewalInfo: renewal({ appAccountToken: ledger.token, signedDate: now }) }) });
  const refunded = { ...initial, signedDate: now + 10, revocationDate: now + 10 };
  await lifecycleNotification(ledger, { type: 'REFUND', id: '11111111-1111-4111-8111-111111111111',
    event: refunded, current: { ...refunded, signedDate: now + 40 }, status: 5, observedAt: now + 40 });
  const before = (await ledger.pg.query('SELECT to_jsonb(s) AS v FROM public.apple_subscriptions s')).rows[0].v;
  const reversed = { ...initial, signedDate: now + 20 };
  const reversalId = '22222222-2222-4222-8222-222222222222';
  let rpcCalls = 0; const rpc = ledger.database.rpc.bind(ledger.database);
  ledger.database.rpc = async (...args) => { rpcCalls++; return rpc(...args); };
  await assert.rejects(lifecycleNotification(ledger, { type: 'REFUND_REVERSED', id: reversalId,
    event: reversed, current: { ...refunded, signedDate: now + 50 }, status: 5, observedAt: now + 50 }),
  error => error.status === 503);
  assert.equal(rpcCalls, 0);
  assert.deepEqual((await ledger.pg.query('SELECT to_jsonb(s) AS v FROM public.apple_subscriptions s')).rows[0].v, before);
  assert.equal((await ledger.pg.query('SELECT count(*)::integer AS n FROM public.apple_subscription_notifications WHERE notification_id=$1', [reversalId])).rows[0].n, 0);
  assert.equal((await lib.resolveAppleSubscriptionAccess(ledger.database, EMAIL,
    { config: CONFIG, nowMs: now + 50, refresh: false })).paid, false);

  assert.equal((await lifecycleNotification(ledger, { type: 'REFUND_REVERSED', id: reversalId,
    event: reversed, current: { ...initial, signedDate: now + 60 }, status: 1, observedAt: now + 60 })).ok, true);
  assert.equal(rpcCalls, 1);
  const after = await lib.resolveAppleSubscriptionAccess(ledger.database, EMAIL,
    { config: CONFIG, nowMs: now + 60, refresh: false });
  assert.equal(after.paid, true); assert.equal(after.paidUntil, new Date(initial.expiresDate).toISOString());
  assert.equal((await ledger.pg.query('SELECT revoked_at FROM public.apple_subscription_transactions')).rows[0].revoked_at, null);
  assert.equal((await ledger.pg.query('SELECT count(*)::integer AS n FROM public.apple_subscription_notifications WHERE notification_id=$1', [reversalId])).rows[0].n, 1);
});

test('A verified refund reversal restores only the signed grace period after ordinary expiry', lifecycleSql, async t => {
  const ledger = await lifecycleLedger(t); const now = Date.now();
  const expired = transaction({ appAccountToken: ledger.token, purchaseDate: now - DAY,
    expiresDate: now - 1000, signedDate: now - 2000 });
  assert.equal((await lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
    { database: ledger.database, config: CONFIG, nowMs: now - 2000,
      ...provider({ device: expired, current: expired,
        renewalInfo: renewal({ appAccountToken: ledger.token, signedDate: expired.signedDate }) }) })).paid, true);
  const refunded = { ...expired, signedDate: now - 500, revocationDate: now - 500 };
  await lifecycleNotification(ledger, { type: 'REFUND', id: '11111111-1111-4111-8111-111111111111',
    event: refunded, current: refunded, status: 5, observedAt: now - 500 });
  const reversed = { ...expired, signedDate: now - 250 };
  const current = { ...expired, signedDate: now };
  const graceUntil = now + 120000;
  const graceRenewal = renewal({ appAccountToken: ledger.token, signedDate: now,
    gracePeriodExpiresDate: graceUntil });
  const reversalId = '22222222-2222-4222-8222-222222222222';
  await lifecycleNotification(ledger, { type: 'REFUND_REVERSED', id: reversalId,
    event: reversed, current, status: 4, observedAt: now, renewalInfo: graceRenewal });
  const access = await lib.resolveAppleSubscriptionAccess(ledger.database, EMAIL,
    { config: CONFIG, nowMs: now, refresh: false });
  assert.equal(access.paid, true, 'A reversed refund in provider grace status must not remain revoked');
  assert.equal(access.paidUntil, new Date(graceUntil).toISOString());
  const subscription = (await ledger.pg.query('SELECT status,access_until,grace_until FROM public.apple_subscriptions')).rows[0];
  assert.equal(subscription.status, 4);
  assert.equal(new Date(subscription.access_until).getTime(), graceUntil);
  assert.equal(new Date(subscription.grace_until).getTime(), graceUntil);
  const record = (await ledger.pg.query('SELECT revoked_at,revocation_reversed_at FROM public.apple_subscription_transactions')).rows[0];
  assert.equal(record.revoked_at, null);
  assert.equal(new Date(record.revocation_reversed_at).getTime(), reversed.signedDate);

  await lifecycleNotification(ledger, { type: 'REFUND_REVERSED', id: reversalId,
    event: reversed, current: { ...current, signedDate: now + 10 }, status: 4, observedAt: now + 10,
    renewalInfo: { ...graceRenewal, signedDate: now + 10 } });
  assert.equal((await ledger.pg.query('SELECT count(*)::integer AS n FROM public.apple_subscription_notifications WHERE notification_id=$1', [reversalId])).rows[0].n, 1);
  assert.equal((await lib.resolveAppleSubscriptionAccess(ledger.database, EMAIL,
    { config: CONFIG, nowMs: graceUntil, refresh: false })).paid, false, 'Signed grace access ends at its exact deadline');
});

test('An inactive refund reversal clears the marker without access and allows a later verified restore or status refresh', lifecycleSql, async t => {
  for (const status of [2, 3]) await t.test(status === 2 ? 'expired status followed by restoration' : 'billing retry followed by API refresh', async child => {
    const ledger = await lifecycleLedger(child); const now = Date.now();
    const expired = transaction({ appAccountToken: ledger.token, purchaseDate: now - DAY,
      expiresDate: now - 1000, signedDate: now - 2000 });
    await lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
      { database: ledger.database, config: CONFIG, nowMs: now - 2000,
        ...provider({ device: expired, current: expired,
          renewalInfo: renewal({ appAccountToken: ledger.token, signedDate: expired.signedDate }) }) });
    const refunded = { ...expired, signedDate: now - 500, revocationDate: now - 500 };
    await lifecycleNotification(ledger, { type: 'REFUND', id: '11111111-1111-4111-8111-111111111111',
      event: refunded, current: refunded, status: 5, observedAt: now - 500 });
    const reversed = { ...expired, signedDate: now - 250 };
    const reversalId = '22222222-2222-4222-8222-222222222222';
    await lifecycleNotification(ledger, { type: 'REFUND_REVERSED', id: reversalId,
      event: reversed, current: { ...expired, signedDate: now }, status, observedAt: now });
    const denied = await lib.resolveAppleSubscriptionAccess(ledger.database, EMAIL,
      { config: CONFIG, nowMs: now, refresh: false });
    assert.equal(denied.paid, false, 'A reversal alone must not grant expired or billing-retry access');
    assert.equal(denied.paidUntil, null);
    assert.equal(denied.status, status === 2 ? 'EXPIRED' : 'BILLING_RETRY');
    const record = (await ledger.pg.query('SELECT revoked_at,revocation_reversed_at FROM public.apple_subscription_transactions')).rows[0];
    assert.equal(record.revoked_at, null, 'Inactive status must not consume the reversal while retaining its refund marker');
    assert.equal(new Date(record.revocation_reversed_at).getTime(), reversed.signedDate);
    assert.equal((await ledger.pg.query('SELECT status,access_until FROM public.apple_subscriptions')).rows[0].access_until, null);
    assert.equal((await ledger.pg.query('SELECT count(*)::integer AS n FROM public.apple_subscription_notifications WHERE notification_id=$1', [reversalId])).rows[0].n, 1);

    // No purchase or new transaction occurs: the existing contract receives a
    // verified grace period through the same real restore/refresh paths.
    const observedAt = status === 2 ? now + 10 : now + 61000;
    const graceUntil = now + 120000;
    const apple = provider({ device: reversed, current: { ...expired, signedDate: observedAt }, status: 4,
      renewalInfo: renewal({ appAccountToken: ledger.token, signedDate: observedAt,
        gracePeriodExpiresDate: graceUntil }) });
    const restored = status === 2 ? await lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
      { database: ledger.database, config: CONFIG, nowMs: observedAt, ...apple }) :
      await lib.resolveAppleSubscriptionAccess(ledger.database, EMAIL,
        { config: CONFIG, nowMs: observedAt, ...apple });
    assert.equal(apple.apiReads, 1);
    assert.equal(restored.paid, true, 'The already processed valid reversal must not block later current-status access');
    assert.equal(restored.paidUntil, new Date(graceUntil).toISOString());
    const counts = (await ledger.pg.query('SELECT (SELECT count(*)::integer FROM public.apple_subscriptions) AS contracts,(SELECT count(*)::integer FROM public.apple_subscription_transactions) AS transactions')).rows[0];
    assert.deepEqual(counts, { contracts: 1, transactions: 1 });
    assert.equal((await ledger.pg.query('SELECT status FROM public.apple_subscriptions')).rows[0].status, 4);
    assert.equal((await ledger.pg.query('SELECT count(*)::integer AS n FROM public.apple_subscription_notifications WHERE notification_id=$1', [reversalId])).rows[0].n, 1);
  });
});

test('A legacy API signing date cannot suppress a genuine later refund after the ledger upgrade', lifecycleSql, async t => {
  const ledger = await lifecycleLedger(t, { applyRefundOrdering: false }); const now = Date.now();
  const initial = transaction({ appAccountToken: ledger.token, purchaseDate: now - DAY,
    expiresDate: now + DAY, signedDate: now });
  assert.equal((await lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
    { database: ledger.database, config: CONFIG, nowMs: now, ...provider({ device: initial, current: initial,
      renewalInfo: renewal({ appAccountToken: ledger.token, signedDate: now }) }) })).paid, true);
  // The old schema recorded a later API signature in this field. The original
  // reversal event at t20 is unavailable, so t40 must not suppress a refund t30.
  await ledger.pg.query('UPDATE public.apple_subscription_transactions SET revocation_reversed_at=$1,signed_at=$1',
    [new Date(now + 40).toISOString()]);
  await ledger.pg.exec(refundOrderingMigration());
  const legacy = (await ledger.pg.query('SELECT revoked_at,revocation_reversed_at,revocation_event_at,revocation_notification_signed_at FROM public.apple_subscription_transactions')).rows[0];
  assert.equal(legacy.revoked_at, null); assert.equal(new Date(legacy.revocation_reversed_at).getTime(), now + 40);
  assert.equal(legacy.revocation_event_at, null); assert.equal(legacy.revocation_notification_signed_at, null);

  const refund = { ...initial, signedDate: now + 30, revocationDate: now + 30 };
  await lifecycleNotification(ledger, { type: 'REFUND', id: '11111111-1111-4111-8111-111111111111',
    event: refund, current: { ...initial, signedDate: now + 50 }, status: 1, observedAt: now + 50 });
  const access = await lib.resolveAppleSubscriptionAccess(ledger.database, EMAIL,
    { config: CONFIG, nowMs: now + 50, refresh: false });
  assert.equal(access.paid, false, 'Unknown legacy reversal chronology cannot override new negative evidence');
  assert.equal(access.paidUntil, null);
  const stored = (await ledger.pg.query('SELECT revoked_at,revocation_reversed_at,revocation_event_at,revocation_notification_signed_at FROM public.apple_subscription_transactions')).rows[0];
  assert.equal(new Date(stored.revoked_at).getTime(), refund.revocationDate);
  assert.equal(new Date(stored.revocation_event_at).getTime(), refund.revocationDate);
  assert.equal(new Date(stored.revocation_notification_signed_at).getTime(), refund.signedDate);
  assert.equal(new Date(stored.revocation_reversed_at).getTime(), now + 40);
});

test('Actual PostgreSQL ledger: ownership, replay, refunds, renewal, detach/recreation and browser denial',
  { skip: sqlAvailable ? false : 'Local isolated PGlite runtime unavailable; set JL_APPLE_TEST_PGLITE_PATH.' }, async () => {
  const { PGlite } = require(path.resolve(pglitePath)); const pg = new PGlite();
  try {
    await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE TABLE public.userprofile(email text PRIMARY KEY);');
    await pg.exec(fs.readFileSync(path.join(root, 'supabase/migrations/20261007110000_apple_subscriptions.sql'), 'utf8'));
    await pg.exec(fs.readFileSync(path.join(root, 'supabase/migrations/20261007110000_apple_subscriptions.sql'), 'utf8'));
    await pg.query('INSERT INTO public.userprofile(email,account_generation) VALUES($1,$2)', [EMAIL, GENERATION]);
    const owner = (await pg.query('SELECT public.ensure_apple_account_token($1,$2) AS v', [EMAIL, GENERATION])).rows[0].v;
    const stable = (await pg.query('SELECT public.ensure_apple_account_token($1,$2) AS v', [EMAIL, GENERATION])).rows[0].v;
    assert.equal(owner.app_account_token, stable.app_account_token);
    await pg.exec('GRANT USAGE ON SCHEMA public TO service_role; GRANT SELECT,INSERT ON public.userprofile TO service_role;');
    assert.equal((await pg.query("SELECT has_table_privilege('service_role','public.userprofile','UPDATE') AS allowed")).rows[0].allowed, false);
    try {
      await pg.exec('SET ROLE service_role;');
      const serviceOwner = (await pg.query('SELECT public.ensure_apple_account_token($1,$2) AS v', [EMAIL, GENERATION])).rows[0].v;
      assert.equal(serviceOwner.app_account_token, owner.app_account_token);
      await assert.rejects(pg.query('SELECT public.ensure_apple_account_token($1,$2)', [EMAIL, 'd815ae8d-8300-4e50-a89d-98148a376625']), /JL_APPLE_ACCOUNT/);
    } finally { await pg.exec('RESET ROLE;'); }
    const token = owner.app_account_token;
    const record = lib.verifiedAppleTransactionRecord(transaction({ appAccountToken: token }), CONFIG, NOW);
    const snapshot = (changes = {}) => ({ original_transaction_id: record.original_transaction_id,
      app_account_token: token, environment: 'Sandbox', account_email: EMAIL, account_generation: GENERATION,
      status: 1, auto_renew: true, grace_until: null, observed_at: new Date(NOW).toISOString(), transactions: [record], ...changes });
    const apply = async value => (await pg.query('SELECT public.apply_apple_subscription_snapshot($1::jsonb) AS v', [JSON.stringify(value)])).rows[0].v;
    const paid = await apply(snapshot()); assert.equal(Date.parse(paid.access_until), NOW + 29 * DAY);
    await apply(snapshot());
    assert.equal((await pg.query('SELECT count(*)::integer AS n FROM public.apple_subscription_transactions')).rows[0].n, 1);
    const revoked = await apply(snapshot({ status: 5, transactions: [{ ...record, revoked_at: new Date(NOW - 1000).toISOString() }] }));
    assert.equal(revoked.access_until, null);
    // Upgrade an already populated old ledger, preserving existing business
    // fields and private grants. Backfill uses the real revocation event date.
    const legacySubscription = (await pg.query('SELECT to_jsonb(s) AS v FROM public.apple_subscriptions s')).rows[0].v;
    const legacyTransaction = (await pg.query('SELECT to_jsonb(t) AS v FROM public.apple_subscription_transactions t')).rows[0].v;
    const permissions = () => pg.query(`SELECT r.rolname AS role,
      has_table_privilege(r.rolname,'public.apple_subscription_transactions','SELECT') AS can_read,
      has_function_privilege(r.rolname,'public.apply_apple_subscription_snapshot(jsonb)','EXECUTE') AS can_apply
      FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role') ORDER BY r.rolname`);
    const grants = (await permissions()).rows;
    await pg.exec(refundOrderingMigration());
    assert.deepEqual((await pg.query('SELECT to_jsonb(s) AS v FROM public.apple_subscriptions s')).rows[0].v, legacySubscription);
    const upgraded = (await pg.query('SELECT to_jsonb(t) AS v FROM public.apple_subscription_transactions t')).rows[0].v;
    const { revocation_event_at, revocation_notification_signed_at, ...oldFields } = upgraded;
    assert.deepEqual(oldFields, legacyTransaction);
    assert.equal(revocation_event_at, legacyTransaction.revoked_at); assert.equal(revocation_notification_signed_at, null);
    assert.deepEqual((await permissions()).rows, grants);
    await pg.exec(refundOrderingMigration());
    assert.deepEqual((await pg.query('SELECT to_jsonb(t) AS v FROM public.apple_subscription_transactions t')).rows[0].v, upgraded);
    assert.deepEqual((await pg.query('SELECT to_jsonb(s) AS v FROM public.apple_subscriptions s')).rows[0].v, legacySubscription);
    assert.deepEqual((await permissions()).rows, grants);
    const newColumnGrants = (await pg.query(`SELECT r.rolname AS role,
      has_column_privilege(r.rolname,'public.apple_subscription_transactions','revocation_event_at','SELECT') AS event_read,
      has_column_privilege(r.rolname,'public.apple_subscription_transactions','revocation_notification_signed_at','SELECT') AS notice_read
      FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role') ORDER BY r.rolname`)).rows;
    assert.deepEqual(newColumnGrants, [{ role: 'anon', event_read: false, notice_read: false },
      { role: 'authenticated', event_read: false, notice_read: false },
      { role: 'service_role', event_read: true, notice_read: true }]);
    const replay = await apply(snapshot({ observed_at: new Date(NOW - 1000).toISOString() }));
    assert.equal(replay.access_until, null);
    const evenLaterReplay = await apply(snapshot()); assert.equal(evenLaterReplay.access_until, null);
    const reversedRecord = { ...record, signed_at: new Date(NOW + 1).toISOString() };
    const booleanOnly = await apply(snapshot({ allow_revocation_reversal: true, transactions: [reversedRecord],
      observed_at: new Date(NOW + 1).toISOString() }));
    assert.equal(booleanOnly.access_until, null, 'A bare reversal boolean is not signed event evidence');
    const reversed = await apply(snapshot({ transactions: [reversedRecord, reversedRecord],
      revocation_notification: { notification_type: 'REFUND_REVERSED', notification_signed_at: new Date(NOW + 1).toISOString(),
        transaction_id: record.transaction_id, transaction_signed_at: reversedRecord.signed_at, revoked_at: null },
      notification_id: '55555555-5555-4555-8555-555555555555', observed_at: new Date(NOW + 1).toISOString() }));
    assert.equal(Date.parse(reversed.access_until), NOW + 29 * DAY);
    const oldRefundAfterReversal = await apply(snapshot({ transactions: [{ ...record, revoked_at: new Date(NOW - 1000).toISOString() }],
      observed_at: new Date(NOW + 2).toISOString() }));
    assert.equal(Date.parse(oldRefundAfterReversal.access_until), NOW + 29 * DAY);
    const renewedRecord = { ...record, transaction_id: '20000002', purchased_at: new Date(NOW).toISOString(), expires_at: new Date(NOW + 30 * DAY).toISOString() };
    const renewed = await apply(snapshot({ transactions: [renewedRecord, record], observed_at: new Date(NOW + 3).toISOString() }));
    assert.equal(Date.parse(renewed.access_until), NOW + 30 * DAY);
    await assert.rejects(apply(snapshot({ account_email: 'other@example.invalid' })), /JL_APPLE_ACCOUNT/);
    await pg.query('SELECT public.detach_apple_account($1,$2)', [EMAIL, GENERATION]);
    await pg.query('DELETE FROM public.userprofile WHERE email=$1', [EMAIL]);
    const newGeneration = 'd815ae8d-8300-4e50-a89d-98148a376625';
    await pg.query('INSERT INTO public.userprofile(email,account_generation) VALUES($1,$2)', [EMAIL, newGeneration]);
    const recreated = (await pg.query('SELECT public.ensure_apple_account_token($1,$2) AS v', [EMAIL, newGeneration])).rows[0].v;
    assert.notEqual(recreated.app_account_token, token);
    await assert.rejects(pg.query('SELECT public.ensure_apple_account_token($1,$2)', [EMAIL, GENERATION]), /JL_APPLE_ACCOUNT/);
    await assert.rejects(apply(snapshot()), /JL_APPLE_ACCOUNT/);
    const detached = await apply(snapshot({ account_email: null, observed_at: new Date(NOW + 2).toISOString(), transactions: [renewedRecord] }));
    assert.equal(detached.app_account_token, token);
    for (const role of ['anon', 'authenticated']) {
      await pg.exec(`SET ROLE ${role};`);
      await assert.rejects(pg.query('SELECT * FROM public.apple_account_tokens'), /permission denied/);
      await assert.rejects(pg.query('SELECT public.ensure_apple_account_token($1,$2)', [EMAIL, newGeneration]), /permission denied/);
      await pg.exec('RESET ROLE;');
    }
  } finally { await pg.close(); }
});
