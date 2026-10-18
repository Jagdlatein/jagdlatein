const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader();
const data = load('lib/habitat-workshop.js');
const { resolveHabitatReading, habitatReadingHash } = load('components/HabitatWorkshop.js');
const defaultFeature = data.habitatPresets[1].ids[0];

function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join('');
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
function find(node, predicate) {
  if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } return null; }
  if (!node || typeof node !== 'object') return null;
  return predicate(node) ? node : find(node.props?.children, predicate);
}
function setup() {
  const slots = []; let cursor = 0, effects = [], tree;
  const hooks = { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = {value: typeof initial === 'function' ? initial() : initial}; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = {value: {current: initial}}; return slots[i].value; },
    useEffect(callback, deps) { const i = cursor++, previous = slots[i]; if (!previous || deps.some((value, index) => value !== previous.deps[index])) { slots[i] = {deps, cleanup: previous?.cleanup}; effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = callback(); }); } },
  };
  const Component = createLoader({react: hooks})('components/HabitatWorkshop.js').default;
  function redraw() { cursor = 0; tree = Component(); }
  redraw();
  return {
    get tree() { return tree; }, redraw,
    flush() { const pending = effects; effects = []; pending.forEach(run => run()); redraw(); },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
    field(label) { const holder = find(tree, node => node.type === 'label' && text(node).startsWith(label)); assert.ok(holder, label); return find(holder, node => node.type === 'select'); },
    select(label, value) { this.field(label).props.onChange({target: {value}}); redraw(); },
    click(label) { const button = find(tree, node => node.type === 'button' && text(node) === label); assert.ok(button, label); button.props.onClick(); redraw(); },
    mapSelection() { return [...find(tree, node => node.type?.name === 'HabitatMap').props.selected]; },
  };
}
function browser(initial = '') {
  const listeners = new Map(), entries = [initial]; let index = 0;
  const location = {};
  Object.defineProperty(location, 'hash', {get: () => entries[index], set(value) { if (value === entries[index]) return; entries.splice(index + 1); entries.push(value); index++; }});
  const window = {location, addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); }, removeEventListener(type, fn) { listeners.get(type)?.delete(fn); }};
  const emit = type => [...(listeners.get(type) || [])].forEach(fn => fn());
  return {window, emit, back() { if (index > 0) index--; emit('popstate'); emit('hashchange'); }, get listenerCount() { return [...listeners.values()].reduce((sum, values) => sum + values.size, 0); }};
}
function withBrowser(fake, fn) {
  const previous = global.window;
  global.window = fake.window;
  try { fn(); } finally { if (previous === undefined) delete global.window; else global.window = previous; }
}
function assertOnlyFeature(tree, feature) {
  const visible = text(tree);
  for (const item of data.habitatFeatures) assert.equal(visible.includes(item.text), item.id === feature.id, item.id);
}
function assertOnlySpecies(tree, id) {
  const visible = text(tree);
  for (const item of data.habitatSpecies) assert.equal(visible.includes(item.text), item.id === id, item.id);
}

test('SSR preserves eight compact model controls but renders just one feature explanation and no full species dump', () => {
  const s = setup();
  const choices = find(s.tree, node => node.type === 'fieldset');
  assert.ok(text(choices).includes('Bausteine deiner Lernlandschaft'));
  assert.equal(React.Children.toArray(choices.props.children[1].props.children).length, 8);
  assertOnlyFeature(s.tree, data.habitatFeatures.find(item => item.id === defaultFeature));
  assertOnlySpecies(s.tree, null);
  for (const item of data.habitatFeatures) assert.ok(text(choices).includes(item.name));
  assert.equal(s.field('Baustein verstehen').props['aria-controls'], 'habitat-feature-reading');
  assert.equal(s.field('Tierart hervorheben').props['aria-controls'], 'habitat-species-reading');
  const html = renderToStaticMarkup(React.createElement(createLoader({'next/head': () => null, 'next/router': {useRouter: () => ({query: {}})}})('components/HabitatWorkshop.js').default));
  assert.doesNotMatch(html, /undefined|null|<iframe|<video/);
});

test('Every feature has exactly its original explanation and source; reading does not edit the landscape', () => {
  const s = setup(), selected = s.mapSelection();
  for (const feature of data.habitatFeatures) {
    s.select('Baustein verstehen', feature.id);
    assertOnlyFeature(s.tree, feature);
    const detail = find(s.tree, node => node.props?.id === 'habitat-feature-reading');
    assert.ok(text(detail).includes(feature.function));
    assert.equal(find(detail, node => node.type === 'a').props.href, data.habitatSources[feature.source].url);
    assert.deepEqual(s.mapSelection(), selected);
    assert.equal(s.field('Lernlandschaft laden').props.value, data.habitatPresets[1].id);
  }
});

test('Every selected species retains only its original resource results and source; overview remains compact', () => {
  const s = setup(), expected = data.evaluateHabitat(s.mapSelection());
  for (const species of expected) {
    s.select('Tierart hervorheben', species.id);
    assertOnlySpecies(s.tree, species.id);
    const detail = find(s.tree, node => node.props?.id === 'habitat-species-reading');
    assert.equal(find(detail, node => node.type === 'a').props.href, data.habitatSources[species.source].url);
    for (const resource of species.resources) {
      assert.ok(text(detail).includes(resource.label));
      assert.ok(text(detail).includes(resource.covered ? 'Baustein vorhanden' : 'Im Modell noch offen'));
    }
  }
  s.select('Tierart hervorheben', 'alle');
  assertOnlySpecies(s.tree, null);
  const overview = find(s.tree, node => node.props?.id === 'habitat-species-reading');
  const items = overview.props.children.props.children;
  assert.equal(items.length, 8);
  for (const [index, species] of expected.entries()) {
    assert.equal(find(items[index], node => node.type === 'a').props.href, habitatReadingHash(defaultFeature, species.id));
    assert.ok(text(items[index]).includes(`${species.resources.filter(resource => resource.covered).length} von ${species.resources.length} Funktionen im Modell vorhanden`));
  }
});

test('Validated native fragment selection rejects unknown, duplicate and oversized values', () => {
  for (const feature of data.habitatFeatures) for (const species of data.habitatSpecies) assert.deepEqual(resolveHabitatReading(habitatReadingHash(feature.id, species.id)), {feature: feature.id, focus: species.id});
  for (const invalid of ['', null, '#other', '#habitat-lesen?baustein=missing&art=unknown', '#habitat-lesen?baustein=wald&baustein=wasser&art=reh&art=igel', '#habitat-lesen?' + 'a'.repeat(301)]) assert.deepEqual(resolveHabitatReading(invalid), {feature: defaultFeature, focus: 'alle'});
  const s = setup();
  s.select('Baustein verstehen', 'missing'); s.select('Tierart hervorheben', 'missing');
  assert.equal(s.field('Baustein verstehen').props.value, defaultFeature);
  assert.equal(s.field('Tierart hervorheben').props.value, 'alle');
});

test('Native Back restores reading choices without undoing model edits, including rapid selections and delayed hash events', () => {
  const fake = browser(habitatReadingHash('wasser', 'erdkroete'));
  withBrowser(fake, () => {
    const s = setup(); s.flush();
    assert.equal(s.field('Baustein verstehen').props.value, 'wasser');
    assert.equal(s.field('Tierart hervorheben').props.value, 'erdkroete');
    // Two events before the next render must merge the latest reading state.
    s.field('Baustein verstehen').props.onChange({target: {value: 'hecke'}});
    s.field('Tierart hervorheben').props.onChange({target: {value: 'igel'}});
    s.redraw(); fake.emit('hashchange'); s.redraw();
    assert.equal(fake.window.location.hash, habitatReadingHash('hecke', 'igel'));
    assertOnlySpecies(s.tree, 'igel');
    const first = find(s.tree, node => node.type === 'input' && node.props.type === 'checkbox');
    first.props.onChange(); s.redraw();
    const edited = s.mapSelection();
    assert.equal(s.field('Lernlandschaft laden').props.value, 'custom');
    fake.back(); s.redraw();
    assert.equal(s.field('Baustein verstehen').props.value, 'hecke');
    assert.equal(s.field('Tierart hervorheben').props.value, 'igel');
    assert.deepEqual(s.mapSelection(), edited);
    fake.back(); s.redraw();
    assert.equal(s.field('Tierart hervorheben').props.value, 'erdkroete');
    fake.back(); s.redraw();
    assert.equal(s.field('Baustein verstehen').props.value, 'wasser');
    assert.deepEqual(s.mapSelection(), edited);
    s.unmount(); assert.equal(fake.listenerCount, 0);
  });
});

test('Quiz and valid preset loading preserve reading choices while invalid preset input remains ignored', () => {
  const s = setup();
  s.select('Baustein verstehen', 'verbund'); s.select('Tierart hervorheben', 'igel');
  s.click('Zusammenhänge prüfen');
  assert.ok(find(s.tree, node => node.type?.name === 'NatureQuestionRound'));
  s.click('Landschaft gestalten');
  assert.equal(s.field('Baustein verstehen').props.value, 'verbund');
  assert.equal(s.field('Tierart hervorheben').props.value, 'igel');
  s.select('Lernlandschaft laden', data.habitatPresets[0].id);
  assert.deepEqual(s.mapSelection(), []);
  s.select('Lernlandschaft laden', 'invalid');
  assert.deepEqual(s.mapSelection(), []);
  assertOnlySpecies(s.tree, 'igel');
  const css = fs.readFileSync(path.join(__dirname, '../styles/HabitatWorkshop.module.css'), 'utf8');
  assert.match(css, /min-height:\s*48px/);
  assert.match(css, /minmax\(0,\s*1fr\)/);
});
