const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');
const css = new Proxy({}, { get: (_, key) => String(key) });
function load(relative, overrides = {}, expose = '') {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const mod = { exports: {} }, req = createRequire(filename);
  function resolve(id) {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/router') return { useRouter: () => ({ query: {}, isReady: false }) };
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href: typeof href === 'object' ? href.pathname : href, ...props }, children);
    if (id === 'next/head') return ({ children }) => React.createElement(React.Fragment, null, children);
    if (id === 'next/image') return ({ priority, loading, sizes, ...props }) => React.createElement('img', props);
    if (id.endsWith('.module.css')) return { __esModule: true, default: css };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), /\.(js|json)$/.test(id) ? id : `${id}.js`)), overrides);
    return req(id);
  }
  new Function('require', 'module', 'exports', code + (expose ? `\nmodule.exports.__test = ${expose};` : ''))(resolve, mod, mod.exports);
  return mod.exports;
}
function engine() {
  const slots = [], effects = []; let cursor = 0;
  const hooks = { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
    useEffect(fn, deps) { const i = cursor++; const old = slots[i]; if (!old || !deps || deps.some((dep, j) => !Object.is(dep, old.deps[j]))) { slots[i] = { deps }; effects.push(fn); } },
  };
  return { hooks, render(fn) { cursor = 0; return fn(); }, effects() { for (const effect of effects.splice(0)) effect(); } };
}
function find(node, predicate) { if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } return null; } if (!node || typeof node !== 'object') return null; return predicate(node) ? node : find(node.props?.children, predicate); }
function text(node) { if (node == null || typeof node === 'boolean') return ''; if (Array.isArray(node)) return node.map(text).join(''); return typeof node === 'object' ? text(node.props?.children) : String(node); }
function hrefs(node) { return [...renderToStaticMarkup(node).matchAll(/href="([^"]+)"/g)].map(match => match[1].replace(/&amp;/g, '&')); }
function setup(file, props = {}, exposed = '', router = { query: {}, isReady: false }) {
  const e = engine(); const mod = load(file, { react: e.hooks, 'next/router': { useRouter: () => router } }, exposed); const Component = exposed ? mod.__test : mod.default; let tree;
  const render = () => tree = e.render(() => Component(props)); render();
  return { e, render, router, get tree() { return tree; }, html() { return renderToStaticMarkup(tree); } };
}

const ecology = load('lib/small-revier-life.js');
const foodweb = load('lib/foodweb-learning.js');
const report = load('docs/small-revier-life-stream-foodweb-oct13.json');
const streamIds = ['eintagsfliegenlarven', 'koecherfliegenlarven', 'bachflohkrebse'];
test('New stream profiles describe different biological strategies and no photograph certifies water quality', () => {
  assert.equal(ecology.revierLifeTopics.length, 16);
  for (const id of streamIds) {
    const topic = ecology.getRevierLifeTopic(id);
    assert.equal(topic.group, 'gewaesser'); assert.equal(topic.reviewedOn, '2026-10-13');
    assert.equal(topic.facts.length, 3); assert.equal(topic.quiz.choices.length, 3);
    assert.ok(topic.quiz.answer >= 0 && topic.quiz.answer < topic.quiz.choices.length);
    assert.ok(topic.observe.includes('nicht') && topic.limit.length > 80);
    assert.equal(ecology.revierLifeSearchEntries.find(entry => entry.id === 'revierleben:' + id).href, '/lernen/kleines-revierleben?thema=' + id + '#revierleben-inhalt');
  }
  assert.match(ecology.getRevierLifeTopic('eintagsfliegenlarven').facts[0].text, /wesentlich länger als einen Tag/);
  assert.match(ecology.getRevierLifeTopic('koecherfliegenlarven').facts[1].text, /nicht jede/);
  assert.match(ecology.getRevierLifeTopic('koecherfliegenlarven').facts[2].text, /Einige Arten spinnen Fangnetze/);
  assert.match(ecology.getRevierLifeTopic('bachflohkrebse').facts.map(f => f.text).join(' '), /Gammarus fossarum.*Zerkleinerern.*einzelner Krebsfund genügt.*nicht/s);
});
test('Each new stream fact has an exact manually authored evidence map with independent organizations and explicit limits', () => {
  assert.equal(report.reviewedOn, '2026-10-13');
  assert.deepEqual(report.topics.map(t => t.id), streamIds);
  for (const entry of report.topics) {
    const topic = ecology.getRevierLifeTopic(entry.id);
    assert.deepEqual(entry.claims.map(c => c.factId), topic.facts.map(f => f.id));
    for (const claim of entry.claims) {
      const fact = topic.facts.find(f => f.id === claim.factId);
      assert.deepEqual(claim.sourceIds, fact.sourceIds);
      assert.ok(new Set(claim.sourceIds.map(id => ecology.revierLifeSources[id].organization)).size >= 2);
      assert.deepEqual(claim.support.map(s => s.sourceId), claim.sourceIds);
      assert.ok(claim.boundary && claim.support.every(s => s.supports && s.section));
    }
  }
  assert.ok(report.accessNotes.some(note => note.sourceId === 'eawagLeafDynamics' && note.method.includes('Originalseite')));
  assert.deepEqual(ecology.revierLifeTopics.slice(0, 9).map(t => t.reviewedOn), ['2026-10-12', '2026-10-12', '2026-10-12', '2026-10-12', '2026-10-12', '2026-10-12', '2026-10-13', '2026-10-13', '2026-10-13']);
});
test('The three real stream images retain physical dimensions, hash, exact licensing and location boundaries', async () => {
  const sharp = pr('sharp');
  for (const id of streamIds) {
    const media = ecology.getRevierLifeTopic(id).photo;
    const bytes = fs.readFileSync(path.join(root, 'public', media.src));
    const dimensions = await sharp(bytes).metadata();
    assert.equal(dimensions.width, media.width); assert.equal(dimensions.height, media.height);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), media.sha256);
    assert.equal(media.aiGenerated, false); assert.ok(media.visuallyVerified);
    assert.equal(media.license, 'CC BY-SA 3.0'); assert.ok(media.sourceUrl.includes('commons.wikimedia.org/wiki/File:'));
  }
  assert.match(ecology.getRevierLifeTopic('koecherfliegenlarven').photo.author, /Ecology of Commanster/);
  assert.match(ecology.getRevierLifeTopic('bachflohkrebse').photoContext, /Tschechien.*menschlicher Haut.*keine Aufforderung/s);
});
test('Every food-web arrow is supported, source-scoped and distinct from an observed photo event or quantitative model', () => {
  assert.equal(foodweb.foodwebNodes.length, 5); assert.equal(foodweb.foodwebRelationships.length, 4);
  const nodeIds = new Set(foodweb.foodwebNodes.map(n => n.id));
  assert.equal(nodeIds.size, 5); assert.equal(new Set(foodweb.foodwebRelationships.map(r => r.id)).size, 4);
  for (const edge of foodweb.foodwebRelationships) {
    assert.ok(nodeIds.has(edge.from) && nodeIds.has(edge.to) && edge.from !== edge.to);
    assert.ok(edge.sourceIds.every(id => foodweb.foodwebSources[id]));
    assert.ok(new Set(edge.sourceIds.map(id => foodweb.foodwebSources[id].organization)).size >= 2);
    const evidence = report.foodweb.relationships.find(r => r.id === edge.id);
    assert.deepEqual(evidence.sourceIds, edge.sourceIds); assert.ok(evidence.scope && evidence.boundary && evidence.supportSections.length >= 2);
  }
  assert.match(foodweb.foodwebContext.limit, /keine Tierzahlen.*verschiedenen Fotoorten/s);
  assert.match(foodweb.foodwebRelationships.find(r => r.id === 'wurm-frosch').text, /nicht auf.*Kaulquappen/);
  assert.match(foodweb.foodwebRelationships.find(r => r.id === 'spinne-frosch').text, /weder den Fang dieser Gartenkreuzspinne/);
  assert.ok(!foodweb.foodwebNodes.some(n => 'population' in n || 'quantity' in n));
  assert.equal(foodweb.foodwebSearchEntries[0].href, '/lernen/kleines-revierleben?thema=nahrungsnetz#revierleben-inhalt');
});
test('Food-web selection shows exactly the adjacent arrows, preserves source data and falls back to a connected organism', () => {
  const before = JSON.stringify(foodweb.foodwebRelationships);
  for (const node of foodweb.foodwebNodes) {
    const selected = foodweb.getFoodwebSelection(node.id);
    assert.equal(selected.node.id, node.id);
    assert.deepEqual(selected.relationships.map(r => r.id), foodweb.foodwebRelationships.filter(r => r.from === node.id || r.to === node.id).map(r => r.id));
    assert.ok(selected.connectedIds.includes(node.id) && selected.relationships.length >= 1);
  }
  assert.equal(foodweb.getFoodwebSelection('invalid').node.id, 'regenwurm');
  assert.equal(JSON.stringify(foodweb.foodwebRelationships), before);
});
test('Food-web photograph selection immediately changes explanation without an opening button or simulation', () => {
  const s = setup('components/FoodwebLearning.js');
  const change = id => { find(s.tree, n => n.type === 'input' && n.props.value === id).props.onChange(); s.render(); };
  assert.match(text(find(s.tree, n => n.props?.id === 'nahrungsnetz-beziehungen')), /Laubstreu → Regenwürmer.*Regenwürmer → Goldlaufkäfer.*Würmer → erwachsener Grasfrosch/s);
  change('spinne');
  const explanation = text(find(s.tree, n => n.props?.id === 'nahrungsnetz-beziehungen'));
  assert.match(explanation, /Spinnen: die Verbindungen.*Spinnen → erwachsener Grasfrosch/s);
  assert.doesNotMatch(explanation, /Laubstreu → Regenwürmer|Regenwürmer → Goldlaufkäfer/);
  assert.equal(find(s.tree, n => n.type === 'input' && n.props.value === 'spinne').props.checked, true);
  change('laub'); assert.match(text(find(s.tree, n => n.props?.id === 'nahrungsnetz-beziehungen')), /Laubstreu → Regenwürmer/);
  assert.equal(find(s.tree, n => n.props?.id === 'nahrungsnetz-beziehungen').props['aria-live'], 'polite');
  assert.doesNotMatch(s.html(), /<button|<canvas|type="range"/);
  for (const node of foodweb.foodwebNodes) assert.ok(find(s.tree, n => n.props?.src === node.photo.src));
});

test('A controlled food-web motif waits for its parent commit and retains the learning answer across motif changes', () => {
  const requested = [], props = { selectedId: 'spinne', onSelect: id => requested.push(id) };
  const s = setup('components/FoodwebLearning.js', props);
  find(s.tree, n => n.type === 'input' && n.props.name === 'nahrungsnetz-lernfrage').props.onChange(); s.render();
  const feedback = text(find(s.tree, n => n.props?.role === 'status'));
  find(s.tree, n => n.type === 'input' && n.props.value === 'grasfrosch').props.onChange(); s.render();
  assert.deepEqual(requested, ['grasfrosch']);
  assert.equal(find(s.tree, n => n.type === 'input' && n.props.value === 'spinne').props.checked, true);
  assert.match(text(find(s.tree, n => n.props?.id === 'nahrungsnetz-beziehungen')), /^Spinnen:/);
  props.selectedId = 'grasfrosch'; s.render();
  assert.equal(find(s.tree, n => n.type === 'input' && n.props.value === 'grasfrosch').props.checked, true);
  assert.equal(text(find(s.tree, n => n.props?.role === 'status')), feedback);
  assert.match(text(find(s.tree, n => n.props?.id === 'nahrungsnetz-beziehungen')), /^Erwachsener Grasfrosch:/);
});

test('Food-web explanations stay direct while each relation, context and quiz reference and every photo licence is preserved in the final closed block', () => {
  for (const node of foodweb.foodwebNodes) {
    const s = setup('components/FoodwebLearning.js', { selectedId: node.id });
    const children = React.Children.toArray(s.tree.props.children);
    const footer = children.at(-1), body = React.createElement(React.Fragment, null, children.slice(0, -1));
    assert.equal(footer.type, 'details'); assert.ok(!footer.props.open);
    assert.doesNotMatch(renderToStaticMarkup(body), /<a\b/);
    assert.ok(text(body).includes(node.description)); assert.ok(text(body).includes(foodweb.foodwebContext.text)); assert.ok(text(body).includes(foodweb.foodwebContext.limit));
    for (const relation of foodweb.getFoodwebSelection(node.id).relationships) assert.ok(text(body).includes(relation.text));
    for (const [id, sourceIds] of [...foodweb.foodwebRelationships.map(relation => [relation.id, relation.sourceIds]), ['context', foodweb.foodwebContext.sourceIds], ['question', foodweb.foodwebQuestion.sourceIds]]) {
      const mapping = find(footer, item => item.props?.['data-source-for'] === id);
      assert.ok(mapping, id); assert.deepEqual(hrefs(mapping), sourceIds.map(sourceId => foodweb.foodwebSources[sourceId].url));
    }
    for (const photograph of foodweb.foodwebNodes.map(item => item.photo)) {
      assert.ok(text(footer).includes(photograph.author)); assert.ok(text(footer).includes(photograph.license));
      assert.ok(text(footer).includes(photograph.modifications));
      assert.ok(hrefs(footer).includes(photograph.sourceUrl)); assert.ok(hrefs(footer).includes(photograph.licenseUrl));
    }
  }
});
test('Existing selector supports food-web deep links, keeps URL state and returns to normal profiles on back navigation', () => {
  const changes = []; const router = { query: { thema: 'nahrungsnetz', preserved: 'yes' }, isReady: true, pathname: '/lernen/kleines-revierleben', replace: (...args) => { changes.push(args); return Promise.resolve(); } };
  router.push = (...args) => { changes.push(args); router.query = args[0].query; return Promise.resolve(true); };
  const s = setup('components/SmallRevierLife.js', {}, '', router); s.e.effects(); s.render();
  assert.equal(find(s.tree, n => n.type?.name === 'MenuChoice').props.value, 'nahrungsnetz');
  assert.ok(find(s.tree, n => n.type?.name === 'FoodwebLearning'));
  find(s.tree, n => n.type?.name === 'MenuChoice').props.onChange({ target: { value: 'eintagsfliegenlarven' } }); s.render();
  assert.equal(find(s.tree, n => n.props?.topic)?.props.topic.id, 'eintagsfliegenlarven');
  assert.equal(changes[0][0].query.preserved, 'yes'); assert.equal(changes[0][0].query.thema, 'eintagsfliegenlarven');
  router.query.thema = changes[0][0].query.thema; s.render(); s.e.effects(); s.render();
  router.query.thema = 'nahrungsnetz'; s.render(); s.e.effects(); s.render(); assert.ok(find(s.tree, n => n.type?.name === 'FoodwebLearning'));
  router.query.thema = 'wildbienen'; s.render(); s.e.effects(); s.render(); assert.equal(find(s.tree, n => n.props?.topic)?.props.topic.id, 'wildbienen');
});
test('Food-web motif survives a saved URL and external navigation, and stale motif is removed from other profiles', () => {
  const changes = []; const router = { query: { thema: 'nahrungsnetz', motiv: 'spinne', retained: 'yes' }, isReady: true, pathname: '/lernen/kleines-revierleben', replace: (...args) => { changes.push(args); return Promise.resolve(); } };
  router.push = (...args) => { changes.push(args); router.query = args[0].query; return Promise.resolve(true); };
  const s = setup('components/SmallRevierLife.js', {}, '', router); s.e.effects(); s.render();
  const network = () => find(s.tree, n => n.type?.name === 'FoodwebLearning');
  assert.equal(network().props.selectedId, 'spinne');
  network().props.onSelect('grasfrosch'); s.render();
  assert.equal(network().props.selectedId, 'grasfrosch');
  assert.equal(changes[0][0].query.motiv, 'grasfrosch'); assert.equal(changes[0][0].query.retained, 'yes');
  assert.equal(changes[0][0].hash, 'revierleben-inhalt'); assert.equal(changes[0][2].scroll, false);
  router.query.motiv = 'laub'; s.render(); s.e.effects(); s.render(); assert.equal(network().props.selectedId, 'laub');
  router.query.motiv = ['spinne', 'laub']; s.render(); s.e.effects(); s.render(); assert.equal(network(), null); assert.match(s.html(), /Dieses Thema oder Nahrungsnetzmotiv ist nicht verfügbar/);
  find(s.tree, n => n.type?.name === 'MenuChoice').props.onChange({ target: { value: 'wildbienen' } });
  assert.equal(changes.at(-1)[0].query.motiv, undefined);
});
test('The inline food-web knowledge check explains an incorrect answer without another action', () => {
  const s = setup('components/FoodwebLearning.js');
  find(s.tree, n => n.type === 'input' && n.props.name === 'nahrungsnetz-lernfrage' && n.props.checked === false).props.onChange(); s.render();
  assert.match(text(s.tree), /Das passt\..*Der Pfeil beschreibt einen Nahrungsweg/s);
  const question = find(s.tree, n => n.type === 'fieldset' && text(n).startsWith('Was bedeutet hier der Pfeil'));
  const wrong = find(question, n => n.type === 'label' && text(n).startsWith('Jede Regenwurmart'));
  find(wrong, n => n.type === 'input').props.onChange(); s.render();
  assert.match(text(s.tree), /Hier lohnt sich ein genauerer Blick\..*Passend ist:\s*Abgestorbene Pflanzenreste/s);
  assert.deepEqual(foodweb.foodwebQuestion.sourceIds, ['muensterWorms', 'kielWorms']);
});
test('The four added soil and waterside profiles are reachable through the existing selector, shared search and public media registry', () => {
  const search = load('lib/knowledge-expansion-search.js').knowledgeExpansionSearchEntries;
  const assets = load('lib/knowledge-expansion-assets.js').knowledgeExpansionAssetPaths;
  for (const id of ['asseln', 'doppelfuesser', 'libellenlarven', 'wasserlaeufer']) {
    const topic = ecology.revierLifeTopics.find(item => item.id === id); assert.ok(topic);
    const router = { query: { thema: id }, isReady: true, pathname: '/lernen/kleines-revierleben' };
    const s = setup('components/SmallRevierLife.js', {}, '', router); s.e.effects(); s.render();
    assert.equal(find(s.tree, n => n.type?.name === 'MenuChoice').props.value, id);
    assert.equal(find(s.tree, n => n.props?.topic)?.props.topic.id, id);
    assert.ok(ecology.revierLifeGroups.some(group => group.id === topic.group));
    assert.equal(search.find(entry => entry.id === `revierleben:${id}`).href, `/lernen/kleines-revierleben?thema=${id}#revierleben-inhalt`);
    assert.ok(assets.includes(topic.photo.src));
  }
  assert.ok(load('lib/learning-experiences.js').learningExperiences.some(item => item.href === '/lernen/kleines-revierleben'), 'The ecology tool remains reachable from the learning catalog');
});
