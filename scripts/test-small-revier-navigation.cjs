const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { createLoader } = require('./helpers/project-module.cjs');
const load = createLoader();
const { revierLifeTopics } = load('lib/small-revier-life.js');
const { foodwebNodes } = load('lib/foodweb-learning.js');
const file = 'components/SmallRevierLife.js';
const menu = h => h.nodes(node => node.type?.name === 'PageMenu')[0];
const topic = h => h.nodes(node => node.props?.topic)[0]?.props.topic.id;
const network = h => h.nodes(node => node.type?.name === 'FoodwebLearning')[0];
const choose = (h, id, control = 'revierleben-thema') => h.nodes(node => node.type?.name === 'MenuChoice' && node.props.id === control)[0].props.onChange({ target: { value: id } });
function fixture(t, query, options) { const h = setup(file, query, options); t.after(() => h.dispose()); return h; }

test('Missing, invalid and repeated topic/motif selections never show an unrelated organism', async t => {
  for (const query of [{}, { thema: 'missing' }, { thema: ['spinnen', 'holzpilze'] }, { thema: 'nahrungsnetz', motiv: 'missing' }, { thema: 'nahrungsnetz', motiv: ['laub', 'spinne'] }]) {
    const h = fixture(t, query);
    assert.equal(topic(h), undefined); assert.equal(network(h), undefined);
    assert.equal(menu(h).props.openInitially, true);
    assert.match(text(h.tree), /Wähle unten im Menü ein Thema/);
  }
  const repair = fixture(t, { thema: 'nahrungsnetz', motiv: 'invalid' });
  await choose(repair, 'laub', 'revierleben-motiv'); repair.render();
  assert.equal(network(repair).props.selectedId, 'laub');
});

test('All 16 profile links and all five food-web motif links restore precisely their addressed content', t => {
  const h = fixture(t, {});
  for (const entry of revierLifeTopics) {
    h.navigate({ thema: entry.id, motiv: 'irrelevant-on-a-normal-profile' });
    assert.equal(topic(h), entry.id); assert.equal(network(h), undefined);
    assert.equal(menu(h).props.openInitially, false);
    assert.equal(h.nodes(node => node.props?.topic)[0].key, entry.id);
  }
  for (const entry of foodwebNodes) {
    h.navigate({ thema: 'nahrungsnetz', motiv: entry.id });
    assert.equal(topic(h), undefined); assert.equal(network(h).props.selectedId, entry.id);
    assert.equal(h.nodes(node => node.props?.id === 'revierleben-motiv')[0].props.value, entry.id);
  }
  h.navigate({ thema: 'nahrungsnetz' }); assert.equal(network(h).props.selectedId, 'regenwurm', 'The original food-web link without a motif stays valid');
  assert.equal(h.calls.length, 0, 'Restored URLs do not add history entries');
});

test('A new topic waits for URL commit, preserves unrelated parameters and creates reversible history and focus', async t => {
  const h = fixture(t, { thema: 'holzpilze', retained: 'yes' });
  let complete; const focus = [];
  h.nodes(node => node.type === 'div' && node.props.ref)[0].props.ref.current = { querySelector(selector) { return { setAttribute() {}, focus() { focus.push(selector); }, scrollIntoView() {} }; } };
  h.router.push = (href, as, options) => { h.calls.push({ href, options }); return new Promise(resolve => { complete = resolve; }); };
  const request = choose(h, 'regenwuermer'); h.render();
  assert.equal(topic(h), 'holzpilze'); assert.equal(focus.length, 0);
  assert.deepEqual(h.calls[0], { href: { pathname: '/lernen/kleines-revierleben', query: { thema: 'regenwuermer', retained: 'yes' }, hash: 'revierleben-inhalt' }, options: { shallow: true, scroll: false } });
  h.navigate(h.calls[0].href.query); complete(true); await request;
  assert.equal(topic(h), 'regenwuermer'); assert.deepEqual(focus, ['h2']);
  h.navigate({ thema: 'holzpilze' }); assert.equal(topic(h), 'holzpilze');
  h.navigate({ thema: 'regenwuermer' }); assert.equal(topic(h), 'regenwuermer');
  const reload = fixture(t, h.router.query); assert.equal(topic(reload), 'regenwuermer');
});

test('Motifs wait for their URL, focus the resulting explanation and preserve the component identity; leaving removes the motif parameter', async t => {
  const h = fixture(t, { thema: 'nahrungsnetz', motiv: 'spinne', retained: 'yes' });
  const firstKey = network(h).key, focus = [];
  h.nodes(node => node.type === 'div' && node.props.ref)[0].props.ref.current = { querySelector(selector) { return { setAttribute() {}, focus() { focus.push(selector); }, scrollIntoView() {} }; } };
  const defaultPush = h.router.push;
  let complete; h.router.push = href => new Promise(resolve => { h.calls.push({ href }); complete = resolve; });
  const request = network(h).props.onSelect('grasfrosch'); h.render();
  assert.equal(network(h).props.selectedId, 'spinne');
  h.navigate(h.calls[0].href.query); complete(true); await request;
  assert.equal(network(h).props.selectedId, 'grasfrosch'); assert.equal(network(h).key, firstKey);
  assert.deepEqual(focus, ['#nahrungsnetz-beziehungen']);
  assert.equal(h.calls[0].href.query.retained, 'yes');
  h.router.push = defaultPush;
  await choose(h, 'wildbienen'); h.render();
  assert.equal(topic(h), 'wildbienen'); assert.equal(h.calls.at(-1).href.query.motiv, undefined);
  await choose(h, 'nahrungsnetz'); h.render(); assert.equal(network(h).props.selectedId, 'grasfrosch', 'Returning via the menu remembers only the last committed valid motif');
});

test('Hydration cannot flash a default organism or open a stale picker over a valid incoming food-web link', async t => {
  const h = fixture(t, {}, { ready: false });
  assert.equal(topic(h), undefined); assert.equal(network(h), undefined); assert.equal(menu(h).props.openInitially, false);
  await choose(h, 'holzpilze'); assert.equal(h.calls.length, 0);
  h.router.isReady = true; h.navigate({ thema: 'nahrungsnetz', motiv: 'laub' });
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(network(h).props.selectedId, 'laub'); assert.equal(h.menu.opened, 0);
});

test('Current failures retain the matching topic/motif and offer retry; cancelled and unmounted requests stay silent', async t => {
  const h = fixture(t, { thema: 'nahrungsnetz', motiv: 'spinne' });
  h.router.push = async () => { throw new Error('network'); };
  await choose(h, 'grasfrosch', 'revierleben-motiv'); h.render();
  assert.equal(network(h).props.selectedId, 'spinne'); assert.equal(h.router.query.motiv, 'spinne');
  assert.match(text(h.tree), /konnte nicht geöffnet werden/); assert.equal(h.menu.opened, 1);
  h.router.push = async () => { throw Object.assign(new Error('cancel'), { cancelled: true }); };
  await choose(h, 'holzpilze'); h.render(); assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
  let reject; let calls = 0; h.router.push = () => { calls++; return new Promise((resolve, fail) => { reject = fail; }); };
  const staleSelector = h.nodes(node => node.props?.id === 'revierleben-thema')[0].props.onChange;
  const pending = choose(h, 'holzpilze'); h.dispose(); reject(new Error('late')); await pending; h.render();
  await staleSelector({ target: { value: 'wildbienen' } });
  assert.equal(calls, 1, 'An event retained after unmount cannot start another navigation'); assert.equal(h.menu.opened, 1);
});

test('History changes invalidate old failures and callbacks even after returning to exactly the same topic/motif', async t => {
  for (const useNetwork of [false, true]) {
    const initial = useNetwork ? { thema: 'nahrungsnetz', motiv: 'spinne' } : { thema: 'holzpilze' };
    const h = fixture(t, initial); let reject, calls = 0;
    h.router.push = () => { calls++; return new Promise((resolve, fail) => { reject = fail; }); };
    const stale = h.nodes(node => node.props?.id === 'revierleben-thema')[0].props.onChange;
    const pending = choose(h, 'regenwuermer');
    h.navigate({ thema: 'wildbienen' }); h.navigate(initial);
    reject(new Error('late history')); await pending; h.render();
    await stale({ target: { value: 'spinnen' } });
    assert.equal(calls, 1); assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
    assert.equal(useNetwork ? network(h).props.selectedId : topic(h), useNetwork ? 'spinne' : 'holzpilze');
  }
});

test('Re-selecting the current motif supersedes a pending selection and old completion cannot clear newer work', async t => {
  const h = fixture(t, { thema: 'nahrungsnetz', motiv: 'spinne' }); const waits = [];
  h.router.push = href => new Promise((resolve, reject) => { h.calls.push({ href }); waits.push({ resolve, reject }); });
  const first = choose(h, 'grasfrosch', 'revierleben-motiv');
  const second = choose(h, 'spinne', 'revierleben-motiv'); assert.equal(h.calls.length, 2);
  waits[0].resolve(false); await first;
  const third = choose(h, 'spinne', 'revierleben-motiv'); assert.equal(h.calls.length, 3);
  waits[1].reject(new Error('superseded')); await second; h.render();
  assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
  waits[2].resolve(true); await third;
  assert.equal(network(h).props.selectedId, 'spinne');
});

test('Topic and motif navigation occurs only in the shared lower PageMenu', t => {
  const h = fixture(t, { thema: 'nahrungsnetz', motiv: 'laub' });
  const controls = nodes(menu(h), node => node.type?.name === 'MenuChoice'); assert.equal(controls.length, 2);
  const content = h.nodes(node => node.type === 'div' && node.props.ref)[0];
  assert.equal(nodes(content, node => node.type?.name === 'MenuChoice').length, 0);
  assert.equal(h.tree.props.headingOnly, true);
});
