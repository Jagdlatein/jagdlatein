const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const API = 'https://api-m.sandbox.paypal.com';
const CLIENT = 'isolated-sandbox-client-for-pricing-123456';
const LIVE_CLIENT = 'AQx7R9V-b-x8NJmvXUkRrJ-Js68jqMq3udNpdVmONZrpS0y6zpUj5QMIAiunCQDCTPpwmiKFaJJybJBW';
const REGULAR = 'P-AAAAAAAAAAAAAAAAAAAAAAAA';
const TRIAL = 'P-BBBBBBBBBBBBBBBBBBBBBBBB';
const LIVE_REGULAR = 'P-9XU38461YG7706134NESJQWA';
const LIVE_TRIAL = 'P-0SN76115U1905643NNLBEIGQ';
const EMAIL='buyer@example.invalid', GENERATION='11111111-1111-4111-8111-111111111111', SUBSCRIPTION='I-CHECKOUT1234';

function plan(id, overrides) {
  const trial = id === TRIAL;
  return { id, status: 'ACTIVE', quantity_supported: false, billing_cycles: [
    ...(trial ? [{ tenure_type: 'TRIAL', sequence: 1, total_cycles: 1,
      frequency: { interval_unit: 'DAY', interval_count: 3 },
      pricing_scheme: { fixed_price: { value: '0.00', currency_code: 'EUR' } } }] : []),
    { tenure_type: 'REGULAR', sequence: trial ? 2 : 1, total_cycles: 0,
      frequency: { interval_unit: 'MONTH', interval_count: 1 },
      pricing_scheme: { fixed_price: { value: '5.00', currency_code: 'EUR' } } },
  ], ...overrides };
}

function fixture(overrides = {}, providerOverrides = {}) {
  const env = {
    NODE_ENV:'test', JL_SESSION_SECRET:'isolated-checkout-session-secret-at-least-32-bytes', ACCOUNT_GENERATION_ENABLED:'true',
    JL_TEST_ENVIRONMENT: 'paypal-sandbox', PAYPAL_API_BASE: API,
    PAYPAL_CLIENT_ID: CLIENT, NEXT_PUBLIC_PAYPAL_CLIENT_ID: CLIENT, PAYPAL_SECRET: 'fake-isolated-secret',
    NEXT_PUBLIC_PAYPAL_PLAN_ID: REGULAR, NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID: TRIAL,
    PAYPAL_PLAN_IDS: `${REGULAR},${TRIAL}`, PAYPAL_TRIAL_PLAN_IDS: TRIAL,
    SUPABASE_URL: 'https://isolated-db.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fake-isolated-db-key',
    ...overrides,
  };
  const calls = []; const effects = []; const cache = new Map(); let sdkOptions;
  const document = {
    createElement(tag) { calls.push({ type: 'create-element', tag }); return {}; },
    body: {
      appendChild(script) { calls.push({ type: 'sdk-script', src: script.src }); script.onload(); },
      removeChild() {},
    },
  };
  const window = { paypal: { Buttons(options) {
    sdkOptions = options; calls.push({ type: 'sdk-buttons' });
    return { render: async () => {}, close: async () => {} };
  } }, location: {} };
  function load(relative) {
    const filename = path.join(root, relative);
    if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename,'utf8'));
    if (cache.has(filename)) return cache.get(filename).exports;
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), {
      filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } },
      module: { type: 'commonjs' },
    });
    const mod = { exports: {} }; cache.set(filename, mod);
    new Function('require', 'module', 'exports', 'process', 'fetch', 'document', 'window', code)(id => {
      if (id === '@supabase/supabase-js') return { createClient() {
        calls.push({ type: 'database-client' }); return { from(table) {
          calls.push({ type: 'database-table', table });
          return { select() { return this; }, eq() { return this; }, ilike() { return this; },
            async maybeSingle() { return {data:table==='userprofile'?{email:EMAIL,account_generation:GENERATION,is_premium:false,is_admin:false}:null,error:null}; },
            async limit(n) { assert.equal(n, 0); return { data: [], error: null }; },
            then(resolve,reject) { return Promise.resolve({data:[],error:null}).then(resolve,reject); } };
        }, async rpc(name,args) { calls.push({type:'database-rpc',name});
          if(name==='begin_paypal_checkout')return {data:{request_id:'22222222-2222-4222-8222-222222222222',account_generation:GENERATION,plan_id:args.p_plan_id},error:null};
          assert.equal(name,'reserve_paypal_subscription'); return {data:{subscription_id:SUBSCRIPTION,account_generation:GENERATION,account_email:EMAIL},error:null};
        } };
      } };
      if (id === 'react') return { ...pr('react'),
        useState: initial => [initial, () => {}], useMemo: fn => fn(), useEffect: fn => effects.push(fn),
      };
      if (id === 'next/router') return { useRouter: () => ({ query: {} }) };
      if (id === 'next/link' || id.endsWith('/LearningToolLayout')) return () => null;
      if (id.endsWith('.module.css')) return { __esModule: true, default: {} };
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)));
      return pr(id);
    }, mod, mod.exports, { env }, async (target, options) => {
      if (target === '/api/account') {
        calls.push({ type: 'browser-fetch', target }); return providerOverrides.unsigned
          ? Response.json({}, {status:401}) : Response.json({account:{paid:false,admin:false}});
      }
      if (target === '/api/paypal/checkout-config') {
        calls.push({ type: 'browser-fetch', target });
        return load('app/api/paypal/checkout-config/route.js').GET(request());
      }
      if(target==='/api/paypal/create-subscription') {
        calls.push({type:'browser-fetch',target});
        return load('app/api/paypal/create-subscription/route.js').POST(request(JSON.parse(options.body)));
      }
      const url = new URL(target); calls.push({ type: 'provider-fetch', url: url.href, options });
      assert.equal(url.origin, API);
      if (url.pathname === '/v1/oauth2/token') return Response.json({ access_token: 'fake-isolated-token' });
      if (url.pathname.startsWith('/v1/billing/plans/')) return Response.json(plan(url.pathname.split('/').at(-1), providerOverrides));
      if(url.pathname==='/v1/billing/subscriptions' && options.method==='POST') {
        calls.push({type:'server-subscription',body:JSON.parse(options.body)});
        return Response.json({id:SUBSCRIPTION,plan_id:JSON.parse(options.body).plan_id,status:'APPROVAL_PENDING'});
      }
      throw new Error('Unexpected provider target');
    }, document, window);
    return mod.exports;
  }
  const session=load('lib/account-session.js');
  const token=session.createAccountSession(EMAIL,Date.now(),{authenticatedAt:Math.floor(Date.now()/1000),accountGeneration:GENERATION});
  function request(body={}) { return {url:'https://jagdlatein.test/api/paypal/create-subscription',
    headers:new Headers({origin:'https://jagdlatein.test','content-type':'application/json'}),json:async()=>body,
    cookies:{get:name=>name===session.JL_ACCOUNT_COOKIE&&!providerOverrides.unsigned?{value:token}:undefined}}; }
  return { env, calls, load, request,
    async runPage() {
      load('pages/preise.js').default();
      effects.forEach(effect => effect());
      await new Promise(resolve => setImmediate(resolve));
    },
    async createSubscription() {
      assert.ok(sdkOptions, 'SDK must have been loaded after server verification');
      return sdkOptions.createSubscription({}, { subscription: { create(args) {
        calls.push({ type: 'sdk-subscription', args }); return 'isolated-fake-subscription';
      } } });
    },
  };
}

const invalidSettings = {
  'missing browser client': { NEXT_PUBLIC_PAYPAL_CLIENT_ID: undefined },
  'missing server client': { PAYPAL_CLIENT_ID: undefined },
  'different server and browser clients': { PAYPAL_CLIENT_ID: 'other-isolated-sandbox-client-123456' },
  'known live browser client': { NEXT_PUBLIC_PAYPAL_CLIENT_ID: LIVE_CLIENT, PAYPAL_CLIENT_ID: LIVE_CLIENT },
  'missing monthly plan': { NEXT_PUBLIC_PAYPAL_PLAN_ID: undefined },
  'known live monthly plan': { NEXT_PUBLIC_PAYPAL_PLAN_ID: LIVE_REGULAR },
  'known live trial plan': { NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID: LIVE_TRIAL },
  'identical trial and monthly plans': { NEXT_PUBLIC_PAYPAL_PLAN_ID: TRIAL },
  'invalid explicit trial plan': { NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID: 'invalid' },
  'default live API': { PAYPAL_API_BASE: undefined },
  'explicit live API': { PAYPAL_API_BASE: 'https://api-m.paypal.com' },
};
for (const [name, values] of Object.entries(invalidSettings)) test(`Sandbox checkout rejects ${name} before any database or provider access`, async () => {
  const ctx = fixture(values); const response = await ctx.load('app/api/paypal/checkout-config/route.js').GET(ctx.request());
  assert.equal(response.status, 503); assert.deepEqual(ctx.calls, []);
  const body = JSON.stringify(await response.json()); assert.ok(!body.includes('fake-isolated-secret'));
});

test('Trial checkout returns only an explicit client and the verified three-day sandbox offer', async () => {
  const ctx = fixture(); const response = await ctx.load('app/api/paypal/checkout-config/route.js').GET(ctx.request());
  assert.equal(response.status, 200); assert.ok(response.headers.get('cache-control').includes('no-store'));
  assert.deepEqual(await response.json(), { clientId: CLIENT, planId: TRIAL, trialDays: 3, amount: '5.00', currency: 'EUR' });
  assert.equal(ctx.calls.filter(call => call.type === 'provider-fetch').length, 2);
});

test('A regular-only sandbox offer is verified against its actual monthly plan before SDK approval', async () => {
  const ctx = fixture({ NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID: undefined });
  const response = await ctx.load('app/api/paypal/checkout-config/route.js').GET(ctx.request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { clientId: CLIENT, planId: REGULAR, trialDays: 0, amount: '5.00', currency: 'EUR' });
  assert.equal(ctx.calls.filter(call => call.type === 'provider-fetch').length, 2);
  assert.ok(ctx.calls.some(call => call.type === 'database-client'));
});

for (const wrongPlan of [{ status: 'INACTIVE' }, { quantity_supported: true }, { id: 'P-WRONGPLAN' },
  { billing_cycles: [{ tenure_type: 'REGULAR', sequence: 1, total_cycles: 0,
    frequency: { interval_unit: 'MONTH', interval_count: 1 },
    pricing_scheme: { fixed_price: { value: '6.00', currency_code: 'EUR' } } }] }]) {
  test(`Regular sandbox checkout refuses mismatched actual plan: ${JSON.stringify(wrongPlan)}`, async () => {
    const ctx = fixture({ NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID: undefined }, wrongPlan);
    assert.equal((await ctx.load('app/api/paypal/checkout-config/route.js').GET(ctx.request())).status, 503);
    assert.equal(ctx.calls.filter(call => call.type === 'provider-fetch').length, 2);
  });
}

test('Browser with missing public test settings cannot create an SDK script or subscription', async () => {
  for (const values of [{ NEXT_PUBLIC_PAYPAL_CLIENT_ID: undefined },
    { NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID: undefined, NEXT_PUBLIC_PAYPAL_PLAN_ID: undefined, NEXT_PUBLIC_PAYPAL_CLIENT_ID: undefined },
    { NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID: undefined, NEXT_PUBLIC_PAYPAL_CLIENT_ID: LIVE_CLIENT, PAYPAL_CLIENT_ID: LIVE_CLIENT }]) {
    const ctx = fixture(values); await ctx.runPage();
    assert.ok(ctx.calls.some(call => call.type === 'browser-fetch' && call.target === '/api/paypal/checkout-config'));
    assert.ok(!ctx.calls.some(call => ['sdk-script', 'sdk-buttons', 'sdk-subscription', 'provider-fetch', 'database-client'].includes(call.type)));
  }
});

test('Both trial and regular browser checkouts verify the server offer before loading the sandbox SDK', async () => {
  for (const trial of [true, false]) {
    const ctx = fixture(trial ? {} : { NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID: undefined });
    await ctx.runPage(); await ctx.createSubscription();
    const sdkIndex = ctx.calls.findIndex(call => call.type === 'sdk-script');
    assert.ok(sdkIndex > ctx.calls.findIndex(call => call.type === 'browser-fetch' && call.target === '/api/paypal/checkout-config'));
    assert.equal(ctx.calls.slice(0, sdkIndex).filter(call => call.type === 'provider-fetch').length, 2);
    const script = new URL(ctx.calls[sdkIndex].src); assert.equal(script.searchParams.get('client-id'), CLIENT);
    assert.equal(ctx.calls.find(call => call.type === 'server-subscription').body.plan_id, trial ? TRIAL : REGULAR);
    assert.ok(!ctx.calls.some(call=>call.type==='sdk-subscription'));
  }
});

test('Production monthly defaults and the existing UI still use the original live client and monthly plan', async () => {
  const ctx = fixture({ JL_TEST_ENVIRONMENT: undefined, PAYPAL_API_BASE: undefined,
    PAYPAL_CLIENT_ID: undefined, NEXT_PUBLIC_PAYPAL_CLIENT_ID: undefined,
    NEXT_PUBLIC_PAYPAL_PLAN_ID: undefined, NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID: undefined });
  const response = await ctx.load('app/api/paypal/checkout-config/route.js').GET(ctx.request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { clientId: LIVE_CLIENT, planId: LIVE_REGULAR, trialDays: 0, amount: '5.00', currency: 'EUR' });
  assert.ok(!ctx.calls.some(call=>call.type==='provider-fetch'));
  await ctx.runPage();
  const script = new URL(ctx.calls.find(call => call.type === 'sdk-script').src);
  assert.equal(script.searchParams.get('client-id'), LIVE_CLIENT);
  assert.ok(!ctx.calls.some(call=>call.type==='sdk-subscription'));
  assert.ok(!ctx.calls.some(call => call.type === 'provider-fetch'));
});

test('Signed-out visitors cannot load a PayPal SDK or request server creation', async () => {
  const ctx=fixture({}, {unsigned:true}); await ctx.runPage();
  assert.ok(ctx.calls.some(call=>call.type==='browser-fetch'&&call.target==='/api/account'));
  assert.ok(!ctx.calls.some(call=>['sdk-script','sdk-buttons','provider-fetch','database-client'].includes(call.type)));
  assert.equal((await ctx.load('app/api/paypal/checkout-config/route.js').GET(ctx.request())).status,401);
  assert.equal((await ctx.load('app/api/paypal/create-subscription/route.js').POST(ctx.request())).status,401);
});
