const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const swc = local('next/dist/build/swc');
const load = createLoader({ '../../components/WildYear': { __esModule: true, default: () => null } });
const page = load('pages/lernen/wildjahr.js');
const { wildYearCatalog } = load('lib/wild-year-catalog.js');
const { wildYearSpecies, wildYearSources, getWildYearProfile } = load('lib/wild-year.js');
const { getWildYearOverview } = load('lib/wild-year-overview-server.js');
const { wildlifePhotographs } = load('lib/wildlife-photographs.js');
const { readWildYearSelection } = load('lib/wild-year-selection.js');
const base = '/lernen/wildjahr';
const propsFor = query => page.getServerSideProps({ query }).props;
const heading = h => nodes(h.tree, node => node.props?.id === 'wildjahr-current')[0];
const select = h => nodes(h.tree, node => node.type?.name === 'WildYearSpeciesPicker')[0];
const pickerTree = h => select(h).type(select(h).props);
const speciesButton = (h, slug) => nodes(pickerTree(h), node => node.props?.['data-wildjahr-species'] === slug)[0];
const range = h => nodes(h.tree, node => node.type === 'input' && node.props.id === 'wildjahr-month')[0];
const alerts = h => nodes(h.tree, node => node.props?.role === 'alert');
function address(query, hash = 'wildjahr-current') {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) for (const part of Array.isArray(value) ? value : [value]) params.append(key, part);
  return `${base}${params.size ? `?${params}` : ''}${hash ? `#${hash}` : ''}`;
}
const choose = (h, slug) => speciesButton(h, slug).props.onClick();
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');

// Compile once, but give every component mount its own actual effect/cleanup,
// state and ref slots. Setters close over that mount, including deferred calls.
let active;
const hooks = { ...React,
  useState(initial) {
    const h = active, index = h.cursor++;
    if (!h.slots[index]) h.slots[index] = { value: typeof initial === 'function' ? initial() : initial };
    return [h.slots[index].value, value => {
      const next = typeof value === 'function' ? value(h.slots[index].value) : value;
      h.changed ||= !Object.is(next, h.slots[index].value); h.slots[index].value = next;
    }];
  },
  useRef(initial) { const h = active, index = h.cursor++; return h.slots[index] ||= { current: initial }; },
  useEffect(effect, deps) {
    const h = active, index = h.cursor++, previous = h.slots[index];
    if (!previous || !deps || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
      h.slots[index] = { deps }; h.effects.push(() => { h.cleanups[index]?.(); h.cleanups[index] = effect(); });
    }
  },
};
function PageMenu({ children }) { return React.createElement('aside', { 'data-page-menu': true }, children); }
const componentLoad = createLoader({ react: hooks, 'next/router': { useRouter: () => active.router },
  './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
  './PageMenu': { __esModule: true, default: PageMenu, openPageMenu() { currentMenu.opened++; }, closePageMenu() { currentMenu.closed++; } },
  'next/image': { __esModule: true, default: function Picture() {} },
  './LearningPhoto': { LearningPhotoCredit: function Credit() {} },
});
// Effects and callbacks run after the render call; this is only the external
// shared menu endpoint, not component state. Each action selects its own mount.
let currentMenu;
const Component = componentLoad('components/WildYear.js').default;
function fixture(t, query, { ready = true, props = propsFor(query) } = {}) {
  const h = { props, slots: [], cleanups: [], effects: [], calls: [], requests: [], menu: { opened: 0, closed: 0 }, focus: 0, scroll: 0 };
  h.target = { focus(options) { assert.deepEqual(options, { preventScroll: true }); h.focus++; }, scrollIntoView() { h.scroll++; } };
  h.router = { isReady: ready, query: { ...query }, asPath: address(query), push(href, as, options) {
    const request = { href, as, options }; h.calls.push(request); h.requests.push(request);
    return new Promise((resolve, reject) => Object.assign(request, { resolve, reject }));
  } };
  h.render = () => {
    currentMenu = h.menu;
    for (let pass = 0; pass < 10; pass++) {
      active = h; h.cursor = 0; h.changed = false; h.tree = Component(h.props); active = null;
      // Simulate the object-ref commit before effects, including removal of a
      // temporarily absent heading while the selected server props are pending.
      const target = nodes(h.tree, node => node.props?.id === 'wildjahr-top')[0];
      if (target?.props.ref) { target.props.ref.current = h.target; h.lastRef = target.props.ref; }
      else if (h.lastRef) h.lastRef.current = null;
      const effects = h.effects; h.effects = []; effects.forEach(effect => effect());
      if (!h.changed) return;
    }
    throw new Error('Wildjahr did not settle');
  };
  h.navigate = (query, { props, hash = 'wildjahr-current' } = {}) => {
    h.router.query = query; h.router.asPath = address(query, hash);
    if (props) h.props = props; h.render();
  };
  h.act = action => { currentMenu = h.menu; return action(); };
  h.dispose = () => { currentMenu = h.menu; h.cleanups.forEach(cleanup => cleanup?.()); };
  h.render(); t.after(h.dispose); return h;
}

const SSRRouter = { isReady: false, query: {}, asPath: base };
const ssrLoad = createLoader({
  'next/router': { useRouter: () => SSRRouter },
  'next/image': { __esModule: true, default: ({ priority, ...props }) => React.createElement('img', props) },
  'next/link': { __esModule: true, default: ({ href, prefetch, scroll, children, ...props }) => React.createElement('a', { href, ...props }, children) },
  './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
  './PageMenu': { __esModule: true, default: () => null, openPageMenu() {}, closePageMenu() {} },
  './LearningPhoto': { LearningPhotoCredit: () => null },
});
const SSRComponent = ssrLoad('components/WildYear.js').default;

test('All 114 actual server selections render the exact selected knowledge in SSR and first client render, including records without photos', t => {
  let checked = 0, pictured = 0, overviews = 0;
  for (const entry of wildYearCatalog) {
    const query = { art: entry.slug, monat: '6', ref: 'suche' }, props = propsFor(query);
    assert.deepEqual(props.initialSelection, { slug: entry.slug, month: 6 });
    const monthly = wildYearSpecies.some(item => item.slug === entry.slug);
    assert.equal(Boolean(props.annualOverview), !monthly);
    if (props.annualOverview) assert.equal(props.annualOverview.slug, entry.slug);
    const expected = monthly ? getWildYearProfile(entry.slug, 6).sections.map(section => section.claim.text)
      : getWildYearOverview(entry.slug).sections.flatMap(section => section.paragraphs);
    const html = renderToStaticMarkup(React.createElement(SSRComponent, props));
    const h = fixture(t, {}, { ready: false, props });
    const firstText = text(h.tree), firstHeading = text(heading(h));
    assert.ok(heading(h), entry.slug);
    assert.ok(firstHeading.includes(entry.name) || firstHeading.includes(getWildYearProfile(entry.slug, 6)?.species.name), entry.slug);
    for (const paragraph of expected) {
      assert.ok(firstText.includes(paragraph), `Initial ${entry.slug}: ${paragraph}`);
      assert.ok(html.includes(escape(paragraph)), `SSR ${entry.slug}: ${paragraph}`);
      assert.ok(html.indexOf(escape(paragraph)) < html.indexOf('Quellen und Bildnachweis'));
    }
    assert.match(html, /<details[^>]*><summary>Quellen und Bildnachweis<\/summary>/);
    assert.doesNotMatch(html, /<details[^>]*\bopen(?:=|\s|>)/);
    assert.equal(Boolean(range(h)), monthly, entry.slug);
    const figure = nodes(h.tree, node => node.type === 'figure');
    assert.equal(figure.length, wildlifePhotographs[entry.slug] ? 1 : 0, entry.slug);
    if (wildlifePhotographs[entry.slug]) { assert.ok(html.includes(wildlifePhotographs[entry.slug].src)); pictured++; }
    else assert.doesNotMatch(html, /<figure/);
    assert.equal(select(h).props.disabled, true);
    h.router.isReady = true; h.navigate(query);
    assert.equal(text(heading(h)), firstHeading);
    for (const paragraph of expected) assert.ok(text(h.tree).includes(paragraph), `Ready ${entry.slug}`);
    assert.equal(h.calls.length, 0);
    if (!monthly) { overviews++; assert.ok(!/ im Juni$/.test(firstHeading)); }
    h.dispose(); checked++;
  }
  assert.equal(checked, 114); assert.equal(pictured, 47); assert.equal(overviews, 114 - wildYearSpecies.length);
});

test('The lower selector retains all canonical groups and entries, while an invalid selection never leaks old server knowledge', t => {
  const query = { art: 'wolf', monat: '6' }, h = fixture(t, query);
  const menu = nodes(h.tree, node => node.type === PageMenu)[0];
  const grouped = nodes(pickerTree(h), node => node.type === 'section');
  assert.deepEqual(grouped.map(node => text(nodes(node, child => child.type === 'h3')[0])), [...new Set(wildYearCatalog.map(item => item.group))]);
  assert.deepEqual(grouped.flatMap(node => nodes(node, child => child.type === 'button').map(child => child.props['data-wildjahr-species'])),
    [...new Set(wildYearCatalog.map(item => item.group))].flatMap(group => wildYearCatalog.filter(item => item.group === group).map(item => item.slug)));
  assert.equal(nodes(menu, node => node.type?.name === 'WildYearSpeciesPicker').length, 1);
  for (const query of [
    { art: ['wolf'], monat: '6' }, { art: ['wolf', 'kolbenente'], monat: '6' },
    { art: 'wolf', monat: ['6'] }, { art: 'wolf', monat: ['6', '7'] },
    { art: '', monat: '6' }, { art: 'constructor', monat: '6' }, { art: 'wolf', monat: '13' },
  ]) {
    h.navigate(query); assert.equal(heading(h), undefined);
    assert.match(text(h.tree), /Wähle eine Wildart unten im Menü/);
    assert.equal(nodes(h.tree, node => node.type === 'select').length, 0, 'Invalid inputs do not reintroduce a menu month selector');
    assert.ok(!text(h.tree).includes(getWildYearOverview('wolf').sections[0].paragraphs[0]));
    const props = propsFor(query); assert.equal(props.annualOverview, null);
  }
  assert.equal(h.calls.length, 0);
});

test('Monthly and overview navigation uses real push operations, preserves committed text on failure and fetches only required server props', async t => {
  for (const [from, to] of [['rehwild', 'wolf'], ['wolf', 'rehwild'], ['wolf', 'kolbenente']]) {
    const query = { art: from, monat: '6', ref: 'suche', q: 'extern' }, h = fixture(t, query);
    const before = text(heading(h)), focus = h.focus;
    const action = h.act(() => choose(h, to)); h.render();
    const request = h.requests[0];
    assert.deepEqual(request.href, { pathname: base, query: { ...query, art: to }, hash: 'wildjahr-top' });
    assert.deepEqual(request.options, { shallow: false, scroll: false });
    assert.equal(request.as, undefined); assert.equal(text(heading(h)), before); assert.equal(h.focus, focus);
    request.reject(new Error('offline')); await action; h.render();
    assert.equal(text(heading(h)), before); assert.deepEqual(h.router.query, query);
    assert.equal(alerts(h).length, 1); assert.equal(h.focus, focus);
    const retry = h.act(() => choose(h, to)); h.render(); const next = h.requests[1];
    h.navigate(next.href.query, { props: propsFor(next.href.query) }); next.resolve(true); await retry; h.render();
    assert.notEqual(text(heading(h)), before); assert.equal(select(h).props.selectedSlug, to);
    assert.equal(h.focus, focus + 1); assert.equal(h.scroll, 0, 'No content-anchor scrollIntoView remains');
    assert.equal(alerts(h).length, 0);
  }
});

test('A committed overview address waits for matching props, then focuses the newly mounted result exactly once', async t => {
  const initial = { art: 'rehwild', monat: '6' }, h = fixture(t, initial), focus = h.focus, closed = h.menu.closed;
  const action = h.act(() => choose(h, 'wolf')), request = h.requests[0];
  h.navigate(request.href.query);
  assert.equal(heading(h), undefined); assert.match(text(h.tree), /wird geladen/);
  assert.equal(h.focus, focus); assert.equal(h.menu.closed, closed);
  assert.equal(h.menu.opened, 0, 'A valid address awaiting its selected server props is not an invalid-link chooser');
  request.resolve(true); await action; h.render(); assert.equal(h.focus, focus);
  h.props = propsFor(request.href.query); h.render();
  assert.equal(select(h).props.selectedSlug, 'wolf'); assert.equal(h.focus, focus + 1); assert.equal(h.menu.closed, closed + 1);
  h.render(); assert.equal(h.focus, focus + 1);
  h.navigate({ art: 'kolbenente', monat: '6' });
  assert.equal(heading(h), undefined); assert.ok(!text(h.tree).includes(getWildYearOverview('wolf').sections[0].paragraphs[0]));
  h.props = propsFor(h.router.query); h.render(); assert.match(text(heading(h)), /Kolbenente/); assert.equal(h.focus, focus + 2);
});

test('History across overview and model restores the corresponding authored view and invalidates stale pending failures and selectors', async t => {
  const initial = { art: 'wolf', monat: '6' }, h = fixture(t, initial);
  const oldSelector = speciesButton(h, 'rehwild').props.onClick;
  const action = h.act(() => choose(h, 'kolbenente'));
  const visits = [{ art: 'rehwild', monat: '4' }, { art: 'wolf', monat: '6' }];
  for (const query of visits) h.navigate(query, { props: propsFor(query) });
  const focus = h.focus, opened = h.menu.opened;
  h.requests[0].reject(new Error('late after return')); await action; h.render();
  assert.equal(alerts(h).length, 0); assert.equal(h.focus, focus); assert.equal(h.menu.opened, opened);
  await h.act(() => oldSelector({ target: { value: 'rehwild' } }));
  assert.equal(h.requests.length, 1); assert.match(text(heading(h)), /Wolf/);
  assert.equal(range(h), undefined);
  const currentSelector = speciesButton(h, 'rehwild').props.onClick;
  h.navigate({ ...initial, ref: 'anderer-einstieg' }, { props: propsFor(initial), hash: 'anderer-anker' });
  await h.act(() => currentSelector({ target: { value: 'rehwild' } }));
  assert.equal(h.requests.length, 1);
});

test('Unmount blocks late overview transitions and saved handlers before URL, focus or menu work', async t => {
  const initial = { art: 'wolf', monat: '6' }, h = fixture(t, initial), handler = speciesButton(h, 'kolbenente').props.onClick;
  const action = h.act(() => choose(h, 'rehwild')), focus = h.focus, opened = h.menu.opened;
  h.dispose(); h.requests[0].reject(new Error('after unmount')); await action;
  await h.act(() => handler({ target: { value: 'kolbenente' } }));
  assert.equal(h.requests.length, 1); assert.deepEqual(h.router.query, initial);
  assert.equal(h.focus, focus); assert.equal(h.menu.opened, opened); assert.equal(alerts(h).length, 0);
});

test('Every original ten-species monthly object, source and 120 selected phase claims remain identical to the published baseline', () => {
  const source = execFileSync('git', ['show', 'b2251178993ba0475ce04de4cc837c0fce6d55cf:lib/wild-year.js'], { cwd: root, encoding: 'utf8' });
  const { code } = swc.transformSync(source, { filename: 'wild-year-baseline.js', jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  const mod = { exports: {} }; new Function('module', 'exports', code)(mod, mod.exports);
  assert.equal(mod.exports.wildYearSpecies.length, 10);
  for (const old of mod.exports.wildYearSpecies) {
    assert.deepEqual(wildYearSpecies.find(species => species.slug === old.slug), old);
    for (let month = 1; month <= 12; month++) assert.deepEqual(getWildYearProfile(old.slug, month), mod.exports.getWildYearProfile(old.slug, month));
  }
  for (const [id, original] of Object.entries(mod.exports.wildYearSources)) assert.deepEqual(wildYearSources[id], original);
});

test('Actual portrait guide SSR adds exactly one valid Wildjahr link per canonical species and no new empty guide for unknown input', () => {
  const guideLoad = createLoader({ 'next/link': { __esModule: true, default: ({ href, prefetch, scroll, children, ...props }) => React.createElement('a', { href, ...props }, children) } });
  const Guide = guideLoad('components/WildlifeLearningGuide.js').default;
  const { getWildlifeLearningGuide, getWildlifeStudyLinks } = guideLoad('lib/wildlife-learning-guide.js');
  for (const entry of wildYearCatalog) {
    const html = renderToStaticMarkup(React.createElement(Guide, { slug: entry.slug, name: entry.name }));
    assert.ok(html.includes(`href="/lernen/wildjahr?art=${entry.slug}"`), entry.slug);
    assert.equal((html.match(/>Wildjahr<\/a>/g) || []).length, 1, entry.slug);
    assert.equal((html.match(/<a /g) || []).length, 1 + getWildlifeLearningGuide(entry.slug).length + getWildlifeStudyLinks(entry.slug).length, entry.slug);
    assert.doesNotMatch(html, /<button|<details|<video|<img/);
    assert.deepEqual(readWildYearSelection({ art: entry.slug, monat: '6' }), { slug: entry.slug, month: 6 });
  }
  for (const slug of ['unknown', 'constructor', '__proto__']) assert.equal(renderToStaticMarkup(React.createElement(Guide, { slug, name: slug })), '');
});

test('The actual Wildjahr client import graph excludes full portrait, question, law and server overview corpora', () => {
  const visited = new Set();
  function visit(relative) {
    const filename = path.resolve(root, relative), name = path.relative(root, filename).replaceAll('\\', '/');
    if (visited.has(name)) return; visited.add(name);
    const source = fs.readFileSync(filename, 'utf8');
    for (const match of source.matchAll(/(?:import|export)\s[^;]*?\sfrom\s["'](\.[^"']+)["']/g)) {
      const id = match[1];
      if (id.endsWith('.module.css') || /^\.\/LearningToolLayout$|^\.\/PageMenu$|^\.\/LearningPhoto$/.test(id)) continue;
      visit(path.relative(root, path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)));
    }
  }
  visit('components/WildYear.js');
  assert.ok(visited.has('lib/wild-year-catalog.js'));
  for (const filename of visited) assert.doesNotMatch(filename, /wild-year-overview-server|wildlife-depth\.js|european-wildlife(?:\.js|-expansion|-birds|-mammals)|wildlife-biology-2026|learning-curriculum|regional-law|wildlife-knowledge-expansion/);
});
