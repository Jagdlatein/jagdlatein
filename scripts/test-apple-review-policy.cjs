// All identities/provider responses are synthetic. PGlite executes the actual
// local ledger migrations; no Apple, email, HTTP or remote database is contacted.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const { VerificationStatus } = pr('@apple/app-store-server-library');
const DAY = 86400000;
const EMAIL = 'store-review@example.invalid';
const GENERATION = '74a76587-e13c-41df-bb9b-8bc079303dd1';
const NEXT_GENERATION = '0f258a91-d433-4e64-96ed-7c199e647cb9';
const TOKEN = 'e52e2fbe-d0fc-4b13-8cfa-c83edaa67345';
const FOREIGN_TOKEN = 'd1a5f7ef-798c-41f7-9a47-b2fbc08de4b4';
const PRODUCT = 'de.jagdlatein.premium.monthly';
const PRODUCTION = { environment: 'Production', bundleId: 'de.jagdlatein.app', appAppleId: 6819820561, productIds: [PRODUCT] };
const SANDBOX = { ...PRODUCTION, environment: 'Sandbox' };
const JWS = { device: 'e30.ZGV2aWNl.c2ln', current: 'e30.Y3VycmVudA.c2ln',
  event: 'e30.ZXZlbnQ.c2ln', renewal: 'e30.cmVuZXdhbA.c2ln', notification: 'e30.bm90aWNl.c2ln' };
const FIXED_REVIEW_URL = 'https://jagdlatein.de/api/apple/review-notifications';

function load(relative, env = {}, overrides = {}, globals = {}) {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename,
    jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  const module = { exports: {} };
  const localRequire = id => {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename),
      id.endsWith('.json') ? id : `${id}.js`)), env, overrides, globals);
    return pr(id);
  };
  const blockedFetch = async () => { throw new Error('An offline test attempted a real network request'); };
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {
    process: { env }, Buffer, Date, Response, URL, Headers, AbortController, AbortSignal,
    fetch: blockedFetch, console, ...globals,
  })(localRequire, module, module.exports);
  return module.exports;
}
const policyLib = load('lib/apple-review-policy.js');
const lib = load('lib/apple-subscriptions.js');
const plain = value => JSON.parse(JSON.stringify(value));
const policy = (now, token = TOKEN, generation = GENERATION, changes = {}) => Object.freeze({
  accountGeneration: generation, appAccountToken: token, validFrom: now - 1000, validUntil: now + 120000, ...changes,
});
const policyEnv = (now, changes = {}) => ({ APPLE_REVIEW_SANDBOX_ENABLED: 'true', ACCOUNT_GENERATION_ENABLED: 'true',
  APPLE_SUBSCRIPTIONS_ENABLED: 'true', APPLE_STORE_ENVIRONMENT: 'Production',
  APPLE_REVIEW_ACCOUNT_GENERATION: GENERATION, APPLE_REVIEW_APP_ACCOUNT_TOKEN: TOKEN,
  APPLE_REVIEW_VALID_FROM: new Date(now - 1000).toISOString(),
  APPLE_REVIEW_VALID_UNTIL: new Date(now + 120000).toISOString(), ...changes });
const transaction = (now, changes = {}) => ({ bundleId: SANDBOX.bundleId, environment: 'Sandbox',
  productId: PRODUCT, type: 'Auto-Renewable Subscription', inAppOwnershipType: 'PURCHASED', quantity: 1,
  transactionId: '20000001', originalTransactionId: '10000001', appAccountToken: TOKEN,
  purchaseDate: now - DAY, expiresDate: now + DAY, signedDate: now, ...changes });

function apple({ now, device = transaction(now), current = device, event = current,
  environment = current.environment, status = 1, notice = {}, failSignature = false, failApi = false } = {}) {
  const calls = { transactions: 0, notifications: 0, renewal: 0, api: 0 };
  const verifier = {
    async verifyAndDecodeTransaction(signed) {
      calls.transactions++;
      if (failSignature) throw new Error('synthetic forged Apple signature');
      return signed === JWS.device ? device : signed === JWS.event ? event : current;
    },
    async verifyAndDecodeRenewalInfo() {
      calls.renewal++;
      return { environment, originalTransactionId: current.originalTransactionId, productId: current.productId,
        signedDate: current.signedDate, autoRenewStatus: 1, appAccountToken: current.appAccountToken };
    },
    async verifyAndDecodeNotification() {
      calls.notifications++;
      if (failSignature) throw new Error('synthetic forged Apple notification');
      return { notificationUUID: '386bf991-f1d3-4dde-8f6a-b957120c95b1', notificationType: 'DID_RENEW',
        version: '2.0', signedDate: now,
        data: { environment, bundleId: SANDBOX.bundleId, appAppleId: SANDBOX.appAppleId,
          signedTransactionInfo: JWS.event }, ...notice };
    },
  };
  const apiClient = { async getAllSubscriptionStatuses(originalId) {
    calls.api++;
    if (failApi) throw new Error('synthetic private provider failure');
    assert.equal(originalId, current.originalTransactionId);
    return { environment, bundleId: SANDBOX.bundleId, appAppleId: SANDBOX.appAppleId,
      data: [{ lastTransactions: [{ originalTransactionId: originalId, status,
        signedTransactionInfo: JWS.current, signedRenewalInfo: JWS.renewal }] }] };
  } };
  return { verifier, apiClient, calls };
}

function productionRejectsSandbox() {
  const calls = { transactions: 0, notifications: 0, api: 0 };
  const wrongEnvironment = () => Object.assign(new Error('synthetic environment mismatch'),
    { status: VerificationStatus.INVALID_ENVIRONMENT });
  return { calls, verifier: {
    async verifyAndDecodeTransaction() { calls.transactions++; throw wrongEnvironment(); },
    async verifyAndDecodeNotification() { calls.notifications++; throw wrongEnvironment(); },
  }, apiClient: { async getAllSubscriptionStatuses() { calls.api++; throw new Error('Production API must not see a review purchase'); } } };
}

const pglitePath = process.env.JL_APPLE_TEST_PGLITE_PATH || process.env.JL_PAYPAL_TEST_PGLITE_PATH ||
  path.join(process.env.LOCALAPPDATA || '', 'Jagdlatein/paypal-sandbox/test-runtime/node_modules/@electric-sql/pglite');
if (!fs.existsSync(path.join(pglitePath, 'package.json'))) throw new Error('Isolated PGlite runtime missing; these tests must not be skipped.');

async function ledger(t) {
  const { PGlite } = require(path.resolve(pglitePath)); const pg = new PGlite();
  t.after(() => pg.close());
  await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE TABLE public.userprofile(email text PRIMARY KEY);');
  for (const filename of ['20261007110000_apple_subscriptions.sql','20261008120000_apple_refund_ordering.sql'])
    await pg.exec(fs.readFileSync(path.join(root, 'supabase/migrations', filename), 'utf8'));
  await pg.query('INSERT INTO public.userprofile(email,account_generation) VALUES($1,$2)', [EMAIL, GENERATION]);
  const calls = { lookups: 0, reads: 0, snapshots: [] };
  const columns = { userprofile: new Set(['email']), apple_account_tokens: new Set(['app_account_token','account_email']),
    apple_subscriptions: new Set(['app_account_token','environment']) };
  const database = {
    from(table) {
      assert.ok(Object.hasOwn(columns, table)); const filters = [];
      const read = async () => {
        calls.reads++;
        const where = filters.map(([column], i) => `${column}=$${i + 1}`).join(' AND ');
        const result = await pg.query(`SELECT * FROM public.${table}${where ? ` WHERE ${where}` : ''}`, filters.map(([, value]) => value));
        return { data: plain(result.rows), error: null };
      };
      return { select() { return this; }, eq(column, value) { assert.ok(columns[table].has(column)); filters.push([column,value]); return this; },
        ilike(column,value) { assert.equal(table,'userprofile'); assert.equal(column,'email');
          filters.push([column,value.replace(/\\([\\%_])/g,'$1')]); return this; },
        async maybeSingle() { calls.lookups++; const result = await read(); assert.ok(result.data.length <= 1);
          return { data: result.data[0] || null, error: null }; },
        then(resolve,reject) { return read().then(resolve,reject); } };
    },
    async rpc(name,args) {
      if (name === 'ensure_apple_account_token') return { data: (await pg.query('SELECT public.ensure_apple_account_token($1,$2) AS v',
        [args.p_email,args.p_account_generation])).rows[0].v, error: null };
      assert.equal(name,'apply_apple_subscription_snapshot'); calls.snapshots.push(plain(args.p_snapshot));
      return { data: (await pg.query('SELECT public.apply_apple_subscription_snapshot($1::jsonb) AS v', [JSON.stringify(args.p_snapshot)])).rows[0].v, error: null };
    },
  };
  const token = await lib.ensureAppleAccountToken(database,EMAIL,GENERATION);
  return { database,pg,token,calls };
}

test('Review policy defaults off and cannot turn a stray configuration into public access', () => {
  const now = Date.now();
  assert.equal(policyLib.appleReviewPolicy({}),null);
  assert.equal(policyLib.appleReviewPolicy(policyEnv(now,{APPLE_REVIEW_SANDBOX_ENABLED:'false',APPLE_REVIEW_ACCOUNT_GENERATION:'bad'})),null);
  assert.equal(policyLib.isAppleReviewPolicyActive(null,now),false);
  assert.equal(policyLib.matchesAppleReviewBinding(null,{account_generation:GENERATION,app_account_token:TOKEN,deleted_at:null},now),false);
  assert.equal(policyLib.APPLE_REVIEW_NOTIFICATION_URL,FIXED_REVIEW_URL);
});

test('Private policy requires explicit account generations, safe deployment environment and canonical bounded UTC dates', () => {
  const now = Date.now(); const env = policyEnv(now);
  const good = policyLib.appleReviewPolicy(env);
  assert.deepEqual(plain(good),plain(policy(now)));
  assert.equal(Object.isFrozen(good),true);
  assert.equal(policyLib.appleReviewPolicy({...env,APPLE_REVIEW_ACCOUNT_GENERATION:GENERATION.toUpperCase(),APPLE_REVIEW_APP_ACCOUNT_TOKEN:TOKEN.toUpperCase()}).appAccountToken,TOKEN);
  assert.ok(policyLib.appleReviewPolicy({...env,APPLE_STORE_ENVIRONMENT:'Sandbox',JL_TEST_ENVIRONMENT:'paypal-sandbox'}));
  const invalid = [
    {APPLE_REVIEW_SANDBOX_ENABLED:'yes'}, {ACCOUNT_GENERATION_ENABLED:'false'}, {ACCOUNT_GENERATION_ENABLED:undefined},
    {APPLE_SUBSCRIPTIONS_ENABLED:'false'}, {APPLE_STORE_ENVIRONMENT:'LocalTesting'},
    {JL_TEST_ENVIRONMENT:'paypal-sandbox'}, {APPLE_STORE_ENVIRONMENT:'Sandbox'},
    {APPLE_STORE_ENVIRONMENT:'Sandbox',JL_TEST_ENVIRONMENT:'unknown'},
    {APPLE_REVIEW_ACCOUNT_GENERATION:'not-a-generation'}, {APPLE_REVIEW_APP_ACCOUNT_TOKEN:'not-a-token'},
    {APPLE_REVIEW_VALID_FROM:undefined}, {APPLE_REVIEW_VALID_UNTIL:'invalid'},
    {APPLE_REVIEW_VALID_FROM:'2026-10-08T12:00:00Z'},
    {APPLE_REVIEW_VALID_FROM:'2026-10-08T12:00:00+00:00'},
    {APPLE_REVIEW_VALID_UNTIL:env.APPLE_REVIEW_VALID_FROM},
    {APPLE_REVIEW_VALID_UNTIL:new Date(now-2000).toISOString()},
    {APPLE_REVIEW_VALID_UNTIL:new Date(now-1000+14*DAY+1).toISOString()},
  ];
  for (const change of invalid) assert.throws(() => policyLib.appleReviewPolicy({...env,...change}),error=>error.status===503);
  assert.ok(policyLib.appleReviewPolicy({...env,APPLE_REVIEW_VALID_UNTIL:new Date(now-1000+14*DAY).toISOString()}));
});

test('Review binding includes both immutable identifiers, deleted state and an exclusive expiry boundary', () => {
  const now=Date.now(); const reviewed=policy(now); const owner={account_generation:GENERATION,app_account_token:TOKEN,deleted_at:null};
  assert.equal(policyLib.matchesAppleReviewBinding(reviewed,owner,now),true);
  assert.equal(policyLib.isAppleReviewPolicyActive(reviewed,reviewed.validFrom),true);
  for (const time of [reviewed.validFrom-1,reviewed.validUntil,reviewed.validUntil+1,NaN,Infinity])
    assert.equal(policyLib.isAppleReviewPolicyActive(reviewed,time),false);
  for (const changed of [{account_generation:NEXT_GENERATION},{app_account_token:FOREIGN_TOKEN},
    {deleted_at:new Date(now).toISOString()},{deleted_at:undefined}])
    assert.equal(policyLib.matchesAppleReviewBinding(reviewed,{...owner,...changed},now),false);
  for (const changed of [{validUntil:reviewed.validFrom},{validUntil:reviewed.validFrom+14*DAY+1},
    {validFrom:-1},{accountGeneration:'bad'},{appAccountToken:'bad'}])
    assert.equal(policyLib.isAppleReviewPolicyActive({...reviewed,...changed},now),false);
});

test('Exact reviewed Sandbox restoration on Production uses signed evidence and actual SQL, clamps access and expires', async t => {
  const data=await ledger(t); const now=Date.now(); const reviewed=policy(now,data.token);
  const device=transaction(now,{appAccountToken:data.token,offerType:1,offerDiscountType:'FREE_TRIAL'});
  const sandbox=apple({now,device}); const normal=productionRejectsSandbox();
  const first=await lib.applyVerifiedAppleTransaction(JWS.device,EMAIL,GENERATION,{database:data.database,config:PRODUCTION,
    nowMs:now,reviewPolicy:reviewed,reviewDependencies:sandbox,...normal});
  assert.equal(first.paid,true); assert.equal(first.paidUntil,new Date(reviewed.validUntil).toISOString());
  assert.equal(first.accessType,'trial'); assert.equal(first.trialUntil,first.paidUntil);
  assert.equal(normal.calls.api,0); assert.equal(sandbox.calls.api,1);
  assert.equal(data.calls.snapshots[0].environment,'Sandbox');
  const stored=(await data.pg.query('SELECT environment,access_until FROM public.apple_subscriptions')).rows[0];
  assert.equal(stored.environment,'Sandbox');
  assert.equal(new Date(stored.access_until).getTime(),device.expiresDate,'Policy must not falsify signed provider expiry');
  const restored=await lib.applyVerifiedAppleTransaction(JWS.device,EMAIL,GENERATION,{database:data.database,config:PRODUCTION,
    nowMs:now+10,reviewPolicy:reviewed,reviewDependencies:apple({now:now+10,device,current:{...device,signedDate:now+10}}),...normal});
  assert.equal(restored.paid,true); assert.equal(restored.paidUntil,first.paidUntil);
  const refreshedProvider=apple({now:now+61000,device,current:{...device,signedDate:now+61000}});
  const refreshed=await lib.resolveAppleSubscriptionAccess(data.database,EMAIL,{config:PRODUCTION,nowMs:now+61000,
    reviewPolicy:reviewed,reviewDependencies:refreshedProvider,...normal});
  assert.equal(refreshedProvider.calls.api,1); assert.equal(refreshed.paid,true); assert.equal(refreshed.paidUntil,first.paidUntil);
  const before=data.calls.snapshots.length;
  assert.equal((await lib.resolveAppleSubscriptionAccess(data.database,EMAIL,{config:PRODUCTION,
    nowMs:reviewed.validUntil,refresh:false,reviewPolicy:reviewed,reviewDependencies:refreshedProvider,...normal})).paid,false);
  await assert.rejects(lib.applyVerifiedAppleTransaction(JWS.device,EMAIL,GENERATION,{database:data.database,config:PRODUCTION,
    nowMs:reviewed.validUntil,reviewPolicy:reviewed,reviewDependencies:sandbox,...normal}));
  assert.equal(data.calls.snapshots.length,before);
  assert.equal((await data.pg.query('SELECT count(*)::integer AS n FROM public.apple_subscriptions')).rows[0].n,1);
});

test('Ordinary Production purchases preserve their real deadline and never call review providers', async t => {
  const data=await ledger(t); const now=Date.now();
  const device=transaction(now,{appAccountToken:data.token,environment:'Production'}); const normal=apple({now,device});
  const review=apple({now,failApi:true,failSignature:true});
  const result=await lib.applyVerifiedAppleTransaction(JWS.device,EMAIL,GENERATION,{database:data.database,config:PRODUCTION,
    nowMs:now,reviewPolicy:policy(now,FOREIGN_TOKEN),reviewDependencies:review,...normal});
  assert.equal(result.paid,true); assert.equal(result.paidUntil,new Date(device.expiresDate).toISOString());
  assert.equal(normal.calls.api,1); assert.equal(review.calls.api,0); assert.equal(review.calls.transactions,0);
  assert.equal(data.calls.snapshots[0].environment,'Production');
});

test('Inactive or differently bound policies cannot grant Sandbox access or write a ledger', async t => {
  const data=await ledger(t); const now=Date.now(); const device=transaction(now,{appAccountToken:data.token});
  const normal=productionRejectsSandbox();
  for (const reviewed of [null,policy(now,FOREIGN_TOKEN),policy(now,data.token,NEXT_GENERATION),
    policy(now,data.token,GENERATION,{validFrom:now+60000}),policy(now,data.token,GENERATION,{validUntil:now})]) {
    const review=apple({now,device});
    await assert.rejects(lib.applyVerifiedAppleTransaction(JWS.device,EMAIL,GENERATION,{database:data.database,
      config:PRODUCTION,nowMs:now,reviewPolicy:reviewed,reviewDependencies:review,...normal}));
    assert.equal(review.calls.api,0); assert.equal(data.calls.snapshots.length,0);
  }
});

test('Review signature failures and provider outages stay fail closed with no writes', async t => {
  const data=await ledger(t); const now=Date.now(); const device=transaction(now,{appAccountToken:data.token});
  for (const change of [{failSignature:true},{failApi:true}]) {
    const review=apple({now,device,...change}); const normal=productionRejectsSandbox();
    await assert.rejects(lib.applyVerifiedAppleTransaction(JWS.device,EMAIL,GENERATION,{database:data.database,
      config:PRODUCTION,nowMs:now,reviewPolicy:policy(now,data.token),reviewDependencies:review,...normal}),
    error=>[400,503].includes(error.status));
    assert.equal(data.calls.snapshots.length,0);
    if (change.failSignature) assert.equal(review.calls.api,0);
  }
});

test('Deleted and same-email recreated accounts cannot inherit a reviewed token or generation', async t => {
  const data=await ledger(t); const now=Date.now(); const reviewed=policy(now,data.token);
  const oldDevice=transaction(now,{appAccountToken:data.token}); const normal=productionRejectsSandbox();
  await data.pg.query('SELECT public.detach_apple_account($1,$2)',[EMAIL,GENERATION]);
  await assert.rejects(lib.applyVerifiedAppleTransaction(JWS.device,EMAIL,GENERATION,{database:data.database,config:PRODUCTION,
    nowMs:now,reviewPolicy:reviewed,reviewDependencies:apple({now,device:oldDevice}),...normal}),error=>[400,403].includes(error.status));
  await data.pg.query('DELETE FROM public.userprofile WHERE email=$1',[EMAIL]);
  await data.pg.query('INSERT INTO public.userprofile(email,account_generation) VALUES($1,$2)',[EMAIL,NEXT_GENERATION]);
  const nextToken=await lib.ensureAppleAccountToken(data.database,EMAIL,NEXT_GENERATION);
  assert.notEqual(nextToken,data.token);
  const nextDevice=transaction(now,{appAccountToken:nextToken}); const review=apple({now,device:nextDevice});
  await assert.rejects(lib.applyVerifiedAppleTransaction(JWS.device,EMAIL,NEXT_GENERATION,{database:data.database,config:PRODUCTION,
    nowMs:now,reviewPolicy:reviewed,reviewDependencies:review,...normal}));
  assert.equal(review.calls.api,0); assert.equal(data.calls.snapshots.length,0);
});

test('Review account rechecks prevent a provider response from writing after same-email recreation', async t => {
  const data=await ledger(t); const now=Date.now(); const device=transaction(now,{appAccountToken:data.token});
  const review=apple({now,device}); const readStatus=review.apiClient.getAllSubscriptionStatuses.bind(review.apiClient);
  review.apiClient.getAllSubscriptionStatuses=async id=>{
    await data.pg.query('UPDATE public.userprofile SET account_generation=$1 WHERE email=$2',[NEXT_GENERATION,EMAIL]);
    return readStatus(id);
  };
  await assert.rejects(lib.applyVerifiedAppleTransaction(JWS.device,EMAIL,GENERATION,{database:data.database,config:PRODUCTION,
    nowMs:now,reviewPolicy:policy(now,data.token),reviewDependencies:review,...productionRejectsSandbox()}),error=>error.status===403);
  assert.equal(review.calls.api,1); assert.equal(data.calls.snapshots.length,0);
});

test('A provider response arriving after policy expiry cannot grant or write review access', async t => {
  const data=await ledger(t); const now=Date.now(); const device=transaction(now,{appAccountToken:data.token});
  let clockMs=now;
  class ReviewClock extends Date { static now(){return clockMs;} }
  const clockLib=load('lib/apple-subscriptions.js',{}, {},{Date:ReviewClock});
  const review=apple({now,device}); const readStatus=review.apiClient.getAllSubscriptionStatuses.bind(review.apiClient);
  review.apiClient.getAllSubscriptionStatuses=async id=>{
    clockMs+=1000;return readStatus(id);
  };
  await assert.rejects(clockLib.applyVerifiedAppleTransaction(JWS.device,EMAIL,GENERATION,{database:data.database,config:PRODUCTION,
    nowMs:now,reviewPolicy:policy(now,data.token,GENERATION,{validUntil:now+500}),
    reviewDependencies:review,...productionRejectsSandbox()}),error=>error.status===403);
  assert.equal(review.calls.api,1); assert.equal(data.calls.snapshots.length,0);
});

test('An active review window never extends signed expiry or bypasses current inactive and revoked statuses',async t=>{
  const data=await ledger(t);const now=Date.now();const reviewed=policy(now,data.token);
  const device=transaction(now,{appAccountToken:data.token,expiresDate:now+60000});
  const options={database:data.database,config:PRODUCTION,nowMs:now,reviewPolicy:reviewed,...productionRejectsSandbox()};
  const initial=await lib.applyVerifiedAppleTransaction(JWS.device,EMAIL,GENERATION,
    {...options,reviewDependencies:apple({now,device})});
  assert.equal(initial.paid,true);assert.equal(initial.paidUntil,new Date(device.expiresDate).toISOString());
  assert.equal((await lib.resolveAppleSubscriptionAccess(data.database,EMAIL,{config:PRODUCTION,refresh:false,
    nowMs:device.expiresDate,reviewPolicy:reviewed})).paid,false,'Policy eligibility is not a paid period');
  for(const status of [2,3,5]){
    const observed=now+status;
    const current={...device,signedDate:observed,...(status===5?{revocationDate:now-1000}:{})};
    const result=await lib.applyVerifiedAppleTransaction(JWS.device,EMAIL,GENERATION,
      {...options,nowMs:observed,reviewDependencies:apple({now:observed,device,current,status})});
    assert.equal(result.paid,false,`Review policy must not grant provider status ${status}`);
    assert.equal(result.paidUntil,null);
  }
});

test('The separate Production receiver verifies Sandbox evidence and binds it before the real SQL write', async t => {
  const data=await ledger(t); const now=Date.now(); const current=transaction(now,{appAccountToken:data.token});
  const review=apple({now,device:current});
  const result=await lib.applyVerifiedAppleReviewNotification(JWS.notification,{database:data.database,config:PRODUCTION,
    nowMs:now,reviewPolicy:policy(now,data.token),...review});
  assert.deepEqual(plain(result),{ok:true}); assert.equal(review.calls.api,1);
  assert.equal(data.calls.snapshots.length,1); assert.equal(data.calls.snapshots[0].environment,'Sandbox');
  assert.equal((await data.pg.query('SELECT count(*)::integer AS n FROM public.apple_subscription_notifications')).rows[0].n,1);
  const access=await lib.resolveAppleSubscriptionAccess(data.database,EMAIL,{config:PRODUCTION,nowMs:now,
    refresh:false,reviewPolicy:policy(now,data.token)});
  assert.equal(access.paid,true); assert.equal(access.paidUntil,new Date(now+120000).toISOString());
});

test('Separate review notifications reject forged, foreign, malformed, inactive and out-of-window evidence before provider lookup', async t => {
  const data=await ledger(t); const now=Date.now(); const current=transaction(now,{appAccountToken:data.token});
  const baseData={environment:'Sandbox',bundleId:SANDBOX.bundleId,appAppleId:SANDBOX.appAppleId,signedTransactionInfo:JWS.event};
  const cases=[
    {name:'forged envelope',provider:{failSignature:true}},
    {name:'foreign bundle',provider:{notice:{data:{...baseData,bundleId:'other.app'}}}},
    {name:'foreign environment',provider:{notice:{data:{...baseData,environment:'Production'}}}},
    {name:'foreign supplied Apple app ID',provider:{notice:{data:{...baseData,appAppleId:1}}}},
    {name:'bad notification UUID',provider:{notice:{notificationUUID:'not-a-uuid'}}},
    {name:'bad protocol version',provider:{notice:{version:'1.0'}}},
    {name:'before private review window',provider:{notice:{signedDate:now-1001}}},
    {name:'exclusive private review end',provider:{notice:{signedDate:now+120000}}},
    {name:'foreign signed product',provider:{event:{...current,productId:'de.jagdlatein.unknown'}}},
    {name:'foreign signed token',provider:{event:{...current,appAccountToken:FOREIGN_TOKEN}}},
    {name:'foreign generation',reviewed:policy(now,data.token,NEXT_GENERATION)},
    {name:'policy absent',reviewed:null},
    {name:'policy expired',reviewed:policy(now,data.token,GENERATION,{validUntil:now})},
    {name:'policy not started',reviewed:policy(now,data.token,GENERATION,{validFrom:now+60000})},
    {name:'not a Production receiver',config:SANDBOX},
  ];
  for(const item of cases){
    const review=apple({now,device:current,...item.provider});
    await assert.rejects(lib.applyVerifiedAppleReviewNotification(JWS.notification,{database:data.database,
      config:item.config||PRODUCTION,nowMs:now,
      reviewPolicy:Object.hasOwn(item,'reviewed')?item.reviewed:policy(now,data.token),...review}),undefined,item.name);
    assert.equal(review.calls.api,0,item.name); assert.equal(data.calls.snapshots.length,0,item.name);
  }
  const forgedInner=apple({now,device:current});
  forgedInner.verifier.verifyAndDecodeTransaction=async()=>{throw new Error('synthetic forged inner signature');};
  await assert.rejects(lib.applyVerifiedAppleReviewNotification(JWS.notification,{database:data.database,config:PRODUCTION,
    nowMs:now,reviewPolicy:policy(now,data.token),...forgedInner}),error=>error.status===400);
  assert.equal(forgedInner.calls.api,0); assert.equal(data.calls.snapshots.length,0);
});

test('Ordinary Production notifications cannot fall back to the review verifier or relay after a signature mismatch',async t=>{
  const data=await ledger(t);const now=Date.now();const normal=productionRejectsSandbox();
  const review=apple({now,device:transaction(now,{appAccountToken:data.token})});let forwarded=0;
  await assert.rejects(lib.applyVerifiedAppleNotification(JWS.notification,{database:data.database,config:PRODUCTION,
    nowMs:now,reviewPolicy:policy(now,data.token),...normal,reviewDependencies:{...review,
      fetcher:async()=>{forwarded++;return new Response('{}');}}}),error=>error.status===400);
  assert.equal(normal.calls.notifications,1);assert.equal(normal.calls.api,0);
  assert.equal(review.calls.notifications,0);assert.equal(review.calls.transactions,0);assert.equal(review.calls.api,0);
  assert.equal(data.calls.lookups,0);assert.equal(data.calls.snapshots.length,0);assert.equal(forwarded,0);
});

test('A verified unknown review token is forwarded only to the fixed public receiver with a bounded credential-free request', async t => {
  const data=await ledger(t); const now=Date.now(); const review=apple({now,device:transaction(now,{appAccountToken:FOREIGN_TOKEN})});
  const requests=[]; const timeouts=[];
  const forwardingLib=load('lib/apple-subscriptions.js',{APPLE_REVIEW_NOTIFICATION_URL:'https://other.example.invalid/'},
    {},{AbortSignal:{timeout(ms){timeouts.push(ms);return AbortSignal.timeout(ms);}}});
  const fetcher=async(url,options)=>{requests.push({url,options});return new Response('{"ok":true}',{status:200});};
  const result=await forwardingLib.applyVerifiedAppleNotification(JWS.notification,{database:data.database,config:SANDBOX,nowMs:now,
    reviewPolicy:policy(now,FOREIGN_TOKEN),reviewDependencies:{fetcher},...review});
  assert.deepEqual(plain(result),{ok:true,forwarded:true}); assert.equal(requests.length,1);
  const {url,options}=requests[0];
  assert.equal(url,FIXED_REVIEW_URL); assert.equal(options.method,'POST');
  assert.equal(options.credentials,'omit'); assert.equal(options.redirect,'error'); assert.equal(options.cache,'no-store');
  assert.deepEqual(plain(options.headers),{'Content-Type':'application/json'});
  assert.deepEqual(JSON.parse(options.body),{signedPayload:JWS.notification});
  assert.ok(options.signal instanceof AbortSignal); assert.equal(options.signal.aborted,false);
  assert.deepEqual(timeouts,[10000]);
  assert.equal(review.calls.api,0); assert.equal(data.calls.snapshots.length,0);
});

test('Local tokens, including deleted ones, are never forwarded from the test backend', async t => {
  const data=await ledger(t); const now=Date.now(); let forwarded=0;
  const fetcher=async()=>{forwarded++;return new Response('{}',{status:200});};
  const review=apple({now,device:transaction(now,{appAccountToken:data.token})});
  assert.deepEqual(plain(await lib.applyVerifiedAppleNotification(JWS.notification,{database:data.database,config:SANDBOX,
    nowMs:now,reviewPolicy:policy(now,data.token),reviewDependencies:{fetcher},...review})),{ok:true});
  assert.equal(forwarded,0); assert.equal(review.calls.api,1);
  await data.pg.query('SELECT public.detach_apple_account($1,$2)',[EMAIL,GENERATION]);
  const before=(await data.pg.query('SELECT to_jsonb(s) AS v FROM public.apple_subscriptions s')).rows[0].v;
  assert.deepEqual(plain(await lib.applyVerifiedAppleNotification(JWS.notification,{database:data.database,config:SANDBOX,
    nowMs:now,reviewPolicy:policy(now,data.token),reviewDependencies:{fetcher},...review})),{ok:true});
  assert.equal(forwarded,0);
  assert.deepEqual((await data.pg.query('SELECT to_jsonb(s) AS v FROM public.apple_subscriptions s')).rows[0].v,before);
  const owner=(await data.pg.query('SELECT account_email,account_generation,deleted_at FROM public.apple_account_tokens WHERE app_account_token=$1',[data.token])).rows[0];
  assert.equal(owner.account_email,null);assert.equal(owner.account_generation,GENERATION);assert.ok(owner.deleted_at);
  assert.equal((await lib.resolveAppleSubscriptionAccess(data.database,EMAIL,{config:SANDBOX,refresh:false,nowMs:now})).paid,false);
});

test('A failed local owner lookup cannot be mistaken for a foreign token and relayed', async()=>{
  const now=Date.now();let forwarded=0;let rpcCalls=0;
  const database={from(){return{select(){return this;},eq(){return this;},async maybeSingle(){return{data:null,error:{message:'private synthetic database failure'}};}};},
    async rpc(){rpcCalls++;throw new Error('Unexpected ledger write');}};
  const review=apple({now,device:transaction(now,{appAccountToken:FOREIGN_TOKEN})});
  await assert.rejects(lib.applyVerifiedAppleNotification(JWS.notification,{database,config:SANDBOX,nowMs:now,
    reviewPolicy:policy(now,FOREIGN_TOKEN),reviewDependencies:{fetcher:async()=>{forwarded++;return new Response('{}');}},...review}),error=>error.status===503);
  assert.equal(forwarded,0);assert.equal(rpcCalls,0);assert.equal(review.calls.api,0);
});

test('Forwarding requires signed in-window evidence, the exact foreign token and an active policy', async t=>{
  const data=await ledger(t);const now=Date.now();let forwarded=0;
  const fetcher=async()=>{forwarded++;return new Response('{}');};
  for(const item of [
    {reviewed:null},{reviewed:policy(now,TOKEN)},
    {reviewed:policy(now,FOREIGN_TOKEN,GENERATION,{validFrom:now+60000})},
    {reviewed:policy(now,FOREIGN_TOKEN,GENERATION,{validUntil:now})},
    {provider:{failSignature:true}},{provider:{notice:{signedDate:now-1001}}},
    {provider:{notice:{signedDate:now+120000}}},
    {provider:{event:transaction(now,{appAccountToken:FOREIGN_TOKEN,bundleId:'other.app'})}},
  ]){
    const review=apple({now,device:transaction(now,{appAccountToken:FOREIGN_TOKEN}),...item.provider});
    await assert.rejects(lib.applyVerifiedAppleNotification(JWS.notification,{database:data.database,config:SANDBOX,nowMs:now,
      reviewPolicy:Object.hasOwn(item,'reviewed')?item.reviewed:policy(now,FOREIGN_TOKEN),reviewDependencies:{fetcher},...review}));
    assert.equal(forwarded,0);assert.equal(review.calls.api,0);assert.equal(data.calls.snapshots.length,0);
  }
});

test('Forward errors, redirects and non-200 responses fail closed without provider details or local writes', async t=>{
  const data=await ledger(t);const now=Date.now();
  for(const outcome of [null,{status:301},{status:204},{status:500},new Error('synthetic private upstream details')]){
    const review=apple({now,device:transaction(now,{appAccountToken:FOREIGN_TOKEN})});
    await assert.rejects(lib.applyVerifiedAppleNotification(JWS.notification,{database:data.database,config:SANDBOX,nowMs:now,
      reviewPolicy:policy(now,FOREIGN_TOKEN),...review,reviewDependencies:{fetcher:async()=>{
        if(outcome instanceof Error)throw outcome;return outcome;
      }}}),error=>error.status===503&&!error.message.includes('private')&&error.cause===undefined);
    assert.equal(review.calls.api,0);assert.equal(data.calls.snapshots.length,0);
  }
});

test('Disabled review receiver rejects before reading a request or creating a database client',async()=>{
  const now=Date.now();let bodyReads=0;let databaseReads=0;let applications=0;
  const overrides={
    '../../../../lib/course-progress-server':{getAccountDatabase(){databaseReads++;throw new Error('Unexpected database');},
      accountJson:(value,status=200)=>Response.json(value,{status})},
    '../../../../lib/apple-subscriptions':{appleSubscriptionConfig:()=>PRODUCTION,
      async readAppleJson(){bodyReads++;throw new Error('Unexpected body');},
      async applyVerifiedAppleReviewNotification(){applications++;throw new Error('Unexpected application');},
      appleErrorResponse:lib.appleErrorResponse},
  };
  for(const env of [{},policyEnv(now,{APPLE_REVIEW_SANDBOX_ENABLED:'false'}),
    policyEnv(now,{APPLE_REVIEW_VALID_UNTIL:new Date(now-1).toISOString(),APPLE_REVIEW_VALID_FROM:new Date(now-1000).toISOString()})]){
    const route=load('app/api/apple/review-notifications/route.js',env,overrides);
    assert.equal((await route.POST({})).status,503);
  }
  assert.equal(bodyReads,0);assert.equal(databaseReads,0);assert.equal(applications,0);
});

test('Enabled review route processes a bounded JSON request through real verification and SQL without exposing policy bindings',async t=>{
  const data=await ledger(t);const now=Date.now();const review=apple({now,device:transaction(now,{appAccountToken:data.token})});
  const route=load('app/api/apple/review-notifications/route.js',policyEnv(now,{APPLE_REVIEW_APP_ACCOUNT_TOKEN:data.token}),{
    '../../../../lib/course-progress-server':{getAccountDatabase:()=>data.database,
      accountJson:(value,status=200)=>Response.json(value,{status})},
    '../../../../lib/apple-subscriptions':{appleSubscriptionConfig:()=>PRODUCTION,readAppleJson:lib.readAppleJson,
      appleErrorResponse:lib.appleErrorResponse,
      applyVerifiedAppleReviewNotification:(signedPayload,options)=>lib.applyVerifiedAppleReviewNotification(signedPayload,
        {...options,nowMs:now,verifier:review.verifier,apiClient:review.apiClient})},
  });
  const request=()=>new Request(FIXED_REVIEW_URL,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({signedPayload:JWS.notification})});
  const response=await route.POST(request());
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});
  assert.equal(review.calls.api,1);assert.equal(data.calls.snapshots.length,1);
  review.verifier.verifyAndDecodeNotification=async()=>{throw new Error('synthetic private signature failure');};
  const forged=await route.POST(request());
  assert.equal(forged.status,400);
  const errorBody=await forged.text();
  assert.ok(!errorBody.includes(data.token));assert.ok(!errorBody.includes(GENERATION));
  assert.ok(!errorBody.includes('private'));assert.ok(!errorBody.includes(EMAIL));
  assert.equal(review.calls.api,1);assert.equal(data.calls.snapshots.length,1);
});
