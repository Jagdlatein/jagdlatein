const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {createRequire} = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const React = pr('react');
const {renderToStaticMarkup} = pr('react-dom/server');
const sharp = pr('sharp');
const swc = pr('next/dist/build/swc');
function load(relative, overrides = {}, cache = new Map()) {
  const filename = path.join(root, relative);
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
  if (cache.has(filename)) return cache.get(filename);
  const mod = {exports: {}};
  const {code} = swc.transformSync(fs.readFileSync(filename, 'utf8'), {filename, disableNextSsg: true, jsc: {parser: {syntax: 'ecmascript', jsx: true}, target: 'es2022', transform: {react: {runtime: 'automatic'}}}, module: {type: 'commonjs'}});
  function resolve(id) {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/image') return ({priority, fill, ...props}) => React.createElement('img', props);
    if (id.endsWith('.module.css')) return {__esModule: true, default: new Proxy({}, {get: (_, key) => String(key)})};
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')), overrides, cache);
    return pr(id);
  }
  new Function('require', 'module', 'exports', code)(resolve, mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}
function walk(node, predicate, results = []) {
  if (Array.isArray(node)) node.forEach(child => walk(child, predicate, results));
  else if (node && typeof node === 'object') { if (predicate(node)) results.push(node); walk(node.props?.children, predicate, results); }
  return results;
}
const digestive = load('lib/digestive-learning.js');
const parasite = load('lib/parasite-learning.js');
const collections = [
  {topics: digestive.digestiveTopics, sources: digestive.digestiveSources, Component: 'DigestiveLearning', searches: digestive.digestiveSearchEntries, assets: digestive.digestiveAssetPaths, pathname: '/lernen/anatomie', section: 'verdauung', anchor: 'anatomie-verdauung'},
  {topics: parasite.parasiteTopics, sources: parasite.parasiteSources, Component: 'ParasiteLearning', searches: parasite.parasiteSearchEntries, assets: parasite.parasiteAssetPaths, pathname: '/lernen/wildbret-fallwerkstatt', section: 'parasiten', anchor: 'wildbret-parasiten'},
];

test('Five bounded learning profiles have nineteen distinct claim blocks and ten explained questions', () => {
  assert.equal(digestive.digestiveTopics.length, 2); assert.equal(parasite.parasiteTopics.length, 3);
  const all = collections.flatMap(collection => collection.topics);
  assert.equal(new Set(all.map(topic => topic.id)).size, 5);
  const facts = all.flatMap(topic => topic.facts), questions = all.flatMap(topic => topic.questions);
  assert.equal(facts.length, 19); assert.equal(new Set(facts.map(fact => fact.id)).size, 19);
  assert.equal(questions.length, 10); assert.equal(new Set(questions.map(question => question.id)).size, 10);
  for (const topic of all) {
    assert.equal(topic.reviewedOn, '2026-10-13'); assert.ok(topic.summary && topic.limit && topic.photoContext && topic.keywords.length);
    assert.equal(topic.questions.length, 2);
    for (const question of topic.questions) {
      assert.equal(question.choices.length, 3); assert.equal(new Set(question.choices).size, 3);
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 3);
      assert.ok(question.explanation.length > 65);
      assert.ok(question.factIds.length && question.factIds.every(id => topic.facts.some(fact => fact.id === id)));
    }
  }
  assert.equal(digestive.getDigestiveTopic('unknown').id, digestive.digestiveTopics[0].id);
  assert.equal(parasite.getParasiteTopic('unknown').id, parasite.parasiteTopics[0].id);
});

test('Each claim block and simplified pathway records at least two independent responsible organizations', () => {
  for (const {topics, sources} of collections) for (const topic of topics) {
    for (const fact of [...topic.facts, topic.pathway || topic.cycle]) {
      assert.ok(fact.sourceIds.every(id => sources[id]), `${topic.id}: missing source`);
      const organizations = new Set(fact.sourceIds.map(id => sources[id].independenceGroup || sources[id].organization));
      assert.ok(organizations.size >= 2, `${topic.id}: ${fact.id || fact.title}`);
    }
    for (const source of Object.values(sources)) {
      assert.ok(source.title && source.organization && source.scope); assert.match(source.url, /^https:\/\//);
      assert.equal(source.reviewedOn, '2026-10-13');
    }
  }
  assert.equal(digestive.digestiveSources.vetAnatomy.organization, digestive.digestiveSources.vetMicrobes.organization);
  assert.ok(digestive.digestiveSources.luzern.scope.includes('nicht als unabhängige'));
  assert.equal(parasite.parasiteSources.ict.independenceGroup, parasite.parasiteSources.bfrFreeze.organization);
  assert.ok(parasite.getParasiteTopic('trichinellen').facts.find(fact => fact.id === 'trich-gefrieren').sourceIds.includes('cdcFreeze'));
});

test('The selected biological roles stay separate: no boar rumen, no obligatory human fox-bandworm host, and no snail end-host', () => {
  const boar = digestive.getDigestiveTopic('schwarzwild-verdauung');
  assert.match(boar.facts.find(fact => fact.id === 'kein-wiederkaeuer').text, /kein Wiederkäuer/);
  assert.match(boar.facts.find(fact => fact.id === 'ein-hohlraum').text, /Schleimhaut.*vier Abschnitte/);
  assert.match(boar.facts.find(fact => fact.id === 'auch-mikroben').text, /Dickdarm/);
  assert.match(boar.photoContext, /keine inneren Verdauungsorgane/);
  const fox = parasite.getParasiteTopic('fuchsbandwurm');
  assert.equal(fox.cycle.steps.length, 4); assert.ok(fox.cycle.steps.every(step => !/Mensch/.test(step.title)));
  assert.match(fox.cycle.branch.text, /keine notwendige Station/);
  assert.match(fox.facts.find(fact => fact.id === 'echino-mensch').text, /Eiaufnahme.*Fehlzwischenwirt/);
  const fluke = parasite.getParasiteTopic('grosser-leberegel');
  assert.match(fluke.facts.find(fact => fact.id === 'fasciola-schnecke').text, /Galba truncatula.*Zwischenwirt/);
  assert.match(fluke.facts.find(fact => fact.id === 'fasciola-pflanze').text, /Metazerkarien/);
  assert.equal(fluke.questions[1].choices[fluke.questions[1].answer], 'Eine eingekapselte Metazerkarie');
  const trich = parasite.getParasiteTopic('trichinellen');
  assert.match(trich.facts.find(fact => fact.id === 'trich-aufnahme').text, /Muskelgewebe.*Trichinellenlarven/);
  assert.match(trich.facts.find(fact => fact.id === 'trich-gefrieren').text, /nicht als verlässliche Kontrolle/);
  assert.match(trich.photoContext, /keine Aufnahme eines Wildschweins/);
});

test('Every delivered photograph decodes, matches its provenance hash and is labelled with its actual motive and changes', async () => {
  const manifest = load('public/lernen/koerper-kreislauf-2026/mediennachweise.json');
  const assets = [...new Set(collections.flatMap(collection => collection.assets))];
  assert.equal(assets.length, 5); assert.equal(manifest.length, 5);
  assert.deepEqual(manifest.map(photo => photo.src).sort(), assets.slice().sort());
  for (const photo of manifest) {
    const bytes = fs.readFileSync(path.join(root, 'public', photo.src));
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.width, photo.width); assert.equal(metadata.height, photo.height);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), photo.sha256, photo.src);
    assert.equal(photo.aiGenerated, false); assert.equal(photo.visuallyCheckedOn, '2026-10-13');
    assert.ok(photo.visualInspection && photo.author && photo.alt && photo.originalDescription && photo.modifications);
    assert.match(photo.sourceUrl, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.match(photo.license, /^(CC BY-SA|Public Domain)/); assert.match(photo.licenseUrl, /^https:\/\//);
    assert.match(photo.modifications, /contain/);
  }
});

test('Selected content and sources appear immediately without a second layout, extra opening buttons or cropped teaching photos', () => {
  for (const collection of collections) {
    const Component = load(`components/${collection.Component}.js`).default;
    for (const topic of collection.topics) {
      const html = renderToStaticMarkup(React.createElement(Component, {selectedId: topic.id, hideSelector: true}));
      assert.ok(html.includes(topic.title) && html.includes(topic.photo.src) && html.includes(`id="${collection.anchor}"`));
      assert.equal((html.match(/type="radio"/g) || []).length, 6);
      assert.equal((html.match(/<fieldset\b/g) || []).length, 2);
      assert.doesNotMatch(html, /<main\b|<h1\b|<button\b|<select\b|undefined/);
      assert.match(html, /Eigene vereinfachte Lernskizze/); assert.match(html, /13\. Oktober 2026/);
      assert.ok(html.includes(topic.photo.author.replace(/&/g, '&amp;')));
      for (const fact of topic.facts) for (const sourceId of fact.sourceIds) assert.ok(html.includes(collection.sources[sourceId].url.replace(/&/g, '&amp;')));
    }
    const css = fs.readFileSync(path.join(root, `styles/${collection.Component}.module.css`), 'utf8');
    assert.match(css, /object-fit:\s*contain/); assert.match(css, /height:\s*350px/);
    assert.match(css, /focus-visible/); assert.match(css, /max-width:\s*620px/);
  }
});

test('Every radio answer reveals the correct explanation immediately and can be revised without submitting', () => {
  for (const {Component: name, topics} of collections) for (const topic of topics) for (const question of topic.questions) {
    let answers = {};
    const hooks = {...React, useState(initial) { return typeof initial === 'object' ? [answers, update => { answers = typeof update === 'function' ? update(answers) : update; }] : [initial, () => {}]; }};
    const Component = load(`components/${name}.js`, {react: hooks}).default;
    const tree = Component({selectedId: topic.id, hideSelector: true});
    const content = walk(tree, node => node.type?.name === 'Content')[0]; assert.ok(content);
    function choose(index) {
      const rendered = content.type(content.props);
      const radio = walk(rendered, node => node.type === 'input' && node.props.name === question.id)[index]; assert.ok(radio);
      radio.props.onChange();
      return renderToStaticMarkup(content.type(content.props));
    }
    assert.doesNotMatch(renderToStaticMarkup(content.type(content.props)), /role="status"/);
    const wrong = choose((question.answer + 1) % 3);
    assert.match(wrong, /Passend ist:/); assert.ok(wrong.includes(question.explanation));
    const correct = choose(question.answer);
    assert.match(correct, /Das passt\./); assert.ok(correct.includes(question.explanation));
    assert.equal(answers[question.id], question.answer);
  }
});

test('Digestive learning keeps all teaching and limits visible while the last closed source block retains each fact, diagram, quiz and photograph attribution', () => {
  const hooks = { ...React, useState: initial => [initial, () => {}] };
  const Component = load('components/DigestiveLearning.js', { react: hooks }).default;
  const words = node => Array.isArray(node) ? node.map(words).join(' ') : node == null || typeof node === 'boolean' ? '' : typeof node === 'object' ? words(node.props?.children) : String(node);
  const hrefs = node => [...renderToStaticMarkup(node).matchAll(/href="([^"]+)"/g)].map(match => match[1].replaceAll('&amp;', '&'));
  for (const topic of digestive.digestiveTopics) {
    const tree = Component({ selectedId: topic.id, hideSelector: true });
    const content = walk(tree, node => node.type?.name === 'Content')[0];
    const article = content.type(content.props);
    const children = React.Children.toArray(article.props.children);
    const evidence = children.at(-1);
    assert.equal(evidence.type, 'details'); assert.ok(!evidence.props.open, 'All supplemental sources start closed');
    const learning = children.slice(0, -1);
    assert.equal(walk(learning, node => node.type === 'a' || node.type?.name === 'SourceLinks').length, 0, 'No inline source or photo-license links interrupt the learning text');
    const visible = words(learning);
    for (const text of [topic.summary, topic.photoContext, topic.observation, topic.limit, topic.pathway.note, ...topic.facts.map(fact => fact.text), ...topic.pathway.steps.flatMap(step => [step.title, step.text]), ...topic.questions.map(question => question.prompt)]) assert.ok(visible.includes(text), `${topic.id}: learning text or scope limit missing`);
    const mapping = walk(evidence, node => node.type === 'li' && walk(node, child => child.type?.name === 'SourceLinks').length > 0);
    for (const fact of topic.facts) {
      const row = mapping.find(row => words(row).includes(fact.title)); assert.ok(row, fact.id);
      assert.deepEqual(new Set(hrefs(row)), new Set(fact.sourceIds.map(id => digestive.digestiveSources[id].url)));
    }
    for (const question of topic.questions) {
      const row = mapping.find(row => words(row).includes(question.prompt)); assert.ok(row, question.id);
      const expected = topic.facts.filter(fact => question.factIds.includes(fact.id)).flatMap(fact => fact.sourceIds).map(id => digestive.digestiveSources[id].url);
      assert.deepEqual(new Set(hrefs(row)), new Set(expected), 'Quiz sources remain traceable to the exact facts used by its explanation');
    }
    const links = walk(evidence, node => node.type?.name === 'SourceLinks');
    assert.deepEqual(new Set(hrefs(links[topic.facts.length])), new Set(topic.pathway.sourceIds.map(id => digestive.digestiveSources[id].url)), 'The learning diagram retains its own source assignment');
    const evidenceText = words(evidence), evidenceLinks = hrefs(evidence);
    for (const text of [topic.photo.author, topic.photo.license, topic.photo.modifications]) assert.ok(evidenceText.includes(text));
    assert.ok(evidenceLinks.includes(topic.photo.sourceUrl)); assert.ok(evidenceLinks.includes(topic.photo.licenseUrl));
    for (const id of new Set([...topic.facts.flatMap(fact => fact.sourceIds), ...topic.pathway.sourceIds])) assert.ok(evidenceText.includes(digestive.digestiveSources[id].scope));
  }
});

test('Each search result addresses the real profile directly and exposes no answer keys', () => {
  for (const collection of collections) {
    assert.equal(collection.searches.length, collection.topics.length);
    for (const entry of collection.searches) {
      const url = new URL(entry.href, 'https://example.test');
      assert.equal(url.pathname, collection.pathname); assert.equal(url.searchParams.get('bereich'), collection.section);
      assert.equal(url.hash, `#${collection.anchor}`); assert.ok(collection.topics.some(topic => topic.id === url.searchParams.get('thema')));
      assert.ok(entry.title && entry.description && entry.categorySlug && entry.keywords.length);
      assert.ok(!entry.answer && !entry.questions && !entry.facts);
    }
  }
});
