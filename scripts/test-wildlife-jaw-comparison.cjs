const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader();
const { getJawComparisonEntry: entry, getJawComparisonRows: rows } = load('lib/wildlife-jaw-comparison.js');
const dental = load('lib/wildlife-dentition.js');
const inventory = load('lib/european-wildlife-discovery.js').europeanWildlife;
const production = load('lib/wildlife-jaw-models.js');
const moduleValue = value => ({ __esModule: true, default: value });
const framework = {
  'next/link': moduleValue(({ href, children, ...props }) => React.createElement('a', { href, ...props }, children)),
  './AppIcon': moduleValue(() => null),
};
function all(node, predicate) { if (Array.isArray(node)) return node.flatMap(child => all(child, predicate)); if (!node || typeof node !== 'object') return []; return [...(predicate(node) ? [node] : []), ...all(node.props?.children, predicate)]; }
function words(node) { if (node == null || typeof node === 'boolean') return ''; if (Array.isArray(node)) return node.map(words).join(' '); return typeof node === 'object' ? words(node.props?.children) : String(node); }
function engine() {
  const slots = []; let cursor = 0;
  return { hooks: { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
  }, render(fn) { cursor = 0; return fn(); } };
}
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function atlas(query = {}) {
  const e = engine(), calls = []; let tree;
  const router = { query, replace(href, unused, options) { const task = deferred(); calls.push({ href, options, task }); return task.promise; } };
  const Jaw = () => null, Comparison = () => null, Teeth = () => null;
  const Component = createLoader({ ...framework, react: e.hooks, 'next/router': { useRouter: () => router },
    '../../components/LearningToolLayout': moduleValue(({ children }) => React.createElement('main', null, children)),
    '../../components/WildlifeJawModel': moduleValue(Jaw), '../../components/WildlifeJawComparison': moduleValue(Comparison), '../../components/WildlifeDentition': moduleValue(Teeth),
  })('pages/lernen/kiefer-3d.js').default;
  const render = () => { tree = e.render(() => Component()); };
  render();
  return { get tree() { return tree; }, router, calls, render, Jaw, Comparison, Teeth,
    fields() { return all(tree, node => node.type === 'select'); },
    choose(index, slug) { this.fields()[index].props.onChange({ target: { value: slug } }); render(); },
    async acknowledge() { const last = calls.at(-1); router.query = last.href.query; last.task.resolve(true); await tick(); render(); },
  };
}

test('Comparison accepts only exact known species; each formula value is inherited from its own reviewed source', () => {
  for (const bad of [undefined, null, '', 'absent', '__proto__', 'constructor']) assert.equal(entry(bad), null, String(bad));
  for (const species of inventory) {
    const value = entry(species.slug); assert.equal(value.name, species.name);
    assert.equal(value.sourceHref, `/wildkunde/${species.slug}#gebiss`);
    const profile = dental.dentitionBySlug[species.slug];
    assert.equal(value.kind, profile ? 'formula' : dental.birdDentitionSlugs.has(species.slug) ? 'bird' : 'open');
    if (!profile) { assert.equal(value.profile, null); assert.deepEqual(rows(value, entry('rehwild')), []); continue; }
    assert.deepEqual(value.profile, profile);
    const comparison = rows(value, entry('rehwild'));
    for (const type of ['I', 'C', 'P', 'M']) assert.equal(comparison.find(row => row.id === type).values[0], `${profile.formula[type][0]} / ${profile.formula[type][1]}`);
    const upper = Object.values(profile.formula).reduce((sum, pair) => sum + pair[0] * 2, 0);
    const lower = Object.values(profile.formula).reduce((sum, pair) => sum + pair[1] * 2, 0);
    assert.equal(comparison.find(row => row.id === 'upper').values[0], upper);
    assert.equal(comparison.find(row => row.id === 'lower').values[0], lower);
    assert.equal(comparison.find(row => row.id === 'total').values[0], upper + lower);
  }
});

test('Bird and open records never become substitute zero formulas; ordinary comparisons retain formula scope and evidence links', () => {
  const Component = createLoader(framework)('components/WildlifeJawComparison.js').default;
  for (const species of inventory.filter(s => !dental.dentitionBySlug[s.slug])) {
    const html = renderToStaticMarkup(React.createElement(Component, { left: 'rehwild', right: species.slug }));
    assert.doesNotMatch(html, /<table|0 \/ 0/); assert.ok(html.includes(`/wildkunde/${species.slug}#gebiss`));
    assert.match(html, dental.birdDentitionSlugs.has(species.slug) ? /Schnabel/ : /Formel offen/);
  }
  const html = renderToStaticMarkup(React.createElement(Component, { left: 'rehwild', right: 'rotwild' }));
  assert.match(html, /<table/); assert.match(html, /keine Zählung an den 3D/); assert.match(html, /beide Seiten/);
  assert.ok(html.includes(dental.dentitionBySlug.rehwild.scope));
  for (const pair of [{ left: 'rehwild', right: 'rehwild' }, { left: 'absent', right: 'rehwild' }]) assert.equal(renderToStaticMarkup(React.createElement(Component, pair)), '');
});

test('Atlas restores both valid URL selections and ignores identical, unknown or repeated comparison parameters safely', () => {
  const valid = atlas({ art: 'rehwild', vergleich: 'rotwild' });
  assert.deepEqual(valid.fields().map(field => field.props.value), ['rehwild', 'rotwild']);
  assert.equal(all(valid.fields()[0], node => node.type === 'option').length, inventory.length);
  assert.equal(all(valid.fields()[1], node => node.type === 'option' && node.props.value === 'rehwild').length, 0);
  assert.deepEqual(all(valid.tree, node => node.type === valid.Jaw).map(node => node.props.slug), ['rehwild', 'rotwild']);
  assert.equal(all(valid.tree, node => node.type === valid.Teeth).length, 0);
  for (const vergleich of ['rehwild', 'unknown', '__proto__', ['rotwild'], ['rotwild', 'damwild']]) {
    const ui = atlas({ art: 'rehwild', vergleich });
    assert.equal(ui.fields()[1].props.value, ''); assert.equal(all(ui.tree, node => node.type === ui.Comparison).length, 0);
    assert.equal(all(ui.tree, node => node.type === ui.Teeth).length, 1);
  }
  const invalidMain = atlas({ art: ['rotwild', 'damwild'], vergleich: 'rehwild' });
  assert.deepEqual(invalidMain.fields().map(field => field.props.value), ['rehwild', '']);
});

test('Changing or clearing comparison updates only its URL selection, preserves unrelated values and removes a duplicate after a primary species change', async () => {
  const ui = atlas({ art: 'rehwild', vergleich: 'rotwild', ref: ['one', 'two'] });
  ui.choose(1, 'damwild'); assert.deepEqual(ui.calls[0].href.query, { art: 'rehwild', vergleich: 'damwild', ref: ['one', 'two'] });
  assert.deepEqual(ui.calls[0].options, { shallow: true, scroll: false }); await ui.acknowledge();
  ui.choose(1, ''); assert.deepEqual(ui.calls[1].href.query, { art: 'rehwild', ref: ['one', 'two'] }); await ui.acknowledge();
  assert.equal(all(ui.tree, node => node.type === ui.Comparison).length, 0);
  assert.deepEqual(all(ui.tree, node => node.type === ui.Jaw).map(node => node.props.slug), ['rehwild']);
  ui.choose(1, 'damwild'); await ui.acknowledge(); ui.choose(0, 'damwild'); await ui.acknowledge();
  assert.deepEqual(ui.router.query, { art: 'damwild', ref: ['one', 'two'] });
  assert.deepEqual(ui.fields().map(field => field.props.value), ['damwild', '']);
  const count = ui.calls.length; ui.choose(1, 'damwild'); ui.choose(1, 'unknown'); assert.equal(ui.calls.length, count);
  const missing = inventory.find(species => !production.jawModelsBySlug[species.slug]);
  if (missing) { ui.router.query = { art: 'rehwild', vergleich: missing.slug }; ui.render(); assert.match(words(ui.tree), new RegExp(missing.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))); assert.equal(all(ui.tree, node => node.type === ui.Jaw).length, 1); }
});

test('Two model panels expose distinct anchors/headings and exactly one activated external viewer, including A to B to A late callbacks', () => {
  const owners = ['rehwild', 'rotwild']; let owner = null;
  const panels = owners.map((slug, index) => {
    const e = engine();
    const Component = createLoader({ ...framework, react: e.hooks })('components/WildlifeJawModel.js').default;
    return { e, Component, props: { slug, name: slug, sectionId: index ? 'kiefer-3d-vergleich' : 'kiefer-3d', onActivate: value => { owner = value; } } };
  });
  const render = () => panels.forEach(panel => { panel.tree = panel.e.render(() => panel.Component({ ...panel.props, viewerOwner: owner })); });
  const frame = index => all(panels[index].tree, node => node.type === 'iframe')[0];
  const activate = index => { all(panels[index].tree, node => node.type === 'button')[0].props.onClick(); render(); assert.equal(panels.reduce((sum, panel) => sum + all(panel.tree, node => node.type === 'iframe').length, 0), 1); };
  render(); assert.equal(frame(0), undefined); assert.equal(frame(1), undefined);
  const ids = panels.flatMap(panel => all(panel.tree, node => node.props?.id).map(node => node.props.id)); assert.equal(new Set(ids).size, ids.length);
  for (const panel of panels) for (const section of all(panel.tree, node => node.type === 'section')) assert.ok(ids.includes(section.props['aria-labelledby']));
  activate(0); const oldA = frame(0); oldA.props.onLoad(); render();
  activate(1); const currentB = frame(1); assert.equal(frame(0), undefined);
  oldA.props.onError(); render(); assert.ok(frame(1)); assert.match(words(panels[1].tree), /wird geöffnet/);
  currentB.props.onLoad(); render(); activate(0); const currentA = frame(0); assert.equal(frame(1), undefined);
  oldA.props.onError(); oldA.props.onLoad(); currentB.props.onError(); render();
  assert.ok(frame(0)); assert.match(words(panels[0].tree), /wird geöffnet/, 'Detached first A cannot mark the new A ready');
  currentA.props.onLoad(); render(); assert.match(words(panels[0].tree), /Drehen/);
});

test('Preparation A to B to A ignores callbacks from the first instance even though its model identifier is reused', () => {
  const species = production.jawModelSpecies.find(record => record.models.length > 1); assert.ok(species);
  const e = engine(); const Component = createLoader({ ...framework, react: e.hooks })('components/WildlifeJawModel.js').default;
  let tree; const render = () => { tree = e.render(() => Component({ slug: species.speciesSlug })); };
  const frame = () => all(tree, node => node.type === 'iframe')[0];
  const select = id => { all(tree, node => node.type === 'select')[0].props.onChange({ target: { value: id } }); render(); };
  render(); all(tree, node => node.type === 'button')[0].props.onClick(); render(); const old = frame();
  const firstId = production.preferredJawModel(species).id;
  select(species.models.find(model => model.id !== firstId).id); select(firstId);
  old.props.onError(); old.props.onLoad(); render(); assert.ok(frame()); assert.match(words(tree), /wird geöffnet/);
  frame().props.onLoad(); render(); assert.match(words(tree), /Drehen/);
});
