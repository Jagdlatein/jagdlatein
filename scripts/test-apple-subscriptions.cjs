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
const JWS = { device: 'e30.ZGV2aWNl.c2ln', current: 'e30.Y3VycmVudA.c2ln', renewal: 'e30.cmVuZXdhbA.c2ln', notice: 'e30.bm90aWNl.c2ln' };

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
function provider({ device = transaction(), current = transaction(), renewalInfo = renewal(), status = 1,
  notice = {}, failApi = false, invalidSignature = false } = {}) {
  let apiReads = 0;
  const verifier = {
    async verifyAndDecodeTransaction(signed) { if (invalidSignature) throw new Error('invalid signature');
      return signed === JWS.device ? device : current; },
    async verifyAndDecodeRenewalInfo() { return renewalInfo; },
    async verifyAndDecodeNotification() { return { notificationUUID: 'c815a0bb-d432-40c6-bf2a-e97fb877b195',
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

test('Signed revocation cannot be masked by a lagging positive current-status endpoint', async () => {
  const data = fakeDatabase(); const apple = provider({ device: transaction({ revocationDate: NOW - 60000 }) });
  const result = await lib.applyVerifiedAppleTransaction(JWS.device, EMAIL, GENERATION,
    { database: data.database, config: CONFIG, nowMs: NOW, ...apple });
  assert.equal(result.paid, false);
  assert.equal(data.snapshots[0].transactions[0].revoked_at, new Date(NOW - 60000).toISOString());
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
    const replay = await apply(snapshot({ observed_at: new Date(NOW - 1000).toISOString() }));
    assert.equal(replay.access_until, null);
    const evenLaterReplay = await apply(snapshot()); assert.equal(evenLaterReplay.access_until, null);
    const reversedRecord = { ...record, signed_at: new Date(NOW + 1).toISOString() };
    const reversed = await apply(snapshot({ allow_revocation_reversal: true, transactions: [reversedRecord],
      observed_at: new Date(NOW + 1).toISOString() }));
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
