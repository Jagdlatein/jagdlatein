const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { createLoader } = require('./helpers/project-module.cjs');
const plants = createLoader()('lib/plant-atlas.js');
const { developmentPhotoSeries } = createLoader()('lib/development-photo-series.js');
const file = 'components/PlantAtlas.js';

const menu = h => h.nodes(node => node.type?.name === 'PageMenu')[0];
const title = h => h.nodes(node => node.props?.id === 'plant-title')[0]?.props.children;
function plantButton(h, id) {
  const entry = plants.plantAtlasEntries.find(item => item.id === id);
  return nodes(menu(h), node => node.type === 'button' && text(node).startsWith(entry.name))[0];
}
function select(h, id, value) {
  const control = h.nodes(node => node.type?.name === 'MenuChoice' && node.props.id === id)[0];
  assert.ok(control, id);
  return control.props.onChange({ target: { value } });
}
function fixture(t, query, options) { const h = setup(file, query, options); t.after(() => h.dispose()); return h; }

test('An explicit choice replaces unrelated default content; unknown and repeated IDs never open another plant', t => {
  for (const query of [{}, { eintrag: 'missing' }, { eintrag: ['rotbuche', 'waldkiefer'] }, { entwicklung: 'missing' }]) {
    const h = fixture(t, query);
    assert.equal(title(h), undefined);
    assert.equal(menu(h).props.openInitially, true);
    assert.match(text(h.tree), /Wähle eine Pflanze unten im Menü/);
    assert.match(text(h.tree), /keine Verzehr- oder Sammelfreigabe/);
  }
});

test('Every existing plant/season deep link opens its full matching text with controls confined to the lower menu', t => {
  const h = fixture(t, {});
  for (const entry of plants.plantAtlasEntries) for (const season of plants.plantSeasons) {
    h.navigate({ eintrag: entry.id, jahreszeit: season.id });
    assert.equal(title(h), entry.name);
    const detail = h.nodes(node => node.props?.id === 'plant-detail')[0];
    assert.match(text(detail), new RegExp(entry.latin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.ok(text(detail).includes(entry.features.join('')));
    assert.ok(text(detail).includes(entry.habitat));
    assert.ok(text(detail).includes(entry.confusion));
    assert.ok(text(detail).includes(entry.seasons[season.id]));
    assert.equal(nodes(detail, node => ['select', 'input', 'button'].includes(node.type)).length, 0);
    assert.equal(nodes(detail, node => node.type === 'details').length, 0);
    assert.equal(h.nodes(node => node.props?.id === 'plant-season-choice')[0].props.value, season.id);
    assert.equal(menu(h).props.openInitially, false);
    const source = h.nodes(node => node.type === 'details').at(-1);
    assert.ok(text(source).includes(entry.source.title));
    assert.match(text(source), /4\. Oktober 2026/);
  }
  assert.equal(h.calls.length, 0, 'Restored deep links do not create history');
});

test('Search/group filtering creates no history; choosing a result and season creates reversible URLs and focuses the text', async t => {
  const h = fixture(t, { eintrag: 'rotbuche', jahreszeit: 'winter', retained: 'yes' });
  let focused = 0, scrolled = 0;
  h.nodes(node => node.type === 'div' && node.props.ref)[0].props.ref.current = {
    querySelector: () => ({ setAttribute() {}, focus() { focused++; }, scrollIntoView() { scrolled++; } }),
  };
  h.input('Kiefer'); await select(h, 'plant-group', 'Nadelbaum'); h.render();
  assert.equal(h.calls.length, 0);
  assert.equal(title(h), 'Rotbuche');
  await plantButton(h, 'waldkiefer').props.onClick(); h.render();
  assert.equal(title(h), 'Waldkiefer / Waldföhre');
  assert.deepEqual(h.calls[0], { href: { pathname: '/lernen/pflanzenatlas', query: { eintrag: 'waldkiefer', jahreszeit: 'winter', retained: 'yes' }, hash: 'plant-detail' }, options: { shallow: true, scroll: false } });
  assert.equal(focused, 1); assert.equal(scrolled, 0, 'A committed selection starts at the page top instead of scrolling below earlier content');
  await select(h, 'plant-season-choice', 'fruehling'); h.render();
  assert.equal(h.calls.length, 2);
  assert.equal(h.calls[1].href.query.jahreszeit, 'fruehling');
  assert.match(text(h.nodes(node => node.props?.id === 'plant-season')[0]), /^Frühling/);
  h.navigate(h.calls[0].href.query); assert.match(text(h.nodes(node => node.props?.id === 'plant-season')[0]), /^Winter/);
  h.navigate(h.calls[1].href.query); assert.match(text(h.nodes(node => node.props?.id === 'plant-season')[0]), /^Frühling/);
  const reloaded = fixture(t, h.calls[1].href.query); assert.equal(title(reloaded), 'Waldkiefer / Waldföhre');
  assert.match(text(reloaded.nodes(node => node.props?.id === 'plant-season')[0]), /^Frühling/);
});

test('Existing photo-development links and quiz remain usable and returning to the atlas restores the plant/season', async t => {
  const series = developmentPhotoSeries[0];
  const h = fixture(t, { eintrag: 'waldkiefer', jahreszeit: 'winter', entwicklung: series.id });
  let photo = h.nodes(node => node.type?.name === 'DevelopmentPhotoSeries')[0];
  assert.equal(photo.props.selectedId, series.id); assert.equal(title(h), undefined);
  await select(h, 'plant-mode', 'atlas'); h.render();
  assert.equal(title(h), 'Waldkiefer / Waldföhre');
  assert.match(text(h.nodes(node => node.props?.id === 'plant-season')[0]), /^Winter/);
  await select(h, 'plant-mode', 'quiz'); h.render();
  assert.ok(h.nodes(node => node.type?.name === 'NatureQuestionRound').length);
  assert.equal(h.calls.at(-1).href.hash, 'plant-quiz');
  assert.equal(title(h), undefined);
  await select(h, 'plant-mode', 'entwicklung'); h.render();
  photo = h.nodes(node => node.type?.name === 'DevelopmentPhotoSeries')[0];
  assert.equal(photo.props.selectedId, series.id); assert.equal(h.calls.at(-1).href.hash, 'pflanzen-entwicklung');
  assert.match(text(h.tree), /keine Verzehr- oder Sammelfreigabe/);
  assert.equal(h.calls.at(-1).href.query.eintrag, 'waldkiefer');
});

test('Delayed router hydration cannot open the picker over an incoming plant or photo-development link', async t => {
  for (const query of [{ eintrag: 'waldkiefer' }, { entwicklung: developmentPhotoSeries[0].id }]) {
    const h = fixture(t, query, { ready: false });
    assert.equal(menu(h).props.openInitially, false); assert.equal(title(h), undefined); assert.equal(h.menu.closed, 0);
    await select(h, 'plant-mode', 'quiz'); h.render(); assert.equal(h.calls.length, 0);
    h.router.isReady = true; h.render();
    assert.equal(menu(h).props.openInitially, false); assert.equal(h.menu.closed, 1);
  }
});

test('Cancelled, superseded and departed requests do not reopen the picker or replace committed content', async t => {
  const h = fixture(t, { eintrag: 'rotbuche' }); const rejects = [];
  h.router.push = () => new Promise((resolve, reject) => rejects.push(reject));
  const first = plantButton(h, 'waldkiefer').props.onClick();
  const second = plantButton(h, 'stieleiche').props.onClick();
  rejects[0](Object.assign(new Error('superseded'), { cancelled: true })); await first; h.render();
  assert.equal(h.menu.opened, 0); assert.equal(title(h), 'Rotbuche');
  rejects[1](new Error('offline')); await second; h.render();
  assert.equal(h.menu.opened, 1); assert.match(text(h.tree), /Thema konnte nicht geöffnet/);
  const third = plantButton(h, 'waldkiefer').props.onClick();
  const fourth = plantButton(h, 'stieleiche').props.onClick();
  rejects[2](new Error('old failure')); await third; h.render(); assert.equal(h.menu.opened, 1);
  h.dispose(); rejects[3](new Error('departed')); await fourth; assert.equal(h.menu.opened, 1);
});

test('Re-selecting the committed plant/season supersedes another pending view even after an older request finishes', async t => {
  const h = fixture(t, { eintrag: 'rotbuche', jahreszeit: 'winter' }); const rejects = [];
  h.router.push = href => { h.calls.push({ href }); return new Promise((resolve, reject) => rejects.push(reject)); };
  const first = plantButton(h, 'waldkiefer').props.onClick();
  const second = select(h, 'plant-season-choice', 'sommer');
  rejects[0](Object.assign(new Error('superseded'), { cancelled: true })); await first;
  const latest = select(h, 'plant-season-choice', 'winter');
  assert.equal(h.calls.length, 3);
  assert.equal(h.calls.at(-1).href.query.eintrag, 'rotbuche'); assert.equal(h.calls.at(-1).href.query.jahreszeit, 'winter');
  rejects[1](Object.assign(new Error('superseded'), { cancelled: true })); await second;
  rejects[2](Object.assign(new Error('cancelled'), { cancelled: true })); await latest;
  assert.equal(h.menu.opened, 0); assert.equal(title(h), 'Rotbuche');
});

test('A late failed push cannot reopen the menu after an external History/deep-link commit, even when History returns to the first plant', async t => {
  for (const visits of [['stieleiche'], ['stieleiche', 'rotbuche']]) {
    const h = fixture(t, { eintrag: 'rotbuche' });
    let reject;
    h.router.push = () => new Promise((resolve, fail) => { reject = fail; });
    const pending = plantButton(h, 'waldkiefer').props.onClick();
    for (const id of visits) h.navigate({ eintrag: id });
    reject(new Error('late failure')); await pending; h.render();
    assert.equal(title(h), plants.plantAtlasEntries.find(item => item.id === visits.at(-1)).name);
    assert.equal(h.menu.opened, 0);
    assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
  }
});
