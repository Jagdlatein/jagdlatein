'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { prepare, execute, API, RETRY_WINDOW_MS } = require('./paypal-sandbox-plans.cjs');
const CLI = path.resolve(__dirname, 'paypal-sandbox-plans.cjs');
const CLIENT = 'SandboxClientForJagdlatein_1234567890';
const SECRET = 'sandbox-secret-do-not-print';
const TOKEN = 'sandbox-token-do-not-print';
const PRODUCT = `PROD-${'A'.repeat(17)}`;
const REGULAR = `P-${'1'.repeat(24)}`;
const TRIAL = `P-${'2'.repeat(24)}`;
const clone = value => JSON.parse(JSON.stringify(value));
const response = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });

function fixture(t, hooks = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'jagdlatein-sandbox-plans-'));
  t.after(() => {
    // Only remove the exact mkdtemp directory, never a computed project path.
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('jagdlatein-sandbox-plans-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const statePath = path.join(directory, 'plans-state.json');
  const prepared = prepare({ clientId: CLIENT, statePath });
  const products = new Map(), plans = new Map(), requests = new Map(), calls = [];
  const read = () => JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const write = state => fs.writeFileSync(statePath, JSON.stringify(state));
  async function fetchFn(url, options) {
    assert.equal(new URL(url).origin, API);
    assert.equal(options.redirect, 'manual'); assert.ok(options.signal instanceof AbortSignal);
    const endpoint = new URL(url).pathname, method = options.method;
    const body = options.body && (endpoint === '/v1/oauth2/token' ? options.body : JSON.parse(options.body));
    const call = { url, endpoint, method, headers: options.headers, body }; calls.push(call);
    if (hooks.beforeRequest) { const override = await hooks.beforeRequest(call, { products, plans, requests, read }); if (override !== undefined) return override; }
    if (endpoint === '/v1/oauth2/token') {
      assert.equal(method, 'POST'); assert.equal(options.body, 'grant_type=client_credentials');
      assert.equal(options.headers.Authorization, `Basic ${Buffer.from(`${CLIENT}:${SECRET}`).toString('base64')}`);
      return response({ access_token: TOKEN });
    }
    assert.equal(options.headers.Authorization, `Bearer ${TOKEN}`);
    if (method === 'GET') {
      const map = endpoint.startsWith('/v1/catalogs/products/') ? products : plans;
      const item = map.get(endpoint.split('/').pop());
      return item ? response(item) : response({ error: `not found ${SECRET} ${TOKEN}` }, 404);
    }
    assert.equal(method, 'POST'); assert.ok(['/v1/catalogs/products', '/v1/billing/plans'].includes(endpoint));
    const isProduct = endpoint === '/v1/catalogs/products';
    const kind = isProduct ? 'product' : body.billing_cycles.length === 1 ? 'regular' : 'trial';
    const state = read();
    assert.ok(state.operations[kind].attemptedAt, 'Attempt must be persisted before POST');
    assert.equal(options.headers['PayPal-Request-Id'], state.operations[kind].requestId);
    assert.deepEqual(body, state.operations[kind].body, 'Posted body must be the persisted preparation');
    const requestId = options.headers['PayPal-Request-Id'];
    if (requests.has(requestId)) return response({ id: requests.get(requestId) });
    if (isProduct) assert.equal(Object.hasOwn(body, 'id'), false, 'PayPal must generate its own reserved product ID');
    else {
      assert.equal(body.product_id, PRODUCT);
      assert.equal(state.operations.product.id, PRODUCT);
      assert.ok(['regular', 'trial'].every(name => state.operations[name].body.product_id === PRODUCT));
    }
    const id = isProduct ? PRODUCT : kind === 'regular' ? REGULAR : TRIAL;
    let item = { ...clone(body), id };
    if (hooks.transform) item = hooks.transform(kind, item);
    (isProduct ? products : plans).set(id, item); requests.set(requestId, id);
    if (hooks.afterCreated) { const override = await hooks.afterCreated(kind, item, call, { products, plans, requests, read }); if (override !== undefined) return override; }
    return response({ id }, 201);
  }
  const run = (step = 'Create', recovery = {}) => execute({ step, clientId: CLIENT, secret: SECRET, statePath, ...recovery }, fetchFn);
  return { statePath, prepared, products, plans, requests, calls, read, write, run, fetchFn,
    posts: () => calls.filter(call => call.method === 'POST' && call.endpoint !== '/v1/oauth2/token') };
}
function safeError(code, snippets = [SECRET, TOKEN]) {
  return error => {
    assert.equal(error.code, code);
    for (const snippet of snippets) assert.ok(!`${error.message}${JSON.stringify(error)}`.includes(snippet));
    return true;
  };
}

test('Prepare is offline, bound to the client, repeatable, and contains all reviewable exact conditions', t => {
  const ctx = fixture(t); const original = fs.readFileSync(ctx.statePath, 'utf8');
  assert.deepEqual(prepare({ clientId: CLIENT, statePath: ctx.statePath }), ctx.prepared);
  assert.equal(fs.readFileSync(ctx.statePath, 'utf8'), original);
  const state = ctx.read();
  assert.equal(state.version, 2);
  assert.equal(state.apiBase, API); assert.equal(state.operations.product.body.type, 'SERVICE');
  assert.equal(Object.hasOwn(state.operations.product.body, 'id'), false);
  assert.equal(new Set(Object.values(state.operations).map(op => op.requestId)).size, 3);
  assert.ok(Object.values(state.operations).every(op => op.id === null && op.attemptedAt === null && /^[a-f0-9]{64}$/.test(op.bodyHash)));
  assert.equal(ctx.prepared.providerLifecycle, 'pending'); assert.equal(ctx.prepared.productId, null);
  assert.equal(ctx.prepared.conditions.regularPlan.product_id, null);
  assert.equal(ctx.prepared.conditions.trialPlan.product_id, null);
  assert.equal(ctx.prepared.conditions.regularPlan.billing_cycles[0].pricing_scheme.fixed_price.value, '5.00');
  assert.equal(ctx.prepared.conditions.trialPlan.billing_cycles[0].frequency.interval_count, 3);
  assert.ok(!original.includes(CLIENT)); assert.ok(!original.includes(SECRET));
  assert.throws(() => prepare({ clientId: 'AnotherSandboxClient_123456', statePath: ctx.statePath }), safeError('INVALID_STATE'));
});

test('Preparation rejects project paths and secret or changed condition fields before network', async t => {
  assert.throws(() => prepare({ clientId: CLIENT, statePath: path.join(__dirname, 'never-written.json') }), safeError('INVALID_STATE_PATH'));
  const ctx = fixture(t); const state = ctx.read(); state.operations.regular.body.billing_cycles[0].pricing_scheme.fixed_price.value = '9.00'; ctx.write(state);
  await assert.rejects(ctx.run(), safeError('INVALID_STATE')); assert.equal(ctx.calls.length, 0);
  state.operations.regular.body.billing_cycles[0].pricing_scheme.fixed_price.value = '5.00'; state.secret = SECRET; ctx.write(state);
  await assert.rejects(ctx.run(), safeError('INVALID_STATE')); assert.equal(ctx.calls.length, 0);
});

test('A version-1 merchant-product preparation is rejected unchanged and before authentication', async t => {
  const ctx = fixture(t), state = ctx.read();
  state.version = 1; state.operations.product.body.id = PRODUCT;
  state.operations.product.attemptedAt = new Date().toISOString(); ctx.write(state);
  const original = fs.readFileSync(ctx.statePath, 'utf8');
  assert.throws(() => prepare({ clientId: CLIENT, statePath: ctx.statePath }), safeError('INVALID_STATE'));
  await assert.rejects(ctx.run(), safeError('INVALID_STATE'));
  assert.equal(ctx.calls.length, 0); assert.equal(fs.readFileSync(ctx.statePath, 'utf8'), original);
});

test('An independently altered plan product binding is rejected even with its corresponding payload hash', async t => {
  const ctx = fixture(t), state = ctx.read();
  state.operations.regular.body.product_id = PRODUCT;
  const sorted = value => value && typeof value === 'object'
    ? Array.isArray(value) ? value.map(sorted) : Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])])) : value;
  state.operations.regular.bodyHash = crypto.createHash('sha256').update(JSON.stringify(sorted(state.operations.regular.body))).digest('hex');
  ctx.write(state); await assert.rejects(ctx.run(), safeError('INVALID_STATE'));
  assert.equal(ctx.calls.length, 0);
});

test('State API, client, payload, and per-resource request bindings fail closed before authentication', async t => {
  const ctx = fixture(t), original = ctx.read();
  for (const change of [
    state => { state.apiBase = 'https://api-m.paypal.com'; },
    state => { state.operations.trial.requestId = state.operations.regular.requestId; },
    state => { state.operations.product.attemptedAt = new Date(Date.now() + 3600000).toISOString(); },
    state => { state.operations.regular.id = 'P-9XU38461YG7706134NESJQWA'; },
  ]) {
    const state = clone(original); change(state); ctx.write(state);
    await assert.rejects(ctx.run(), safeError('INVALID_STATE')); assert.equal(ctx.calls.length, 0);
  }
  ctx.write(original);
  await assert.rejects(execute({ step: 'Create', clientId: 'DifferentSandboxClient_12345', secret: SECRET, statePath: ctx.statePath }, ctx.fetchFn), safeError('INVALID_STATE'));
  assert.equal(ctx.calls.length, 0);
});

test('Create mutates exactly one product and two plans, saves IDs before detail reads, and never creates a subscription/payment/webhook', async t => {
  const ctx = fixture(t, { beforeRequest(call, remote) {
    if (call.method === 'GET' && remote.products.size && call.endpoint.includes('/products/')) {
      const state = remote.read();
      assert.equal(state.operations.product.id, call.endpoint.split('/').pop());
      assert.ok(['regular', 'trial'].every(name => state.operations[name].body.product_id === PRODUCT));
      assert.ok(['regular', 'trial'].every(name => state.operations[name].bodyHash !== ctx.initialPlanHashes[name]));
    }
    if (call.method === 'GET' && call.endpoint.includes('/plans/')) assert.ok(Object.values(remote.read().operations).some(op => op.id === call.endpoint.split('/').pop()));
  } });
  ctx.initialPlanHashes = Object.fromEntries(['regular', 'trial'].map(name => [name, ctx.read().operations[name].bodyHash]));
  const result = await ctx.run();
  assert.equal(result.status, 'verified'); assert.equal(result.productId, PRODUCT);
  assert.equal(result.regularPlanId, REGULAR); assert.equal(result.trialPlanId, TRIAL);
  assert.equal(result.providerLifecycle, 'pending'); assert.equal(result.paymentsCreated, 0);
  assert.equal(result.webhooksCreated, 0); assert.equal(result.databaseWrites, 0);
  assert.deepEqual(ctx.posts().map(call => call.endpoint), ['/v1/catalogs/products', '/v1/billing/plans', '/v1/billing/plans']);
  assert.equal(ctx.products.size, 1); assert.equal(ctx.plans.size, 2);
  assert.ok(!JSON.stringify(result).includes(SECRET)); assert.ok(!JSON.stringify(result).includes(TOKEN));
  assert.ok(!fs.readFileSync(ctx.statePath, 'utf8').includes(SECRET));
  assert.deepEqual(await ctx.run(), result); assert.deepEqual(await ctx.run('Status'), result);
  assert.equal(ctx.posts().length, 3, 'Known resources must only be read on repeated Create/Status');
});

test('Status before Create is read-only and reports pending, including unverified planned product', async t => {
  const ctx = fixture(t); const result = await ctx.run('Status');
  assert.equal(result.status, 'pending'); assert.equal(result.productStatus, 'pending');
  assert.equal(result.regularPlanId, null); assert.equal(ctx.posts().length, 0);
  assert.equal(ctx.read().operations.product.id, null);
  assert.equal(ctx.calls.length, 1, 'Unknown product must not trigger guessed GETs or resource POSTs');
  assert.ok(ctx.calls.every(call => call.endpoint === '/v1/oauth2/token'));
});

test('A lost product response replays the same request ID and payload within 24 hours without duplicating the product', async t => {
  let failed = false;
  const ctx = fixture(t, { afterCreated(kind) { if (kind === 'product' && !failed) { failed = true; throw new Error(`${SECRET} ${TOKEN}`); } } });
  await assert.rejects(ctx.run(), safeError('SANDBOX_UNAVAILABLE'));
  assert.equal(ctx.read().operations.product.id, null); assert.equal(ctx.products.size, 1);
  const first = ctx.read();
  assert.ok(['regular', 'trial'].every(name => first.operations[name].body.product_id === null));
  const result = await ctx.run(); assert.equal(result.status, 'verified');
  const productPosts = ctx.posts().filter(call => call.endpoint.includes('/products'));
  assert.equal(productPosts.length, 2);
  assert.deepEqual(productPosts[0].body, productPosts[1].body);
  assert.equal(productPosts[0].headers['PayPal-Request-Id'], productPosts[1].headers['PayPal-Request-Id']);
  assert.equal(ctx.read().operations.product.attemptedAt, first.operations.product.attemptedAt);
  assert.equal(ctx.products.size, 1); assert.equal(ctx.plans.size, 2);
});

test('A lost regular-plan response retries the same request ID and payload, preserving the product and creating no duplicate plan', async t => {
  let failed = false;
  const ctx = fixture(t, { afterCreated(kind) { if (kind === 'regular' && !failed) { failed = true; throw new Error('response lost'); } } });
  await assert.rejects(ctx.run(), safeError('SANDBOX_UNAVAILABLE'));
  const first = ctx.read(); assert.ok(first.operations.product.id); assert.equal(first.operations.regular.id, null);
  assert.equal(ctx.plans.size, 1);
  assert.equal((await ctx.run()).status, 'verified');
  const regularPosts = ctx.posts().filter(call => call.body.billing_cycles?.length === 1);
  assert.equal(regularPosts.length, 2); assert.deepEqual(regularPosts[0].body, regularPosts[1].body);
  assert.equal(regularPosts[0].headers['PayPal-Request-Id'], regularPosts[1].headers['PayPal-Request-Id']);
  assert.equal(ctx.read().operations.regular.attemptedAt, first.operations.regular.attemptedAt);
  assert.equal(ctx.products.size, 1); assert.equal(ctx.plans.size, 2);
});

test('An ID survives a detail-read failure and is subsequently GET-verified without another POST', async t => {
  let failed = false;
  const ctx = fixture(t, { beforeRequest(call, remote) {
    if (call.method === 'GET' && call.endpoint.endsWith(REGULAR) && remote.plans.has(REGULAR) && !failed) { failed = true; throw new Error('GET lost'); }
  } });
  await assert.rejects(ctx.run(), safeError('SANDBOX_UNAVAILABLE'));
  assert.equal(ctx.read().operations.regular.id, REGULAR);
  assert.equal((await ctx.run()).status, 'verified'); assert.equal(ctx.posts().length, 3);
});

test('Product ID and both plan payloads survive a failed product detail read as one local transition', async t => {
  let failed = false;
  const ctx = fixture(t, { beforeRequest(call) {
    if (call.method === 'GET' && call.endpoint.endsWith(PRODUCT) && !failed) { failed = true; throw new Error('GET lost'); }
  } });
  await assert.rejects(ctx.run(), safeError('SANDBOX_UNAVAILABLE'));
  const saved = ctx.read(); assert.equal(saved.operations.product.id, PRODUCT);
  assert.ok(['regular', 'trial'].every(name => saved.operations[name].body.product_id === PRODUCT));
  assert.ok(['regular', 'trial'].every(name => saved.operations[name].attemptedAt === null));
  assert.equal(ctx.posts().length, 1);
  assert.equal((await ctx.run()).status, 'verified'); assert.equal(ctx.posts().length, 3);
});

test('An uncertain plan attempt at 24 hours blocks POST, but explicit Status recovery allows completing the missing plan', async t => {
  const ctx = fixture(t, { afterCreated(kind) { if (kind === 'regular') throw new Error('response lost'); } });
  await assert.rejects(ctx.run(), safeError('SANDBOX_UNAVAILABLE'));
  const state = ctx.read(); state.operations.regular.attemptedAt = new Date(Date.now() - RETRY_WINDOW_MS).toISOString(); ctx.write(state);
  const count = ctx.posts().length;
  await assert.rejects(ctx.run(), safeError('RECOVERY_REQUIRED')); assert.equal(ctx.posts().length, count);
  const status = await ctx.run('Status', { regularPlanId: REGULAR });
  assert.equal(status.regularPlanStatus, 'verified'); assert.equal(status.trialPlanStatus, 'pending');
  assert.equal(ctx.posts().length, count);
  assert.equal((await ctx.run()).status, 'verified'); assert.equal(ctx.plans.size, 2);
});

test('An expired missing product cannot be posted again; a found product can be recovered without a new mutation', async t => {
  const ctx = fixture(t); const state = ctx.read();
  state.operations.product.attemptedAt = new Date(Date.now() - RETRY_WINDOW_MS - 1000).toISOString(); ctx.write(state);
  await assert.rejects(ctx.run(), safeError('RECOVERY_REQUIRED')); assert.equal(ctx.posts().length, 0);
  assert.equal((await ctx.run('Status')).status, 'pending'); assert.equal(ctx.posts().length, 0);
  assert.ok(ctx.calls.every(call => call.endpoint === '/v1/oauth2/token'));
  ctx.products.set(PRODUCT, { ...clone(state.operations.product.body), id: PRODUCT });
  const status = await ctx.run('Status', { productId: PRODUCT });
  assert.equal(status.productStatus, 'verified'); assert.equal(ctx.posts().length, 0);
  assert.equal(ctx.read().operations.product.id, PRODUCT);
  assert.ok(['regular', 'trial'].every(name => ctx.read().operations[name].body.product_id === PRODUCT));
  assert.equal((await ctx.run()).status, 'verified'); assert.equal(ctx.products.size, 1);
  assert.equal(ctx.posts().length, 2, 'Recovered product must never be POSTed again');
});

test('Wrong or live recovery IDs are rejected before authentication/network', async t => {
  const ctx = fixture(t);
  for (const recovery of [{ productId: 'JL-SBX-00000000000000000' }, { productId: 'PROD-short' }, { regularPlanId: 'P-9XU38461YG7706134NESJQWA' },
    { regularPlanId: REGULAR, trialPlanId: REGULAR }]) await assert.rejects(ctx.run('Status', recovery), safeError('RECOVERY_ID_MISMATCH'));
  await assert.rejects(ctx.run('Create', { regularPlanId: REGULAR }), safeError('RECOVERY_STATUS_ONLY'));
  assert.equal(ctx.calls.length, 0);
});

test('An explicit recovered product must have exactly the prepared identity and other fields before adoption', async t => {
  for (const change of [item => { item.name = 'Different merchant'; }, item => { item.description = 'Different product'; },
    item => { item.type = 'PHYSICAL'; }, item => { item.id = `PROD-${'B'.repeat(17)}`; },
    item => { item.home_url = 'https://jagdlatein.vercel.app/'; }]) {
    const ctx = fixture(t), item = { ...clone(ctx.prepared.conditions.product), id: PRODUCT };
    change(item); ctx.products.set(PRODUCT, item);
    const original = fs.readFileSync(ctx.statePath, 'utf8');
    await assert.rejects(ctx.run('Status', { productId: PRODUCT }), safeError('PRODUCT_MISMATCH'));
    assert.equal(fs.readFileSync(ctx.statePath, 'utf8'), original); assert.equal(ctx.posts().length, 0);
  }
});

test('A known product cannot be replaced by another recovery ID', async t => {
  const ctx = fixture(t); await ctx.run(); const count = ctx.calls.length;
  await assert.rejects(ctx.run('Status', { productId: `PROD-${'B'.repeat(17)}` }), safeError('RECOVERY_ID_MISMATCH'));
  assert.equal(ctx.calls.length, count);
});

test('A product with different conditions is preserved for diagnosis and prevents plan creation', async t => {
  const ctx = fixture(t, { transform(kind, item) { if (kind === 'product') item.type = 'PHYSICAL'; return item; } });
  await assert.rejects(ctx.run(), safeError('PRODUCT_MISMATCH'));
  assert.ok(ctx.read().operations.product.id); assert.equal(ctx.posts().length, 1);
  await assert.rejects(ctx.run(), safeError('PRODUCT_MISMATCH')); assert.equal(ctx.posts().length, 1);
});

const wrongPlans = {
  'wrong price': item => { item.billing_cycles.at(-1).pricing_scheme.fixed_price.value = '4.99'; },
  'wrong currency': item => { item.billing_cycles.at(-1).pricing_scheme.fixed_price.currency_code = 'CHF'; },
  'weekly billing': item => { item.billing_cycles.at(-1).frequency.interval_unit = 'WEEK'; },
  'finite billing': item => { item.billing_cycles.at(-1).total_cycles = 12; },
  'wrong product': item => { item.product_id = 'PROD-00000000000000000'; },
  'inactive plan': item => { item.status = 'INACTIVE'; },
  'extra setup fee': item => { item.payment_preferences.setup_fee.value = '1.00'; },
  'tax': item => { item.taxes = { percentage: '19', inclusive: false }; },
  'variable quantity': item => { item.quantity_supported = true; },
  'tiered prices': item => { item.billing_cycles.at(-1).pricing_scheme.tiers = []; },
  'disabled automatic billing': item => { item.payment_preferences.auto_bill_outstanding = false; },
  'different failure threshold': item => { item.payment_preferences.payment_failure_threshold = 0; },
  'unexpected redirect': item => { item.merchant_preferences = { return_url: 'https://jagdlatein.vercel.app/' }; },
};
for (const [name, change] of Object.entries(wrongPlans)) test(`Rejects ${name} without duplicating the known bad plan or creating the trial plan`, async t => {
  const ctx = fixture(t, { transform(kind, item) { if (kind === 'regular') change(item); return item; } });
  await assert.rejects(ctx.run(), safeError('PLAN_MISMATCH'));
  assert.equal(ctx.read().operations.regular.id, REGULAR); assert.equal(ctx.read().operations.trial.id, null);
  const count = ctx.posts().length; await assert.rejects(ctx.run(), safeError('PLAN_MISMATCH')); assert.equal(ctx.posts().length, count);
});

test('An omitted free-trial pricing scheme is accepted as documented; out-of-order cycle representations are normalized', async t => {
  const ctx = fixture(t, { transform(kind, item) { if (kind === 'trial') { delete item.billing_cycles[0].pricing_scheme; item.billing_cycles.reverse(); } return item; } });
  assert.equal((await ctx.run()).status, 'verified');
});

test('A trial longer than three days or a nonzero trial price is rejected', async t => {
  for (const change of [item => { item.billing_cycles[0].frequency.interval_count = 4; }, item => { item.billing_cycles[0].pricing_scheme.fixed_price.value = '1'; }]) {
    const ctx = fixture(t, { transform(kind, item) { if (kind === 'trial') change(item); return item; } });
    await assert.rejects(ctx.run(), safeError('PLAN_MISMATCH')); assert.equal(ctx.read().operations.trial.id, TRIAL);
  }
});

test('HTTP errors preserve only the numeric status, never response bodies/debug IDs/credentials', async t => {
  const ctx = fixture(t, { beforeRequest() { return response({ error: `${SECRET} ${TOKEN}`, debug_id: 'never-print-debug' }, 401); } });
  await assert.rejects(ctx.run(), error => { safeError('SANDBOX_REQUEST_FAILED', [SECRET, TOKEN, 'never-print-debug'])(error); assert.match(error.message, /HTTP 401/); return true; });
  assert.equal(ctx.posts().length, 0);
});

test('Product HTTP 400 diagnostics include only whitelisted exact error codes and field names', async t => {
  const ctx = fixture(t, { beforeRequest(call) {
    if (call.endpoint !== '/v1/catalogs/products') return;
    return response({ name: 'INVALID_REQUEST', message: SECRET, debug_id: TOKEN, details: [
      { issue: 'INVALID_PARAMETER_SYNTAX', field: '/id', value: SECRET, description: TOKEN },
      { issue: 'MISSING_REQUIRED_PARAMETER', field: 'type', value: TOKEN, description: SECRET },
      { issue: 'INVALID_STRING_MAX_LENGTH', field: '/name', value: SECRET, description: TOKEN },
    ], links: [{ href: `https://secret.invalid/${SECRET}` }] }, 400);
  } });
  await assert.rejects(ctx.run(), error => {
    safeError('SANDBOX_REQUEST_FAILED')(error);
    assert.match(error.message, /Schritt: Produkt; HTTP 400/);
    assert.match(error.message, /Code: INVALID_REQUEST/);
    assert.match(error.message, /Issue: INVALID_PARAMETER_SYNTAX, Feld: \/id/);
    assert.match(error.message, /Issue: MISSING_REQUIRED_PARAMETER, Feld: \/type/);
    assert.match(error.message, /Issue: INVALID_STRING_MAX_LENGTH, Feld: \/name/);
    assert.ok(!error.message.includes('secret.invalid')); return true;
  });
  assert.ok(ctx.read().operations.product.attemptedAt); assert.equal(ctx.read().operations.product.id, null);
  assert.ok(['regular', 'trial'].every(name => ctx.read().operations[name].attemptedAt === null));
});

test('Injected names, issues, fields, descriptions and header names are never echoed or partly matched', async t => {
  const ctx = fixture(t, { beforeRequest(call) {
    if (call.endpoint !== '/v1/catalogs/products') return;
    return response({ name: `INVALID_REQUEST${SECRET}`, description: SECRET, debug_id: TOKEN, details: [
      { issue: `INVALID_PARAMETER_SYNTAX${SECRET}`, field: `/id/${TOKEN}`, description: SECRET, value: TOKEN },
      { issue: SECRET, field: TOKEN, description: SECRET },
      { issue: 'MISSING_REQUIRED_PARAMETER', field: '/Authorization', value: TOKEN },
      { issue: 'INVALID_PARAMETER_VALUE', field: '/description', description: SECRET, value: TOKEN },
      { issue: TOKEN, field: 'type', description: SECRET },
    ] }, 400);
  } });
  await assert.rejects(ctx.run(), error => {
    safeError('SANDBOX_REQUEST_FAILED')(error);
    assert.ok(!error.message.includes('Code: INVALID_REQUEST')); assert.ok(!error.message.includes('INVALID_PARAMETER_SYNTAX'));
    assert.ok(!error.message.includes('/Authorization')); assert.ok(!error.message.includes('Feld: /id'));
    assert.match(error.message, /Issue: MISSING_REQUIRED_PARAMETER/);
    assert.match(error.message, /Issue: INVALID_PARAMETER_VALUE, Feld: \/description/);
    assert.match(error.message, /Feld: \/type/); return true;
  });
});

test('Diagnostic field names are isolated to the token, product or plan phase', async t => {
  for (const [endpoint, accepted, rejected] of [
    ['/v1/oauth2/token', '/grant_type', '/name'],
    ['/v1/catalogs/products', '/type', '/billing_cycles/0/frequency/interval_count'],
    ['/v1/billing/plans', '/billing_cycles/0/frequency/interval_count', '/grant_type'],
  ]) {
    const ctx = fixture(t, { beforeRequest(call) {
      if (call.endpoint === endpoint) return response({ name: 'INVALID_REQUEST', details: [
        { field: accepted, description: SECRET }, { field: rejected, description: TOKEN },
      ] }, 400);
    } });
    await assert.rejects(ctx.run(), error => {
      safeError('SANDBOX_REQUEST_FAILED')(error); assert.ok(error.message.includes(`Feld: ${accepted}`));
      assert.ok(!error.message.includes(`Feld: ${rejected}`)); return true;
    });
  }
});

test('Unknown error content and malformed error JSON retain only safe HTTP and phase information', async t => {
  for (const body of [response({ name: SECRET, details: [{ field: TOKEN, issue: SECRET, description: TOKEN }] }, 400),
    new Response(`${SECRET} ${TOKEN}`, { status: 400 })]) {
    const ctx = fixture(t, { beforeRequest() { return body; } });
    await assert.rejects(ctx.run(), error => {
      safeError('SANDBOX_REQUEST_FAILED')(error); assert.match(error.message, /Schritt: Zugangstoken; HTTP 400/);
      assert.ok(!error.message.includes('Erlaubte Diagnose')); return true;
    });
  }
});

for (const [phase, blockedEndpoint] of [
  ['Zugangstoken', '/v1/oauth2/token'], ['Produkt', '/v1/catalogs/products'], ['Plan', '/v1/billing/plans'],
]) test(`HTTP failure identifies only the fixed ${phase} step without resource IDs or provider bodies`, async t => {
  const ctx = fixture(t, { beforeRequest(call) {
    if (call.endpoint === blockedEndpoint || blockedEndpoint.endsWith('/') && call.endpoint.startsWith(blockedEndpoint))
      return response({ error: `${SECRET} ${TOKEN}`, debug_id: 'provider-debug-do-not-print', id: REGULAR }, 401);
  } });
  await assert.rejects(ctx.run(), error => {
    safeError('SANDBOX_REQUEST_FAILED', [SECRET, TOKEN, REGULAR, PRODUCT, 'provider-debug-do-not-print'])(error);
    assert.match(error.message, new RegExp(`Schritt: ${phase}; HTTP 401`)); return true;
  });
  if (phase === 'Zugangstoken') assert.ok(Object.values(ctx.read().operations).every(op => op.attemptedAt === null && op.id === null));
  if (phase === 'Produkt') {
    assert.ok(ctx.read().operations.product.attemptedAt); assert.equal(ctx.read().operations.product.id, null);
    assert.ok(['regular', 'trial'].every(name => ctx.read().operations[name].attemptedAt === null && ctx.read().operations[name].id === null));
  }
});

test('Authentication uses the exact UTF-8 client:secret Basic header and forwards only the returned Bearer token', async t => {
  const ctx = fixture(t); await ctx.run();
  const auth = ctx.calls[0];
  assert.equal(auth.endpoint, '/v1/oauth2/token'); assert.equal(auth.method, 'POST');
  assert.equal(auth.headers['Content-Type'], 'application/x-www-form-urlencoded');
  assert.equal(Buffer.from(auth.headers.Authorization.slice('Basic '.length), 'base64').toString('utf8'), `${CLIENT}:${SECRET}`);
  assert.equal(auth.body, 'grant_type=client_credentials');
  assert.ok(ctx.calls.slice(1).every(call => call.headers.Authorization === `Bearer ${TOKEN}`));
  assert.ok(ctx.calls.slice(1).every(call => !JSON.stringify(call.headers).includes(SECRET)));
});

test('Redirects and malformed response URLs never forward credentials to another host', async t => {
  const ctx = fixture(t, { beforeRequest() { return new Response(SECRET, { status: 302, headers: { location: 'https://api-m.paypal.com/v1/catalogs/products' } }); } });
  await assert.rejects(ctx.run(), safeError('SANDBOX_REQUEST_FAILED')); assert.equal(ctx.calls.length, 1);
  for (const value of ['https://api-m.paypal.com/v1/oauth2/token', `not-a-url-${SECRET}`]) {
    const other = fixture(t, { beforeRequest() { return { ok: true, status: 200, url: value, json: async () => ({ access_token: TOKEN }) }; } });
    await assert.rejects(other.run(), safeError('ENDPOINT_BLOCKED')); assert.equal(other.calls.length, 1);
  }
});

test('Malformed JSON and missing tokens produce safe errors without saving provider data', async t => {
  for (const malformed of [() => new Response(SECRET, { status: 200 }), () => response({ access_token: `${TOKEN}\n` })]) {
    const ctx = fixture(t, { beforeRequest() { return malformed(); } });
    await assert.rejects(ctx.run(), error => {
      assert.ok(['SANDBOX_RESPONSE_INVALID', 'SANDBOX_AUTH_FAILED'].includes(error.code));
      assert.ok(!error.message.includes(SECRET)); assert.ok(!error.message.includes(TOKEN)); return true;
    });
    assert.equal(ctx.calls.length, 1); assert.equal(ctx.posts().length, 0);
    assert.ok(!fs.readFileSync(ctx.statePath, 'utf8').includes(TOKEN));
  }
});

test('A missing known resource is never recreated', async t => {
  const ctx = fixture(t); await ctx.run(); ctx.plans.delete(REGULAR);
  const count = ctx.posts().length;
  await assert.rejects(ctx.run(), safeError('SANDBOX_REQUEST_FAILED')); assert.equal(ctx.posts().length, count);
});

test('Duplicate IDs or IDs from known live plans are never adopted from a provider response', async t => {
  for (const id of [REGULAR, 'P-0SN76115U1905643NNLBEIGQ']) {
    const ctx = fixture(t, { afterCreated(kind) { if (kind === 'trial') return response({ id }, 201); } });
    await assert.rejects(ctx.run(), safeError('SANDBOX_ID_INVALID')); assert.equal(ctx.read().operations.trial.id, null);
  }
});

test('CLI outputs one safe JSON document; unknown/duplicate args and live-secret fallback are blocked', t => {
  const ctx = fixture(t);
  const args = ['--client-id', CLIENT, '--state-path', ctx.statePath];
  const cli = extra => spawnSync(process.execPath, [CLI, ...extra, ...args], { encoding: 'utf8', env: {
    PAYPAL_SECRET: 'must-never-be-used', PAYPAL_CLIENT_SECRET: 'must-never-be-used', PAYPAL_API_BASE: 'https://api-m.paypal.com',
  } });
  let run = cli(['--prepare']); assert.equal(run.status, 0); assert.equal(run.stderr, '');
  assert.equal(JSON.parse(run.stdout).status, 'prepared');
  for (const extra of [['--status'], ['--prepare', '--prepare'], ['--prepare', '--create'], ['--prepare', '--secret', SECRET],
    ['--prepare', '--client-id', CLIENT], ['--prepare', '--product-id', REGULAR], ['constructor']]) {
    run = cli(extra); assert.equal(run.status, 1); assert.equal(run.stderr, '');
    const message = JSON.parse(run.stdout); assert.ok(message.error); assert.ok(message.code);
    assert.ok(!run.stdout.includes(SECRET)); assert.ok(!run.stdout.includes('must-never-be-used'));
  }
});
