const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');

function nodes(node, predicate) {
  if (Array.isArray(node)) return node.flatMap(child => nodes(child, predicate));
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join(' ');
  if (node == null || typeof node === 'boolean') return '';
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
function setup(file, query = {}) {
  const previousWindow = global.window;
  const slots = [], effects = [], replacements = [], methods = [], focus = [], scroll = [];
  let cursor = 0, dirty = false, tree, closeCount = 0;
  const router = { isReady: true, pathname: file.includes('Anatomy') ? '/lernen/anatomie' : '/lernen/wildtier-details', query,
    replace(...args) { methods.push('replace'); replacements.push(args); router.query = args[0].query; return Promise.resolve(true); },
    push(...args) { methods.push('push'); replacements.push(args); router.query = args[0].query; return Promise.resolve(true); } };
  const hooks = { ...React,
    useState(initial) {
      const i = cursor++; slots[i] ||= { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, value => { const next = typeof value === 'function' ? value(slots[i].value) : value; dirty ||= !Object.is(next, slots[i].value); slots[i].value = next; }];
    },
    useRef(initial) { const i = cursor++; slots[i] ||= { value: { current: initial } }; return slots[i].value; },
    useEffect(callback, deps) {
      const i = cursor++, previous = slots[i];
      if (!previous || deps.some((value, index) => !Object.is(value, previous.deps[index]))) {
        slots[i] = { deps, cleanup: previous?.cleanup };
        effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = callback(); });
      }
    },
  };
  const PageMenu = () => null;
  const load = createLoader({ react: hooks, 'next/router': { useRouter: () => router },
    './PageMenu': { __esModule: true, default: PageMenu, closePageMenu() { closeCount++; }, openPageMenu() {} } });
  const Component = load(file).default;
  global.window = { location: { search: `?${new URLSearchParams(query)}` } };
  function flush() {
    let passes = 0;
    do {
      cursor = 0; dirty = false; tree = Component();
      for (const node of nodes(tree, node => node.props?.ref)) {
        const label = node.props['aria-label'] || node.props.id;
        node.props.ref.current = { focus(options) { focus.push({ label, options }); }, scrollIntoView(options) { scroll.push({ label, options }); } };
      }
      effects.splice(0).forEach(effect => effect());
    } while (dirty && ++passes < 15);
    assert.ok(passes < 15, 'The navigation settles without an effect loop');
  }
  flush();
  return { load, focus, scroll, replacements, methods, get tree() { return tree; }, get closeCount() { return closeCount; },
    menu() { return nodes(tree, node => node.type === PageMenu)[0]; },
    bodyText() { return text(React.Children.toArray(tree.props.children).filter(node => node?.type !== PageMenu)); },
    choose(id, redraw = true) { const result = nodes(this.menu(), node => node.type === 'select')[0].props.onChange({ target: { value: id } }); if (redraw) flush(); return result; },
    route(query) { router.query = query; flush(); }, flush,
    close() { for (const slot of slots) slot?.cleanup?.(); global.window = previousWindow; },
  };
}

test('Anatomy keeps both existing groups only in the lower menu, preserves the model lesson and closes onto the chosen content', async () => {
  const s = setup('components/AnatomyExplorer.js');
  try {
    const { anatomyModels, anatomySources } = s.load('lib/anatomy-explorer.js');
    const body = React.Children.toArray(s.tree.props.children).filter(node => node?.type !== s.menu().type);
    assert.equal(nodes(body, node => node.type === 'select' || node.type === 'optgroup').length, 0);
    assert.deepEqual(nodes(s.menu(), node => node.type === 'optgroup').map(node => node.props.label), ['Verdauung verstehen', 'Museumsscans drehen']);
    assert.match(s.bodyText(), /Weißwedelhirsches.*kein Reh oder Rotwild/);
    for (const source of anatomySources) assert.ok(s.bodyText().includes(source.title));
    await s.choose(anatomyModels[1].id); s.flush();
    assert.equal(s.closeCount, 1);
    assert.ok(s.bodyText().includes(anatomyModels[1].description));
    assert.equal(s.focus.at(-1).label, anatomyModels[1].title);
    assert.deepEqual(s.focus.at(-1).options, { preventScroll: true });
    assert.equal(s.scroll.at(-1).options.block, 'start');
    assert.equal(s.replacements.at(-1)[0].query.eintrag, anatomyModels[1].id);
    await s.choose(anatomyModels[1].id); s.flush();
    assert.equal(s.focus.length, 2, 'Reselecting the visible model also returns focus from the lower menu');
    await s.choose('not-an-entry'); assert.equal(s.closeCount, 2); assert.equal(s.replacements.length, 1);
    assert.deepEqual(s.methods, ['push'], 'One committed model change adds a real history step; a current reselect adds none');
  } finally { s.close(); }
});

test('Anatomy keeps exact digestion and museum deep links, clears incompatible selection keys and focuses only the final rapid choice', () => {
  const s = setup('components/AnatomyExplorer.js', { bereich: 'verdauung', thema: 'schwarzwild-verdauung', suche: 'test' });
  try {
    const digestive = () => nodes(s.tree, node => node.type?.name === 'DigestiveLearning')[0];
    assert.equal(digestive().props.selectedId, 'schwarzwild-verdauung');
    assert.equal(digestive().props.hideSelector, true);
    const initialFocus = s.focus.length;
    s.choose('unterkiefer', false); s.choose('wiederkaeuer-verdauung', false); s.flush();
    assert.equal(digestive().props.selectedId, 'wiederkaeuer-verdauung');
    assert.equal(s.focus.length, initialFocus + 1);
    assert.deepEqual(s.methods, ['push', 'push']);
    assert.deepEqual(s.replacements.at(-1)[0].query, { suche: 'test', bereich: 'verdauung', thema: 'wiederkaeuer-verdauung' });
    s.route({ eintrag: 'vorderlauf' });
    assert.equal(digestive(), undefined);
    assert.match(s.bodyText(), /Vorderlauf-Abgüssen/);
  } finally { s.close(); }
});

test('The detail atlas selector lives only in the lower menu and every selected topic retains its exact photographs, claims, source IDs and limits', () => {
  const s = setup('components/WildDetailAtlas.js', { thema: 'gebiss-und-schaedel', suche: 'test' });
  try {
    const { wildDetailTopics, wildDetailPhotos } = s.load('lib/wild-detail-atlas.js');
    const body = React.Children.toArray(s.tree.props.children).filter(node => node?.type !== s.menu().type);
    assert.equal(nodes(body, node => node.type === 'select').length, 0);
    assert.match(s.bodyText(), /Pflanzennahrung, Mischkost/);
    for (const topic of wildDetailTopics) {
      s.choose(topic.id);
      assert.ok(s.bodyText().includes(topic.title));
      for (const fact of topic.claims) { assert.ok(s.bodyText().includes(fact.text)); assert.ok(s.bodyText().includes(fact.reviewedOn)); }
      assert.ok(s.bodyText().includes(topic.comparison)); assert.ok(s.bodyText().includes(topic.observation));
      const photos = nodes(s.tree, node => node.type?.name === 'DetailPhoto');
      assert.equal(photos.length, topic.panels.length);
      for (const [i, panel] of topic.panels.entries()) { assert.equal(photos[i].props.panel, panel); assert.equal(photos[i].props.photograph, wildDetailPhotos[panel.photoId]); }
      assert.equal(s.focus.at(-1).label, 'wilddetails-title');
      assert.deepEqual(s.replacements.at(-1)[0].query, { thema: topic.id, suche: 'test' });
      assert.deepEqual(s.replacements.at(-1)[2], { shallow: true, scroll: false });
    }
    const previous = s.closeCount; s.choose('unknown'); assert.equal(s.closeCount, previous);
    s.route({ thema: wildDetailTopics[1].id }); assert.ok(s.bodyText().includes(wildDetailTopics[1].title));
    s.route({}); assert.ok(s.bodyText().includes(wildDetailTopics[0].title), 'A URL without a topic returns to its actual default instead of retaining the previous URL selection');
    s.route({ thema: ['ambiguous', wildDetailTopics[1].id] }); assert.match(s.bodyText(), /Dieses Thema ist nicht verfügbar/); assert.equal(nodes(s.tree, node => node.type?.name === 'DetailPhoto').length, 0);
  } finally { s.close(); }
});
