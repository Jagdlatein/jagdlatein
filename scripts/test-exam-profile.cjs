// Isolated storage doubles only: no browser profile, account or user data is read.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const api = createLoader()('lib/exam-profile.js');
const { examCountries, EXAM_PROFILE_STORAGE_KEY: KEY, normalizeExamProfile, getExamProfileDetails, examProfileLawHref } = api;

function fixture(t, initial = {}) {
  const previousWindow = global.window;
  const values = new Map(Object.entries(initial));
  const reads = [], writes = [], removes = [], listeners = new Set();
  let denyRead = false, denyWrite = false, denyRemove = false, denyGetter = false, protocol;
  const storage = {
    getItem(key) { reads.push(key); if (denyRead) throw new Error('Read denied'); return values.get(key) ?? null; },
    setItem(key, value) { writes.push([key, value]); if (denyWrite) throw new Error('Write denied'); values.set(key, value); },
    removeItem(key) { removes.push(key); if (denyRemove) throw new Error('Remove denied'); values.delete(key); },
  };
  const target = {
    get localStorage() { if (denyGetter) throw new Error('Storage denied'); return storage; },
    addEventListener(name, listener) { assert.equal(name, 'storage'); listeners.add(listener); },
    removeEventListener(name, listener) { assert.equal(name, 'storage'); listeners.delete(listener); },
  };
  global.window = target;
  // Exercise the real subscribe/getSnapshot/getServerSnapshot protocol and its
  // independent consumer lifetimes, without a DOM or real persistent storage.
  const module = createLoader({ react: {
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
      protocol = { subscribe, getSnapshot, getServerSnapshot };
      return getSnapshot();
    },
  } })('lib/use-exam-profile.js');
  const hook = module.useExamProfile;
  const cleanups = new Set();
  t.after(() => { for (const cleanup of cleanups) cleanup(); global.window = previousWindow; });
  function mount() {
    hook();
    let notifications = 0, live = true;
    const unsubscribe = protocol.subscribe(() => { assert.ok(live, 'An unmounted consumer is not notified'); notifications++; });
    const cleanup = () => { if (!live) return; live = false; unsubscribe(); cleanups.delete(cleanup); };
    cleanups.add(cleanup);
    return { read: hook, close: cleanup, get notifications() { return notifications; } };
  }
  hook();
  return {
    hook, module, mount, values, storage, reads, writes, removes, target,
    get protocol() { return protocol; }, get listeners() { return listeners.size; },
    set denied(value) { denyGetter = value; },
    set readDenied(value) { denyRead = value; },
    set writeDenied(value) { denyWrite = value; },
    set removeDenied(value) { denyRemove = value; },
    event(event = {}) { for (const listener of [...listeners]) listener({ key: KEY, storageArea: storage, ...event }); },
  };
}

test('The compact catalog exactly preserves all 51 real regional codes/names without federal or legal data', () => {
  assert.equal(KEY, 'jl_exam_profile_v1');
  assert.deepEqual(examCountries.map(country => [country.code, country.regions.length]), [['CH', 26], ['AT', 9], ['DE', 16]]);
  for (const country of examCountries) {
    const dataset = JSON.parse(fs.readFileSync(path.join(root, `data/jagdrecht-regional/${country.slug}.json`), 'utf8'));
    assert.deepEqual(country.regions, dataset.regions.filter(region => region.code !== 'BUND').map(({ code, name }) => ({ code, name })));
    assert.deepEqual(Object.keys(country), ['code', 'slug', 'name', 'regionLabel', 'regions']);
    assert.equal(country.regionLabel, country.code === 'CH' ? 'Kanton' : 'Bundesland');
    assert.equal(new Set(country.regions.map(region => region.code)).size, country.regions.length);
    assert.ok(Object.isFrozen(country) && Object.isFrozen(country.regions));
    for (const region of country.regions) {
      assert.deepEqual(Object.keys(region), ['code', 'name']);
      assert.ok(Object.isFrozen(region));
    }
  }
  assert.ok(Object.isFrozen(examCountries));
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'lib/exam-profile.js'), 'utf8'), /import .*jagdrecht-regional|require\(.*jagdrecht-regional/);
});

test('Every exam target validates within its own country, returns only two fields and resolves exact details', () => {
  for (const country of examCountries) for (const region of country.regions) {
    const input = { country: country.code, region: region.code, note: 'Never persist notes' };
    const profile = normalizeExamProfile(input);
    assert.deepEqual(profile, { country: country.code, region: region.code });
    assert.ok(Object.isFrozen(profile)); assert.notEqual(profile, input);
    const details = getExamProfileDetails(profile);
    assert.equal(details.country, country); assert.equal(details.region, region);
  }
});

test('Invalid, repeated, inherited, cross-country and federal selections cannot become an exam target', () => {
  for (const value of [null, undefined, false, 0, 'CH:ZH', [], [{ country: 'CH', region: 'ZH' }], {},
    { country: ['CH'], region: 'ZH' }, { country: 'CH', region: ['ZH'] },
    { country: 'CH', region: ['ZH', 'BE'] }, { country: 'CH', region: '' },
    { country: '', region: 'ZH' }, { country: 'XX', region: 'ZH' },
    { country: 'CH', region: 'BY' }, { country: 'DE', region: 'ZH' }, { country: 'AT', region: 'BW' },
    { country: 'CH', region: 'BUND' }, { country: 'AT', region: 'BUND' }, { country: 'DE', region: 'BUND' },
    { country: 'ch', region: 'ZH' }, { country: 'CH', region: 'zh' }, { country: 'CH ', region: 'ZH' },
    Object.create({ country: 'CH', region: 'ZH' }), { country: 'CH', region: { toString: () => 'ZH' } }]) {
    assert.equal(normalizeExamProfile(value), null);
    assert.equal(getExamProfileDetails(value), null);
    assert.equal(examProfileLawHref(value), '/jagdrecht');
  }
});

test('Law destinations use canonical exact targets and encode only supported reading views', () => {
  for (const country of examCountries) for (const region of country.regions) {
    const profile = { country: country.code, region: region.code };
    const base = `/jagdrecht/${country.slug}?region=${region.code}`;
    assert.equal(examProfileLawHref(profile), base);
    assert.equal(examProfileLawHref(profile, 'wissen'), base);
    assert.equal(examProfileLawHref(profile, 'uebung'), `${base}&ansicht=uebung`);
    assert.equal(examProfileLawHref(profile, 'fragen'), `${base}&ansicht=fragen`);
    assert.equal(examProfileLawHref(profile, 'originale'), `${base}&ansicht=originale`);
    assert.equal(examProfileLawHref(profile, 'javascript:alert(1)'), base);
  }
});

test('Real React SSR always renders the stable unhydrated snapshot without storage reads or writes', () => {
  const previousWindow = global.window;
  let attempts = 0;
  global.window = { get localStorage() { attempts++; throw new Error('SSR must not touch storage'); } };
  try {
    const React = local('react');
    const { renderToStaticMarkup } = local('react-dom/server');
    const { default: useExamProfile, useExamProfile: named } = createLoader()('lib/use-exam-profile.js');
    assert.equal(useExamProfile, named);
    const read = () => { const s = useExamProfile(); return React.createElement('p', {}, `${s.ready}:${s.profile}:${s.persistence}`); };
    assert.equal(renderToStaticMarkup(React.createElement(read)), '<p>false:null:unknown</p>');
    assert.equal(renderToStaticMarkup(React.createElement(read)), '<p>false:null:unknown</p>');
    assert.equal(attempts, 0);
  } finally { global.window = previousWindow; }
});

test('Hydration reads only the explicit exam key; legacy legal browsing and ranking preferences are never imported', t => {
  const s = fixture(t, { jl_legal_region_v1: JSON.stringify({ country: 'DE', region: 'BY' }), jagd_country: 'AT' });
  const first = s.hook();
  assert.equal(first.ready, false); assert.equal(first.profile, null); assert.equal(first.persistence, 'unknown');
  assert.equal(s.hook(), first); assert.equal(s.protocol.getServerSnapshot(), first);
  const consumer = s.mount();
  assert.deepEqual(s.reads, [KEY]); assert.equal(s.writes.length, 0); assert.equal(s.removes.length, 0);
  assert.equal(consumer.read().ready, true); assert.equal(consumer.read().profile, null); assert.equal(consumer.read().persistence, 'device');
  assert.equal(s.listeners, 1);
  assert.equal(s.protocol.getServerSnapshot(), first, 'Hydration does not change the SSR snapshot');
});

test('Existing valid profile hydrates once for simultaneous consumers and same-tab explicit changes propagate with stable snapshots', t => {
  const s = fixture(t, { [KEY]: JSON.stringify({ country: 'CH', region: 'SG' }) });
  const a = s.mount(), b = s.mount();
  assert.equal(s.listeners, 1); assert.deepEqual(s.reads, [KEY]);
  assert.deepEqual(a.read().profile, { country: 'CH', region: 'SG' }); assert.equal(a.read(), b.read());
  const before = a.read(), bNotices = b.notifications;
  assert.equal(before.saveProfile({ country: 'AT', region: 'T', note: 'Private draft' }), true);
  const after = a.read();
  assert.deepEqual(after.profile, { country: 'AT', region: 'T' }); assert.equal(after, b.read());
  assert.equal(b.notifications, bNotices + 1); assert.equal(after.persistence, 'device');
  assert.equal(after.saveProfile, before.saveProfile); assert.equal(after.clearProfile, before.clearProfile);
  assert.deepEqual(JSON.parse(s.values.get(KEY)), { country: 'AT', region: 'T' });
  const notices = a.notifications;
  assert.equal(after.saveProfile({ country: 'AT', region: 'T' }), true);
  assert.equal(a.read(), after); assert.equal(a.notifications, notices, 'Equal explicit saves do not churn snapshots');
  a.close(); assert.equal(s.listeners, 1); b.close(); assert.equal(s.listeners, 0);
});

test('Malformed stored profiles are ignored without deleting storage or inventing a default target', t => {
  const s = fixture(t, { [KEY]: '{bad json' });
  const a = s.mount();
  assert.equal(a.read().profile, null); assert.equal(a.read().ready, true); assert.equal(a.read().persistence, 'device');
  assert.equal(s.values.get(KEY), '{bad json'); assert.deepEqual(s.writes, []); assert.deepEqual(s.removes, []);
  for (const invalid of [{ country: 'CH', region: 'BY' }, { country: 'DE', region: 'BUND' }, ['DE', 'BY']]) {
    const before = a.read();
    assert.equal(a.read().saveProfile(invalid), false); assert.equal(a.read(), before);
  }
  assert.deepEqual(s.writes, []);
});

test('Denied storage degrades to a useful session target; save and clear still report successful explicit commits', t => {
  const s = fixture(t); s.denied = true;
  const a = s.mount();
  assert.equal(a.read().ready, true); assert.equal(a.read().persistence, 'session'); assert.equal(a.read().profile, null);
  assert.equal(a.read().saveProfile({ country: 'DE', region: 'BY' }), true);
  assert.deepEqual(a.read().profile, { country: 'DE', region: 'BY' }); assert.equal(a.read().persistence, 'session');
  const before = a.read(); assert.equal(before.saveProfile({ country: 'DE', region: 'ZH' }), false); assert.equal(a.read(), before);
  assert.equal(a.read().clearProfile(), true); assert.equal(a.read().profile, null); assert.equal(a.read().persistence, 'session');
  assert.deepEqual(s.writes, []); assert.deepEqual(s.removes, []);
});

test('Failed writes and clears cannot resurrect an older device target after all consumers unmount', t => {
  const s = fixture(t, { [KEY]: JSON.stringify({ country: 'CH', region: 'BE' }) });
  const a = s.mount(); s.writeDenied = true;
  assert.equal(a.read().saveProfile({ country: 'DE', region: 'BW' }), true); assert.equal(a.read().persistence, 'session');
  a.close(); const b = s.mount(); assert.deepEqual(b.read().profile, { country: 'DE', region: 'BW' });
  s.removeDenied = true;
  assert.equal(b.read().clearProfile(), true); assert.equal(b.read().persistence, 'session'); b.close();
  const c = s.mount(); assert.equal(c.read().profile, null); assert.equal(c.read().persistence, 'session');
  assert.deepEqual(JSON.parse(s.values.get(KEY)), { country: 'CH', region: 'BE' });
  assert.deepEqual(s.reads, [KEY], 'Remount retains the explicit session commit rather than rereading a known older value');
});

test('Cross-tab events synchronize actual current storage, ignore other areas/keys and handle external removal or clearing', t => {
  const s = fixture(t, { [KEY]: JSON.stringify({ country: 'CH', region: 'ZH' }) });
  const a = s.mount(), before = a.read();
  s.values.set(KEY, JSON.stringify({ country: 'AT', region: 'W' }));
  s.event({ storageArea: {}, newValue: s.values.get(KEY) }); assert.equal(a.read(), before);
  s.event({ key: 'jl_legal_region_v1' }); assert.equal(a.read(), before);
  s.event({ key: 'jagd_country' }); assert.equal(a.read(), before);
  s.event({ newValue: JSON.stringify({ country: 'DE', region: 'BY' }) });
  assert.deepEqual(a.read().profile, { country: 'AT', region: 'W' }, 'A queued old event cannot override the present device value');
  assert.equal(a.read().persistence, 'device');
  s.values.set(KEY, JSON.stringify({ country: 'DE', region: 'BUND' })); s.event(); assert.equal(a.read().profile, null);
  s.values.set(KEY, JSON.stringify({ country: 'DE', region: 'SH' })); s.event();
  assert.deepEqual(a.read().profile, { country: 'DE', region: 'SH' });
  s.values.delete(KEY); s.event({ newValue: null }); assert.equal(a.read().profile, null);
  s.values.set(KEY, JSON.stringify({ country: 'CH', region: 'GR' })); s.event();
  s.values.clear(); s.event({ key: null, newValue: null }); assert.equal(a.read().profile, null);
  assert.deepEqual(s.writes, []); assert.deepEqual(s.removes, []);
});

test('Listener cleanup is exact and remount rereads missed device changes while denied reads preserve the current target', t => {
  const s = fixture(t, { [KEY]: JSON.stringify({ country: 'CH', region: 'TI' }) });
  const a = s.mount(), b = s.mount();
  a.close(); a.close(); assert.equal(s.listeners, 1);
  s.readDenied = true; const before = b.read();
  s.event({ storageArea: {} }); assert.equal(b.read(), before, 'Foreign storage areas stay ignored even if reads are denied');
  s.event(); assert.deepEqual(b.read().profile, { country: 'CH', region: 'TI' }); assert.equal(b.read().persistence, 'session');
  s.readDenied = false; s.event(); assert.equal(b.read().persistence, 'device');
  b.close(); assert.equal(s.listeners, 0);
  const notices = b.notifications;
  s.values.set(KEY, JSON.stringify({ country: 'DE', region: 'HE' })); s.event(); assert.equal(b.notifications, notices);
  const c = s.mount(); assert.deepEqual(c.read().profile, { country: 'DE', region: 'HE' }); assert.equal(s.listeners, 1);
  assert.deepEqual(s.reads, [KEY, KEY, KEY, KEY]);
  c.close(); assert.equal(s.listeners, 0);
});

test('Explicit clear touches only the exam key, propagates to other consumers and stays empty after remount', t => {
  const legacy = JSON.stringify({ country: 'AT', region: 'T' });
  const s = fixture(t, { [KEY]: JSON.stringify({ country: 'DE', region: 'BB' }), jl_legal_region_v1: legacy, jagd_country: 'CH', journal: 'Private notes' });
  const a = s.mount(), b = s.mount();
  assert.equal(a.read().clearProfile(), true); assert.equal(b.read().profile, null); assert.equal(b.read().persistence, 'device');
  assert.deepEqual(s.removes, [KEY]); assert.equal(s.values.get('jl_legal_region_v1'), legacy);
  assert.equal(s.values.get('jagd_country'), 'CH'); assert.equal(s.values.get('journal'), 'Private notes');
  a.close(); b.close(); const c = s.mount(); assert.equal(c.read().profile, null); assert.equal(c.read().ready, true);
});
