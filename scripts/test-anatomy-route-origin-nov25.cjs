const test = require('node:test'), assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const { anatomyRoute } = createLoader()('lib/anatomy-navigation.js');
const raw = '/lernen/anatomie?eintrag=schaedel&ref=one&ref=two#anatomie-modell';
const current = () => ({ isReady: true, asPath: raw, query: { eintrag: 'schaedel', ref: ['one', 'two'] } });

test('Anatomy SSR readiness requires the exact local route and all raw query values, including unknown repeated values and their types', () => {
  assert.equal(typeof window, 'undefined');
  assert.equal(anatomyRoute(current()).ready, true);
  assert.equal(anatomyRoute({ isReady: true, asPath: '/lernen/anatomie', query: {} }).ready, true);
  for (const path of [undefined, '', 'https://example.invalid/lernen/anatomie', '//example.invalid/lernen/anatomie', '/lernen/lernkarten', '/lernen/anatomie/', '/lernen/ana\\tomie', '/lernen/anatomie\n']) assert.equal(anatomyRoute({ ...current(), asPath: path }).ready, false);
  for (const query of [null, [], {}, { eintrag: 'schaedel', ref: ['two', 'one'] }, { eintrag: ['schaedel'], ref: ['one', 'two'] }, { eintrag: 'schaedel', ref: 1 }, { eintrag: 'schaedel', ref: [1, 2] }, { eintrag: 'schaedel', ref: ['one', 2n] }]) assert.equal(anatomyRoute({ ...current(), query }).ready, false);
  assert.equal(anatomyRoute({ ...current(), isReady: false }).ready, false);
});

test('A live browser must agree exactly with raw query encoding and hash; becoming coherent requires no mutation of learner state', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const address = new URL(raw, 'https://jagdlatein.test');
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: { location: { pathname: address.pathname, search: address.search, hash: address.hash } } });
  try {
    const router = current(), good = anatomyRoute(router);
    assert.equal(good.ready, true);
    window.location.hash = '#foreign';
    assert.equal(anatomyRoute(router).ready, false); assert.notEqual(anatomyRoute(router).origin, good.origin);
    window.location.hash = address.hash; window.location.search = '?ref=one&ref=two&eintrag=schaedel';
    assert.equal(anatomyRoute(router).ready, false, 'Equivalent decoded values do not certify a different raw browser address');
    window.location.search = address.search;
    assert.deepEqual(anatomyRoute(router), good);
    router.query.ref.reverse(); assert.equal(anatomyRoute(router).ready, false);
    router.query.ref.reverse(); assert.deepEqual(anatomyRoute(router), good);
    window.location = {}; assert.equal(anatomyRoute(router).ready, false, 'A browser-shaped context without an address is not SSR');
  } finally { if (previous) Object.defineProperty(globalThis, 'window', previous); else delete globalThis.window; }
});
