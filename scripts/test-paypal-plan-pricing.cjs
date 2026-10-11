const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const OLD_REGULAR = 'P-9XU38461YG7706134NESJQWA', OLD_TRIAL = 'P-0SN76115U1905643NNLBEIGQ';
const NEW_REGULAR = 'P-AAAAAAAAAAAAAAAAAAAAAAAA', NEW_TRIAL = 'P-BBBBBBBBBBBBBBBBBBBBBBBB';
const UNKNOWN_TRIAL = 'P-CCCCCCCCCCCCCCCCCCCCCCCC';
const ENV = { PAYPAL_PLAN_PRICES: JSON.stringify({ [NEW_REGULAR]: '10.00', [NEW_TRIAL]: '10.00' }),
  PAYPAL_TRIAL_PLAN_IDS: `${OLD_TRIAL},${NEW_TRIAL},${UNKNOWN_TRIAL}`, NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID: NEW_TRIAL };
function setup(env = ENV) {
  const context = vm.createContext({ process: { env }, Date, Buffer, URL, Response, AbortSignal,
    fetch: async () => { throw Error('Pricing tests must not contact PayPal'); } });
  const cache = new Map();
  function load(relative) {
    const filename = path.join(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} }; cache.set(filename, mod);
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename,
      jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
    const requireLocal = id => {
      if (id === '@supabase/supabase-js') return { createClient() { throw Error('Pricing tests must not open a remote database'); } };
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), `${id}.js`)));
      return pr(id);
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(requireLocal, mod, mod.exports);
    return mod.exports;
  }
  return { pricing: load('lib/paypal-plan-pricing.js'), access: load('lib/subscription-access.js') };
}
function plan(trial, amount) { return { quantity_supported: false, billing_cycles: [
  ...(trial ? [{ tenure_type: 'TRIAL', sequence: 1, total_cycles: 1,
    frequency: { interval_unit: 'DAY', interval_count: 3 }, pricing_scheme: { fixed_price: { value: '0.00', currency_code: 'EUR' } } }] : []),
  { tenure_type: 'REGULAR', sequence: trial ? 2 : 1, total_cycles: 0,
    frequency: { interval_unit: 'MONTH', interval_count: 1 }, pricing_scheme: { fixed_price: { value: amount, currency_code: 'EUR' } } },
] }; }

test('Each new tariff is bound to its own 10-EUR plan ID; historical live plans remain 5 EUR', () => {
  const { access } = setup();
  for (const [id, trial, amount] of [[OLD_REGULAR, false, '5.00'], [OLD_TRIAL, true, '5.00'],
    [NEW_REGULAR, false, '10.00'], [NEW_TRIAL, true, '10.00']]) {
    const policy = access.regularAccessPolicy({ plan_id: id }, plan(trial, amount));
    assert.equal(policy.reviewReason, null); assert.equal(policy.amount, `${amount}0`); assert.equal(policy.currency, 'EUR');
    for (const wrong of ['4.00', amount === '5.00' ? '10.00' : '5.00'])
      assert.ok(access.regularAccessPolicy({ plan_id: id }, plan(trial, wrong)).reviewReason);
  }
  assert.equal(access.regularAccessPolicy({ plan_id: UNKNOWN_TRIAL }, plan(true, '10.00')).reviewReason, 'unsupported_trial_plan');
  assert.equal(access.regularAccessPolicy({ plan_id: NEW_TRIAL }, plan(true, '10.00')).trial, true);
});

test('Malformed maps and attempts to change historical prices fail closed', () => {
  const { pricing } = setup();
  for (const raw of ['{', 'null', '[]', JSON.stringify({ [OLD_TRIAL]: '10.00' }),
    JSON.stringify({ [NEW_TRIAL]: '7.00' }), JSON.stringify({ [NEW_TRIAL]: 10 }), JSON.stringify({ arbitrary: '10.00' })]) {
    assert.throws(() => pricing.paypalPlanPricing(NEW_TRIAL, { PAYPAL_PLAN_PRICES: raw }));
    assert.equal(setup({ ...ENV, PAYPAL_PLAN_PRICES: raw }).access.regularAccessPolicy({ plan_id: NEW_TRIAL }, plan(true, '10.00')).reviewReason,
      'unsupported_plan_price_configuration');
  }
  assert.equal(pricing.paypalPlanPricing(NEW_TRIAL, {}), null);
  assert.equal(pricing.paypalPlanPricing(OLD_TRIAL, {}).amount, '5.000');
});

test('New monthly tariffs reject altered currency, cycle, trial, overrides and extra charges', () => {
  const { access } = setup();
  for (const trial of [false, true]) for (const mutate of [
    value => { value.billing_cycles.at(-1).pricing_scheme.fixed_price.currency_code = 'CHF'; },
    value => { value.billing_cycles.at(-1).frequency.interval_unit = 'WEEK'; },
    value => { value.billing_cycles.at(-1).frequency.interval_count = 2; },
    value => { value.billing_cycles.at(-1).total_cycles = 12; },
    value => { value.quantity_supported = true; },
    value => { value.payment_preferences = { setup_fee: { value: '1.00', currency_code: 'EUR' } }; },
    value => { value.taxes = { percentage: '5' }; },
  ]) {
    const value = plan(trial, '10.00'); mutate(value);
    assert.ok(access.regularAccessPolicy({ plan_id: trial ? NEW_TRIAL : NEW_REGULAR }, value).reviewReason);
  }
  for (const mutate of [value => { value.billing_cycles[0].frequency.interval_count = 4; },
    value => { value.billing_cycles[0].pricing_scheme.fixed_price.value = '1.00'; }]) {
    const value = plan(true, '10.00'); mutate(value);
    assert.ok(access.regularAccessPolicy({ plan_id: NEW_TRIAL }, value).reviewReason);
  }
  assert.ok(access.regularAccessPolicy({ plan_id: NEW_TRIAL, plan_overridden: true }, plan(true, '10.00')).reviewReason);
});

test('Cancelling a previously paid five-euro contract retains access only until its paid expiry', () => {
  const { access } = setup(); const now = Date.parse('2026-10-11T12:00:00Z');
  const until = '2026-10-12T12:00:00Z';
  const rows = [{ subscription_id: 'I-PAIDLEGACY123', plan_id: OLD_TRIAL, status: 'CANCELLED',
    paid_until: until, review_reason: null, verified_at: '2026-10-11T12:00:00Z' }];
  assert.equal(access.regularAccessPolicy({ plan_id: OLD_TRIAL }, plan(true, '5.00')).reviewReason, null);
  const active = access.accessFromSubscriptions(rows, now);
  assert.equal(active.paid, true); assert.equal(Date.parse(active.paidUntil), Date.parse(until));
  assert.equal(access.accessFromSubscriptions(rows, Date.parse(until)).paid, false);
  assert.equal(rows[0].status, 'CANCELLED'); assert.equal(rows[0].paid_until, until);
});
