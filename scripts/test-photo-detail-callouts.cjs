const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..'), pr = createRequire(path.join(root, 'package.json'));
const React = pr('react'), swc = pr('next/dist/build/swc');
function nodes(node, predicate) { return Array.isArray(node) ? node.flatMap(child => nodes(child, predicate)) : !node || typeof node !== 'object' ? [] : [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)]; }
function setup() {
  let active = null;
  const cache = new Map();
  function load(relative) {
    const file = path.join(root, relative);
    if (cache.has(file)) return cache.get(file);
    const { code } = swc.transformSync(fs.readFileSync(file, 'utf8'), { filename: file, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    const mod = { exports: {} };
    new Function('require', 'module', 'exports', code)(id => {
      if (id === 'react') return { ...React, useState: () => [active, value => { active = typeof value === 'function' ? value(active) : value; }] };
      if (id === 'next/router') return {};
      if (id === './LearningToolLayout' || id === './LearningPhoto') return {};
      if (id.endsWith('.module.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(file), path.extname(id) ? id : `${id}.js`)));
      return pr(id);
    }, mod, mod.exports); cache.set(file, mod.exports); return mod.exports;
  }
  return { load };
}

test('Every atlas photo puts numbered controls outside its image plane and starts unobscured', () => {
  const { load } = setup(), { DetailPhoto } = load('components/WildDetailAtlas.js');
  const { wildDetailTopics, wildDetailPhotos } = load('lib/wild-detail-atlas.js');
  for (const topic of wildDetailTopics) for (const [index, panel] of topic.panels.entries()) {
    const tree = DetailPhoto({ panel, photograph: wildDetailPhotos[panel.photoId], prefix: `${topic.id}-${index}` });
    const plane = nodes(tree, item => item.props.className === 'imagePlane')[0];
    assert.equal(nodes(plane, item => item.type === 'button' || item.type === 'span' || item.type === 'svg').length, 0);
    const controls = nodes(tree, item => item.type === 'button');
    assert.equal(controls.length, panel.markers.length);
    controls.forEach((button, number) => {
      assert.equal(button.props['aria-pressed'], false);
      assert.match(button.props['aria-label'], new RegExp(`Merkmal ${number + 1}:`));
      assert.ok(nodes(tree, item => item.props.id === button.props['aria-describedby']).length === 1);
    });
  }
});

test('Selecting a Gams feature uses its original coordinates, shows only one hollow pointer and toggles off', () => {
  const { load } = setup(), { DetailPhoto } = load('components/WildDetailAtlas.js');
  const data = load('lib/wild-detail-atlas.js'), panel = data.getWildDetailTopic('gams-und-steinbock').panels[0];
  const props = { panel, photograph: data.wildDetailPhotos[panel.photoId], prefix: 'gams' };
  let tree = DetailPhoto(props);
  nodes(tree, item => item.type === 'button')[1].props.onClick(); tree = DetailPhoto(props);
  let svg = nodes(tree, item => item.type === 'svg');
  assert.equal(svg.length, 1);
  const circle = nodes(svg[0], item => item.type === 'circle')[0];
  assert.equal(circle.props.cx, panel.markers[1].x); assert.equal(circle.props.cy, panel.markers[1].y);
  assert.equal(nodes(svg[0], item => item.type === 'text' || item.type === 'button').length, 0);
  nodes(tree, item => item.type === 'button')[0].props.onClick(); tree = DetailPhoto(props);
  assert.equal(nodes(tree, item => item.type === 'circle').length, 1);
  assert.equal(nodes(tree, item => item.type === 'circle')[0].props.cx, panel.markers[0].x);
  nodes(tree, item => item.type === 'button')[0].props.onClick(); tree = DetailPhoto(props);
  assert.equal(nodes(tree, item => item.type === 'svg').length, 0);
  const css = fs.readFileSync(path.join(root, 'styles/WildDetailAtlas.module.css'), 'utf8');
  assert.match(css, /min-width: 44px; min-height: 44px/);
  assert.match(css, /fill: none/);
  assert.match(css, /pointer-events: none/);
});
