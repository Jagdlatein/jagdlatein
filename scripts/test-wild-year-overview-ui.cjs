const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const swc = local('next/dist/build/swc');
const load = createLoader({ '../../components/WildYear': { __esModule: true, default: () => null } });
const { wildYearSpecies, wildYearSources, wildYearMonths, getWildYearProfile } = load('lib/wild-year.js');
const { wildYearCatalog } = load('lib/wild-year-catalog.js');
const { getWildYearOverviewRows, default: Overview } = load('components/WildYearOverview.js');
const page = load('pages/lernen/wildjahr.js');
const base = '/lernen/wildjahr';
const heading = h => h.nodes(node => node.props?.id === 'wildjahr-current')[0];
const picker = h => h.nodes(node => node.type?.name === 'WildYearSpeciesPicker')[0];
const pickerTree = h => picker(h).type(picker(h).props);
const speciesButton = (h, slug) => nodes(pickerTree(h), node => node.props?.['data-wildjahr-species'] === slug)[0];
const yearChild = h => h.nodes(node => node.type?.name === 'WildYearOverview')[0];
// The real overview child is stateless. Render that actual function rather
// than treating an unexecuted React element as proof of twelve visible rows.
const yearTree = h => yearChild(h)?.type(yearChild(h).props) || null;
const yearButtons = h => nodes(yearTree(h), node => node.type === 'button' && node.props['data-wildjahr-month']);
const button = (h, month) => yearButtons(h).find(node => node.props['data-wildjahr-month'] === month);
const alerts = h => h.nodes(node => node.props?.role === 'alert');
function fragmentChildren(node) {
  if (Array.isArray(node)) return node.flatMap(fragmentChildren);
  if (!node || typeof node === 'boolean') return [];
  return node.type === React.Fragment ? fragmentChildren(node.props.children) : [node];
}
function address(query, hash = 'wildjahr-current') {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) for (const part of Array.isArray(value) ? value : [value]) params.append(key, part);
  return `${base}${params.size ? `?${params}` : ''}${hash ? `#${hash}` : ''}`;
}
function fixture(t, query = { art: 'rehwild', monat: '6' }, options = {}) {
  const props = options.props || page.getServerSideProps({ query }).props;
  const h = setup('components/WildYear.js', query, { ...options, props, router: { asPath: address(query), ...options.router } });
  h.requests = [];
  h.router.push = (href, as, options) => {
    const request = { href, as, options }; h.calls.push(request); h.requests.push(request);
    return new Promise((resolve, reject) => Object.assign(request, { resolve, reject }));
  };
  h.setProps = next => { Object.assign(props, next); h.render(); };
  t.after(() => h.dispose()); return h;
}
function history(h, query, hash = 'wildjahr-current') {
  h.router.asPath = address(query, hash); h.navigate(query);
}
function focusProbe(h) {
  const calls = { focus: 0, scroll: 0 };
  h.nodes(node => node.props?.id === 'wildjahr-top')[0].props.ref.current = {
    focus(options) { assert.deepEqual(options, { preventScroll: true }); calls.focus++; },
    scrollIntoView() { calls.scroll++; }, // Top focus must not use a content-anchor scroll.
  };
  return calls;
}
const clickMonth = (h, month) => button(h, month).props.onClick();
async function commit(h, request, action) {
  history(h, request.href.query, request.href.hash); request.resolve(true); await action; h.render();
}

test('Every monthly profile projects exactly twelve authored reproduction and behavior phase pairs without adding biological dates', () => {
  for (const species of wildYearSpecies) {
    const rows = getWildYearOverviewRows(species);
    assert.equal(rows.length, 12, species.slug);
    for (const [index, row] of rows.entries()) {
      const expected = getWildYearProfile(species.slug, index + 1);
      assert.equal(row.month, index + 1); assert.equal(row.monthName, wildYearMonths[index]);
      assert.equal(row.reproduction, expected.sections.find(section => section.key === 'reproduction').claim);
      assert.equal(row.behavior, expected.sections.find(section => section.key === 'behavior').claim);
      assert.deepEqual(Object.keys(row).sort(), ['month', 'monthName', 'reproduction', 'behavior'].sort());
    }
    const tree = Overview({ species, month: 6, disabled: false, onSelect() {} });
    const buttons = nodes(tree, node => node.type === 'button');
    assert.equal(buttons.length, 12);
    for (const [index, node] of buttons.entries()) {
      assert.equal(node.props.type, 'button'); assert.equal(node.props['data-wildjahr-month'], index + 1);
      assert.equal(node.props['aria-pressed'], index === 5); assert.equal(node.props.disabled, false);
      assert.ok(text(node).includes(rows[index].monthName));
      assert.ok(text(node).includes(rows[index].reproduction.title));
      assert.ok(text(node).includes(rows[index].behavior.title));
    }
    assert.equal(nodes(tree, node => ['a', 'input', 'select', 'dialog'].includes(node.type)).length, 0);
    assert.ok(text(tree).includes('biologische Orientierung'));
  }
  for (const species of [null, undefined, {}, { reproduction: [], behavior: [] }]) {
    assert.deepEqual(getWildYearOverviewRows(species), []);
    assert.equal(Overview({ species, month: 6 }), null);
  }
});

test('Actual parent rendering shows the year overview only for modeled species, with no fake monthly controls for the remaining catalog', t => {
  for (const entry of wildYearCatalog) {
    const query = { art: entry.slug, monat: '6' }, h = fixture(t, query);
    const modeled = wildYearSpecies.some(species => species.slug === entry.slug);
    assert.equal(Boolean(yearChild(h)), modeled, entry.slug);
    if (modeled) {
      assert.equal(yearButtons(h).length, 12); assert.equal(yearChild(h).props.species.slug, entry.slug);
      assert.equal(yearChild(h).props.month, 6);
      assert.equal(button(h, 6).props['aria-pressed'], true);
    } else assert.equal(h.nodes(node => node.props?.id === 'wildjahr-month').length, 0);
    h.dispose();
  }
});

test('A year button writes the real contextual art/monat URL, keeps committed facts while pending and focuses the heading after commit', async t => {
  const query = { art: 'rehwild', monat: '6', ref: 'suche', q: 'Reh' }, h = fixture(t, query), focus = focusProbe(h);
  const before = text(heading(h)), action = clickMonth(h, 7); h.render();
  assert.equal(h.requests.length, 1);
  assert.deepEqual(h.requests[0].href, { pathname: base, query: { ...query, monat: '7' }, hash: 'wildjahr-top' });
  assert.deepEqual(h.requests[0].options, { shallow: true, scroll: false });
  assert.equal(h.requests[0].as, undefined); assert.deepEqual(h.router.query, query);
  assert.equal(text(heading(h)), before); assert.equal(button(h, 6).props['aria-pressed'], true);
  assert.equal(button(h, 7).props['aria-pressed'], false); assert.deepEqual(focus, { focus: 0, scroll: 0 });
  await commit(h, h.requests[0], action);
  assert.equal(text(heading(h)), 'Reh im Juli'); assert.equal(button(h, 7).props['aria-pressed'], true);
  assert.deepEqual(focus, { focus: 1, scroll: 0 });
  await clickMonth(h, 7); h.render();
  assert.equal(h.requests.length, 1, 'Reselecting the current settled month adds no history stop');
  assert.deepEqual(focus, { focus: 2, scroll: 0 });
});

test('Failed, refused and cancelled year selections preserve the displayed month; newer selections supersede older failures', async t => {
  const initial = { art: 'rehwild', monat: '6' }, h = fixture(t, initial), focus = focusProbe(h);
  const failed = clickMonth(h, 7); h.requests[0].reject(new Error('offline')); await failed; h.render();
  assert.equal(text(heading(h)), 'Reh im Juni'); assert.equal(button(h, 6).props['aria-pressed'], true);
  assert.equal(alerts(h).length, 1); assert.deepEqual(focus, { focus: 0, scroll: 0 });
  const refused = clickMonth(h, 8); h.requests[1].resolve(false); await refused; h.render();
  assert.equal(alerts(h).length, 0); assert.equal(text(heading(h)), 'Reh im Juni');
  const cancelled = clickMonth(h, 9); h.requests[2].reject(Object.assign(new Error('cancelled'), { cancelled: true })); await cancelled; h.render();
  assert.equal(alerts(h).length, 0); assert.deepEqual(h.router.query, initial);
  const older = clickMonth(h, 7), newer = clickMonth(h, 8); h.render();
  await commit(h, h.requests[4], newer);
  h.requests[3].reject(new Error('old request')); await older; h.render();
  assert.equal(text(heading(h)), 'Reh im August'); assert.equal(alerts(h).length, 0);
  assert.deepEqual(focus, { focus: 1, scroll: 0 });
});

test('History, raw context changes and away-and-back navigation reject departed year handlers and pending errors', async t => {
  const initial = { art: 'rehwild', monat: '6' };
  for (const visits of [
    [{ art: 'rotwild', monat: '9' }],
    [{ art: 'rotwild', monat: '9' }, initial],
    [{ ...initial, ref: 'anderer-einstieg' }],
  ]) {
    const h = fixture(t, initial), focus = focusProbe(h), stale = button(h, 8).props.onClick;
    const pending = clickMonth(h, 7);
    for (const query of visits) history(h, query);
    const focused = focus.focus, opened = h.menu.opened;
    h.requests[0].reject(new Error('after History')); await pending; h.render();
    await stale(); h.render();
    assert.equal(h.requests.length, 1); assert.equal(alerts(h).length, 0);
    assert.equal(focus.focus, focused); assert.equal(h.menu.opened, opened);
    assert.deepEqual(h.router.query, visits.at(-1));
    assert.equal(button(h, Number(visits.at(-1).monat)).props['aria-pressed'], true);
  }
  const h = fixture(t, initial), stale = button(h, 8).props.onClick;
  history(h, initial, 'anderes-ziel'); await stale(); h.render(); assert.equal(h.requests.length, 0);
});

test('Unready and unmounted views cannot use saved year buttons to navigate or perform late focus/menu work', async t => {
  const initial = { art: 'rehwild', monat: '6' }, unready = fixture(t, initial, { ready: false });
  assert.ok(yearButtons(unready).every(node => node.props.disabled));
  await clickMonth(unready, 7); unready.render(); assert.equal(unready.requests.length, 0);
  const h = fixture(t, initial), focus = focusProbe(h), stale = button(h, 8).props.onClick;
  const pending = clickMonth(h, 7); h.dispose();
  h.requests[0].reject(new Error('after unmount')); await pending; await stale(); h.render();
  assert.equal(h.requests.length, 1); assert.equal(alerts(h).length, 0);
  assert.deepEqual(focus, { focus: 0, scroll: 0 }); assert.equal(h.menu.opened, 0);
});

test('All four field catalogs have every annual phase evidenced exactly once in the final closed sources', t => {
  const h = fixture(t);
  for (const species of wildYearSpecies) for (const month of [1, 6, 12]) {
    history(h, { art: species.slug, monat: String(month) });
    const footer = h.nodes(node => node.type === 'details' && nodes(node, child => child.type === 'summary' && text(child) === 'Quellen und Bildnachweis').length)[0];
    assert.ok(footer && !footer.props.open, species.slug);
    const allPhases = ['coat', 'crown', 'reproduction', 'behavior'].flatMap(key => species[key]);
    const groups = nodes(footer, node => node.props?.['data-wild-year-claim']);
    assert.deepEqual(groups.map(node => node.props['data-wild-year-claim']).sort(), allPhases.map(phase => phase.id).sort(), species.slug);
    assert.equal(new Set(groups.map(node => node.props['data-wild-year-claim'])).size, allPhases.length, species.slug);
    for (const phase of allPhases) {
      const group = groups.find(node => node.props['data-wild-year-claim'] === phase.id);
      assert.ok(text(group).includes(phase.title), `${species.slug}:${phase.id}`);
      assert.deepEqual(nodes(group, node => node.type === 'a').map(node => ({ href: node.props.href, label: text(node) })),
        phase.sourceIds.map(id => ({ href: wildYearSources[id].url, label: wildYearSources[id].label })), `${species.slug}:${phase.id}`);
    }
    const siblings = fragmentChildren(h.nodes(node => node.props?.id === 'wildjahr-top')[0].props.children);
    assert.equal(siblings.at(-1), footer, 'Supplemental sources remain the final reading element');
    assert.ok(siblings.indexOf(yearChild(h)) < siblings.indexOf(footer));
    assert.equal(h.calls.length, 0, 'Inspecting source coverage does not navigate');
  }
});

test('The previously published 26 full models and their sources remain identical; overview integration is on the same reading page', () => {
  const baseline = 'c27c76483e26102a073070d0ddcdf3021d520fdf', cache = new Map();
  function fromCommit(relative) {
    relative = relative.replaceAll('\\', '/');
    if (cache.has(relative)) return cache.get(relative).exports;
    const source = execFileSync('git', ['show', `${baseline}:${relative}`], { cwd: root, encoding: 'utf8' });
    const mod = { exports: {} }; cache.set(relative, mod);
    const { code } = swc.transformSync(source, { filename: relative, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(id => fromCommit(path.posix.normalize(path.posix.join(path.posix.dirname(relative), path.posix.extname(id) ? id : `${id}.js`))), mod, mod.exports);
    return mod.exports;
  }
  const original = fromCommit('lib/wild-year.js'); assert.equal(original.wildYearSpecies.length, 26);
  for (const species of original.wildYearSpecies) {
    assert.deepEqual(wildYearSpecies.find(item => item.slug === species.slug), species);
    for (let month = 1; month <= 12; month++) assert.deepEqual(getWildYearProfile(species.slug, month), original.getWildYearProfile(species.slug, month));
  }
  for (const [id, source] of Object.entries(original.wildYearSources)) assert.deepEqual(wildYearSources[id], source);
  const species = wildYearSpecies[0], html = renderToStaticMarkup(React.createElement(Overview, { species, month: 6, onSelect() {} }));
  assert.equal((html.match(/<button /g) || []).length, 12);
  assert.doesNotMatch(html, /<a |<form|<dialog|type="search"/);
  assert.match(fs.readFileSync(path.join(root, 'components/WildYear.js'), 'utf8'), /<WildYearOverview\s+species=/);
});

test('A bare server entry never selects Gams; readiness opens the complete species chooser once without changing the URL', async t => {
  const props = page.getServerSideProps({ query: {} }).props;
  assert.equal(props.initialSelection.slug, null); assert.equal(props.annualOverview, null);
  assert.equal(props.initialSelection.month, props.currentMonth);
  const h = fixture(t, {}, { ready: false, props });
  assert.equal(heading(h), undefined); assert.equal(yearChild(h), undefined);
  assert.equal(picker(h).props.selectedSlug, null);
  assert.ok(!text(h.tree).includes(getWildYearProfile('gamswild', props.currentMonth).sections[0].claim.text));
  const selectSpecies = picker(h);
  assert.equal(selectSpecies.props.disabled, true);
  await speciesButton(h, 'gamswild').props.onClick(); h.render();
  await new Promise(resolve => setTimeout(resolve, 2));
  assert.equal(h.requests.length, 0); assert.equal(h.menu.opened, 0);
  h.router.isReady = true; h.render();
  assert.equal(heading(h), undefined); assert.match(text(h.tree), /Wähle zuerst eine Wildart/);
  const chooser = pickerTree(h);
  assert.equal(nodes(chooser, node => node.type === 'button' && node.props['data-wildjahr-species']).length, 114);
  await new Promise(resolve => setTimeout(resolve, 2)); assert.equal(h.menu.opened, 1);
  h.render(); await new Promise(resolve => setTimeout(resolve, 2));
  assert.equal(h.menu.opened, 1); assert.equal(h.requests.length, 0); assert.deepEqual(h.router.query, {});
});

test('Month-only entry preserves its month without inventing an animal; stale chooser timers cannot reopen after a selection or unmount', async t => {
  const query = { monat: '7', ref: 'menue' }, props = page.getServerSideProps({ query }).props;
  assert.deepEqual(props.initialSelection, { slug: null, month: 7 }); assert.equal(props.annualOverview, null);
  const h = fixture(t, query, { props });
  assert.equal(heading(h), undefined); assert.equal(yearChild(h), undefined);
  const action = speciesButton(h, 'rehwild').props.onClick();
  assert.deepEqual(h.requests[0].href.query, { ...query, art: 'rehwild' });
  assert.deepEqual(h.requests[0].options, { shallow: false, scroll: false });
  await commit(h, h.requests[0], action);
  await new Promise(resolve => setTimeout(resolve, 2));
  assert.equal(text(heading(h)), 'Reh im Juli'); assert.equal(h.menu.opened, 0);
  const disposed = fixture(t, {}); disposed.dispose();
  await new Promise(resolve => setTimeout(resolve, 2)); assert.equal(disposed.menu.opened, 0);
  const explicitQuery = { art: 'gamswild', monat: '11' }, explicit = fixture(t, explicitQuery);
  const expected = getWildYearProfile('gamswild', 11);
  assert.equal(text(heading(explicit)), `${expected.species.name} im ${expected.monthName}`);
  assert.equal(yearButtons(explicit).length, 12);
  await new Promise(resolve => setTimeout(resolve, 2)); assert.equal(explicit.menu.opened, 0);
});
