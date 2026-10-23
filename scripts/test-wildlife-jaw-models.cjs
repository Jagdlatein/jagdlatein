const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const production = createLoader()('lib/wildlife-jaw-models.js');
const inventory = createLoader()('lib/european-wildlife-discovery.js').europeanWildlife;
const IDS = ['a'.repeat(32), 'b'.repeat(32), 'c'.repeat(32)];
const makeModel = (id, part) => ({ id, part, title: `Präparat ${part}`, creator: 'Sammlung Beispiel', sourceURL: `https://sketchfab.com/models/${id}`, licenseURL: 'https://creativecommons.org/licenses/by/4.0/', license: 'CC BY 4.0', specimen: `Inventar ${id.slice(0, 2)}`, note: 'Ein bestimmtes Sammlungsobjekt.' });
const specimen = { speciesSlug: 'rehwild', name: 'Rehwild', scientificName: 'Capreolus capreolus', models: [makeModel(IDS[0], 'cranium'), makeModel(IDS[1], 'mandible')] };
const fixture = { ...production, jawModelSpecies: [specimen], jawModelsBySlug: { rehwild: specimen } };
const moduleValue = value => ({ __esModule: true, default: value });
const framework = {
  'next/link': moduleValue(({ href, children, ...props }) => React.createElement('a', { href, ...props }, children)),
  './AppIcon': moduleValue(() => null),
};
function all(node, predicate) { if (Array.isArray(node)) return node.flatMap(child => all(child, predicate)); if (!node || typeof node !== 'object') return []; return [...(predicate(node) ? [node] : []), ...all(node.props?.children, predicate)]; }
function words(node) { if (node == null || typeof node === 'boolean') return ''; if (Array.isArray(node)) return node.map(words).join(' '); return typeof node === 'object' ? words(node.props?.children) : String(node); }
function engine() {
  const slots = []; let cursor = 0, effects = [];
  return { hooks: { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
    useMemo(fn) { return fn(); },
    useEffect(fn, deps) { const i = cursor++, prior = slots[i]; if (!prior || !deps || deps.some((v, j) => v !== prior.deps[j])) { slots[i] = { deps, cleanup: prior?.cleanup }; effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = fn(); }); } },
  }, render(fn) { cursor = 0; return fn(); }, flush() { const pending = effects; effects = []; pending.forEach(fn => fn()); }, dispose() { slots.forEach(slot => slot?.cleanup?.()); } };
}
function viewer() {
  const e = engine(); let tree;
  const Component = createLoader({ ...framework, react: e.hooks, '../lib/wildlife-jaw-models': fixture })('components/WildlifeJawModel.js').default;
  const render = () => { tree = e.render(() => Component({ slug: 'rehwild' })); e.flush(); };
  render();
  return { get tree() { return tree; }, render,
    frame() { return all(tree, n => n.type === 'iframe')[0]; },
    load() { const button = all(tree, n => n.type === 'button')[0]; assert.ok(button); button.props.onClick(); render(); },
    change(value) { all(tree, n => n.type === 'select')[0].props.onChange({ target: { value } }); render(); },
  };
}
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function atlas(query = { art: 'rehwild' }) {
  const e = engine(), calls = [], menuCalls = []; let tree;
  const router = { query, isReady: true, asPath: '/lernen/kiefer-3d', replace(href, unused, options) { const task = deferred(); calls.push({ href, options, task }); return task.promise; } };
  const Jaw = () => null, PageMenu = () => null;
  const loaded = createLoader({ ...framework, react: e.hooks, 'next/router': { useRouter: () => router }, '../../components/LearningToolLayout': moduleValue(({ children }) => React.createElement('main', null, children)), '../../components/PageMenu': { ...moduleValue(PageMenu), closePageMenu: () => { menuCalls.push('close'); } }, '../../components/WildlifeJawModel': moduleValue(Jaw), '../../components/WildlifeDentition': moduleValue(() => null), '../../lib/wildlife-jaw-models': fixture })('pages/lernen/kiefer-3d.js');
  const render = () => { tree = e.render(() => loaded.default()); e.flush(); };
  render();
  return { get tree() { return tree; }, calls, menuCalls, router, render, Jaw, PageMenu,
    field() { return all(tree, n => n.type === 'select')[0]; },
    choose(slug) { this.field().props.onChange({ target: { value: slug } }); render(); },
    async reject(error) { calls.at(-1).task.reject(error); await tick(); render(); },
    async acknowledge(index = 0) { router.query = calls[index].href.query; calls[index].task.resolve(true); await tick(); render(); },
  };
}

test('Viewer URLs accept only literal lowercase32-character hexadecimal IDs and carry no account data', () => {
  for (const bad of [null, {}, { id: '' }, { id: IDS[0] + '\n' }, { id: IDS[0] + '\r' }, { id: IDS[0].toUpperCase() }, { id: IDS[0] + '?email=user@example.test' }, { id: { toString: () => IDS[0] } }, { id: `../${IDS[0]}` }]) assert.equal(production.jawModelEmbedURL(bad), null);
  const url = new URL(production.jawModelEmbedURL({ id: IDS[0], email: 'private@example.test' }));
  assert.equal(url.origin, 'https://sketchfab.com'); assert.equal(url.pathname, `/models/${IDS[0]}/embed`);
  assert.equal(url.searchParams.get('dnt'), '1'); assert.equal(url.searchParams.get('autostart'), '1'); assert.equal(url.searchParams.get('animation_autoplay'), '0');
  assert.doesNotMatch(url.href, /private|email|account|token/i);
});

test('Preferred preparation is the actual mandible rather than the first skull; absence stays absent', () => {
  assert.equal(production.preferredJawModel(specimen).id, IDS[1]);
  assert.equal(production.preferredJawModel({ models: [specimen.models[0]] }).id, IDS[0]);
  assert.equal(production.preferredJawModel({ models: [] }), null); assert.equal(production.preferredJawModel(null), null);
});

test('Every published model belongs to an existing exact species and exposes license/provenance, without requiring a catalog size', () => {
  const slugs = new Set(inventory.map(s => s.slug)), speciesIds = new Set(), modelIds = new Set();
  for (const species of production.jawModelSpecies) {
    assert.ok(slugs.has(species.speciesSlug), species.speciesSlug); assert.ok(!speciesIds.has(species.speciesSlug)); speciesIds.add(species.speciesSlug);
    assert.ok(species.name && species.scientificName); assert.ok(species.models.length > 0);
    assert.equal(production.jawModelsBySlug[species.speciesSlug], species);
    for (const model of species.models) {
      assert.ok(!modelIds.has(model.id), `No cross-species reuse of ${model.id}`); modelIds.add(model.id);
      assert.ok(production.jawModelEmbedURL(model)); assert.ok(['cranium', 'mandible', 'right-mandible'].includes(model.part));
      for (const key of ['title', 'creator', 'sourceURL', 'licenseURL', 'license']) assert.ok(typeof model[key] === 'string' && model[key].trim(), `${species.speciesSlug}: ${key}`);
      assert.match(model.sourceURL, /^https:\/\//); assert.match(model.licenseURL, /^https:\/\//);
    }
  }
});

test('Server rendering exposes explanation and provenance while making no external viewer/image/script request', () => {
  const Component = createLoader({ ...framework, '../lib/wildlife-jaw-models': fixture })('components/WildlifeJawModel.js').default;
  const html = renderToStaticMarkup(React.createElement(Component, { slug: 'rehwild' }));
  assert.doesNotMatch(html, /<(?:iframe|img|script|link|video)\b/i); assert.match(html, /3D-Modell laden/); assert.match(html, /IP-Adresse/); assert.match(html, /creativecommons/); assert.match(html, /keine allgemeine Zahnformel/);
  assert.equal(renderToStaticMarkup(React.createElement(Component, { slug: 'nicht-vorhanden' })), '');
});

test('Only deliberate loading mounts the exact selected iframe with privacy and accessibility attributes', () => {
  const ui = viewer(); assert.equal(ui.frame(), undefined); ui.change(IDS[0]); assert.equal(ui.frame(), undefined);
  ui.load(); const frame = ui.frame(); assert.ok(frame); assert.equal(frame.props.src, production.jawModelEmbedURL(specimen.models[0]));
  assert.equal(frame.props.referrerPolicy, 'no-referrer'); assert.ok(frame.props.title); assert.ok(frame.props.allowFullScreen);
  ui.change('unknown'); assert.equal(ui.frame().props.src, frame.props.src);
});

test('Switching preparation ignores late load/error callbacks from the detached old iframe', () => {
  const ui = viewer(); ui.load(); const old = ui.frame(); old.props.onLoad(); ui.render();
  ui.change(IDS[0]); const current = ui.frame(); assert.notEqual(current.props.src, old.props.src);
  assert.match(words(ui.tree), /wird geöffnet/);
  old.props.onLoad(); ui.render(); assert.match(words(ui.tree), /wird geöffnet/, 'old load must not mark new iframe ready');
  old.props.onError(); ui.render(); assert.ok(ui.frame(), 'old failure must not hide current iframe');
  current.props.onLoad(); ui.render(); assert.match(words(ui.tree), /Drehen/);
});

test('A real viewer failure retains an accessible original-model fallback and switching can recover', () => {
  const ui = viewer(); ui.load(); ui.frame().props.onError(); ui.render();
  assert.equal(ui.frame(), undefined); assert.match(words(ui.tree), /konnte nicht geöffnet/);
  assert.ok(all(ui.tree, n => n.type === 'a' && n.props.href === specimen.models[1].sourceURL).length);
  ui.change(IDS[0]); assert.ok(ui.frame()); assert.match(words(ui.tree), /wird geöffnet/);
});

test('Atlas lists every current wildlife entry once; supported and missing species remain honestly distinct', () => {
  const ui = atlas(); const options = all(ui.field(), n => n.type === 'option');
  assert.equal(options.length, inventory.length); assert.deepEqual(new Set(options.map(o => o.props.value)), new Set(inventory.map(s => s.slug)));
  const groups = all(ui.tree, n => n.type === 'optgroup'); assert.equal(groups.length, 2);
  assert.deepEqual(all(groups[0], n => n.type === 'option').map(o => o.props.value), ['rehwild']);
  const missing = inventory.find(s => !fixture.jawModelsBySlug[s.slug]); ui.router.query = { art: missing.slug }; ui.render();
  assert.equal(ui.field().props.value, missing.slug); assert.equal(all(ui.tree, n => n.type === ui.Jaw).length, 0);
  assert.match(words(ui.tree), /3D-Modell noch offen/); assert.match(words(ui.tree), /nicht als Ersatz/);
  assert.ok(all(ui.tree, n => n.props?.href === `/wildkunde/${missing.slug}#gebiss`).length);
});

test('Invalid or repeated art parameters fall back safely; every valid art stays exact', () => {
  for (const art of ['../fremd', 'https://evil.example', ['rehwild', 'damwild']]) assert.equal(atlas({ art }).field().props.value, 'rehwild');
  for (const species of inventory) { const ui = atlas({ art: species.slug }); assert.equal(ui.field().props.value, species.slug); }
});

test('Atlas contributes species navigation only to the lower PageMenu and keeps the selected species visible in the content', () => {
  const ui = atlas();
  const menu = all(ui.tree, node => node.type === ui.PageMenu);
  assert.equal(menu.length, 1);
  assert.equal(all(menu[0], node => node.type === 'select').length, 2);
  const content = renderToStaticMarkup(ui.tree);
  assert.doesNotMatch(content, /<select|Wildart auswählen|Vergleichen mit \(optional\)/);
  assert.match(content, /<strong>Rehwild<\/strong>/);
  assert.equal(all(ui.tree, node => node.type === ui.Jaw).length, 1, 'Model panel remains in the page content');
});

test('Successful atlas leaf selection closes the lower menu; failure or an abandoned route leaves it alone', async () => {
  const ui = atlas();
  ui.choose('damwild'); await ui.reject(new Error('offline'));
  assert.deepEqual(ui.menuCalls, []);
  ui.choose('damwild'); await ui.acknowledge(1);
  assert.deepEqual(ui.menuCalls, ['close']);
  const abandoned = atlas(); abandoned.choose('damwild');
  abandoned.router.query = { art: 'gamswild' }; abandoned.render();
  abandoned.calls[0].task.resolve(true); await tick(); abandoned.render();
  assert.deepEqual(abandoned.menuCalls, []);
});

test('Atlas navigation preserves unrelated query fields and recovers after ordinary/cancelled errors', async () => {
  const ui = atlas({ art: 'rehwild', q: 'Schädel' }); ui.choose('damwild');
  assert.equal(ui.calls.length, 1); assert.equal(ui.calls[0].href.query.art, 'damwild'); assert.equal(ui.calls[0].href.query.q, 'Schädel');
  assert.deepEqual(ui.calls[0].options, { shallow: true, scroll: false }); await ui.reject(new Error('offline'));
  assert.equal(ui.field().props.disabled, false); assert.match(words(ui.tree), /konnte gerade nicht/);
  ui.choose('gamswild'); await ui.reject({ cancelled: true }); assert.doesNotMatch(words(ui.tree), /konnte gerade nicht/);
  ui.choose('not-a-species'); assert.equal(ui.calls.length, 2);
  ui.choose('damwild'); await ui.acknowledge(); assert.equal(ui.field().props.value, 'damwild');
});

test('A late failure of an abandoned atlas selection does not attach an error to a newer Back/URL selection', async () => {
  const ui = atlas({ art: 'rehwild' }); ui.choose('damwild');
  ui.router.query = { art: 'gamswild' }; ui.render();
  await ui.reject(new Error('old navigation failed after Back'));
  assert.equal(ui.field().props.value, 'gamswild');
  assert.doesNotMatch(words(ui.tree), /konnte gerade nicht/, 'error belongs to abandoned Damwild request, not current Gamswild route');
});

test('An existing selection error disappears from a different Back/URL route', async () => {
  const ui = atlas({ art: 'rehwild' }); ui.choose('damwild');
  await ui.reject(new Error('offline'));
  assert.match(words(ui.tree), /konnte gerade nicht/);
  ui.router.query = { art: 'gamswild' }; ui.render();
  assert.doesNotMatch(words(ui.tree), /konnte gerade nicht/);
  assert.equal(ui.field().props.disabled, false);
});

test('Species search links to the real3D anchor for umlaut/transliterated jaw terms, without inventing missing models', () => {
  const matcher = createLoader({ './wildlife-jaw-models': fixture })('lib/wildlife-section-match.js').matchWildlifeSection;
  const species = inventory.find(s => s.slug === 'rehwild');
  for (const query of ['3D', 'Schädel', 'Schaedel', 'Unterkiefer', 'Mandibel', 'Kiefer']) assert.equal(matcher(species, query)?.href, '/wildkunde/rehwild#kiefer-3d', query);
  const missing = inventory.find(s => !fixture.jawModelsBySlug[s.slug]); assert.notEqual(matcher(missing, '3D')?.href, `/wildkunde/${missing.slug}#kiefer-3d`);
});

test('Every fallback portrait link has an existing dental section rather than a dead hash', () => {
  const dental = createLoader()('lib/wildlife-dentition.js');
  for (const species of inventory) {
    if (production.jawModelsBySlug[species.slug]) continue;
    assert.ok(dental.dentitionBySlug[species.slug] || dental.birdDentitionSlugs.has(species.slug) || dental.dentitionWithheld.some(item => item.slug === species.slug), `${species.slug}: #gebiss must actually exist`);
  }
});
