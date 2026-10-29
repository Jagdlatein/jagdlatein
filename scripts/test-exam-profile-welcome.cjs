// Actual component and actual profile-store lifetimes; synthetic storage only.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const KEY = 'jl_exam_profile_v1';
// Load the real shared layout in the server environment before browser doubles
// are attached; styled-jsx must not mistake that double for a complete DOM.
const Layout = createLoader()('components/LearningToolLayout.js').default;

function setup(t, options = {}) {
  const previous = global.window, values = new Map(options.profile ? [[KEY, JSON.stringify(options.profile)]] : []);
  const writes = [], removed = [], redirects = [], listeners = new Set(), frames = [], saveCalls = [];
  let denyWrite = options.denyWrite || false, denyRead = options.denyRead || false;
  let failNavigation = options.failNavigation || false, parentLive = true;
  const storage = { getItem(key) { if (denyRead) throw new Error('Read denied'); return values.get(key) ?? null; },
    setItem(key, value) { writes.push([key, value]); if (denyWrite) throw new Error('Write denied'); values.set(key, value); },
    removeItem(key) { removed.push(key); values.delete(key); } };
  global.window = { localStorage: storage, location: { replace(target) { redirects.push(target); if (failNavigation) throw new Error('Navigation denied'); } },
    addEventListener(name, listener) { if (name === 'storage') listeners.add(listener); },
    removeEventListener(name, listener) { if (name === 'storage') listeners.delete(listener); } };
  const slots = [], effects = []; let cursor = 0, changed = false, disposed = false, tree, protocol;
  const hooks = { ...React,
    useState(initial) { const i = cursor++; slots[i] ||= { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, input => { assert.equal(disposed, false, 'No state write after unmount'); const value = typeof input === 'function' ? input(slots[i].value) : input; changed ||= !Object.is(value, slots[i].value); slots[i].value = value; }]; },
    useRef(initial) { const i = cursor++; return slots[i] ||= { current: initial }; },
    useEffect(fn, deps) { const i = cursor++, old = slots[i]; if (!old || deps.some((value, index) => !Object.is(value, old.deps[index]))) { slots[i] = { deps, cleanup: old?.cleanup }; effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = fn(); }); } },
    useSyncExternalStore(subscribe, getSnapshot) { protocol = { subscribe, getSnapshot }; hooks.useEffect(() => subscribe(() => { assert.equal(disposed, false); changed = true; }), [subscribe]); return getSnapshot(); },
  };
  const deferred = { profile: options.profile || null, ready: options.ready !== false, persistence: options.persistence || 'device', saveProfile(value) { saveCalls.push(value); return options.rejectSave !== true; } };
  const overrides = { react: hooks, './LearningToolLayout': { __esModule: true, default: Layout } };
  if (options.deferred) overrides['../lib/use-exam-profile'] = { __esModule: true, default: () => deferred };
  const api = createLoader(overrides);
  const Component = api('components/ExamProfileWelcome.js').default;
  const props = { destination: options.destination || '/lernen', isCurrent: () => parentLive };
  function render() {
    for (let pass = 0; pass < 15; pass++) {
      cursor = 0; changed = false; tree = Component(props);
      frames.push({ forms: nodes(tree, node => node.type === 'form').length, text: text(tree) });
      while (effects.length) effects.shift()();
      if (!changed) return tree;
    }
    throw new Error('Welcome did not settle');
  }
  function dispose() { if (disposed) return; slots.forEach(slot => slot.cleanup?.()); disposed = true; }
  t.after(() => { dispose(); global.window = previous; }); render();
  return { writes, removed, values, redirects, frames, saveCalls, deferred, props, storage, render, dispose, get tree() { return tree; },
    controls: () => nodes(tree, node => node.type === 'select'),
    control(id) { return nodes(tree, node => node.props?.id === id)[0]; },
    button(label) { return nodes(tree, node => node.type === 'button' && text(node) === label)[0]; },
    change(id, value) { this.control(id).props.onChange({ target: { value } }); render(); },
    save() { nodes(tree, node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} }); render(); },
    click(label) { this.button(label).props.onClick(); render(); },
    commit(profile, persistence = 'device') { assert.ok(options.deferred); deferred.profile = profile; deferred.persistence = persistence; render(); },
    update(value) { Object.assign(props, value); render(); },
    parent(value) { parentLive = value; },
    external(profile) { if (profile) values.set(KEY, JSON.stringify(profile)); else values.delete(KEY); for (const listener of [...listeners]) listener({ key: KEY, storageArea: storage }); render(); },
    set failNavigation(value) { failNavigation = value; },
    get snapshot() { return protocol?.getSnapshot(); },
  };
}

test('Actual React SSR has exactly one page heading and a loading state without touching browser storage or painting a form', () => {
  const previous = global.window; let reads = 0;
  global.window = { get localStorage() { reads++; throw new Error('SSR cannot read storage'); } };
  try {
    const Welcome = createLoader()('components/ExamProfileWelcome.js').default;
    const html = renderToStaticMarkup(React.createElement(Welcome, { destination: '/lernen' }));
    assert.equal(reads, 0); assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.match(html, />Dein Prüfungsziel<\/h1>/); assert.match(html, /Dein Prüfungsziel wird geladen/);
    assert.doesNotMatch(html, /<form|<select|<dialog/);
  } finally { global.window = previous; }
});

test('A restored valid device profile redirects once to the exact safe destination with no choice flash or storage write', t => {
  const f = setup(t, { profile: { country: 'CH', region: 'ZH' }, destination: '/kurse/wissen-jagdrecht-ch#lesson-rahmen' });
  assert.deepEqual(f.redirects, ['/kurse/wissen-jagdrecht-ch#lesson-rahmen']);
  assert.equal(nodes(f.tree, node => node.type === 'a' && text(node) === 'Weiter')[0].props.href, '/kurse/wissen-jagdrecht-ch#lesson-rahmen');
  assert.ok(f.frames.every(frame => frame.forms === 0));
  assert.deepEqual(f.writes, []); assert.deepEqual(f.removed, []);
  f.render(); f.render(); assert.equal(f.redirects.length, 1);
});

test('All51 region choices start empty, are offered under their exact country and remain unsaved drafts', t => {
  const f = setup(t);
  assert.equal(f.control('exam-welcome-country').props.value, ''); assert.equal(f.control('exam-welcome-region').props.value, '');
  const { examCountries } = createLoader()('lib/exam-profile.js'); let count = 0;
  for (const country of examCountries) {
    f.change('exam-welcome-country', country.code);
    assert.equal(f.control('exam-welcome-region').props.value, '');
    const options = nodes(f.control('exam-welcome-region'), node => node.type === 'option' && node.props.value);
    assert.deepEqual(options.map(option => [option.props.value, text(option)]), country.regions.map(region => [region.code, region.name]));
    count += options.length;
  }
  assert.equal(count, 51); assert.deepEqual(f.writes, []); assert.deepEqual(f.redirects, []);
});

test('A real explicit save persists only country/region before document navigation and double submissions cannot repeat it', t => {
  const f = setup(t, { destination: '/preise?next=%2Flernen' });
  f.change('exam-welcome-country', 'AT'); f.change('exam-welcome-region', 'NOE');
  const submit = nodes(f.tree, node => node.type === 'form')[0].props.onSubmit;
  submit({ preventDefault() {} }); submit({ preventDefault() {} }); f.render();
  assert.deepEqual(f.writes, [[KEY, JSON.stringify({ country: 'AT', region: 'NOE' })]]);
  assert.deepEqual(f.redirects, ['/preise?next=%2Flernen']);
  assert.deepEqual(f.snapshot.profile, { country: 'AT', region: 'NOE' });
  assert.equal(f.snapshot.persistence, 'device');
  assert.doesNotMatch(JSON.stringify(f.writes), /destination|email|code|next/);
});

test('Acceptance without an actual profile-store commit never redirects; only the matching real committed target unlocks continuation', t => {
  const f = setup(t, { deferred: true });
  f.change('exam-welcome-country', 'DE'); f.change('exam-welcome-region', 'BY'); f.save();
  assert.deepEqual(f.saveCalls, [{ country: 'DE', region: 'BY' }]); assert.deepEqual(f.redirects, []);
  assert.equal(f.control('exam-welcome-country').props.disabled, true);
  f.render(); assert.deepEqual(f.redirects, []);
  f.commit({ country: 'DE', region: 'BY' }); assert.deepEqual(f.redirects, ['/lernen']);
});

test('A rejected save stays on the form with a retryable message and does not silently navigate or choose another target', t => {
  const f = setup(t, { deferred: true, rejectSave: true });
  f.change('exam-welcome-country', 'CH'); f.change('exam-welcome-region', 'BE'); f.save();
  assert.match(text(f.tree), /konnte nicht übernommen/); assert.deepEqual(f.redirects, []);
  assert.equal(f.control('exam-welcome-region').props.value, 'BE');
  assert.equal(f.button('Speichern und weiter').props.disabled, false);
});

test('Skipping is explicit, never changes storage and navigates only once', t => {
  const f = setup(t, { destination: '/konto' });
  const skip = f.button('Später auswählen').props.onClick;
  skip(); skip(); f.render();
  assert.deepEqual(f.redirects, ['/konto']); assert.deepEqual(f.writes, []); assert.deepEqual(f.removed, []);
});

test('Blocked storage keeps the selection on the current page and warns of loss before an explicit hard-navigation acknowledgement', t => {
  const f = setup(t, { denyWrite: true });
  f.change('exam-welcome-country', 'AT'); f.change('exam-welcome-region', 'S'); f.save();
  assert.equal(f.snapshot.persistence, 'session'); assert.deepEqual(f.redirects, []);
  assert.match(text(f.tree), /nur auf dieser geöffneten Seite/); assert.match(text(f.tree), /beim Weitergehen verloren gehen/);
  assert.equal(nodes(f.tree, node => node.type === 'form').length, 0);
  const writes = f.writes.length; f.click('Trotzdem weiter');
  assert.deepEqual(f.redirects, ['/lernen']); assert.equal(f.writes.length, writes);
  assert.equal(f.values.has(KEY), false);
});

test('An already held RAM-only preference shows its limitation without a form flash or automatic document navigation', t => {
  const f = setup(t, { deferred: true, profile: { country: 'DE', region: 'BY' }, persistence: 'session' });
  assert.ok(f.frames.every(frame => frame.forms === 0)); assert.deepEqual(f.redirects, []);
  assert.match(text(f.tree), /Bayern · Deutschland/); assert.ok(f.button('Trotzdem weiter'));
});

test('External-tab restoration supersedes a draft; captured save and skip actions cannot overwrite the new profile', t => {
  const f = setup(t);
  f.change('exam-welcome-country', 'AT'); f.change('exam-welcome-region', 'NOE');
  const submit = nodes(f.tree, node => node.type === 'form')[0].props.onSubmit, skip = f.button('Später auswählen').props.onClick;
  f.external({ country: 'CH', region: 'ZH' });
  submit({ preventDefault() {} }); skip(); f.render();
  assert.deepEqual(f.writes, []); assert.deepEqual(f.snapshot.profile, { country: 'CH', region: 'ZH' });
  assert.deepEqual(f.redirects, ['/lernen']); assert.equal(nodes(f.tree, node => node.type === 'form').length, 0);
});

test('Draft revision and destination origins invalidate captured actions before rerender or cleanup', t => {
  const f = setup(t), region = f.control('exam-welcome-region').props.onChange, skip = f.button('Später auswählen').props.onClick;
  f.control('exam-welcome-country').props.onChange({ target: { value: 'AT' } });
  region({ target: { value: 'ZH' } }); skip(); f.render();
  assert.equal(f.control('exam-welcome-region').props.value, ''); assert.deepEqual(f.redirects, []);
  const oldSkip = f.button('Später auswählen').props.onClick;
  f.update({ destination: '/konto' }); oldSkip(); assert.deepEqual(f.redirects, []);
  f.click('Später auswählen'); assert.deepEqual(f.redirects, ['/konto']);
});

test('Parent authorization guards stop old save, skip and initial automatic navigation before child effect cleanup', t => {
  const f = setup(t); f.change('exam-welcome-country', 'AT'); f.change('exam-welcome-region', 'NOE');
  const save = nodes(f.tree, node => node.type === 'form')[0].props.onSubmit, skip = f.button('Später auswählen').props.onClick;
  f.parent(false); save({ preventDefault() {} }); skip();
  assert.deepEqual(f.writes, []); assert.deepEqual(f.redirects, []);
  f.external({ country: 'CH', region: 'ZH' }); assert.deepEqual(f.redirects, []);
});

test('A real unmount blocks captured form actions after an accepted save is still awaiting its store commit', t => {
  const f = setup(t, { deferred: true }); f.change('exam-welcome-country', 'AT'); f.change('exam-welcome-region', 'NOE');
  const submit = nodes(f.tree, node => node.type === 'form')[0].props.onSubmit, skip = f.button('Später auswählen').props.onClick;
  f.save(); f.dispose(); submit({ preventDefault() {} }); skip();
  assert.equal(f.saveCalls.length, 1); assert.deepEqual(f.redirects, []);
});

test('Throwing document navigation does not loop and offers independently guarded repeated retries and a safe direct link', t => {
  const f = setup(t, { profile: { country: 'CH', region: 'ZH' }, failNavigation: true, destination: '/konto' });
  assert.equal(f.redirects.length, 1); f.render(); f.render(); assert.equal(f.redirects.length, 1);
  const oldRetry = f.button('Erneut weiter').props.onClick;
  oldRetry(); oldRetry(); f.render(); assert.equal(f.redirects.length, 2);
  f.click('Erneut weiter'); assert.equal(f.redirects.length, 3);
  const link = nodes(f.tree, node => node.type === 'a')[0]; assert.equal(link.props.href, '/konto');
  let prevented = 0; f.parent(false); link.props.onClick({ preventDefault() { prevented++; } });
  assert.equal(prevented, 1);
  f.parent(true); f.failNavigation = false; f.click('Erneut weiter'); assert.equal(f.redirects.length, 4);
});

test('Unsafe destinations are normalized by the existing login guard and never become external navigation or stored fields', t => {
  for (const destination of ['https://evil.invalid', '//evil.invalid', '/\\evil.invalid', '/login?next=/konto', '/%2F%2Fevil.invalid', '/registrieren', '/%5Cevil']) {
    const f = setup(t, { profile: { country: 'CH', region: 'ZH' }, destination });
    assert.deepEqual(f.redirects, ['/']); assert.deepEqual(f.writes, []); f.dispose();
  }
  const source = fs.readFileSync(path.join(root, 'components/ExamProfileWelcome.js'), 'utf8');
  assert.doesNotMatch(source, /fetch\(|document\.cookie|sessionStorage|localStorage|router\.push|clearProfile|PageMenu|<dialog/);
  assert.match(source, /getLoginContinuation\(destination\)/);
});
