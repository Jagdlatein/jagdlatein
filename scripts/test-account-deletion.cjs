// Synthetic accounts and an in-memory PostgreSQL engine; no remote services.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const runtime = process.env.JL_PAYPAL_TEST_PGLITE_PATH || path.join(process.env.LOCALAPPDATA || '', 'Jagdlatein', 'paypal-sandbox', 'test-runtime', 'node_modules', '@electric-sql', 'pglite');
if (!fs.existsSync(runtime)) throw new Error('Missing isolated SQL test runtime. Set JL_PAYPAL_TEST_PGLITE_PATH to the PGlite package directory.');
const { PGlite } = require(runtime);
const EMAIL = 'remove-me@example.invalid', OTHER = 'keep-me@example.invalid';
const GENERATION = '11111111-1111-4111-8111-111111111111', OTHER_GENERATION = '22222222-2222-4222-8222-222222222222';
const SUBSCRIPTION = 'I-DELETE123456', PLAN = 'P-DELETION1234';
const OTHER_SUBSCRIPTION = 'I-KEEP1234567';
const APPLE_PRODUCT = 'de.jagdlatein.premium.monthly';
const APPLE_CONFIG = { environment: 'Sandbox', bundleId: 'de.jagdlatein.app', appAppleId: 6819820561, productIds: [APPLE_PRODUCT] };
const APPLE_JWS = { device: 'e30.ZGV2aWNl.c2ln', current: 'e30.Y3VycmVudA.c2ln', renewal: 'e30.cmVuZXdhbA.c2ln', notification: 'e30.bm90aWNl.c2ln' };
const POST = '33333333-3333-4333-8333-333333333333', THREAD = '44444444-4444-4444-8444-444444444444';
const NOW = Date.now();
let pg;
const migration = () => fs.readFileSync(path.join(root, 'supabase/migrations/20261009220000_complete_account_deletion.sql'), 'utf8');

function moduleLoader(env, database) {
  const cache = new Map();
  const context = vm.createContext({ process: { env }, Buffer, Date, URL, TextDecoder, Uint8Array, Response, AbortSignal, console,
    fetch: async () => { throw new Error('An offline deletion test attempted a real network request'); } });
  function load(relative) {
    const filename = path.join(root, relative);
    if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} }; cache.set(filename, mod);
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022' }, module: { type: 'commonjs' } });
    const req = id => {
      if (id === '@supabase/supabase-js') return { createClient(url, key, options) { database.calls++; database.options = options; return database; } };
      if (id === './course-catalog') return { courses: [] };
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), id.endsWith('.json') ? id : `${id}.js`)));
      return pr(id);
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(req, mod, mod.exports);
    return mod.exports;
  }
  return load;
}

function api(options = {}) {
  const state = { calls: 0, rpcCalls: 0 };
  const database = { ...state,
    from(name) {
      assert.equal(name, 'userprofile');
      return { select() { return this; }, ilike(column, email) { assert.equal(column, 'email'); this.email = email.replace(/\\([\\%_])/g, '$1'); return this; },
        async maybeSingle() { return { data: (await pg.query('SELECT * FROM public.userprofile WHERE email=$1', [this.email])).rows[0] || null, error: null }; } };
    },
    async rpc(name, parameters) {
      assert.equal(name, 'delete_jagdlatein_account'); this.rpcCalls++;
      try {
        const result = await pg.transaction(async transaction => {
          await transaction.query("SELECT set_config('request.headers',$1,true)", [JSON.stringify(this.options?.global?.headers || {})]);
          return transaction.query('SELECT public.delete_jagdlatein_account($1,$2::uuid) AS data', [parameters.p_email, parameters.p_account_generation]);
        });
        return { data: result.rows[0].data, error: null };
      } catch (error) { return { data: null, error }; }
    },
  };
  const env = { ACCOUNT_DELETION_ENABLED: options.disabled ? 'false' : 'true', NODE_ENV: 'production',
    JL_SESSION_SECRET: 'synthetic-account-deletion-secret-more-than-32-bytes', SUPABASE_URL: 'https://database.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-not-a-key' };
  const load = moduleLoader(env, database);
  const session = load('lib/account-session.js');
  const token = options.unsigned ? 'invalid' : session.createAccountSession(EMAIL, NOW, {
    paid: false, admin: false, authenticatedAt: Math.floor(NOW / 1000) - (options.old ? 601 : 0),
    accountGeneration: options.wrongGeneration ? OTHER_GENERATION : GENERATION,
  });
  const route = load('app/api/account/delete/route.js');
  function request(overrides = {}) {
    const headers = { origin: 'https://app.example.invalid', 'content-type': 'application/json', ...overrides.headers };
    for (const [key, value] of Object.entries(headers)) if (value === null) delete headers[key];
    const body = overrides.body ?? JSON.stringify({ confirmation: 'KONTO LÖSCHEN', acknowledgeSubscriptions: true });
    const req = new Request('https://app.example.invalid/api/account/delete', { method: 'DELETE', headers, body });
    req.cookies = { get() { return { value: token }; } };
    return req;
  }
  return { database, route, request, load };
}

test.before(async () => {
  pg = new PGlite();
  await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
  await pg.exec(fs.readFileSync(path.join(root, 'supabase/test-only/paypal-sandbox-bootstrap.sql'), 'utf8'));
  await pg.exec('CREATE TABLE public.push_tokens(token text PRIMARY KEY,platform text,enabled boolean,updated_at timestamptz); GRANT SELECT,INSERT,UPDATE ON public.push_tokens TO service_role;');
  for (const file of ['20261003_course_progress.sql','20261003160000_activity_results.sql','20261004100000_ranked_quiz.sql',
    '20261004110000_subscription_access.sql','20261004120000_secure_private_tables.sql','20261004130000_subscription_trial.sql','20261004190000_learning_community.sql',
    '20261007105000_account_registration.sql','20261007110000_apple_subscriptions.sql']) {
    await pg.exec(fs.readFileSync(path.join(root, 'supabase/migrations', file), 'utf8'));
  }
  await pg.exec(fs.readFileSync(path.join(root, 'supabase/migrations/20261007120000_account_deletion.sql'), 'utf8'));
  await pg.exec(fs.readFileSync(path.join(root, 'supabase/migrations/20261008120000_apple_refund_ordering.sql'), 'utf8'));
  for (const file of ['20261008140000_community_blocks.sql','20261008150000_apple_review_login_rate_limits.sql',
    '20261008160000_community_premoderation.sql','20261008170000_community_moderators.sql']) {
    await pg.exec(fs.readFileSync(path.join(root,'supabase/migrations',file),'utf8'));
  }
  await pg.exec(fs.readFileSync(path.join(root, 'supabase/migrations/20261009210000_paypal_account_generation.sql'), 'utf8'));
  await pg.exec(migration());
});
test.after(async () => { await pg?.close(); });

async function fixture() {
  await pg.exec('TRUNCATE public.account_registration_codes,public.apple_review_login_limits,public.apple_account_tokens,public.community_blocks,public.community_posts,public.community_profiles,public.quiz_identities,public.course_progress,public.activity_results,public.push_tokens,public.login_codes,public.paypal_checkout_requests,public.paypal_subscriptions,public.userprofile CASCADE;');
  await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation) VALUES(gen_random_uuid(),$1,$2),(gen_random_uuid(),$3,$4)', [EMAIL,GENERATION,OTHER,OTHER_GENERATION]);
  await pg.query('INSERT INTO public.login_codes VALUES($1,$2,now()+interval\'10minutes\',0,now())', [EMAIL,'synthetic-code-hash']);
  await pg.query('INSERT INTO public.push_tokens(token,enabled,account_email) VALUES($1,true,$2),($3,true,$4)', ['owned-device',EMAIL,'other-device',OTHER]);
  await pg.query('INSERT INTO public.course_progress(account_email,course_id,status,answered_questions,total_questions,score) VALUES($1,\'test-course\',\'in_progress\',1,2,1),($2,\'test-course\',\'in_progress\',1,2,1)', [EMAIL,OTHER]);
  await pg.query('INSERT INTO public.activity_results(account_email,event_id,type,topic,total_questions,correct_answers,timed_out_answers,points,duration_seconds) VALUES($1,gen_random_uuid(),\'ansitz\',\'Ansitzsimulator\',25,10,0,10,20)', [EMAIL]);
  await pg.query('INSERT INTO public.quiz_identities(account_email,username,country) VALUES($1,\'remove-quiz\',\'DE\')', [EMAIL]);
  await pg.query('INSERT INTO public.ranked_quiz_rounds VALUES(gen_random_uuid(),$1,\'{}\',now())', [EMAIL]);
  await pg.query('INSERT INTO public.verified_quiz_scores VALUES($1,\'remove-quiz\',\'DE\',100,1,now())', [EMAIL]);
  await pg.query('INSERT INTO public.community_profiles(account_email,display_name,rules_version) VALUES($1,\'Remove Name\',\'test\'),($2,\'Keep Name\',\'test\')', [EMAIL,OTHER]);
  await pg.query('INSERT INTO public.community_posts(id,account_email,category,kind,title,body,status) VALUES($1,$2,\'allgemein\',\'question\',\'Private owned title\',\'Private owned content\',\'visible\'),($3,$4,\'allgemein\',\'question\',\'Other public title\',\'Other public content\',\'visible\')', [POST,EMAIL,THREAD,OTHER]);
  await pg.query('INSERT INTO public.community_posts(id,parent_id,account_email,category,kind,body,moderated_by,status) VALUES(gen_random_uuid(),$1,$2,\'allgemein\',\'reply\',\'Keep this reply\',$3,\'visible\'),(gen_random_uuid(),$4,$3,\'allgemein\',\'reply\',\'Remove this reply\',null,\'visible\')', [POST,OTHER,EMAIL,THREAD]);
  await pg.query('INSERT INTO public.community_reports(post_id,reporter_email,reason) VALUES($1,$2,\'Remove report\'),($3,$4,\'Other report on removed post\')', [THREAD,EMAIL,POST,OTHER]);
  await pg.query('INSERT INTO public.community_events(account_email,action) VALUES($1,\'post\')', [EMAIL]);
  await pg.query('INSERT INTO public.paypal_subscriptions(subscription_id,account_email,account_generation,plan_id,status,paid_until,verified_at) VALUES($1,$2,$3,$4,\'ACTIVE\',now()+interval\'30 days\',now()),($5,$6,$7,$4,\'ACTIVE\',now()+interval\'30 days\',now())', [SUBSCRIPTION,EMAIL,GENERATION,PLAN,OTHER_SUBSCRIPTION,OTHER,OTHER_GENERATION]);
  await pg.query('INSERT INTO public.paypal_subscription_payments(subscription_id,payment_id,status,paid_at,period_until,amount,currency,observed_at) VALUES($1,\'PAYMENT-DELETE123\',\'COMPLETED\',now(),now()+interval\'30 days\',\'5.00\',\'EUR\',now())', [SUBSCRIPTION]);
  await pg.query('INSERT INTO public.paypal_subscription_payments(subscription_id,payment_id,status,paid_at,period_until,amount,currency,observed_at) VALUES($1,\'PAYMENT-KEEP12345\',\'COMPLETED\',now(),now()+interval\'30 days\',\'5.00\',\'EUR\',now())', [OTHER_SUBSCRIPTION]);
  await pg.query('INSERT INTO public.paypal_checkout_requests(account_generation,plan_id,subscription_id) VALUES($1,$2,$3),($4,$2,$5)', [GENERATION,PLAN,SUBSCRIPTION,OTHER_GENERATION,OTHER_SUBSCRIPTION]);
}

async function recreateAccount() {
  return (await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation) VALUES(gen_random_uuid(),$1,gen_random_uuid()) RETURNING account_generation', [EMAIL])).rows[0].account_generation;
}

async function seedApple(email = EMAIL, generation = GENERATION, originalId = '1234567890', transactionId = '1234567891') {
  const owner = (await pg.query('SELECT public.ensure_apple_account_token($1,$2) AS data', [email,generation])).rows[0].data;
  const record = { environment: 'Sandbox', original_transaction_id: originalId, transaction_id: transactionId,
    app_account_token: owner.app_account_token, product_id: APPLE_PRODUCT, purchased_at: new Date(NOW - 86400000).toISOString(),
    expires_at: new Date(NOW + 29 * 86400000).toISOString(), signed_at: new Date(NOW).toISOString(), revoked_at: null, is_upgraded: false, is_trial: false };
  const snapshot = { environment: 'Sandbox', original_transaction_id: originalId, app_account_token: owner.app_account_token,
    account_email: email, account_generation: generation, status: 1, auto_renew: true, observed_at: new Date(NOW).toISOString(),
    notification_id: generation, transactions: [record] };
  await pg.query('SELECT public.apply_apple_subscription_snapshot($1::jsonb)', [JSON.stringify(snapshot)]);
  return { owner,record,snapshot };
}

async function seedDeletionDependencies() {
  const thirdEmail = 'unrelated-community@example.invalid', thirdGeneration = '66666666-6666-4666-8666-666666666666';
  await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation) VALUES(gen_random_uuid(),$1,$2)',[thirdEmail,thirdGeneration]);
  await pg.query('INSERT INTO public.community_profiles(account_email,display_name,rules_version) VALUES($1,\'Unrelated learner\',\'test\')',[thirdEmail]);
  const blocks = (await pg.query('INSERT INTO public.community_blocks(blocker_email,blocked_email) VALUES($1,$2),($2,$1),($2,$3) RETURNING id,blocker_email,blocked_email',[EMAIL,OTHER,thirdEmail])).rows;
  for (const [email,generation,bucket] of [[EMAIL,GENERATION,'a'.repeat(64)],[OTHER,OTHER_GENERATION,'b'.repeat(64)]]) {
    const owner = (await pg.query('SELECT public.ensure_apple_account_token($1,$2) AS data',[email,generation])).rows[0].data;
    const reserved = (await pg.query('SELECT public.reserve_apple_review_login_attempt($1,$2,$3) AS data',[generation,owner.app_account_token,bucket])).rows[0].data;
    assert.equal(reserved.allowed,true);
    assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.apple_review_login_limits WHERE account_generation=$1',[generation])).rows[0].count,2);
  }
  return { ownBlock: blocks.find(block => block.blocker_email === EMAIL),
    otherBlock: blocks.find(block => block.blocked_email === thirdEmail),thirdEmail };
}

function appleDatabase() {
  const calls = { snapshots: 0 };
  const allowed = { apple_account_tokens: new Set(['app_account_token','account_email']),
    apple_subscriptions: new Set(['app_account_token','environment']), userprofile: new Set(['email']) };
  const database = {
    from(table) {
      assert.ok(Object.hasOwn(allowed,table)); const filters = [];
      const read = async () => ({ data: (await pg.query(`SELECT * FROM public.${table} WHERE ${filters.map(([column],i) => `${column}=$${i + 1}`).join(' AND ')}`, filters.map(([,value]) => value))).rows, error: null });
      return { select() { return this; }, eq(column,value) { assert.ok(allowed[table].has(column)); filters.push([column,value]); return this; },
        ilike(column,value) { assert.equal(column,'email'); filters.push([column,value.replace(/\\([\\%_])/g,'$1')]); return this; },
        async maybeSingle() { const result = await read(); assert.ok(result.data.length <= 1); return { data: result.data[0] || null,error: null }; },
        then(resolve,reject) { return read().then(resolve,reject); } };
    },
    async rpc(name,args) {
      assert.equal(name,'apply_apple_subscription_snapshot'); calls.snapshots++;
      try { return { data: (await pg.query('SELECT public.apply_apple_subscription_snapshot($1::jsonb) AS data', [JSON.stringify(args.p_snapshot)])).rows[0].data,error: null }; }
      catch (error) { return { data: null,error }; }
    },
  };
  return { database,calls };
}

function appleProvider(record, beforeStatus = null) {
  const transaction = { bundleId: APPLE_CONFIG.bundleId, environment: record.environment, productId: record.product_id,
    type: 'Auto-Renewable Subscription', inAppOwnershipType: 'PURCHASED', quantity: 1,
    transactionId: record.transaction_id, originalTransactionId: record.original_transaction_id, appAccountToken: record.app_account_token,
    purchaseDate: Date.parse(record.purchased_at), expiresDate: Date.parse(record.expires_at), signedDate: Date.parse(record.signed_at) };
  const calls = { api: 0 };
  return { calls, verifier: {
    async verifyAndDecodeTransaction() { return transaction; },
    async verifyAndDecodeRenewalInfo() { return { environment: record.environment, originalTransactionId: record.original_transaction_id,
      productId: record.product_id, appAccountToken: record.app_account_token, signedDate: Date.parse(record.signed_at), autoRenewStatus: 1 }; },
    async verifyAndDecodeNotification() { return { version: '2.0',notificationUUID: GENERATION,notificationType: 'DID_RENEW',signedDate: NOW,
      data: { bundleId: APPLE_CONFIG.bundleId,environment: record.environment,appAppleId: APPLE_CONFIG.appAppleId,signedTransactionInfo: APPLE_JWS.current } }; },
  }, apiClient: { async getAllSubscriptionStatuses(originalId) {
    calls.api++; assert.equal(originalId,record.original_transaction_id); if (beforeStatus) await beforeStatus();
    return { environment: record.environment,bundleId: APPLE_CONFIG.bundleId,appAppleId: APPLE_CONFIG.appAppleId,
      data: [{ lastTransactions: [{ originalTransactionId: originalId,status: 1,signedTransactionInfo: APPLE_JWS.current,signedRenewalInfo: APPLE_JWS.renewal }] }] };
  } } };
}

test('Disabled deployment exposes no deletion and never contacts a database', async () => {
  const ctx = api({ disabled: true });
  const get = await ctx.route.GET(ctx.request());
  assert.deepEqual(await get.json(), { enabled: false });
  assert.equal((await ctx.route.DELETE(ctx.request())).status, 503);
  assert.equal(ctx.database.calls, 0);
});

test('Absent, foreign, opaque, misleading Origin and cross-site fetches are rejected before data access', async () => {
  for (const headers of [{ origin: null },{ origin: 'null' },{ origin: 'https://evil.example.invalid' },
    { origin: 'https://app.example.invalid.evil.invalid' },{ origin: 'https://app.example.invalid/path' },
    { origin: 'https://name@app.example.invalid' },{ 'sec-fetch-site': 'cross-site' }]) {
    const ctx = api(); assert.equal((await ctx.route.DELETE(ctx.request({ headers }))).status, 403);
    assert.equal(ctx.database.calls, 0);
  }
});

test('Unsigned and old authenticated sessions cannot reach a deletion RPC', async () => {
  for (const options of [{ unsigned: true },{ old: true }]) {
    const ctx = api(options); const response = await ctx.route.DELETE(ctx.request());
    assert.equal(response.status, 401); assert.equal(ctx.database.rpcCalls, 0);
    assert.equal(ctx.database.calls, 0);
  }
});

test('Body must contain exactly the typed confirmation and explicit subscription acknowledgement', async () => {
  const values = [{},{ confirmation: 'KONTO LÖSCHEN', acknowledgeSubscriptions: false },
    { confirmation: 'konto löschen', acknowledgeSubscriptions: true },
    { confirmation: 'KONTO LÖSCHEN', acknowledgeSubscriptions: true, email: OTHER },[],null];
  for (const value of values) {
    const ctx = api(); const response = await ctx.route.DELETE(ctx.request({ body: JSON.stringify(value) }));
    assert.equal(response.status, 400); assert.equal(ctx.database.calls, 0);
  }
  const ctx = api(); assert.equal((await ctx.route.DELETE(ctx.request({ body: '{' }))).status, 400);
  assert.equal((await ctx.route.DELETE(ctx.request({ body: 'x'.repeat(2049) }))).status, 413);
  assert.equal((await ctx.route.DELETE(ctx.request({ headers: { 'content-type': 'text/plain' } }))).status, 415);
});

test('Account generation is validated against the current profile before mutation', async () => {
  await fixture(); const ctx = api({ wrongGeneration: true });
  assert.equal((await ctx.route.DELETE(ctx.request())).status, 401); assert.equal(ctx.database.rpcCalls, 0);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile')).rows[0].count, 2);
});

test('Successful API deletion atomically removes personal data, preserves other accounts, and expires all identity cookies', async () => {
  await fixture(); const ownApple = await seedApple();
  const otherApple = await seedApple(OTHER,OTHER_GENERATION,'2234567890','2234567891');
  const dependencies = await seedDeletionDependencies(); const ctx = api();
  const response = await ctx.route.DELETE(ctx.request());
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { deleted: true });
  const cookies = response.headers.get('set-cookie');
  for (const name of ['jl_account_session','jl_session','jl_paid','jl_email','jl_admin']) assert.ok(cookies.includes(`${name}=;`));
  assert.match(cookies, /Max-Age=0/); assert.match(cookies, /HttpOnly/); assert.match(cookies, /Secure/);
  for (const table of ['userprofile','login_codes','course_progress','activity_results','quiz_identities','ranked_quiz_rounds','verified_quiz_scores','community_profiles','community_events']) {
    const column = ['userprofile','login_codes'].includes(table) ? 'email' : 'account_email';
    assert.equal((await pg.query(`SELECT count(*)::integer AS count FROM public.${table} WHERE ${column}=$1`, [EMAIL])).rows[0].count, 0, table);
  }
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.push_tokens WHERE account_email=$1', [EMAIL])).rows[0].count, 0);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.community_reports')).rows[0].count, 0);
  const own = (await pg.query('SELECT * FROM public.community_posts WHERE id=$1',[POST])).rows[0];
  assert.equal(own.account_email,null); assert.equal(own.status,'deleted'); assert.equal(own.body,'Inhalt entfernt.');
  assert.equal((await pg.query('SELECT body FROM public.community_posts WHERE parent_id=$1 AND account_email=$2',[POST,OTHER])).rows[0].body,'Keep this reply');
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile WHERE email=$1',[OTHER])).rows[0].count,1);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.course_progress WHERE account_email=$1',[OTHER])).rows[0].count,1);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.paypal_subscriptions WHERE subscription_id=$1',[SUBSCRIPTION])).rows[0].count,0);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.paypal_subscription_payments WHERE subscription_id=$1',[SUBSCRIPTION])).rows[0].count,0);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.paypal_checkout_requests WHERE account_generation=$1',[GENERATION])).rows[0].count,0);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.paypal_subscriptions WHERE subscription_id=$1',[OTHER_SUBSCRIPTION])).rows[0].count,1);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.paypal_subscription_payments WHERE subscription_id=$1',[OTHER_SUBSCRIPTION])).rows[0].count,1);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.paypal_checkout_requests WHERE account_generation=$1',[OTHER_GENERATION])).rows[0].count,1);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.apple_account_tokens WHERE app_account_token=$1',[ownApple.owner.app_account_token])).rows[0].count,0);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.apple_account_tokens WHERE app_account_token=$1',[otherApple.owner.app_account_token])).rows[0].count,1);
  for (const table of ['apple_subscriptions','apple_subscription_transactions','apple_subscription_notifications']) {
    assert.equal((await pg.query(`SELECT count(*)::integer AS count FROM public.${table} WHERE original_transaction_id=$1`,[ownApple.record.original_transaction_id])).rows[0].count,0,table);
    assert.equal((await pg.query(`SELECT count(*)::integer AS count FROM public.${table} WHERE original_transaction_id=$1`,[otherApple.record.original_transaction_id])).rows[0].count,1,table);
  }
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.community_blocks WHERE blocker_email=$1 OR blocked_email=$1',[EMAIL])).rows[0].count,0);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.community_blocks WHERE id=$1',[dependencies.otherBlock.id])).rows[0].count,1);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.apple_review_login_limits WHERE account_generation=$1',[GENERATION])).rows[0].count,0);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.apple_review_login_limits WHERE account_generation=$1',[OTHER_GENERATION])).rows[0].count,2);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile WHERE email=$1',[dependencies.thirdEmail])).rows[0].count,1);
});

test('PayPal contracts, payments and checkout requests are removed; late old-generation snapshots cannot recreate them', async () => {
  await fixture(); await pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.paypal_subscriptions WHERE subscription_id=$1',[SUBSCRIPTION])).rows[0].count,0);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.paypal_subscription_payments WHERE subscription_id=$1',[SUBSCRIPTION])).rows[0].count,0);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.paypal_checkout_requests WHERE account_generation=$1',[GENERATION])).rows[0].count,0);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile WHERE email=$1',[EMAIL])).rows[0].count,0);
  const oldSnapshot = { subscription_id:SUBSCRIPTION,account_email:EMAIL,account_generation:GENERATION,plan_id:PLAN,status:'ACTIVE',observed_at:new Date().toISOString(),payments:[] };
  await assert.rejects(pg.query('SELECT public.apply_paypal_subscription_snapshot($1::jsonb)',[JSON.stringify(oldSnapshot)]),/JL_PAYPAL_BINDING_MISSING/);
  await recreateAccount();
  await assert.rejects(pg.query('SELECT public.apply_paypal_subscription_snapshot($1::jsonb)',[JSON.stringify(oldSnapshot)]),/JL_PAYPAL_BINDING_MISSING/);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.paypal_subscriptions WHERE subscription_id=$1',[SUBSCRIPTION])).rows[0].count,0);
  try {
    await pg.exec('SET ROLE service_role');
    await assert.rejects(pg.query('SELECT public.ensure_paypal_account_profile($1,$2)',[SUBSCRIPTION,EMAIL]),/permission denied/);
  } finally { await pg.exec('RESET ROLE'); }
});

test('Explicit same-email registration gets a new generation that old deletion and session requests cannot remove', async () => {
  await fixture(); await pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]);
  const generation = await recreateAccount();
  assert.notEqual(generation,GENERATION);
  await assert.rejects(pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]),/JL_DELETE_ACCOUNT_MISSING/);
  const ctx = api(); assert.equal((await ctx.route.DELETE(ctx.request())).status,401);
});

test('Unknown cascading dependencies abort with a full rollback instead of deleting unreviewed data', async () => {
  await fixture(); await pg.exec('CREATE TABLE public.unreviewed_account_notes(user_id uuid REFERENCES public.userprofile(user_id) ON DELETE CASCADE,note text);');
  try {
    await pg.query('INSERT INTO public.unreviewed_account_notes SELECT user_id,\'Do not delete\' FROM public.userprofile WHERE email=$1',[EMAIL]);
    await assert.rejects(pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]),/unreviewed account dependency/);
    assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.unreviewed_account_notes')).rows[0].count,1);
    assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.course_progress WHERE account_email=$1',[EMAIL])).rows[0].count,1);
    assert.equal((await pg.query('SELECT account_email FROM public.paypal_subscriptions WHERE subscription_id=$1',[SUBSCRIPTION])).rows[0].account_email,EMAIL);
  } finally { await pg.exec('DROP TABLE public.unreviewed_account_notes'); }
});

test('An unknown cascade from trigger-cleaned community blocks aborts before any account or provider data is removed', async () => {
  await fixture(); const ownApple = await seedApple(); const dependencies = await seedDeletionDependencies();
  await pg.exec('CREATE TABLE public.unreviewed_block_notes(block_id uuid REFERENCES public.community_blocks(id) ON DELETE CASCADE,note text)');
  try {
    await pg.query('INSERT INTO public.unreviewed_block_notes VALUES($1,\'Preserve this unrelated dependency\')',[dependencies.ownBlock.id]);
    await assert.rejects(pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]),/unreviewed account dependency/);
    assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.unreviewed_block_notes')).rows[0].count,1);
    assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.community_blocks WHERE id=$1',[dependencies.ownBlock.id])).rows[0].count,1);
    assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile WHERE email=$1',[EMAIL])).rows[0].count,1);
    assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.paypal_subscription_payments WHERE subscription_id=$1',[SUBSCRIPTION])).rows[0].count,1);
    assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.apple_account_tokens WHERE app_account_token=$1',[ownApple.owner.app_account_token])).rows[0].count,1);
    assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.apple_review_login_limits WHERE account_generation=$1',[GENERATION])).rows[0].count,2);
  } finally { await pg.exec('DROP TABLE public.unreviewed_block_notes'); }
});

test('In-flight writes after profile removal fail instead of recreating progress, community profile or login code', async () => {
  await fixture(); await pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]);
  await assert.rejects(pg.query('INSERT INTO public.course_progress(account_email,course_id,status,answered_questions,total_questions,score) VALUES($1,\'late\',\'in_progress\',1,2,1)',[EMAIL]),/JL_ACCOUNT_OWNER_MISSING/);
  await assert.rejects(pg.query('INSERT INTO public.community_profiles(account_email,display_name,rules_version) VALUES($1,\'Late Profile\',\'test\')',[EMAIL]),/JL_ACCOUNT_OWNER_MISSING/);
  await assert.rejects(pg.query('INSERT INTO public.login_codes VALUES($1,\'late\',now()+interval\'10minutes\',0,now())',[EMAIL]),/JL_ACCOUNT_OWNER_MISSING/);
});

test('Deletion function is service-only and migration is repeatable without deleting accounts', async () => {
  await fixture(); await pg.exec(migration());
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile')).rows[0].count,2);
  assert.equal((await pg.query("SELECT has_function_privilege('anon','public.delete_jagdlatein_account(text,uuid)','EXECUTE') AS allowed")).rows[0].allowed,false);
  assert.equal((await pg.query("SELECT has_function_privilege('authenticated','public.delete_jagdlatein_account(text,uuid)','EXECUTE') AS allowed")).rows[0].allowed,false);
  assert.equal((await pg.query("SELECT has_function_privilege('service_role','public.delete_jagdlatein_account(text,uuid)','EXECUTE') AS allowed")).rows[0].allowed,true);
  assert.equal((await pg.query("SELECT has_function_privilege('service_role','public.require_complete_account_deletion_dependencies()','EXECUTE') AS allowed")).rows[0].allowed,false);
  for (const table of ['paypal_subscriptions','paypal_subscription_payments','paypal_checkout_requests','apple_account_tokens','apple_subscriptions','apple_subscription_transactions','apple_subscription_notifications']) {
    assert.equal((await pg.query(`SELECT has_table_privilege('service_role','public.${table}','DELETE') AS allowed`)).rows[0].allowed,false,table);
  }
});

test('Legacy cleanup removes only explicit provider deletion markers and refuses unknown provider dependencies', async () => {
  await fixture(); const currentApple = await seedApple();
  const legacyEmail = 'previously-removed@example.invalid', legacyGeneration = '55555555-5555-4555-8555-555555555555';
  await pg.query('INSERT INTO public.userprofile(user_id,email,account_generation) VALUES(gen_random_uuid(),$1,$2)',[legacyEmail,legacyGeneration]);
  const legacyApple = await seedApple(legacyEmail,legacyGeneration,'3234567890','3234567891');
  await pg.query('SELECT public.detach_apple_account($1,$2)',[legacyEmail,legacyGeneration]);
  await pg.query('DELETE FROM public.userprofile WHERE account_generation=$1',[legacyGeneration]);
  // Recreate only the documented pre-second-migration schema state in this
  // isolated database. Active rows remain bound to their real fixture profiles.
  await pg.exec('ALTER TABLE public.paypal_subscriptions ALTER COLUMN account_generation DROP NOT NULL');
  await pg.query('INSERT INTO public.paypal_subscriptions(subscription_id,account_email,account_generation,account_deleted_at,plan_id,status,verified_at) VALUES(\'I-LEGACYDELETE123\',\'old-marker@deleted.invalid\',NULL,now(),$1,\'CANCELLED\',now())',[PLAN]);
  await pg.exec("INSERT INTO public.paypal_subscription_payments(subscription_id,payment_id,status,observed_at) VALUES('I-LEGACYDELETE123','LEGACY-PAYMENT123','REFUNDED',now())");
  await pg.exec('CREATE TABLE public.unreviewed_provider_notes(token uuid REFERENCES public.apple_account_tokens(app_account_token) ON DELETE CASCADE,note text)');
  try {
    await pg.query('INSERT INTO public.unreviewed_provider_notes VALUES($1,\'Preserve this unknown dependency\')',[legacyApple.owner.app_account_token]);
    await assert.rejects(pg.exec(migration()),/unreviewed account dependency/);
    await pg.exec('ROLLBACK');
    assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.apple_account_tokens WHERE app_account_token=$1',[legacyApple.owner.app_account_token])).rows[0].count,1);
    assert.equal((await pg.query("SELECT count(*)::integer AS count FROM public.paypal_subscriptions WHERE account_deleted_at IS NOT NULL")).rows[0].count,1);
    await assert.rejects(pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]),/unreviewed account dependency/);
    assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile WHERE email=$1',[EMAIL])).rows[0].count,1);
  } finally { await pg.exec('DROP TABLE public.unreviewed_provider_notes'); }
  await pg.exec(migration());
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.paypal_subscriptions WHERE account_deleted_at IS NOT NULL')).rows[0].count,0);
  assert.equal((await pg.query("SELECT count(*)::integer AS count FROM public.paypal_subscription_payments WHERE subscription_id='I-LEGACYDELETE123'")).rows[0].count,0);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.apple_account_tokens WHERE deleted_at IS NOT NULL')).rows[0].count,0);
  for (const table of ['apple_subscriptions','apple_subscription_transactions','apple_subscription_notifications']) {
    assert.equal((await pg.query(`SELECT count(*)::integer AS count FROM public.${table} WHERE original_transaction_id=$1`,[legacyApple.record.original_transaction_id])).rows[0].count,0,table);
    assert.equal((await pg.query(`SELECT count(*)::integer AS count FROM public.${table} WHERE original_transaction_id=$1`,[currentApple.record.original_transaction_id])).rows[0].count,1,table);
  }
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.paypal_subscriptions')).rows[0].count,2);
  assert.equal((await pg.query("SELECT attnotnull FROM pg_attribute WHERE attrelid='public.paypal_subscriptions'::regclass AND attname='account_generation'")).rows[0].attnotnull,true);
  await pg.exec(migration());
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.apple_account_tokens')).rows[0].count,1);
});

test('Service-only Apple application locks the live profile without granting general profile update rights', async () => {
  await fixture(); const original = await seedApple();
  assert.equal((await pg.query("SELECT has_table_privilege('service_role','public.userprofile','UPDATE') AS allowed")).rows[0].allowed,false);
  for (const role of ['anon','authenticated']) {
    assert.equal((await pg.query(`SELECT has_function_privilege('${role}','public.apply_apple_subscription_snapshot(jsonb)','EXECUTE') AS allowed`)).rows[0].allowed,false);
  }
  try {
    await pg.exec('SET ROLE service_role');
    const applied = (await pg.query('SELECT public.apply_apple_subscription_snapshot($1::jsonb) AS data',[JSON.stringify(original.snapshot)])).rows[0].data;
    assert.equal(applied.app_account_token,original.owner.app_account_token);
    await assert.rejects(pg.query('UPDATE public.userprofile SET is_admin=true WHERE email=$1',[EMAIL]),/permission denied/);
  } finally { await pg.exec('RESET ROLE'); }
  await pg.query('SELECT public.detach_apple_account($1,$2)',[EMAIL,GENERATION]);
  await assert.rejects(pg.query('SELECT public.apply_apple_subscription_snapshot($1::jsonb)',[JSON.stringify(original.snapshot)]),/JL_APPLE_ACCOUNT/);
  await assert.rejects(pg.query('SELECT public.apply_apple_subscription_snapshot($1::jsonb)',[JSON.stringify({ ...original.snapshot,account_email: null })]),/JL_APPLE_ACCOUNT/);
  // Remove this intentionally staged legacy marker before the next fixture.
  await pg.exec(migration());
});

test('Old server actor headers cannot write into an account recreated with the same email', async () => {
  await fixture(); await pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]);
  await recreateAccount();
  await pg.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({ 'x-jagdlatein-account-email':EMAIL,'x-jagdlatein-account-generation':GENERATION })]);
  try {
    await assert.rejects(pg.query('INSERT INTO public.course_progress(account_email,course_id,status,answered_questions,total_questions,score) VALUES($1,\'late\',\'in_progress\',1,2,1)',[EMAIL]),/JL_ACCOUNT_GENERATION_MISMATCH/);
    await assert.rejects(pg.query('INSERT INTO public.community_profiles(account_email,display_name,rules_version) VALUES($1,\'Late Profile\',\'test\')',[EMAIL]),/JL_ACCOUNT_GENERATION_MISMATCH/);
    await assert.rejects(pg.query('SELECT public.get_activity_statistics($1)',[EMAIL]),/JL_ACCOUNT_GENERATION_MISMATCH/);
    await assert.rejects(pg.query('SELECT public.community_read($1,\'posts\',\'{}\')',[EMAIL]),/JL_ACCOUNT_GENERATION_MISMATCH/);
    await assert.rejects(pg.query('SELECT public.read_ranked_quiz($1,$2)',[EMAIL,POST]),/JL_ACCOUNT_GENERATION_MISMATCH/);
    for (const rpc of ['get_current_course_progress','get_current_quiz_identity','get_current_quiz_score']) {
      await assert.rejects(pg.query(`SELECT public.${rpc}($1)`,[EMAIL]),/JL_ACCOUNT_GENERATION_MISMATCH/);
    }
  } finally { await pg.query("SELECT set_config('request.headers','',false)"); }
});

test('Current actor generation may read its own RPC data and mutate another owner only with its existing application rights', async () => {
  await fixture();
  await pg.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({ 'x-jagdlatein-account-email':EMAIL,'x-jagdlatein-account-generation':GENERATION })]);
  try {
    const stats = (await pg.query('SELECT public.get_activity_statistics($1) AS data',[EMAIL])).rows[0].data;
    assert.equal(stats.ansitz.rounds,1);
    const community = (await pg.query('SELECT public.community_read($1,\'posts\',\'{}\') AS data',[EMAIL])).rows[0].data;
    assert.equal(community.total,2);
    await assert.rejects(pg.query('SELECT public.get_activity_statistics($1)',[OTHER]),/JL_ACCOUNT_GENERATION_MISMATCH/);
    await pg.query('UPDATE public.community_posts SET moderated_by=NULL WHERE id=$1',[THREAD]);
  } finally { await pg.query("SELECT set_config('request.headers','',false)"); }
});

test('All four Apple ledger tables are purged and stale tokens or direct RPC snapshots cannot recreate them', async () => {
  await fixture(); const original = await seedApple();
  await pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]);
  for (const table of ['apple_account_tokens','apple_subscriptions','apple_subscription_transactions','apple_subscription_notifications']) {
    assert.equal((await pg.query(`SELECT count(*)::integer AS count FROM public.${table}`)).rows[0].count,0,table);
  }
  await assert.rejects(pg.query('SELECT public.ensure_apple_account_token($1,$2)',[EMAIL,GENERATION]),/JL_APPLE_ACCOUNT/);
  await assert.rejects(pg.query('SELECT public.apply_apple_subscription_snapshot($1::jsonb)',[JSON.stringify(original.snapshot)]),/JL_APPLE_ACCOUNT/);
  await recreateAccount();
  const next = (await pg.query('SELECT public.ensure_apple_account_token($1,account_generation) AS token FROM public.userprofile WHERE email=$1',[EMAIL])).rows[0].token;
  assert.notEqual(next.app_account_token,original.owner.app_account_token);
  assert.notEqual(next.account_generation,GENERATION);
  await assert.rejects(pg.query('SELECT public.apply_apple_subscription_snapshot($1::jsonb)',[JSON.stringify(original.snapshot)]),/JL_APPLE_ACCOUNT/);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.apple_subscriptions')).rows[0].count,0);
});

test('Exact old Apple receipts and ordinary notifications fail closed after complete purge and same-email registration', async () => {
  await fixture(); const original = await seedApple(); const lib = api().load('lib/apple-subscriptions.js');
  await pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]);
  const generation = await recreateAccount();
  await pg.query('SELECT public.ensure_apple_account_token($1,$2)',[EMAIL,generation]);
  const data = appleDatabase(), provider = appleProvider(original.record);
  const options = { database: data.database,config: APPLE_CONFIG,nowMs: NOW,reviewPolicy: null,...provider };
  await assert.rejects(lib.applyVerifiedAppleTransaction(APPLE_JWS.device,EMAIL,generation,options),error => error.status === 403);
  await assert.rejects(lib.applyVerifiedAppleNotification(APPLE_JWS.notification,options),error => error.status === 403);
  assert.equal(provider.calls.api,0); assert.equal(data.calls.snapshots,0);
  for (const table of ['apple_subscriptions','apple_subscription_transactions','apple_subscription_notifications']) {
    assert.equal((await pg.query(`SELECT count(*)::integer AS count FROM public.${table}`)).rows[0].count,0,table);
  }
});

test('An Apple provider response arriving after deletion cannot write the old generation into a recreated account', async () => {
  await fixture(); const original = await seedApple(); const lib = api().load('lib/apple-subscriptions.js');
  const data = appleDatabase();
  const provider = appleProvider(original.record,async () => {
    await pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]);
    await recreateAccount();
  });
  await assert.rejects(lib.applyVerifiedAppleTransaction(APPLE_JWS.device,EMAIL,GENERATION,
    { database: data.database,config: APPLE_CONFIG,nowMs: NOW,reviewPolicy: null,...provider }),error => error.status === 403);
  assert.equal(provider.calls.api,1); assert.equal(data.calls.snapshots,1);
  for (const table of ['apple_account_tokens','apple_subscriptions','apple_subscription_transactions','apple_subscription_notifications']) {
    assert.equal((await pg.query(`SELECT count(*)::integer AS count FROM public.${table}`)).rows[0].count,0,table);
  }
});

test('A verified new current Apple token can bind a fresh ledger after purge; historical original-ID memory is not retained', async () => {
  await fixture(); const original = await seedApple(); const lib = api().load('lib/apple-subscriptions.js');
  await pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]);
  const generation = await recreateAccount();
  const next = (await pg.query('SELECT public.ensure_apple_account_token($1,$2) AS data',[EMAIL,generation])).rows[0].data;
  const provider = appleProvider({ ...original.record,app_account_token: next.app_account_token }); const data = appleDatabase();
  const access = await lib.applyVerifiedAppleTransaction(APPLE_JWS.device,EMAIL,generation,
    { database: data.database,config: APPLE_CONFIG,nowMs: NOW,reviewPolicy: null,...provider });
  assert.equal(access.paid,true);
  const bound = (await pg.query('SELECT app_account_token FROM public.apple_subscriptions WHERE original_transaction_id=$1',[original.record.original_transaction_id])).rows[0];
  assert.equal(bound.app_account_token,next.app_account_token); assert.notEqual(bound.app_account_token,original.owner.app_account_token);
});

test('An exact purged review token may relay, but the generation-bound receiver cannot recreate its deleted account', async () => {
  await fixture(); const original = await seedApple(); const lib = api().load('lib/apple-subscriptions.js');
  await pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]);
  const data = appleDatabase(), sender = appleProvider(original.record), receiver = appleProvider(original.record);
  const policy = { appAccountToken: original.owner.app_account_token,accountGeneration: GENERATION,validFrom: NOW - 1000,validUntil: NOW + 120000 };
  let forwarded = 0;
  const fetcher = async (url,options) => {
    forwarded++; assert.equal(url,'https://jagdlatein.de/api/apple/review-notifications'); assert.equal(options.credentials,'omit');
    assert.equal(JSON.parse(options.body).signedPayload,APPLE_JWS.notification);
    try {
      const result = await lib.applyVerifiedAppleReviewNotification(APPLE_JWS.notification,
        { database: data.database,config: { ...APPLE_CONFIG,environment: 'Production' },nowMs: NOW,reviewPolicy: policy,...receiver });
      return Response.json(result);
    } catch (error) { assert.equal(error.status,403); return lib.appleErrorResponse(error); }
  };
  await assert.rejects(lib.applyVerifiedAppleNotification(APPLE_JWS.notification,
    { database: data.database,config: APPLE_CONFIG,nowMs: NOW,reviewPolicy: policy,...sender,reviewDependencies: { fetcher } }),error => error.status === 503);
  assert.equal(forwarded,1); assert.equal(sender.calls.api,0); assert.equal(receiver.calls.api,0); assert.equal(data.calls.snapshots,0);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile WHERE email=$1',[EMAIL])).rows[0].count,0);
  for (const table of ['apple_account_tokens','apple_subscriptions','apple_subscription_transactions','apple_subscription_notifications']) {
    assert.equal((await pg.query(`SELECT count(*)::integer AS count FROM public.${table}`)).rows[0].count,0,table);
  }
});

test('A stale generation cannot write quiz or community data after same-email recreation', async () => {
  await fixture(); await pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]);
  await recreateAccount();
  await pg.query('INSERT INTO public.quiz_identities(account_email,username,country) VALUES($1,\'new-identity\',\'DE\')',[EMAIL]);
  await pg.query('INSERT INTO public.community_profiles(account_email,display_name,rules_version) VALUES($1,\'New Name\',\'test\')',[EMAIL]);
  await pg.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({ 'x-jagdlatein-account-email':EMAIL,'x-jagdlatein-account-generation':GENERATION })]);
  try {
    for (const statement of [
      'INSERT INTO public.ranked_quiz_rounds VALUES(gen_random_uuid(),$1,\'{}\',now())',
      'INSERT INTO public.verified_quiz_scores VALUES($1,\'new-identity\',\'DE\',100,1,now())',
      'INSERT INTO public.community_events(account_email,action) VALUES($1,\'reply\')',
      'INSERT INTO public.community_posts(account_email,category,kind,title,body) VALUES($1,\'allgemein\',\'question\',\'Late private title\',\'Late private content\')',
      'INSERT INTO public.community_reports(post_id,reporter_email,reason) VALUES(\'44444444-4444-4444-8444-444444444444\',$1,\'Late report\')',
      'INSERT INTO public.push_tokens(token,enabled,account_email) VALUES(\'late-device\',true,$1)',
    ]) await assert.rejects(pg.query(statement,[EMAIL]),/JL_ACCOUNT_GENERATION_MISMATCH/);
  } finally { await pg.query("SELECT set_config('request.headers','',false)"); }
});

test('A pending registration challenge is removed so its old verified request cannot recreate the deleted account', async () => {
  await fixture();
  const codeHash = '$2a$10$' + 'A'.repeat(53);
  const reserve = (await pg.query('SELECT public.reserve_account_registration_code($1,$2) AS data',[EMAIL,codeHash])).rows[0].data;
  assert.equal(reserve.reserved,true);
  const challenge = (await pg.query('SELECT * FROM public.account_registration_codes WHERE email=$1',[EMAIL])).rows[0];
  assert.equal((await pg.query('SELECT public.begin_account_registration_attempt($1) AS data',[EMAIL])).rows[0].data.valid,true);
  await pg.query('SELECT public.delete_jagdlatein_account($1,$2)',[EMAIL,GENERATION]);
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.account_registration_codes WHERE email=$1',[EMAIL])).rows[0].count,0);
  assert.deepEqual((await pg.query('SELECT public.consume_account_registration_code($1,$2,$3) AS data',[EMAIL,challenge.registration_id,codeHash])).rows[0].data,{ consumed:false });
  assert.equal((await pg.query('SELECT count(*)::integer AS count FROM public.userprofile WHERE email=$1',[EMAIL])).rows[0].count,0);
});

test('Generation-guarded personal read RPCs expose only the account fields and preserve latest-course ordering', async () => {
  await fixture();
  await pg.query('INSERT INTO public.course_progress(account_email,course_id,status,answered_questions,total_questions,score) VALUES($1,\'later-course\',\'in_progress\',1,3,1)',[EMAIL]);
  await pg.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({ 'x-jagdlatein-account-email':EMAIL,'x-jagdlatein-account-generation':GENERATION })]);
  try {
    const progress = (await pg.query('SELECT public.get_current_course_progress($1) AS data',[EMAIL])).rows[0].data;
    assert.equal(progress.length,2); assert.equal(progress[0].course_id,'later-course');
    assert.deepEqual(Object.keys(progress[0]).sort(),['course_id','status','answered_questions','total_questions','score','best_score','completed_at','updated_at'].sort());
    assert.equal(progress.some(entry => Object.hasOwn(entry,'account_email')),false);
    const identity = (await pg.query('SELECT public.get_current_quiz_identity($1) AS data',[EMAIL])).rows[0].data;
    assert.deepEqual(identity,{ username:'remove-quiz',country:'DE' });
    const score = (await pg.query('SELECT public.get_current_quiz_score($1) AS data',[EMAIL])).rows[0].data;
    assert.equal(score.total_points,100); assert.equal(score.rounds,1);
    assert.deepEqual(Object.keys(score).sort(),['username','country','total_points','rounds','updated_at'].sort());
    for (const rpc of ['get_current_course_progress','get_current_quiz_identity','get_current_quiz_score']) {
      await assert.rejects(pg.query(`SELECT public.${rpc}($1)`,[OTHER]),/JL_ACCOUNT_GENERATION_MISMATCH/);
      assert.equal((await pg.query(`SELECT has_function_privilege('anon','public.${rpc}(text)','EXECUTE') AS allowed`)).rows[0].allowed,false);
      assert.equal((await pg.query(`SELECT has_function_privilege('authenticated','public.${rpc}(text)','EXECUTE') AS allowed`)).rows[0].allowed,false);
      assert.equal((await pg.query(`SELECT has_function_privilege('service_role','public.${rpc}(text)','EXECUTE') AS allowed`)).rows[0].allowed,true);
    }
  } finally { await pg.query("SELECT set_config('request.headers','',false)"); }
  await pg.query("SELECT set_config('request.headers',$1,false)",[JSON.stringify({ 'x-jagdlatein-account-email':OTHER,'x-jagdlatein-account-generation':OTHER_GENERATION })]);
  try {
    assert.equal((await pg.query('SELECT public.get_current_quiz_identity($1) AS data',[OTHER])).rows[0].data,null);
    assert.equal((await pg.query('SELECT public.get_current_quiz_score($1) AS data',[OTHER])).rows[0].data,null);
  } finally { await pg.query("SELECT set_config('request.headers','',false)"); }
});
