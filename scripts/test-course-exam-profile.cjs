const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader();
const { learningModules } = load('lib/learning-curriculum.js');
const scope = load('components/CourseCountryScope.js');
const mixed = learningModules.find(module => module.id === 'wissen-vertiefung-recht-pruefmethode');
const single = learningModules.find(module => module.id === 'wissen-jagdrecht-ch');
const ready = profile => ({ ready: true, profile });
const key = 'jl_exam_profile_v1';

function setup(t, { module = mixed, country = null, profile = { country: 'CH', region: 'ZH' } } = {}) {
  const previous = global.window;
  const values = new Map(profile ? [[key, JSON.stringify(profile)]] : []), writes = [], removed = [], subscribers = new Set();
  const browserStorage = { getItem: name => values.get(name) ?? null, setItem(name, value) { writes.push([name, value]); values.set(name, value); }, removeItem(name) { removed.push(name); values.delete(name); } };
  global.window = { localStorage: browserStorage, addEventListener(name, callback) { if (name === 'storage') subscribers.add(callback); }, removeEventListener(name, callback) { if (name === 'storage') subscribers.delete(callback); } };
  const slots = [], pending = [], chosen = []; let cursor = 0, changed = false, tree, disposed = false, snapshot;
  const props = { module, country, onChoose(value) { assert.equal(disposed, false, 'No course choice after unmount'); chosen.push(value); props.country = value; changed = true; } };
  const hooks = { ...React,
    useRef(initial) { const i = cursor++; return slots[i] ||= { current: initial }; },
    useEffect(fn, deps) { const i = cursor++, old = slots[i]; if (!old || deps.some((value, index) => !Object.is(value, old.deps[index]))) { slots[i] = { deps, cleanup: old?.cleanup }; pending.push(() => { slots[i].cleanup?.(); slots[i].cleanup = fn(); }); } },
    useSyncExternalStore(subscribe, getSnapshot) { hooks.useEffect(() => subscribe(() => { assert.equal(disposed, false); changed = true; }), [subscribe]); return getSnapshot(); },
  };
  const api = createLoader({ react: hooks });
  const components = api('components/CourseCountryScope.js');
  const useProfile = api('lib/use-exam-profile.js').default;
  function render() {
    for (let pass = 0; pass < 12; pass++) {
      cursor = 0; changed = false;
      snapshot = useProfile();
      tree = React.createElement(React.Fragment, null, components.CourseCountryNote(props), components.CourseCountryMenu(props));
      while (pending.length) pending.shift()();
      if (!changed) return tree;
    }
    throw new Error('Course profile did not settle');
  }
  function dispose() { if (disposed) return; slots.forEach(slot => slot.cleanup?.()); disposed = true; }
  t.after(() => { dispose(); global.window = previous; }); render();
  return { props, writes, removed, chosen, render, dispose, get tree() { return tree; },
    buttons: () => nodes(tree, node => node.type === 'button'),
    choose(label) { this.buttons().find(node => text(node) === label).props.onClick(); render(); },
    profile(value) { snapshot.saveProfile(value); render(); },
    note() { return nodes(tree, node => node.type === 'p' && node.props.className === 'countryNote')[0]; },
    update(next) { Object.assign(props, next); render(); },
  };
}

test('The pure selector gives an explicit supported course choice priority over a supported profile and the original fallback', () => {
  const before = JSON.stringify(mixed);
  assert.equal(scope.getCourseExamCountry(mixed, ready({ country: 'CH', region: 'ZH' }), null), 'CH');
  assert.equal(scope.getCourseExamCountry(mixed, ready({ country: 'AT', region: 'NOE' }), null), 'AT');
  assert.equal(scope.getCourseExamCountry(mixed, ready({ country: 'CH', region: 'ZH' }), 'DE'), 'DE');
  assert.equal(scope.getCourseExamCountry(mixed, { ready: false, profile: null }, 'AT'), 'AT');
  assert.equal(scope.getCourseExamCountry(mixed, ready(null), null), mixed.countries[0]);
  assert.equal(JSON.stringify(mixed), before);
});

test('Unsupported countries, invalid profiles and malformed values never invent a scope', () => {
  const module = { ...mixed, countries: ['DE', 'AT'] };
  assert.equal(scope.getCourseExamCountry(module, ready({ country: 'CH', region: 'ZH' }), null), 'DE');
  assert.equal(scope.getCourseExamCountry(module, ready({ country: 'AT', region: 'missing' }), null), 'DE');
  assert.equal(scope.getCourseExamCountry(module, ready({ country: 'AT', region: 'NOE' }), 'CH'), 'AT');
  for (const value of [[], {}, ['AT'], 1]) assert.equal(scope.getCourseExamCountry(module, ready(null), value), 'DE');
  for (const module of [null, {}, { countries: [] }, { countries: ['XX'] }]) assert.equal(scope.getCourseExamCountry(module, ready(null), null), null);
});

test('Actual SSR of a mixed course renders a technical loading notice instead of the misleading default country note', () => {
  const html = renderToStaticMarkup(React.createElement(scope.CourseCountryNote, { module: mixed, country: null }));
  assert.match(html, /Der Länderhinweis wird geladen/); assert.match(html, /role="status"/);
  for (const note of Object.values(mixed.countryNotes)) assert.ok(!html.includes(note));
  assert.doesNotMatch(html, /<strong>Deutschland:/);
  const menu = renderToStaticMarkup(React.createElement(scope.CourseCountryMenu, { module: mixed, country: null, onChoose() { throw new Error('SSR cannot choose'); } }));
  assert.match(menu, /Länderschwerpunkt/); assert.doesNotMatch(menu, /aria-pressed="true"/);
});

test('A single-country course and an explicit manual choice are already correct during SSR without a profile', () => {
  const html = renderToStaticMarkup(React.createElement(scope.CourseCountryNote, { module: single, country: null }));
  assert.match(html, /<strong>Schweiz:/);
  assert.doesNotMatch(html, /wird geladen|Deutschland:/);
  assert.equal(renderToStaticMarkup(React.createElement(scope.CourseCountryMenu, { module: single, country: null })), '');
  const manual = renderToStaticMarkup(React.createElement(scope.CourseCountryNote, { module: mixed, country: 'AT' }));
  assert.match(manual, /<strong>Österreich:/); assert.doesNotMatch(manual, /wird geladen/);
});

test('Every real multi-country law course displays the exact existing countryNotes text for each supported profile', () => {
  const courses = learningModules.filter(module => module.category === 'Jagdrecht' && module.countries.length > 1);
  assert.ok(courses.length >= 4);
  for (const module of courses) for (const country of module.countries) {
    const region = { DE: 'BY', CH: 'ZH', AT: 'NOE' }[country];
    const Note = createLoader({ '../lib/use-exam-profile': { __esModule: true, default: () => ready({ country, region }) } })('components/CourseCountryScope.js').CourseCountryNote;
    const tree = Note({ module, country: null });
    if (module.countryNotes[country]) { assert.equal(text(tree.props.children[2]), module.countryNotes[country]); assert.equal(text(tree.props.children[0]), { DE: 'Deutschland:', CH: 'Schweiz:', AT: 'Österreich:' }[country]); }
    else assert.equal(tree, null);
  }
});

test('The actual profile hook restores the Swiss note and menu selection with no profile writes by either component', t => {
  const f = setup(t);
  assert.equal(text(f.note().props.children[2]), mixed.countryNotes.CH);
  assert.equal(text(f.buttons().find(button => button.props['aria-pressed'])), 'Schweiz');
  assert.deepEqual(f.writes, []); assert.deepEqual(f.removed, []); assert.deepEqual(f.chosen, []);
});

test('A restored profile follows external changes until a local manual course choice takes precedence without saving that choice', t => {
  const f = setup(t);
  f.profile({ country: 'AT', region: 'NOE' });
  assert.equal(text(f.note().props.children[2]), mixed.countryNotes.AT);
  const writes = f.writes.length;
  f.choose('Deutschland');
  assert.deepEqual(f.chosen, ['DE']); assert.equal(f.writes.length, writes);
  assert.equal(text(f.note().props.children[2]), mixed.countryNotes.DE);
  f.profile({ country: 'CH', region: 'ZH' });
  assert.equal(text(f.note().props.children[2]), mixed.countryNotes.DE);
  assert.equal(text(f.buttons().find(button => button.props['aria-pressed'])), 'Deutschland');
});

test('Captured country actions are blocked after a profile context change and actual unmount', t => {
  const f = setup(t), old = f.buttons().find(button => text(button) === 'Deutschland').props.onClick;
  f.profile({ country: 'AT', region: 'NOE' }); old();
  assert.deepEqual(f.chosen, []);
  const current = f.buttons().find(button => text(button) === 'Deutschland').props.onClick;
  f.dispose(); current();
  assert.deepEqual(f.chosen, []);
});

test('Changing the actual module invalidates its old menu action even if both modules support the same country', t => {
  const f = setup(t), old = f.buttons().find(button => text(button) === 'Österreich').props.onClick;
  const other = learningModules.find(module => module.id !== mixed.id && module.category === 'Jagdrecht' && module.countries.length > 1);
  assert.ok(other); f.update({ module: other }); old(); assert.deepEqual(f.chosen, []);
  f.choose('Österreich'); assert.deepEqual(f.chosen, ['AT']);
});

test('The local country fieldset explicitly keeps mixed questions and never mutates the source pool, answers or profile', t => {
  const before = JSON.stringify(mixed), f = setup(t);
  assert.equal(nodes(f.tree, node => node.type === 'fieldset').length, 1);
  assert.match(text(f.tree), /Die Fragen dieses Kurses bleiben gemischt/);
  assert.match(text(f.tree), /Geltungsbereich steht bei jeder Frage/);
  assert.match(text(f.tree), /Prüfungsziel wird dadurch nicht geändert/);
  for (const label of ['Deutschland', 'Österreich', 'Schweiz']) f.choose(label);
  assert.equal(JSON.stringify(mixed), before); assert.equal(f.writes.length, 0); assert.equal(f.removed.length, 0);
  const source = fs.readFileSync(path.join(root, 'components/CourseCountryScope.js'), 'utf8');
  assert.doesNotMatch(source, /saveProfile|clearProfile|localStorage|fetch\(|router|\.questions/);
});
