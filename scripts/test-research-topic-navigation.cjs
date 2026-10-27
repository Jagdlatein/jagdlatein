const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { createLoader } = require('./helpers/project-module.cjs');
const load = createLoader();
const { researchDatasets } = load('lib/research-understanding.js');
const { wildMovementDatasets } = load('lib/wild-movement.js');
const entries = [...researchDatasets, ...wildMovementDatasets];
const file = 'components/ResearchUnderstanding.js';
const menu = h => h.nodes(node => node.type?.name === 'PageMenu')[0];
const selected = h => h.nodes(node => node.props?.dataset)[0]?.props.dataset.id || h.nodes(node => node.props?.selectedId)[0]?.props.selectedId;
const choose = (h, id) => h.nodes(node => node.type?.name === 'MenuChoice' && node.props.id === 'forschung-datensatz')[0].props.onChange({ target: { value: id } });
function fixture(t, query, options) { const h = setup(file, query, options); t.after(() => h.dispose()); return h; }

test('Missing, unknown and repeated research IDs ask for a real choice instead of showing an unrelated dataset', t => {
  for (const query of [{}, { datensatz: 'missing' }, { datensatz: ['temperatur', 'waldbrand'] }]) {
    const h = fixture(t, query);
    assert.equal(selected(h), undefined);
    assert.equal(menu(h).props.openInitially, true);
    assert.match(text(h.tree), /Wähle ein Beispiel unten im Menü/);
    assert.equal(h.nodes(node => node.type?.name === 'MenuChoice')[0].props.value, '');
  }
});

test('Every authored research and movement deep link opens exactly its own content and keeps the selector in the lower menu', t => {
  const h = fixture(t, {});
  for (const entry of entries) {
    h.navigate({ datensatz: entry.id });
    assert.equal(selected(h), entry.id);
    assert.equal(h.nodes(node => node.type?.name === 'MenuChoice')[0].props.value, entry.id);
    const movement = h.nodes(node => node.type?.name === 'WildMovementMap')[0];
    assert.equal(!!movement, wildMovementDatasets.includes(entry));
    if (movement) assert.equal(movement.props.hideSelector, true);
    assert.equal(h.nodes(node => node.props?.dataset).length, movement ? 0 : 1);
    const content = h.nodes(node => node.type === 'div' && node.props.ref)[0];
    assert.equal(nodes(content, node => node.type?.name === 'MenuChoice').length, 0);
    assert.equal(menu(h).props.openInitially, false);
  }
  assert.equal(h.calls.length, 0, 'Restoring a URL must not create history');
});

test('A requested dataset waits for its URL commit; ordinary history restores the chosen dataset and focuses it', async t => {
  const h = fixture(t, { datensatz: 'temperatur', retained: 'yes' });
  let complete; let focused = 0, scrolled = 0;
  h.nodes(node => node.type === 'div' && node.props.ref)[0].props.ref.current = { querySelector: () => ({ setAttribute() {}, focus() { focused++; }, scrollIntoView() { scrolled++; } }) };
  h.router.push = (href, as, options) => { h.calls.push({ href, options }); return new Promise(resolve => { complete = resolve; }); };
  const request = choose(h, 'waldbrand'); h.render();
  assert.equal(selected(h), 'temperatur'); assert.equal(focused, 0);
  assert.deepEqual(h.calls[0], { href: { pathname: '/lernen/forschung-verstehen', query: { datensatz: 'waldbrand', retained: 'yes' }, hash: 'forschung-inhalt' }, options: { shallow: true, scroll: false } });
  h.navigate(h.calls[0].href.query); complete(true); await request; h.render();
  assert.equal(selected(h), 'waldbrand'); assert.equal(focused, 1); assert.equal(scrolled, 0, 'A category starts at page top instead of scrolling its lower result anchor');
  h.navigate({ datensatz: 'temperatur' }); assert.equal(selected(h), 'temperatur');
  h.navigate({ datensatz: 'waldbrand' }); assert.equal(selected(h), 'waldbrand');
  const reloaded = fixture(t, { datensatz: 'waldbrand' }); assert.equal(selected(reloaded), 'waldbrand');
});

test('Movement selections retain the existing movement fragment and invalid choices change neither URL nor content', async t => {
  const h = fixture(t, { datensatz: 'temperatur' });
  await choose(h, wildMovementDatasets[0].id); h.render();
  assert.equal(h.calls[0].href.hash, 'wildbewegung'); assert.equal(selected(h), wildMovementDatasets[0].id);
  const closes = h.menu.closed;
  await choose(h, 'invalid'); h.render();
  assert.equal(h.calls.length, 1); assert.equal(h.menu.closed, closes);
});

test('Hydration waits for a ready router and cannot open a stale picker over a valid incoming deep link', async t => {
  const h = fixture(t, {}, { ready: false });
  assert.equal(menu(h).props.openInitially, false);
  await choose(h, 'waldbrand'); assert.equal(h.calls.length, 0);
  h.router.isReady = true; h.navigate({ datensatz: 'waldbrand' });
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(selected(h), 'waldbrand'); assert.equal(h.menu.opened, 0);
});

test('A current failure keeps the old matching content and offers a retry; cancelled or unmounted requests cannot show errors', async t => {
  const h = fixture(t, { datensatz: 'temperatur' });
  h.router.push = async () => { throw new Error('network'); };
  await choose(h, 'waldbrand'); h.render();
  assert.equal(selected(h), 'temperatur'); assert.equal(h.router.query.datensatz, 'temperatur');
  assert.match(text(h.tree), /konnte nicht geöffnet werden/); assert.equal(h.menu.opened, 1);
  h.router.push = async () => { throw Object.assign(new Error('cancelled'), { cancelled: true }); };
  await choose(h, 'waldbrand'); h.render(); assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
  let reject; h.router.push = () => new Promise((resolve, fail) => { reject = fail; });
  const pending = choose(h, 'waldbrand'); h.dispose(); reject(new Error('late')); await pending; h.render();
  assert.equal(h.menu.opened, 1);
});

test('External history, including away and back to the same dataset, rejects a stale failed request', async t => {
  for (const backToOriginal of [false, true]) {
    const h = fixture(t, { datensatz: 'temperatur' });
    let reject; h.router.push = () => new Promise((resolve, fail) => { reject = fail; });
    const pending = choose(h, 'waldbrand');
    h.navigate({ datensatz: 'brutvoegel' });
    if (backToOriginal) h.navigate({ datensatz: 'temperatur' });
    const opened = h.menu.opened;
    reject(new Error('late history error')); await pending; h.render();
    assert.equal(h.menu.opened, opened); assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
    assert.equal(selected(h), backToOriginal ? 'temperatur' : 'brutvoegel');
  }
});

test('Re-selecting the committed dataset supersedes a different pending destination and an older completion cannot clear a newer request', async t => {
  const h = fixture(t, { datensatz: 'temperatur' });
  const waits = [];
  h.router.push = href => new Promise((resolve, reject) => { h.calls.push({ href }); waits.push({ resolve, reject }); });
  const first = choose(h, 'waldbrand');
  const second = choose(h, 'temperatur');
  assert.equal(h.calls.length, 2, 'Returning to current topic cancels the other pending destination through a new push');
  waits[0].resolve(false); await first;
  const third = choose(h, 'temperatur'); assert.equal(h.calls.length, 3);
  waits[1].reject(new Error('superseded')); await second; h.render();
  assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
  waits[2].resolve(true); await third;
  assert.equal(selected(h), 'temperatur');
});
