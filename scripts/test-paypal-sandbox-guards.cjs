const test = require('node:test');
const assert = require('node:assert/strict');
const { API, REQUIRED_EVENTS, validateDatabaseConfig, validateConfig, validatePlan, inspect } = require('./paypal-sandbox-check.cjs');
const regularId = 'P-AAAAAAAAAAAAAAAAAAAAAAAA';
const trialId = 'P-BBBBBBBBBBBBBBBBBBBBBBBB';
function configuration(overrides = {}) { return {
  version: 1, apiBase: API, testUrl: 'https://jagdlatein-isolated-test.vercel.app',
  publicUrl: 'https://jagdlatein.vercel.app', testSupabaseUrl: 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co',
  publicSupabaseUrl: 'https://bbbbbbbbbbbbbbbbbbbb.supabase.co', clientId: 'sandbox-client-id-for-isolated-test',
  regularPlanId: regularId, trialPlanId: trialId, webhookId: 'SANDBOX123456',
  separateDatabaseConfirmed: true, mailSinkConfirmed: true, ...overrides,
}; }
function plan(trial) { return { id: trial ? trialId : regularId, status: 'ACTIVE', billing_cycles: [
  ...(trial ? [{ tenure_type: 'TRIAL', sequence: 1, total_cycles: 1,
    frequency: { interval_unit: 'DAY', interval_count: 3 },
    pricing_scheme: { fixed_price: { value: '0.00', currency_code: 'EUR' } } }] : []),
  { tenure_type: 'REGULAR', sequence: trial ? 2 : 1, total_cycles: 0,
    frequency: { interval_unit: 'MONTH', interval_count: 1 },
    pricing_scheme: { fixed_price: { value: '5.00', currency_code: 'EUR' } } },
] }; }
test('Only explicit separate sandbox targets pass prerequisite validation', () => {
  assert.equal(validateConfig(configuration()).apiBase, API);
  for (const change of [
    { apiBase: 'https://api-m.paypal.com' }, { apiBase: undefined },
    { testUrl: 'https://jagdlatein.vercel.app' }, { testUrl: 'https://jagdlatein.de' },
    { testUrl: 'https://jagdlatein-isolated-test.vercel.app/?secret=unsafe' },
    { testUrl: 'https://user:pass@jagdlatein-isolated-test.vercel.app' },
    { publicSupabaseUrl: 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co' },
    { publicSupabaseUrl: '' }, { separateDatabaseConfirmed: false }, { mailSinkConfirmed: false },
    { trialPlanId: 'P-0SN76115U1905643NNLBEIGQ' }, { regularPlanId: 'P-9XU38461YG7706134NESJQWA' },
    { regularPlanId: trialId }, { paypalSecret: 'do-not-save' },
  ]) assert.throws(() => validateConfig(configuration(change)));
});
test('Invalid isolation is rejected before any credential or network operation', async () => {
  let requests = 0;
  await assert.rejects(inspect(configuration({ testUrl: 'https://jagdlatein.vercel.app' }), {}, async () => { requests++; }));
  assert.equal(requests, 0);
  await assert.rejects(inspect(configuration(), {}, async () => { requests++; }), /fehlen/);
  assert.equal(requests, 0);
});
test('SQL preparation needs separate database targets before the app, webhook or mail sink exists', () => {
  const preparing = configuration({ testUrl: '', publicUrl: '', webhookId: '', clientId: '',
    regularPlanId: '', trialPlanId: '', mailSinkConfirmed: false });
  assert.equal(validateDatabaseConfig(preparing), preparing);
  assert.throws(() => validateConfig(preparing));
  for (const change of [
    { apiBase: 'https://api-m.paypal.com' }, { apiBase: undefined },
    { publicSupabaseUrl: preparing.testSupabaseUrl }, { publicSupabaseUrl: '' },
    { separateDatabaseConfirmed: false }, { testSupabaseUrl: 'https://user:pass@aaaaaaaaaaaaaaaaaaaa.supabase.co' },
    { testSupabaseUrl: 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co/?secret=unsafe' },
    { paypalSecret: 'do-not-save' }, { version: 2 },
  ]) assert.throws(() => validateDatabaseConfig({ ...preparing, ...change }));
});
test('Plan checks reject wrong trial duration, price, inactive plan and fees', () => {
  assert.equal(validatePlan(plan(true), trialId, true), true);
  assert.equal(validatePlan(plan(false), regularId, false), true);
  for (const mutate of [
    value => { value.status = 'INACTIVE'; },
    value => { value.billing_cycles[0].frequency.interval_count = 4; },
    value => { value.billing_cycles[1].pricing_scheme.fixed_price.value = '5.50'; },
    value => { value.billing_cycles[0].pricing_scheme.fixed_price.value = '1.00'; },
    value => { value.payment_preferences = { setup_fee: { value: '1.00' } }; },
    value => { value.quantity_supported = true; },
  ]) { const value = plan(true); mutate(value); assert.throws(() => validatePlan(value, trialId, true)); }
});
test('Read-only check cannot create contracts or write database records and reports provider lifecycle pending', async () => {
  const config = configuration(); const requests = [];
  const report = await inspect(config, { paypalSecret: 'isolated-fake-secret', databaseKey: 'isolated-fake-key' }, async (url, options) => {
    requests.push({ url: new URL(url), options });
    const parsed = new URL(url);
    if (parsed.origin === API) {
      if (parsed.pathname === '/v1/oauth2/token') return Response.json({ access_token: 'isolated-fake-token' });
      if (parsed.pathname.endsWith(regularId)) return Response.json(plan(false));
      if (parsed.pathname.endsWith(trialId)) return Response.json(plan(true));
      if (parsed.pathname.endsWith(config.webhookId)) return Response.json({ id: config.webhookId,
        url: `${config.testUrl}/api/paypal/webhook`, event_types: REQUIRED_EVENTS.map(name => ({ name })) });
    }
    if (parsed.origin === config.testSupabaseUrl) return Response.json([]);
    if (parsed.origin === config.testUrl) return Response.json({ planId: trialId, trialDays: 3, amount: '5.00', currency: 'EUR' });
    throw new Error('Unexpected target');
  });
  assert.equal(report.setup, 'passed'); assert.equal(report.providerLifecycle, 'pending');
  assert.equal(report.paymentsCreated, 0); assert.equal(report.databaseWrites, 0);
  assert.ok(!JSON.stringify(report).includes('fake-secret')); assert.ok(!JSON.stringify(report).includes(config.clientId));
  assert.equal(requests.filter(call => call.options.method === 'POST').length, 1);
  assert.ok(requests.filter(call => call.options.method === 'POST').every(call => call.url.pathname === '/v1/oauth2/token'));
  assert.ok(requests.every(call => call.options.redirect === 'manual'));
  assert.ok(requests.filter(call => call.url.hostname.endsWith('.supabase.co')).every(call => call.url.searchParams.get('limit') === '0'));
  assert.ok(requests.every(call => ![config.publicUrl, config.publicSupabaseUrl].includes(call.url.origin)));
});
test('Wrong webhook target and provider redirects cannot leak credentials through redirection', async () => {
  for (const redirect of [false, true]) {
    let requests = 0;
    await assert.rejects(inspect(configuration(), { paypalSecret: 'fake', databaseKey: 'fake' }, async (url) => {
      requests++;
      if (redirect) return new Response(null, { status: 302, headers: { location: 'https://api-m.paypal.com/' } });
      if (url.endsWith('/token')) return Response.json({ access_token: 'fake-token' });
      if (url.endsWith(regularId)) return Response.json(plan(false));
      if (url.endsWith(trialId)) return Response.json(plan(true));
      return Response.json({ id: 'SANDBOX123456', url: 'https://jagdlatein.vercel.app/api/paypal/webhook', event_types: [{ name: '*' }] });
    }), /HTTP 302|Webhook/);
    assert.equal(requests, redirect ? 1 : 4);
  }
});
module.exports = { configuration, plan };
