const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader();
const data = load('lib/habitat-workshop.js');
const { resolveHabitatReading, habitatReadingHash, resolveHabitatView, habitatViewHash } = load('components/HabitatWorkshop.js');
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
  const slots = [], focus = [], scroll = []; let cursor = 0, effects = [], tree, closed = 0;
  const hooks = { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = {value: typeof initial === 'function' ? initial() : initial}; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = {value: {current: initial}}; return slots[i].value; },
    useEffect(callback, deps) { const i = cursor++, previous = slots[i]; if (!previous || deps.some((value, index) => value !== previous.deps[index])) { slots[i] = {deps, cleanup: previous?.cleanup}; effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = callback(); }); } },
  };
  function Menu({children}) { return React.createElement('aside', {'data-page-menu': true}, children); }
  const Component = createLoader({react: hooks, './PageMenu': {__esModule: true, default: Menu, closePageMenu: () => {closed++;}}})('components/HabitatWorkshop.js').default;
  function redraw() {
    cursor = 0; tree = Component();
    const target = find(tree, node => node.props?.ref && node.props?.tabIndex === -1);
    if (target) target.props.ref.current = { focus: options => focus.push({id: target.props.id, options}), scrollIntoView: options => scroll.push({id: target.props.id, options}) };
  }
  redraw();
  for (let i = 0; i < 5 && effects.length; i++) { const pending = effects; effects = []; pending.forEach(run => run()); redraw(); }
  return {
    get tree() { return tree; }, get focus() { return focus; }, get scroll() { return scroll; }, get closed() { return closed; }, redraw,
    flush() { const pending = effects; effects = []; pending.forEach(run => run()); redraw(); },
    settle() { redraw(); for (let i = 0; i < 5 && effects.length; i++) this.flush(); },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
    main() { return find(tree, node => node.props?.id === 'habitat-content'); },
    menu() { return find(tree, node => node.type === Menu); },
    field(label) { const choice = find(tree, node => node.type?.name === 'MenuChoice' && node.props.label === label); assert.ok(choice, label); return choice; },
    select(label, value) { this.field(label).props.onChange({target: {value}}); redraw(); },
    mapSelection() { const map = find(tree, node => node.type?.name === 'HabitatMap'); assert.ok(map, 'Modell ist ausdrücklich gewählt'); return [...map.props.selected]; },
  };
}
function browser(initial = '') {
  const listeners = new Map(), entries = [initial]; let index = 0;
  const location = {};
  Object.defineProperty(location, 'hash', {get: () => entries[index], set(value) { if (value === entries[index]) return; entries.splice(index + 1); entries.push(value); index++; }});
  const window = {location, addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); }, removeEventListener(type, fn) { listeners.get(type)?.delete(fn); }};
  const emit = type => [...(listeners.get(type) || [])].forEach(fn => fn({type}));
  return {window, emit, back() { if (index > 0) index--; emit('popstate'); emit('hashchange'); }, forward() { if (index < entries.length - 1) index++; emit('popstate'); emit('hashchange'); }, get listenerCount() { return [...listeners.values()].reduce((sum, values) => sum + values.size, 0); }, get entryCount() { return entries.length; }};
}
function withBrowser(fake, fn) {
  const previous = global.window;
  global.window = fake.window;
  try { fn(); } finally { if (previous === undefined) delete global.window; else global.window = previous; }
}
function assertOnlyReading(tree, featureId, speciesId) {
  const visible = text(tree);
  for (const item of data.habitatFeatures) assert.equal(visible.includes(item.text), item.id === featureId, item.id);
  for (const item of data.habitatSpecies) assert.equal(visible.includes(item.text), item.id === speciesId, item.id);
}

test('Default reader shows one original text; all mode/topic navigation lives in the shared lower menu', () => {
  const s = setup();
  assertOnlyReading(s.main(), defaultFeature, null);
  assert.equal(find(s.main(), node => node.type === 'select'), null);
  assert.equal(find(s.main(), node => node.type?.name === 'HabitatMap'), null);
  assert.equal(find(s.main(), node => node.type === 'button'), null);
  assert.equal(s.field('Lernangebot').props.value, 'lesen');
  assert.ok(find(s.menu(), node => node.type?.name === 'MenuChoice'));
  assert.equal(find(s.menu(), node => node.type === 'select'), null);
  assert.equal(s.field('Wissen auswählen').props['aria-controls'], 'habitat-feature-reading');
  const html = renderToStaticMarkup(React.createElement(createLoader({'next/head': () => null, 'next/router': {useRouter: () => ({query: {}})}})('components/HabitatWorkshop.js').default));
  assert.equal((html.match(/<main/g) || []).length, 1);
  assert.doesNotMatch(html, /undefined|null|<iframe|<video|<select|modeButtons/);
});

test('Every feature and species displays exactly its unchanged text, with sources closed at the end', () => {
  const s = setup();
  for (const feature of data.habitatFeatures) {
    s.select('Wissen auswählen', `baustein:${feature.id}`);
    assertOnlyReading(s.main(), feature.id, null);
    const detail = find(s.main(), node => node.props?.id === 'habitat-feature-reading');
    assert.ok(text(detail).includes(feature.function));
    assert.equal(find(detail, node => node.type === 'a'), null, 'Quelle nicht zwischen dem Wissenstext');
    const sources = find(s.main(), node => node.type === 'details');
    assert.notEqual(sources.props.open, true);
    assert.equal(find(sources, node => node.type === 'a').props.href, data.habitatSources[feature.source].url);
  }
  for (const species of data.habitatSpecies) {
    s.select('Wissen auswählen', `art:${species.id}`);
    assertOnlyReading(s.main(), null, species.id);
    const detail = find(s.main(), node => node.props?.id === 'habitat-species-reading');
    assert.ok(text(detail).includes('kein Feldnachweis und keine Ansiedlungsprognose'));
    assert.equal(find(s.main(), node => node.type === 'a').props.href, data.habitatSources[species.source].url);
    assert.equal(s.field('Wissen auswählen').props['aria-controls'], 'habitat-species-reading');
    for (const resource of data.evaluateHabitat(data.habitatPresets[1].ids).find(item => item.id === species.id).resources) {
      assert.ok(text(detail).includes(resource.label));
      assert.ok(text(detail).includes(resource.covered ? 'Baustein vorhanden' : 'Im Modell noch offen'));
    }
  }
});

test('Landscape remains a separate reversible model with eight controls, compact species links and all four observation steps', () => {
  const s = setup(); s.select('Lernangebot', 'gestalten');
  assert.ok(find(s.main(), node => node.props?.id === s.field('Wissen auswählen').props['aria-controls']));
  const choices = find(s.main(), node => node.type === 'fieldset');
  assert.ok(text(choices).includes('Bausteine deiner Lernlandschaft'));
  assert.equal(React.Children.toArray(choices.props.children[1].props.children).length, 8);
  assertOnlyReading(s.main(), null, null);
  assert.match(text(s.main()), /weder Tierzahlen noch eine Ansiedlungswahrscheinlichkeit/);
  assert.match(text(s.main()), /kein Feldnachweis/);
  const steps = find(s.main(), node => node.type === 'ol');
  assert.equal(steps.props.children.length, 4);
  const original = s.mapSelection();
  const first = find(choices, node => node.type === 'input' && node.props.type === 'checkbox');
  first.props.onChange(); s.redraw(); const changed = s.mapSelection();
  assert.notDeepEqual(changed, original);
  assert.equal(s.field('Lernlandschaft laden').props.value, 'custom');
  s.select('Wissen auswählen', 'art:erdkroete'); assertOnlyReading(s.main(), null, 'erdkroete');
  s.select('Lernangebot', 'gestalten'); assert.deepEqual(s.mapSelection(), changed);
  s.select('Lernlandschaft laden', 'leer'); assert.deepEqual(s.mapSelection(), []);
  s.select('Lernlandschaft laden', 'invalid'); assert.deepEqual(s.mapSelection(), []);
  const links = find(s.main(), node => node.type === 'ul');
  assert.equal(links.props.children.length, 8);
  for (const item of links.props.children) {
    const link = find(item, node => node.type === 'a'); const decoded = resolveHabitatView(link.props.href);
    assert.equal(decoded.mode, 'lesen'); assert.equal(decoded.topic, 'art');
    assert.ok(data.habitatSpecies.some(species => species.id === decoded.focus));
  }
  s.select('Lernangebot', 'quiz'); assert.ok(find(s.main(), node => node.type?.name === 'NatureQuestionRound'));
  assert.ok(find(s.main(), node => node.props?.id === s.field('Wissen auswählen').props['aria-controls']));
  s.select('Lernangebot', 'gestalten'); assert.deepEqual(s.mapSelection(), []);
});

test('Legacy fragments remain valid and unknown, duplicate, oversized and hostile selections safely fall back', () => {
  for (const feature of data.habitatFeatures) for (const species of data.habitatSpecies) {
    const hash = habitatReadingHash(feature.id, species.id);
    assert.deepEqual(resolveHabitatReading(hash), {feature: feature.id, focus: species.id});
    assert.deepEqual(resolveHabitatView(hash), {feature: feature.id, focus: species.id, mode: 'lesen', topic: 'art'});
  }
  for (const invalid of ['', null, '#other', '#habitat-lesen?baustein=missing&art=unknown', '#habitat-lesen?baustein=wald&baustein=wasser&art=reh&art=igel', '#habitat-lesen?' + 'a'.repeat(301)]) {
    assert.deepEqual(resolveHabitatReading(invalid), {feature: defaultFeature, focus: 'alle'});
    assert.deepEqual(resolveHabitatView(invalid), {feature: defaultFeature, focus: 'alle', mode: 'lesen', topic: 'baustein'});
  }
  assert.equal(resolveHabitatView('#habitat-lesen?baustein=wald&art=igel&wissen=baustein').topic, 'baustein');
  assert.equal(resolveHabitatView('#habitat-lesen?ansicht=quiz&ansicht=gestalten').mode, 'lesen');
  const s = setup();
  for (const value of ['baustein:missing', 'art:missing', 'art:alle', 'art:igel:extra', 'javascript:alert(1)', '']) s.select('Wissen auswählen', value);
  s.select('Lernangebot', 'missing');
  assert.equal(s.field('Wissen auswählen').props.value, `baustein:${defaultFeature}`);
  assert.equal(s.field('Lernangebot').props.value, 'lesen');
});

test('Legacy deep entry and explicit selection focus the committed text without scrolling below the page start, including same topic', () => {
  withBrowser(browser(habitatReadingHash('wasser', 'erdkroete')), () => {
    const s = setup(); s.settle();
    assertOnlyReading(s.main(), null, 'erdkroete');
    assert.equal(s.focus.at(-1).id, 'habitat-species-reading');
    assert.deepEqual(s.focus.at(-1).options, {preventScroll: true});
    assert.equal(s.scroll.length, 0, 'A reading selection no longer scrolls down to its article');
    s.select('Wissen auswählen', 'baustein:altholz'); s.settle();
    assertOnlyReading(s.main(), 'altholz', null);
    assert.equal(s.focus.at(-1).id, 'habitat-feature-reading');
    const previousFocus = s.focus.length, previousClose = s.closed;
    s.select('Wissen auswählen', 'baustein:altholz'); s.settle();
    assert.equal(s.focus.length, previousFocus + 1); assert.ok(s.closed > previousClose);
    s.select('Lernangebot', 'gestalten'); s.settle(); assert.equal(s.focus.at(-1).id, 'habitat-landscape');
    s.select('Lernangebot', 'quiz'); s.settle(); assert.equal(s.focus.at(-1).id, 'habitat-quiz-reading');
    s.unmount();
  });
});

test('Native Back/Forward restores topic and mode without undoing model edits; stale events and pageshow use current URL', () => {
  const fake = browser(habitatReadingHash('wasser', 'erdkroete'));
  withBrowser(fake, () => {
    const s = setup(); s.settle();
    // Both controls fire before React commits: preserve the latest choice.
    s.field('Wissen auswählen').props.onChange({target: {value: 'baustein:hecke'}});
    s.field('Wissen auswählen').props.onChange({target: {value: 'art:igel'}});
    s.redraw(); fake.emit('hashchange'); s.settle();
    assertOnlyReading(s.main(), null, 'igel');
    assert.equal(resolveHabitatView(fake.window.location.hash).feature, 'hecke');
    s.select('Lernangebot', 'gestalten'); s.settle();
    const first = find(s.main(), node => node.type === 'input' && node.props.type === 'checkbox');
    first.props.onChange(); s.redraw(); const edited = s.mapSelection();
    s.select('Wissen auswählen', 'baustein:verbund'); s.settle();
    fake.back(); s.settle(); assert.equal(s.field('Lernangebot').props.value, 'gestalten'); assert.deepEqual(s.mapSelection(), edited);
    fake.back(); s.settle(); assertOnlyReading(s.main(), null, 'igel');
    fake.back(); s.settle(); assertOnlyReading(s.main(), 'hecke', null);
    fake.back(); s.settle(); assertOnlyReading(s.main(), null, 'erdkroete');
    fake.forward(); s.settle(); assertOnlyReading(s.main(), 'hecke', null);
    fake.forward(); s.settle(); assertOnlyReading(s.main(), null, 'igel');
    fake.forward(); s.settle(); assert.deepEqual(s.mapSelection(), edited);
    const entries = fake.entryCount, focused = s.focus.length;
    fake.emit('pageshow'); s.settle(); assert.equal(fake.entryCount, entries); assert.equal(s.focus.length, focused + 1);
    s.unmount(); assert.equal(fake.listenerCount, 0);
    fake.emit('hashchange'); s.settle(); assert.equal(fake.listenerCount, 0);
  });
});

test('Reader preserves original model/biological data and uses usable target spacing without shared layout edits', () => {
  const css = fs.readFileSync(path.join(__dirname, '../styles/HabitatWorkshop.module.css'), 'utf8');
  assert.match(css, /min-height:\s*48px/);
  assert.match(css, /minmax\(0,\s*1fr\)/);
  assert.match(css, /scroll-margin-top:\s*24px/);
  assert.equal(data.habitatFeatures.length, 8); assert.equal(data.habitatSpecies.length, 8); assert.equal(data.habitatQuestions.length, 3);
});
