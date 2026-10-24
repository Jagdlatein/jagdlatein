const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { root } = require('./helpers/project-module.cjs');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
function fixture(query = { eintrag: 'schulter' }) {
  const h = setup('components/VenisonCutGuide.js', query);
  h.cuts = h.load('lib/venison-cut-guide.js').venisonCuts;
  h.photo = h.load('lib/venison-cut-guide.js').venisonCutPhoto;
  h.rail = () => h.nodes(node => node.props?.className === 'cutRail')[0];
  h.locator = () => h.nodes(node => node.props?.className === 'cutLocator')[0];
  h.buttons = () => nodes(h.rail(), node => node.type === 'button');
  h.select = id => { h.buttons().find(node => node.props['data-cut-id'] === id).props.onClick(); h.render(); };
  return h;
}
function assertSelected(h, cut) {
  const locator = h.locator(); assert.ok(locator); assert.equal(locator.props['aria-hidden'], 'true');
  const line = nodes(locator, node => node.type === 'line'); assert.equal(line.length, 1);
  assert.deepEqual([line[0].props.x1, line[0].props.y1, line[0].props.x2, line[0].props.y2], [cut.marker.x, cut.marker.y, cut.marker.x, '100']);
  const ring = nodes(locator, node => node.type === 'span')[0];
  assert.deepEqual(ring.props.style, { left: `${cut.marker.x}%`, top: `${cut.marker.y}%` }); assert.equal(text(locator), '');
  const pressed = h.buttons().filter(node => node.props['aria-pressed']); assert.equal(pressed.length, 1); assert.equal(pressed[0].props['data-cut-id'], cut.id);
  const selected = h.nodes(node => node.type === 'article'); assert.equal(selected.length, 1); assert.equal(selected[0].props.id, `wildbret-${cut.id}`);
}

test('Numbers and named controls stay below the optional full-aspect photo; one hollow locator uses original coordinates', () => {
  const h = fixture(); assert.equal(h.locator(), undefined);
  const map = h.nodes(node => node.props?.className === 'photoMap')[0];
  assert.equal(nodes(map, node => node.type === 'button').length, 0);
  assert.equal(nodes(map, node => node.type === 'span' && text(node)).length, 0);
  const image = nodes(map, node => node.type === 'img')[0]; assert.equal(image.props.src, h.photo.src); assert.equal(image.props.width, '1920'); assert.equal(image.props.height, '1080');
  const figure = h.nodes(node => node.type === 'figure' && node.props.className === 'overview')[0];
  assert.ok(figure.props.children.indexOf(map) < figure.props.children.indexOf(h.rail()));
  const photoDetails = h.nodes(node => node.type === 'details')[0]; assert.equal(photoDetails.props.open, undefined);
  assert.equal(h.rail().props.role, 'group'); assert.equal(h.buttons().length, 5);
  for (const cut of h.cuts) {
    h.select(cut.id); assertSelected(h, cut); assert.equal(h.buttons().length, 5);
    assert.equal(h.buttons().find(node => node.props['data-cut-id'] === cut.id).props['aria-controls'], 'wildbret-detail');
    h.select(cut.id); assert.equal(h.locator(), undefined); assert.equal(h.buttons().filter(node => node.props['aria-pressed']).length, 0);
  }
  h.dispose();
});

test('Filtering choices never silently replaces the chosen knowledge text or disconnects photo controls from it', () => {
  const h = fixture(); h.select('schulter'); assertSelected(h, h.cuts[0]); h.input('Gulasch'); assertSelected(h, h.cuts[0]);
  h.select('hals'); assertSelected(h, h.cuts[4]); assert.equal(h.nodes(node => node.type === 'article').length, 1);
  h.input('Banane'); assertSelected(h, h.cuts[4]);
  assert.match(text(h.tree), /Kein passendes Stück gefunden/);
  assert.equal(h.buttons().length, 5, 'The full-photo legend remains complete; filtering belongs to the menu');
  h.dispose();
});

test('Entry links select exactly one cut; image failure preserves its readable text and Back clears obsolete annotations', () => {
  const h = fixture({ eintrag: 'ruecken' }); assert.equal(h.locator(), undefined); assert.equal(h.buttons().length, 5);
  h.select('ruecken'); assertSelected(h, h.cuts[3]);
  h.navigate({ eintrag: 'hals' }); assert.equal(h.locator(), undefined); assert.equal(h.nodes(node => node.type === 'article')[0].props.id, 'wildbret-hals');
  h.select('hals'); assertSelected(h, h.cuts[4]);
  h.nodes(node => node.type === 'img' && node.props.src === h.photo.src)[0].props.onError(); h.render();
  assert.equal(h.locator(), undefined); assert.equal(h.buttons().length, 5); assert.match(text(h.tree), /Aufnahme ist gerade nicht verfügbar/);
  assert.match(text(h.tree), /Ausgewählt: 5 · Hals/); assert.equal(h.nodes(node => node.type === 'article').length, 1);
  h.dispose();
  const missing = fixture({ eintrag: 'unknown' }); assert.equal(missing.nodes(node => node.type === 'article').length, 0); assert.match(text(missing.tree), /Dieses Teilstück ist nicht verfügbar/); missing.dispose();
});

test('Controls meet touch sizing, keep focus styles and leave the photo uncropped with a transparent locator', () => {
  const css = fs.readFileSync(path.join(root, 'styles/DogCutLearning.module.css'), 'utf8');
  assert.match(css, /\.photoMap img\s*\{[^}]*width: 100%;[^}]*height: auto;/);
  assert.match(css, /\.cutRail button\s*\{[^}]*min-width: 44px;[^}]*min-height: 44px;/);
  assert.match(css, /\.cutRail button:focus-visible\s*\{[^}]*outline:/);
  assert.match(css, /\.cutLocator > span\s*\{[^}]*width: 10px;[^}]*background: transparent;/);
  assert.match(css, /\.cutLocator\s*\{[^}]*pointer-events: none;/);
  assert.doesNotMatch(css, /\.marker\s*\{/);
});
