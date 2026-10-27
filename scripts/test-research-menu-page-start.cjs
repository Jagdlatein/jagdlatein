const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { nodes, text } = require('./helpers/field-reader-fixture.cjs');
const data = createLoader()('lib/practice-research-server.js').getPracticeResearchData();
const dogLessons = createLoader()('lib/hunting-dog-video-lessons.js').huntingDogVideoLessons;
const atlasTopics = createLoader()('lib/wild-detail-atlas.js').wildDetailTopics;

// Actual owner + actual MenuChoice + actual selection hook. Browser effects
// are isolated doubles; no real storage, media playback or user data is read.
function fixture(t, file, query, { hash = '', ready = true, props } = {}) {
  const previous = global.window, slots = [], effects = [], cleanups = new Map();
  const frames = new Map(), focus = [], scroll = [], anchors = [], pushes = [];
  let cursor = 0, dirty = false, disposed = false, writesAfterDispose = 0, tree, frameId = 0;
  const win = { location: {}, scrollTo(value) { scroll.push(value); },
    requestAnimationFrame(fn) { frames.set(++frameId, fn); return frameId; }, cancelAnimationFrame(id) { frames.delete(id); } };
  global.window = win;
  const hooks = { ...React,
    useState(initial) { const i = cursor++; slots[i] ||= { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, input => {
      if (disposed) { writesAfterDispose++; return; }
      const next = typeof input === 'function' ? input(slots[i].value) : input;
      if (!Object.is(next, slots[i].value)) { slots[i].value = next; dirty = true; }
    }]; },
    useRef(initial) { const i = cursor++; slots[i] ||= { current: initial }; return slots[i]; },
    useEffect(fn, deps) { const i = cursor++, old = slots[i]; if (!old || deps.some((value, j) => !Object.is(value, old[j]))) { slots[i] = deps; effects.push({ i, fn }); } },
  };
  const header = { isConnected: true, focus(options) { focus.push({ target: 'page', options }); } };
  function target(name) { return { id: name.replace(/^#/, ''), isConnected: true,
    setAttribute() {}, focus(options) { focus.push({ target: name, options }); },
    scrollIntoView(options) { anchors.push({ target: name, options }); },
    closest() { return { querySelector() { return header; } }; },
    querySelector(selector) { return target(selector); }, querySelectorAll() { return []; }, pause() {},
  }; }
  const base = file.endsWith('ResearchForPractice.js') ? '/lernen/wissen-fuers-revier' : file.endsWith('ResearchUnderstanding.js') ? '/lernen/forschung-verstehen' : file.endsWith('SmallRevierLife.js') ? '/lernen/kleines-revierleben' : file.endsWith('WildDetailAtlas.js') ? '/lernen/wildtier-details' : '/lernen/jagdhund-videos';
  function address(next, fragment = '') { const params = new URLSearchParams(next); return `${base}${params.size ? `?${params}` : ''}${fragment ? `#${fragment}` : ''}`; }
  const router = { isReady: ready, query, asPath: address(query, hash), async push(href, as, options) { pushes.push({ href, as, options }); return true; } };
  function location() { const url = new URL(router.asPath, 'https://jagdlatein.invalid'); win.location = { href: url.href, pathname: url.pathname, search: url.search, hash: url.hash }; }
  location();
  function PageMenu({ children }) { return React.createElement('aside', null, children); }
  const load = createLoader({ react: hooks, 'next/router': { useRouter: () => router },
    'next/link': ({ children, ...other }) => React.createElement('a', other, children),
    'next/image': other => React.createElement('img', other),
    './LearningToolLayout': ({ children }) => React.createElement('main', null, children),
    './PageMenu': { __esModule: true, default: PageMenu, openPageMenu() {}, closePageMenu() {} } });
  const Component = load(file).default, MenuChoice = load('components/MenuChoice.js').default;
  function render() {
    for (let pass = 0; pass < 12; pass++) {
      dirty = false; cursor = 0; tree = Component(props);
      for (const node of nodes(tree, node => !!node.props?.ref)) node.props.ref.current = target(node.props.id || text(node).slice(0, 80));
      while (effects.length) { const { i, fn } = effects.shift(); cleanups.get(i)?.(); const cleanup = fn(); if (typeof cleanup === 'function') cleanups.set(i, cleanup); }
      if (!dirty) return;
    }
    throw new Error('Owner did not settle');
  }
  function dispose() { if (disposed) return; for (const cleanup of cleanups.values()) cleanup(); disposed = true; }
  t.after(() => { dispose(); global.window = previous; });
  render();
  return { router, focus, scroll, anchors, pushes, frames, render, dispose,
    get tree() { return tree; }, get writesAfterDispose() { return writesAfterDispose; },
    navigate(next, fragment = '') { router.query = next; router.asPath = address(next, fragment); location(); render(); },
    button(id, value) { const control = nodes(tree, node => node.type === MenuChoice && node.props.id === id)[0]; assert.ok(control, id); return nodes(MenuChoice(control.props), node => node.type === 'button' && node.props['data-menu-choice'] === value)[0]; },
    flushFrames() { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); },
  };
}

test('Research, atlas, ecology and dog choices render real menu buttons and start only committed categories at page top', async t => {
  for (const item of [
    ['ResearchUnderstanding', 'datensatz', 'temperatur', 'waldbrand', 'forschung-datensatz', undefined],
    ['ResearchForPractice', 'thema', 'wildkameras', 'wild-und-stoerung', 'revierwissen-topic', data],
    ['SmallRevierLife', 'thema', 'holzpilze', 'regenwuermer', 'revierleben-thema', undefined],
    ['WildDetailAtlas', 'thema', atlasTopics[0].id, atlasTopics[1].id, 'wilddetails-topic', undefined],
    ['HuntingDogVideos', 'eintrag', dogLessons[0].id, dogLessons[1].id, 'hundevideo-auswahl', undefined],
  ]) {
    const [name, field, first, next, id, props] = item;
    const f = fixture(t, `components/${name}.js`, { [field]: first }, { props });
    // Atlas IDs are authored values, not assumed from the display label.
    const values = nodes(f.tree, node => node.type === 'option' && node.props.value).map(node => node.props.value);
    const destination = values.includes(next) ? next : values.find(value => value !== first);
    const button = f.button(id, destination); assert.ok(button); assert.equal(button.props.type, 'button');
    const before = f.scroll.length; const action = button.props.onClick(); await action;
    assert.equal(f.scroll.length, before, `${name}: pending URL must not move content`);
    assert.equal(f.pushes.length, 1);
    f.navigate(f.pushes[0].href.query, f.pushes[0].href.hash);
    assert.equal(f.scroll.length, before + 1); assert.equal(f.focus.at(-1).target, 'page');
    assert.equal(f.anchors.length, 0, `${name}: no lower result scroll for category choice`);
    f.flushFrames(); assert.equal(f.scroll.length, before + 2);
    f.dispose();
  }
});

test('Explicit research questions and dog Handlung keep their anchors while the next category cancels the pending top frame', async t => {
  const research = fixture(t, 'components/ResearchForPractice.js', { thema: 'wildkameras' }, { hash: 'revierwissen-fragen', props: data });
  assert.equal(research.focus.at(-1).target, '#revierwissen-quiz-title'); assert.equal(research.scroll.length, 0);
  assert.equal(research.anchors.length, 1); assert.equal(research.frames.size, 0);
  await research.button('revierwissen-topic', 'wild-und-stoerung').props.onClick();
  research.navigate(research.pushes[0].href.query, research.pushes[0].href.hash);
  assert.equal(research.focus.at(-1).target, 'page'); assert.equal(research.frames.size, 1);
  await research.button('revierwissen-topic', 'rehwild-fruehling').props.onClick();
  assert.equal(research.frames.size, 0, 'Starting another category immediately cancels delayed old scrolling');
  const before = research.scroll.length; research.flushFrames(); assert.equal(research.scroll.length, before);
  research.dispose();
  const dog = fixture(t, 'components/HuntingDogVideos.js', { eintrag: dogLessons[0].id }, { hash: 'hundevideo-handlung' });
  assert.equal(dog.scroll.length, 0); assert.equal(dog.anchors.length, 1); assert.equal(dog.frames.size, 0);
});

test('Food-web menu motifs start at page top; model radios retain their explanation and direct relationship links remain anchors', async t => {
  const f = fixture(t, 'components/SmallRevierLife.js', { thema: 'nahrungsnetz', motiv: 'spinne' });
  f.flushFrames(); const before = f.scroll.length;
  await f.button('revierleben-motiv', 'laub').props.onClick(); f.navigate(f.pushes.at(-1).href.query, f.pushes.at(-1).href.hash);
  assert.equal(f.scroll.length, before + 1); assert.equal(f.anchors.length, 0); assert.equal(f.pushes.at(-1).href.hash, 'revierleben-inhalt');
  const model = nodes(f.tree, node => node.type?.name === 'FoodwebLearning')[0];
  await model.props.onSelect('grasfrosch'); f.navigate(f.pushes.at(-1).href.query, f.pushes.at(-1).href.hash);
  assert.equal(f.anchors.at(-1).target, '#nahrungsnetz-beziehungen'); assert.equal(f.frames.size, 0);
  f.navigate({ thema: 'nahrungsnetz', motiv: 'regenwurm' }, 'nahrungsnetz-beziehungen');
  assert.equal(f.anchors.at(-1).target, '#nahrungsnetz-beziehungen');
});

test('A removed real menu button cannot navigate or queue scrolling, and deferred category scrolling is cancelled on unmount', async t => {
  const f = fixture(t, 'components/ResearchUnderstanding.js', { datensatz: 'temperatur' });
  const old = f.button('forschung-datensatz', 'waldbrand'); assert.equal(f.frames.size, 1);
  f.dispose(); assert.equal(f.frames.size, 0);
  await old.props.onClick(); f.flushFrames();
  assert.equal(f.pushes.length, 0); assert.equal(f.writesAfterDispose, 0);
});

test('Search/context-only URL edits invalidate old menu callbacks without moving the unchanged text, and foreign fragments retain native position', async t => {
  for (const [name, query, id, destination, props] of [
    ['ResearchUnderstanding', { datensatz: 'temperatur' }, 'forschung-datensatz', 'waldbrand', undefined],
    ['ResearchForPractice', { thema: 'wildkameras' }, 'revierwissen-topic', 'wild-und-stoerung', data],
    ['SmallRevierLife', { thema: 'holzpilze' }, 'revierleben-thema', 'regenwuermer', undefined],
    ['WildDetailAtlas', { thema: atlasTopics[0].id }, 'wilddetails-topic', atlasTopics[1].id, undefined],
    ['HuntingDogVideos', { eintrag: dogLessons[0].id }, 'hundevideo-auswahl', dogLessons[1].id, undefined],
  ]) {
    const f = fixture(t, `components/${name}.js`, query, { props }); f.flushFrames();
    const old = f.button(id, destination), before = f.scroll.length;
    f.navigate({ ...query, q: 'Reh' });
    assert.equal(f.scroll.length, before, `${name}: typing context must not move the unchanged text`);
    assert.equal(f.frames.size, 0); await old.props.onClick(); assert.equal(f.pushes.length, 0);
    f.navigate({ ...query, q: 'Reh' }, 'foreign-source-target');
    assert.equal(f.scroll.length, before, `${name}: do not replace an unknown explicit fragment with a guessed top destination`);
    assert.equal(f.frames.size, 0); f.dispose();
  }
});
