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
      pricing_scheme: { fixed_price: { value: '10.00', currency_code: 'EUR' } } },
  ], ...overrides };
}

function fixture(overrides = {}, providerOverrides = {}) {
  const env = {
    NODE_ENV:'test', JL_SESSION_SECRET:'isolated-checkout-session-secret-at-least-32-bytes', ACCOUNT_GENERATION_ENABLED:'true',
    JL_TEST_ENVIRONMENT: 'paypal-sandbox', PAYPAL_API_BASE: API,
    PAYPAL_CLIENT_ID: CLIENT, NEXT_PUBLIC_PAYPAL_CLIENT_ID: CLIENT, PAYPAL_SECRET: 'fake-isolated-secret',
    NEXT_PUBLIC_PAYPAL_PLAN_ID: REGULAR, NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID: TRIAL,
    PAYPAL_PLAN_IDS: `${REGULAR},${TRIAL}`, PAYPAL_TRIAL_PLAN_IDS: TRIAL,
    PAYPAL_PLAN_PRICES: JSON.stringify({ [REGULAR]: '10.00', [TRIAL]: '10.00' }),
    SUPABASE_URL: 'https://isolated-db.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fake-isolated-db-key',
    ...overrides,
  };
  const calls = []; const effects = []; const cache = new Map(); let sdkOptions, pendingRender;
  const states = [], refs = []; let stateCursor = 0, refCursor = 0, cleanup;
  const confirmations = [...(providerOverrides.confirmations || [])];
  const document = {
    createElement(tag) { calls.push({ type: 'create-element', tag }); return {}; },
    body: {
      appendChild(script) { calls.push({ type: 'sdk-script', src: script.src }); if (!providerOverrides.stallSdkScript) script.onload(); },
      removeChild() {},
    },
  };
  const window = { paypal: { Buttons(options) {
    sdkOptions = options; calls.push({ type: 'sdk-buttons' });
    return { render: () => providerOverrides.stallSdkRender ? new Promise((resolve,reject)=>{pendingRender={resolve,reject};}) : Promise.resolve(), close: async () => { calls.push({type:'sdk-close'}); } };
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
        useState(initial) {
          const index = stateCursor++;
          if (!(index in states)) states[index] = initial === false && providerOverrides.renderVerified ? true : initial;
          return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
        },
        useRef(initial) { const index = refCursor++; return refs[index] ||= {current:initial}; },
        useMemo: fn => fn(), useEffect: fn => effects.push(fn),
      };
      if (id === 'next/router') return { useRouter: () => ({ query: providerOverrides.query || {} }) };
      if (id === 'next/link') return ({ href, children }) => pr('react').createElement('a', { href }, children);
      if (id.endsWith('/LearningToolLayout')) return ({ children }) => children;
      if (id.endsWith('.module.css')) return { __esModule: true, default: {} };
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)));
      return pr(id);
    }, mod, mod.exports, { env }, async (target, options) => {
      if (target === '/api/account') {
        calls.push({ type: 'browser-fetch', target });
        if(providerOverrides.stallAccount) return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('Aborted')),{once:true}));
        return providerOverrides.unsigned
          ? Response.json({}, {status:401}) : Response.json({account:{email:EMAIL,paid:false,admin:false,...providerOverrides.account}});
      }
      if (target === '/api/paypal/checkout-config') {
        calls.push({ type: 'browser-fetch', target });
        if (providerOverrides.browserOffer) return Response.json(providerOverrides.browserOffer);
        return load('app/api/paypal/checkout-config/route.js').GET(request());
      }
      if(target==='/api/paypal/create-subscription') {
        calls.push({type:'browser-fetch',target});
        return load('app/api/paypal/create-subscription/route.js').POST(request(JSON.parse(options.body)));
      }
      if(target==='/api/paypal/confirm-subscription') {
        calls.push({type:'browser-fetch',target,body:JSON.parse(options.body)});
        if (providerOverrides.stallConfirmation && calls.filter(call=>call.target===target).length===1)
          return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('Aborted')), {once:true}));
        const reply = confirmations.shift() || {body:{activated:true,accessType:env.NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID?'trial':'paid'}};
        return Response.json(reply.body,{status:reply.status || 200});
      }
      if(target==='/api/auth/status') {
        calls.push({type:'browser-fetch',target,options});
        return Response.json(providerOverrides.access || {loggedIn:true,email:EMAIL,paid:true,admin:false},{status:providerOverrides.accessStatus || 200});
      }
      const url = new URL(target); calls.push({ type: 'provider-fetch', url: url.href, options });
      assert.equal(url.origin, env.PAYPAL_API_BASE || 'https://api-m.paypal.com');
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
  function page() { stateCursor=0; refCursor=0; return load('pages/preise.js').default(); }
  return { env, calls, load, request, states, window,
    renderPage() {
      return pr('react-dom/server').renderToStaticMarkup(page());
    },
    async runPage() {
      page();
      effects.forEach(effect => { cleanup=effect(); });
      await new Promise(resolve => setImmediate(resolve));
    },
    async approve() { assert.ok(sdkOptions); await sdkOptions.onApprove({subscriptionID:SUBSCRIPTION}); },
    async retryApproval() { assert.ok(refs[0]?.current); await refs[0].current(); },
    finishSdkRender() { pendingRender?.resolve(); },
    rejectSdkRender() { pendingRender?.reject(new Error('Late SDK render failure')); },
    emitLateSdkEvents() { sdkOptions?.onCancel(); sdkOptions?.onError(); },
    unmount() { cleanup?.(); },
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
  assert.deepEqual(await response.json(), { clientId: CLIENT, planId: TRIAL, trialDays: 3, amount: '10.00', currency: 'EUR' });
  assert.equal(ctx.calls.filter(call => call.type === 'provider-fetch').length, 2);
});

test('A regular-only sandbox offer is verified against its actual monthly plan before SDK approval', async () => {
  const ctx = fixture({ NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID: undefined });
  const response = await ctx.load('app/api/paypal/checkout-config/route.js').GET(ctx.request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { clientId: CLIENT, planId: REGULAR, trialDays: 0, amount: '10.00', currency: 'EUR' });
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
    if (ctx.env.NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID || ctx.env.NEXT_PUBLIC_PAYPAL_PLAN_ID)
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

test('Missing production offer cannot fall back to a historical five-euro plan', async () => {
  const ctx = fixture({ JL_TEST_ENVIRONMENT: undefined, PAYPAL_API_BASE: undefined,
    PAYPAL_CLIENT_ID: undefined, NEXT_PUBLIC_PAYPAL_CLIENT_ID: undefined,
    NEXT_PUBLIC_PAYPAL_PLAN_ID: undefined, NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID: undefined });
  const response = await ctx.load('app/api/paypal/checkout-config/route.js').GET(ctx.request());
  assert.equal(response.status, 503);
  assert.deepEqual(ctx.calls, []);
  await ctx.runPage();
  assert.ok(!ctx.calls.some(call => ['sdk-script', 'sdk-subscription', 'provider-fetch'].includes(call.type)));
});

test('Both production offers verify ten-euro monthly conditions before loading PayPal', async () => {
  for (const trial of [true, false]) {
    const ctx = fixture({ JL_TEST_ENVIRONMENT: undefined, PAYPAL_API_BASE: 'https://api-m.paypal.com',
      PAYPAL_CLIENT_ID: LIVE_CLIENT, NEXT_PUBLIC_PAYPAL_CLIENT_ID: LIVE_CLIENT,
      ...(trial ? {} : { NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID: undefined }) });
    const response = await ctx.load('app/api/paypal/checkout-config/route.js').GET(ctx.request());
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { clientId: LIVE_CLIENT, planId: trial ? TRIAL : REGULAR,
      trialDays: trial ? 3 : 0, amount: '10.00', currency: 'EUR' });
    assert.equal(ctx.calls.filter(call => call.type === 'provider-fetch').length, 2);
    await ctx.runPage();
    const script = new URL(ctx.calls.find(call => call.type === 'sdk-script').src);
    assert.equal(script.searchParams.get('client-id'), LIVE_CLIENT);
  }
});

test('Historical production plan IDs cannot be offered for a new checkout', async () => {
  for (const overrides of [{ NEXT_PUBLIC_PAYPAL_PLAN_ID: LIVE_REGULAR, NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID: undefined },
    { NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID: LIVE_TRIAL }]) {
    const ctx = fixture({ JL_TEST_ENVIRONMENT: undefined, PAYPAL_API_BASE: 'https://api-m.paypal.com', ...overrides });
    assert.equal((await ctx.load('app/api/paypal/checkout-config/route.js').GET(ctx.request())).status, 503);
    assert.deepEqual(ctx.calls, []);
  }
});

test('A missing or five-euro price mapping never permits a new subscription', async () => {
  for (const prices of [undefined, JSON.stringify({ [REGULAR]: '5.00', [TRIAL]: '5.00' })]) {
    const ctx = fixture({ PAYPAL_PLAN_PRICES: prices });
    assert.equal((await ctx.load('app/api/paypal/checkout-config/route.js').GET(ctx.request())).status, 503);
    await ctx.runPage();
    assert.ok(!ctx.calls.some(call => ['sdk-script', 'provider-fetch', 'server-subscription'].includes(call.type)));
  }
});

test('Browser rejects a stale five-euro server offer before loading PayPal', async () => {
  const ctx = fixture({}, { browserOffer: { clientId: CLIENT, planId: TRIAL, trialDays: 3, amount: '5.00', currency: 'EUR' } });
  await ctx.runPage();
  assert.ok(!ctx.calls.some(call => ['sdk-script', 'provider-fetch', 'server-subscription'].includes(call.type)));
});

test('Prices are displayed only after verification and advertise ten euros for either new offer', () => {
  for (const trial of [true, false]) {
    const settings = trial ? {} : { NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID: undefined };
    assert.doesNotMatch(fixture(settings).renderPage(), /10 €/);
    const html = fixture(settings, { renderVerified: true }).renderPage();
    assert.match(html, /10 € \/ Monat/);
    assert.doesNotMatch(html, /5 €/);
    if (trial) assert.match(html, /3 Tage kostenlos/);
  }
});

test('Signed-out visitors cannot load a PayPal SDK or request server creation', async () => {
  const ctx=fixture({}, {unsigned:true}); await ctx.runPage();
  assert.ok(ctx.calls.some(call=>call.type==='browser-fetch'&&call.target==='/api/account'));
  assert.ok(!ctx.calls.some(call=>['sdk-script','sdk-buttons','provider-fetch','database-client'].includes(call.type)));
  assert.equal((await ctx.load('app/api/paypal/checkout-config/route.js').GET(ctx.request())).status,401);
  assert.equal((await ctx.load('app/api/paypal/create-subscription/route.js').POST(ctx.request())).status,401);
});

test('Both account choices preserve the safe learning destination through sign-in and checkout', async () => {
  const ctx=fixture({}, {unsigned:true,query:{next:'/lernen/wildkunde?kapitel=2'}});
  await ctx.runPage();
  const html=ctx.renderPage();
  for (const route of ['/login','/registrieren']) {
    const href=html.match(new RegExp(`href="(${route}[^\"]+)"`))[1].replaceAll('&amp;','&');
    const target=new URL(href,'https://jagdlatein.test').searchParams.get('next');
    assert.equal(target,'/preise?next=%2Flernen%2Fwildkunde%3Fkapitel%3D2#paypal-subscribe-preise');
  }
  const unsafe=fixture({}, {unsigned:true,query:{next:'//untrusted.example/payment'}});
  await unsafe.runPage();
  assert.doesNotMatch(unsafe.renderPage(),/untrusted\.example/);
});

test('An unavailable new offer does not hide sign-in or block an already active learner', async () => {
  const settings={NEXT_PUBLIC_PAYPAL_PLAN_ID:undefined,NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID:undefined};
  const unsigned=fixture(settings,{unsigned:true}); await unsigned.runPage();
  assert.equal(unsigned.states[1],'login-required');
  assert.match(unsigned.renderPage(),/Ich habe schon ein Konto/);
  const active=fixture(settings,{account:{paid:true}}); await active.runPage();
  assert.equal(active.states[1],'existing'); assert.match(active.renderPage(),/>Jetzt lernen</);
  for(const ctx of [unsigned,active]) assert.ok(!ctx.calls.some(call=>['sdk-script','provider-fetch','server-subscription'].includes(call.type)));
});

test('A confirmed PayPal purchase refreshes the same signed account without asking for another code', async () => {
  for (const trial of [true,false]) {
    const ctx=fixture(trial?{}:{NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID:undefined}, {query:{next:'/lernen/wildkunde'}});
    await ctx.runPage(); await ctx.createSubscription(); await ctx.approve();
    assert.equal(ctx.states[1],'complete');
    const confirms=ctx.calls.filter(call=>call.target==='/api/paypal/confirm-subscription');
    const refreshes=ctx.calls.filter(call=>call.target==='/api/auth/status');
    assert.equal(confirms.length,1); assert.equal(refreshes.length,1);
    assert.deepEqual(confirms[0].body,{subscriptionId:SUBSCRIPTION});
    assert.equal(refreshes[0].options.credentials,'same-origin');
    assert.equal(refreshes[0].options.cache,'no-store');
    assert.ok(ctx.calls.indexOf(refreshes[0])>ctx.calls.indexOf(confirms[0]));
    assert.equal(ctx.window.location.href,undefined);
    assert.match(ctx.renderPage(),/href="\/lernen\/wildkunde"[^>]*>Jetzt lernen/);
    assert.doesNotMatch(ctx.renderPage(),/reauth=1/);
  }
});

test('Pending confirmation retries the approved subscription and cannot create or approve another purchase', async () => {
  const ctx=fixture({}, {confirmations:[{status:202,body:{activated:false}},{body:{activated:true,accessType:'trial'}}]});
  await ctx.runPage(); await ctx.createSubscription(); await ctx.approve();
  assert.equal(ctx.states[1],'pending');
  assert.match(ctx.renderPage(),/Zugang erneut prüfen/);
  assert.ok(!ctx.calls.some(call=>call.target==='/api/auth/status'));
  await assert.rejects(ctx.createSubscription(),/derzeit nicht möglich/);
  await ctx.approve();
  assert.equal(ctx.calls.filter(call=>call.target==='/api/paypal/confirm-subscription').length,1);
  await ctx.retryApproval();
  assert.equal(ctx.states[1],'complete');
  const confirms=ctx.calls.filter(call=>call.target==='/api/paypal/confirm-subscription');
  assert.equal(confirms.length,2);
  assert.ok(confirms.every(call=>call.body.subscriptionId===SUBSCRIPTION));
  assert.equal(ctx.calls.filter(call=>call.type==='server-subscription').length,1);
});

test('Session refresh cannot display activated learning for a different, unpaid or unavailable account', async () => {
  for (const settings of [{access:{loggedIn:true,email:'other@example.invalid',paid:true}},
    {access:{loggedIn:true,email:EMAIL,paid:false}}, {access:{loggedIn:false,email:null,paid:false}},
    {accessStatus:503,access:{loggedIn:true,email:EMAIL,paid:true}}]) {
    const ctx=fixture({},settings); await ctx.runPage(); await ctx.approve();
    assert.equal(ctx.states[1],'pending');
    assert.match(ctx.renderPage(),/Zugang erneut prüfen/);
    assert.doesNotMatch(ctx.renderPage(),/>Jetzt lernen</);
    assert.equal(ctx.window.location.href,undefined);
  }
});

test('Leaving checkout removes the pending retry and prevents a late approval from checking a purchase', async () => {
  const ctx=fixture(); await ctx.runPage(); ctx.unmount(); await ctx.approve();
  assert.ok(!ctx.calls.some(call=>call.target==='/api/paypal/confirm-subscription'));
  await assert.rejects(ctx.retryApproval());
});

test('A stalled confirmation times out and the same purchase can be retried with a fresh signal', async t => {
  const ctx=fixture({}, {stallConfirmation:true}); await ctx.runPage(); await ctx.createSubscription();
  t.mock.timers.enable({apis:['setTimeout']});
  const approving=ctx.approve();
  assert.equal(ctx.states[1],'confirming');
  t.mock.timers.tick(18000); await approving;
  assert.equal(ctx.states[1],'pending');
  await ctx.retryApproval();
  assert.equal(ctx.states[1],'complete');
  assert.equal(ctx.calls.filter(call=>call.type==='server-subscription').length,1);
});

test('An account startup that never responds ends with a retry instead of an endless loading state', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  const ctx=fixture({}, {stallAccount:true}); await ctx.runPage();
  assert.equal(ctx.states[1],'checking');
  t.mock.timers.tick(20000); await new Promise(resolve=>setImmediate(resolve));
  assert.equal(ctx.states[1],'error');
  assert.match(ctx.renderPage(),/Erneut prüfen/);
  assert.ok(!ctx.calls.some(call=>['sdk-script','server-subscription'].includes(call.type)));
  ctx.unmount();
});

test('A stalled PayPal script or button render times out and a late render cannot reopen checkout', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  for(const settings of [{stallSdkScript:true},{stallSdkRender:true}]) {
    const ctx=fixture({},settings); await ctx.runPage();
    assert.equal(ctx.states[1],'loading-paypal');
    assert.match(ctx.renderPage(),/PayPal wird geladen/);
    t.mock.timers.tick(20000); await new Promise(resolve=>setImmediate(resolve));
    assert.equal(ctx.states[1],'sdk-error');
    ctx.finishSdkRender(); await Promise.resolve();
    assert.equal(ctx.states[1],'sdk-error');
    assert.match(ctx.renderPage(),/Erneut prüfen/);
    assert.ok(!ctx.calls.some(call=>call.type==='server-subscription'));
    ctx.unmount();
  }
});

test('Late SDK rendering, cancel and error events do not overwrite confirmed access', async () => {
  const ctx=fixture({}, {stallSdkRender:true}); await ctx.runPage(); await ctx.approve();
  const message=ctx.states[0];
  assert.equal(ctx.states[1],'complete');
  ctx.finishSdkRender(); await Promise.resolve(); ctx.emitLateSdkEvents();
  assert.equal(ctx.states[1],'complete'); assert.equal(ctx.states[0],message);
  ctx.unmount();
});

test('An explicit purchase during slow SDK rendering is not interrupted by the startup deadline', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  const ctx=fixture({}, {stallSdkRender:true}); await ctx.runPage(); await ctx.createSubscription();
  t.mock.timers.tick(20000); await Promise.resolve();
  assert.equal(ctx.states[1],'ready');
  await ctx.approve(); assert.equal(ctx.states[1],'complete');
  assert.equal(ctx.calls.filter(call=>call.type==='server-subscription').length,1);
  assert.deepEqual(ctx.calls.find(call=>call.target==='/api/paypal/confirm-subscription').body,{subscriptionId:SUBSCRIPTION});
  ctx.unmount();
});

test('A late SDK render failure does not interrupt an already-started purchase', async () => {
  const ctx=fixture({}, {stallSdkRender:true}); await ctx.runPage(); await ctx.createSubscription();
  ctx.rejectSdkRender(); await new Promise(resolve=>setImmediate(resolve));
  assert.equal(ctx.states[1],'ready');
  await ctx.approve(); assert.equal(ctx.states[1],'complete');
  assert.equal(ctx.calls.filter(call=>call.type==='server-subscription').length,1);
  assert.deepEqual(ctx.calls.find(call=>call.target==='/api/paypal/confirm-subscription').body,{subscriptionId:SUBSCRIPTION});
  ctx.unmount();
});
