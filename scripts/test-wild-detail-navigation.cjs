const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { createLoader } = require('./helpers/project-module.cjs');
const { wildDetailTopics: topics, wildDetailPhotos: photos, wildDetailSources: sources } = createLoader()('lib/wild-detail-atlas.js');
const file = 'components/WildDetailAtlas.js';
const menu = h => h.nodes(node => node.type?.name === 'PageMenu')[0];
const title = h => h.nodes(node => node.props?.id === 'wilddetails-title')[0]?.props.children;
const body = h => h.nodes(node => node.props?.id === 'wilddetails-content')[0];
function choose(h, id) {
  return h.nodes(node => node.type === 'select' && node.props.id === 'wilddetails-topic')[0].props.onChange({ target: { value: id } });
}
function fixture(t, query = {}, options) { const h = setup(file, query, options); t.after(() => h.dispose()); return h; }

// Text and media preservation checks do not replace a factual review.
test('Every existing topic link keeps exactly its photographs, annotations, claims, limits and final source mapping', t => {
  const h = fixture(t);
  assert.equal(title(h), topics[0].title);
  for (const topic of topics) {
    h.navigate({ thema: topic.id });
    assert.equal(title(h), topic.title);
    const rendered = text(body(h));
    for (const fact of [topic.subtitle, topic.comparison, topic.observation, ...topic.claims.map(item => item.text)]) assert.ok(rendered.includes(fact), topic.id);
    assert.match(rendered, /Größen sind nicht maßstabsgleich/);
    const panels = nodes(body(h), node => node.type?.name === 'DetailPhoto');
    assert.equal(panels.length, topic.panels.length);
    for (const [index, panel] of topic.panels.entries()) {
      assert.deepEqual(panels[index].props.panel, panel);
      assert.deepEqual(panels[index].props.photograph, photos[panel.photoId]);
      assert.equal(panels[index].props.prefix, `${topic.id}-${index}`);
      assert.equal(panels[index].key, `${topic.id}-${panel.photoId}`);
      assert.equal(panels[index].props.showCredit, false);
    }
    const footer = h.nodes(node => node.type === 'details').at(-1);
    assert.ok(footer && !footer.props.open);
    for (const claim of topic.claims) {
      assert.ok(text(footer).includes(claim.reviewedOn));
      for (const id of claim.sourceIds) assert.ok(nodes(footer, node => node.props?.href === sources[id].url).length);
    }
    assert.deepEqual(nodes(footer, node => node.type?.name === 'LearningPhotoCredit').map(node => node.props.media), [...new Set(topic.panels.map(panel => panel.photoId))].map(id => photos[id]));
    assert.equal(nodes(body(h), node => node.type === 'select' || node.type === 'input').length, 0);
    assert.equal(h.nodes(node => node.type === 'select').length, nodes(menu(h), node => node.type === 'select').length);
  }
  assert.equal(h.calls.length, 0, 'Opening an existing link must not create another history step');
});

test('Unknown, empty and repeated explicit topics show a picker instead of an unrelated first topic', t => {
  for (const thema of ['missing', '', null, [topics[0].id], [topics[0].id, topics[1].id]]) {
    const h = fixture(t, { thema });
    assert.equal(title(h), undefined); assert.equal(body(h), undefined);
    assert.equal(menu(h).props.openInitially, true);
    assert.match(text(h.tree), /Dieses Thema ist nicht verfügbar/);
    assert.equal(h.nodes(node => node.type?.name === 'DetailPhoto').length, 0);
    assert.equal(h.nodes(node => node.type === 'select')[0].props.value, '');
  }
});

test('Selection waits for the committed URL, adds a real history entry and focuses the matching heading', async t => {
  const h = fixture(t, { thema: topics[0].id, retained: 'yes' });
  let focused = 0, scrolled = 0, complete;
  h.nodes(node => node.props?.id === 'wilddetails-title')[0].props.ref.current = { focus() { focused++; }, scrollIntoView() { scrolled++; } };
  h.router.push = (href, as, options) => { h.calls.push({ href, options }); return new Promise(resolve => { complete = resolve; }); };
  const pending = choose(h, topics[1].id); h.render();
  assert.equal(title(h), topics[0].title); assert.equal(focused, 0);
  assert.deepEqual(h.calls[0], { href: { pathname: '/lernen/wildtier-details', query: { thema: topics[1].id, retained: 'yes' }, hash: 'wilddetails-title' }, options: { shallow: true, scroll: false } });
  h.navigate(h.calls[0].href.query); complete(true); await pending; h.render();
  assert.equal(title(h), topics[1].title); assert.equal(focused, 1); assert.equal(scrolled, 1);
  h.navigate({ thema: topics[0].id }); assert.equal(title(h), topics[0].title);
  h.navigate(h.calls[0].href.query); assert.equal(title(h), topics[1].title);
  const reload = fixture(t, h.router.query); assert.equal(title(reload), topics[1].title);
});

test('Hydration never flashes a default topic, opens a picker or navigates before the actual incoming topic is ready', async t => {
  const h = fixture(t, { thema: topics[2].id }, { ready: false });
  assert.equal(title(h), undefined); assert.equal(menu(h).props.openInitially, false);
  assert.match(text(h.tree), /wird geladen/);
  await choose(h, topics[3].id); h.render(); assert.equal(h.calls.length, 0);
  h.router.isReady = true; h.render(); await new Promise(resolve => setTimeout(resolve, 1));
  assert.equal(title(h), topics[2].title); assert.equal(h.menu.opened, 0);
  assert.equal(menu(h).props.openInitially, false);
});

test('Re-selecting the settled topic only focuses its heading and keeps the same photo component identities', async t => {
  const h = fixture(t, { thema: topics[2].id });
  let focused = 0;
  h.nodes(node => node.props?.id === 'wilddetails-title')[0].props.ref.current = { focus() { focused++; }, scrollIntoView() {} };
  const keys = h.nodes(node => node.type?.name === 'DetailPhoto').map(node => node.key);
  await choose(h, topics[2].id); h.render();
  assert.equal(h.calls.length, 0); assert.equal(focused, 1);
  assert.deepEqual(h.nodes(node => node.type?.name === 'DetailPhoto').map(node => node.key), keys);
  const closes = h.menu.closed;
  await choose(h, 'unknown'); h.render(); assert.equal(h.calls.length, 0); assert.equal(h.menu.closed, closes);
});

test('Failed navigation preserves the current URL and photo keys; cancelled, superseded and unmounted failures stay silent', async t => {
  const h = fixture(t, { thema: topics[0].id }); const rejects = [];
  const keys = h.nodes(node => node.type?.name === 'DetailPhoto').map(node => node.key);
  h.router.push = () => new Promise((resolve, reject) => rejects.push(reject));
  const first = choose(h, topics[1].id), second = choose(h, topics[2].id);
  rejects[0](new Error('superseded')); await first; h.render(); assert.equal(h.menu.opened, 0);
  rejects[1](new Error('offline')); await second; h.render();
  assert.equal(h.menu.opened, 1); assert.match(text(h.tree), /Thema konnte nicht geöffnet werden/);
  assert.equal(title(h), topics[0].title); assert.deepEqual(h.router.query, { thema: topics[0].id });
  assert.deepEqual(h.nodes(node => node.type?.name === 'DetailPhoto').map(node => node.key), keys);
  const cancelled = choose(h, topics[1].id);
  rejects[2](Object.assign(new Error('cancelled'), { cancelled: true })); await cancelled; h.render();
  assert.equal(h.menu.opened, 1); assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
  const departed = choose(h, topics[2].id);
  h.dispose(); rejects[3](new Error('unmounted')); await departed; h.render();
  assert.equal(h.menu.opened, 1); assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
  await choose(h, topics[3].id); h.render(); assert.equal(rejects.length, 4, 'A removed selector cannot navigate again');
});

test('Re-selecting the committed topic cancels a pending target even after an older request settles', async t => {
  const h = fixture(t, { thema: topics[0].id }); const rejects = [];
  h.router.push = href => { h.calls.push({ href }); return new Promise((resolve, reject) => rejects.push(reject)); };
  const first = choose(h, topics[1].id), second = choose(h, topics[2].id);
  rejects[0](Object.assign(new Error('cancelled'), { cancelled: true })); await first;
  const latest = choose(h, topics[0].id);
  assert.equal(h.calls.length, 3); assert.equal(h.calls.at(-1).href.query.thema, topics[0].id);
  rejects[1](new Error('superseded')); await second;
  rejects[2](Object.assign(new Error('cancelled'), { cancelled: true })); await latest; h.render();
  assert.equal(title(h), topics[0].title); assert.equal(h.menu.opened, 0);
});

test('A late error cannot reopen the menu after external history, even when history returns to the identical topic', async t => {
  for (const visits of [[topics[2].id], [topics[2].id, topics[0].id]]) {
    const h = fixture(t, { thema: topics[0].id }); let reject;
    h.router.push = () => new Promise((resolve, fail) => { reject = fail; });
    const pending = choose(h, topics[1].id);
    for (const id of visits) h.navigate({ thema: id });
    reject(new Error('late failure')); await pending; h.render();
    assert.equal(title(h), topics.find(item => item.id === visits.at(-1)).title);
    assert.equal(h.menu.opened, 0); assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
  }
});

test('An invalid-link picker timer is cancelled if a valid topic commits before it opens', async t => {
  const h = fixture(t, { thema: 'missing' });
  h.navigate({ thema: topics[1].id });
  await new Promise(resolve => setTimeout(resolve, 1));
  assert.equal(title(h), topics[1].title); assert.equal(h.menu.opened, 0);
});
