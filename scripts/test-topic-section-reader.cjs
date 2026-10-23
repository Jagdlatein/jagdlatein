const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const fs = require('node:fs');
const path = require('node:path');
const { root } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');

function find(node, predicate) {
  if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean) || null;
  if (!node || typeof node !== 'object') return null;
  return predicate(node) ? node : find(node.props?.children, predicate);
}

function engine() {
  const slots = []; let cursor = 0, effects = [], changed = false;
  return { hooks: { ...React,
    useState(initial) { const i = cursor++; slots[i] ||= { value: initial }; return [slots[i].value, value => { if (slots[i].value !== value) changed = true; slots[i].value = value; }]; },
    useRef(initial) { const i = cursor++; slots[i] ||= { value: { current: initial } }; return slots[i].value; },
    useEffect(callback, deps) { const i = cursor++, previous = slots[i]; if (!previous || deps.some((value, j) => value !== previous.deps[j])) { slots[i] = { deps, cleanup: previous?.cleanup }; effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = callback(); }); } },
  }, render(fn) { cursor = 0; changed = false; return fn(); }, changed: () => changed,
  flush() { const pending = effects; effects = []; pending.forEach(fn => fn()); },
  unmount() { slots.forEach(slot => slot.cleanup?.()); } };
}

function setup(hash) {
  const e = engine(), listeners = new Map(), routerListeners = new Map(), calls = [], focus = [];
  const on = (map, event, fn) => { if (!map.has(event)) map.set(event, new Set()); map.get(event).add(fn); };
  const off = (map, event, fn) => map.get(event)?.delete(fn);
  const previousWindow = global.window;
  global.window = { location: { hash }, addEventListener: (event, fn) => on(listeners, event, fn), removeEventListener: (event, fn) => off(listeners, event, fn) };
  const load = createLoader({ react: e.hooks, 'next/router': { events: { on: (event, fn) => on(routerListeners, event, fn), off: (event, fn) => off(routerListeners, event, fn) } } });
  const Reader = load('components/TopicSectionReader.js').default;
  const groups = [{ id: 'biology', title: 'Biologie', topics: ['first', 'second'].map(id => ({ id, title: id, aliases: id === 'first' ? ['legacy'] : [], render: () => { calls.push(id); return React.createElement('p', null, `TEXT-${id}`); } })) }];
  let tree;
  function render() {
    tree = e.render(() => Reader({ id: 'tree', groups }));
    const target = find(tree, node => node.props?.ref);
    if (target) target.props.ref.current = { focus() { focus.push(target.type); }, scrollIntoView() {} };
  }
  render();
  return { get tree() { return tree; }, groups, calls, focus,
    settle() { for (let i = 0; i < 4; i++) { e.flush(); if (!e.changed()) break; render(); } },
    navigate(next, event = 'hashchange', router = false) { global.window.location.hash = next; for (const fn of (router ? routerListeners : listeners).get(event) || []) fn(); if (e.changed()) render(); this.settle(); },
    cleanup() { e.unmount(); assert.equal([...listeners.values()].reduce((n, set) => n + set.size, 0), 0); assert.equal([...routerListeners.values()].reduce((n, set) => n + set.size, 0), 0); if (previousWindow === undefined) delete global.window; else global.window = previousWindow; },
  };
}

test('Root and group navigation render no topic text; an initial deep link focuses only its committed text', () => {
  const s = setup('#first');
  try {
    assert.deepEqual(s.calls, []);
    s.settle(); assert.deepEqual(s.calls, ['first']); assert.deepEqual(s.focus, ['article']);
    assert.equal(find(s.tree, node => node.type === 'nav'), null, 'The selected topic has no duplicate upper breadcrumb');
    s.navigate('#biology'); assert.equal(find(s.tree, node => node.type === 'article'), null); assert.deepEqual(s.calls, ['first']);
    assert.equal(find(s.tree, node => node.type === 'nav'), null, 'Category choices remain content without a second navigation bar');
    s.navigate('#second', 'popstate'); assert.equal(s.calls.at(-1), 'second'); assert.equal(s.focus.at(-1), 'article');
    const beforeRoot = s.focus.length;
    s.navigate('#tree', 'popstate'); assert.equal(find(s.tree, node => node.type === 'article'), null); assert.equal(s.focus.length, beforeRoot, 'A branch focuses the lower menu instead of an upper heading');
  } finally { s.cleanup(); }
});

test('Native aliases, Next fragment completion and malformed/unknown fragments keep normal history semantics', () => {
  const s = setup('');
  try {
    s.settle(); assert.deepEqual(s.focus, []);
    s.navigate('#legacy', 'hashChangeComplete', true); assert.equal(s.calls.at(-1), 'first');
    s.navigate('#second', 'routeChangeComplete', true); assert.equal(s.calls.at(-1), 'second');
    for (const hash of ['#foreign', '#%E0%A4%A']) { s.navigate(hash); assert.equal(find(s.tree, node => node.type === 'article'), null); assert.equal(global.window.location.hash, hash); }
    s.navigate('#first', 'pageshow'); assert.equal(s.calls.at(-1), 'first');
  } finally { s.cleanup(); }
});

test('Legacy React sections remain separate, retain authored sources, and never invoke custom components while discovering topics', () => {
  const load = createLoader(), { createPortraitTopics } = load('components/WildlifePortraitLayout.js');
  const Photo = () => { throw new Error('Discovery must not render a photo'); };
  const content = React.createElement('div', null, ' \n ', React.createElement('div', null, React.createElement(Photo)),
    React.createElement('section', { id: 'old-anchor' }, React.createElement('h2', null, 'Merkmale'), React.createElement('p', null, 'NUR-A')),
    React.createElement('section', null, React.createElement('p', null, 'BELEG'), React.createElement('h2', null, 'Quiz'), React.createElement('p', null, 'NUR-B')));
  const topics = createPortraitTopics(content);
  assert.equal(topics.length, 3); assert.equal(topics[1].id, 'old-anchor'); assert.equal(topics[2].title, 'Quiz');
  const first = renderToStaticMarkup(topics[1].render()), second = renderToStaticMarkup(topics[2].render());
  assert.match(first, /NUR-A/); assert.doesNotMatch(first, /NUR-B|BELEG/); assert.match(second, /BELEG/); assert.doesNotMatch(second, /NUR-A/);
});

test('Every authored legacy portrait retains all its original text exactly once and discovers only meaningful topics', () => {
  const { createPortraitTopics } = createLoader()('components/WildlifePortraitLayout.js');
  const words = node => React.Children.toArray(node).map(child => React.isValidElement(child) ? words(child.props.children) : typeof child === 'string' || typeof child === 'number' ? String(child) : '').join(' ').replace(/\s+/g, ' ').trim();
  const files = fs.readdirSync(path.join(root, 'pages/wildkunde')).filter(file => file.endsWith('.js') && !file.startsWith('[') && fs.readFileSync(path.join(root, 'pages/wildkunde', file), 'utf8').includes('<WildlifePortraitLayout'));
  assert.ok(files.length >= 30);
  for (const file of files) {
    let captured;
    const Page = createLoader({ '../../components/WildlifePortraitLayout': props => { captured = props.children; return null; } })(`pages/wildkunde/${file}`).default;
    renderToStaticMarkup(React.createElement(Page));
    const topics = createPortraitTopics(captured);
    assert.equal(words(topics.map(topic => topic.render())), words(captured), file);
    assert.equal(new Set(topics.map(topic => topic.id)).size, topics.length, file);
    assert.ok(topics.every(topic => topic.title.trim() && topic.id.trim()), file);
  }
});

test('Legacy biological bibliographies are separated from their teaching text without losing references or scope limits', () => {
  const { splitPortraitSources, createPortraitTopics } = createLoader()('components/WildlifePortraitLayout.js');
  const sources = React.createElement('p', null, 'Biologiequellen (alter dokumentierter Prüfstand): ', React.createElement('a', { href: 'https://example.invalid/source' }, 'Originalbeleg'));
  const authored = React.createElement('section', null, sources, React.createElement('p', null, 'Richtwerte können abweichen.'), React.createElement('h2', null, 'Quiz'), React.createElement('p', null, 'Lernfrage'));
  const split = splitPortraitSources(authored);
  const text = renderToStaticMarkup(split.content), evidence = renderToStaticMarkup(split.sources);
  assert.doesNotMatch(text, /Biologiequellen|Originalbeleg/);
  assert.match(text, /Richtwerte können abweichen/); assert.match(text, /Lernfrage/);
  assert.match(evidence, /alter dokumentierter Prüfstand/); assert.match(evidence, /https:\/\/example.invalid\/source/);
  const topics = createPortraitTopics(split.content); assert.equal(topics[0].title, 'Quiz');
});

test('Every expansion/depth section and all established species links resolve to an exact reader leaf or group', () => {
  const load = createLoader(), Layout = load('components/WildlifePortraitLayout.js').default;
  const { resolveTopicSection } = load('components/TopicSectionReader.js');
  const knowledge = load('lib/wildlife-knowledge-discovery.js').wildlifeKnowledgeDiscovery;
  const depth = load('lib/wildlife-depth.js').wildlifeDepthBySlug;
  const speciesList = load('lib/european-wildlife-discovery.js').europeanWildlifeBySlug;
  let checked = 0;
  for (const slug of Object.keys(speciesList)) {
    const tree = Layout({ slug, children: React.createElement('section', null, React.createElement('h2', null, 'Art kennenlernen'), React.createElement('p', null, 'GRUNDTEXT')) });
    assert.equal(tree.props.headingOnly, true); assert.equal(tree.props.searchHref, undefined, 'Search is available in the shared bottom navigation');
    const reader = find(tree, node => node.props?.groups);
    assert.ok(reader, slug);
    const groups = reader.props.groups, ids = groups.flatMap(group => [group.id, ...group.topics.map(topic => topic.id)]);
    assert.equal(new Set(ids).size, ids.length, `duplicate topic id: ${slug}`);
    for (const section of knowledge[slug] || []) assert.equal(resolveTopicSection(groups, `#art-wissen-${section.id}`).kind, 'topic', slug);
    if (depth[slug]) { assert.equal(resolveTopicSection(groups, '#wildlife-depth').kind, 'group'); for (const key of ['seasonalLife', 'fieldSigns', 'comparisons', 'observation']) assert.equal(resolveTopicSection(groups, `#wildlife-depth-${key}`).kind, 'topic'); }
    for (const id of ['portrait-sounds', 'art-weiterlernen', 'portrait-jagdstatus']) assert.equal(resolveTopicSection(groups, `#${id}`).kind, 'topic', `${slug}/${id}`);
    checked++;
  }
  assert.ok(checked > 100);
});

test('Selected biological sections render their own sources and exclude other sections; European leaves preserve exact old anchors', () => {
  const load = createLoader({ 'next/image': ({ priority, ...props }) => React.createElement('img', props) });
  const profile = Object.values(load('lib/wildlife-knowledge.js').wildlifeKnowledgeBySlug).find(item => item.sections.length > 1);
  const slug = Object.keys(load('lib/wildlife-knowledge.js').wildlifeKnowledgeBySlug).find(key => load('lib/wildlife-knowledge.js').wildlifeKnowledgeBySlug[key] === profile);
  const Expansion = load('components/WildlifeKnowledgeExpansion.js').default;
  const html = renderToStaticMarkup(React.createElement(Expansion, { slug, name: 'Art', sectionId: profile.sections[0].id }));
  assert.ok(html.includes(profile.sections[0].text.slice(0, 35))); assert.ok(!html.includes(profile.sections[1].text.slice(0, 35))); assert.match(html, /Fachquellen/);
  const Depth = load('components/WildlifeDepth.js').default, depth = load('lib/wildlife-depth.js').wildlifeDepthBySlug.rehwild;
  const depthHTML = renderToStaticMarkup(React.createElement(Depth, { slug: 'rehwild', name: 'Rehwild', section: 'seasonalLife' }));
  assert.ok(depthHTML.includes(depth.seasonalLife[0].slice(0, 35))); assert.ok(!depthHTML.includes(depth.fieldSigns[0].slice(0, 35))); assert.match(depthHTML, /Quellen dieser Vertiefung/);
  const European = load('components/EuropeanWildlifePortrait.js').default;
  const species = load('lib/european-wildlife.js').europeanWildlife.find(item => item.sections?.length > 1);
  const element = European({ species });
  for (const section of species.sections) assert.ok(element.props.portraitSections.some(topic => topic.id === `art-${section.id}`));
  const selected = renderToStaticMarkup(element.props.portraitSections.find(topic => topic.id === `art-${species.sections[0].id}`).render());
  assert.match(selected, /Fachquellen/); assert.ok(!selected.includes(species.sections[1].paragraphs[0].slice(0, 35)));
  assert.ok(element.props.portraitSections.some(topic => topic.id === 'portrait-geltungsbereich'));
});
