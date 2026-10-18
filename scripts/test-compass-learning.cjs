const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader();
const { readCompassLearningAngle: read } = load('lib/compass-learning.js');

test('The teaching circle has a clockwise full turn and exact reverse directions', () => {
  for (const [angle, reverse] of [[0,180],[45,225],[90,270],[135,315],[180,0],[225,45],[270,90],[315,135],[360,180]]) {
    assert.deepEqual(read(String(angle)), {angle, direction:angle===360?0:angle, reverse});
  }
  for (let angle=0;angle<360;angle++) {
    const original=read(angle), reversed=read(original.reverse);
    assert.equal(reversed.reverse,angle);
    assert.equal((original.reverse-original.direction+360)%360,180);
  }
  for (const value of ['', ' ', 'abc', null, undefined, {}, [], -1, 361, Infinity, NaN, '9e1', '90.5']) assert.equal(read(value),null,String(value));
});

test('The actual diagram updates its arrow and removes stale directions after an invalid edit', () => {
  let value='45';
  const Component=createLoader({react:{...React,useId:()=> 'compass-test',useState:()=>[value,next=>{value=next;}]}})('components/CompassLearning.js').default;
  const find=(tree,predicate)=>Array.isArray(tree)?tree.map(item=>find(item,predicate)).find(Boolean):tree&&typeof tree==='object'?(predicate(tree)?tree:find(tree.props?.children,predicate)):null;
  let tree=Component({});
  assert.match(renderToStaticMarkup(tree),/rotate\(45 170 170\)/);
  find(tree,node=>node.type==='input').props.onChange({target:{value:'270'}});tree=Component({});
  let html=renderToStaticMarkup(tree);
  assert.match(html,/rotate\(270 170 170\)/);assert.match(html,/Gegenrichtung:[\s\S]*90/);
  assert.match(html,/0° \/ 360°/);assert.doesNotMatch(html,/<button|<img|<iframe/);
  find(tree,node=>node.type==='input').props.onChange({target:{value:''}});html=renderToStaticMarkup(Component({}));
  assert.match(html,/Bitte einen ganzen Winkel/);assert.doesNotMatch(html,/rotate\(270|Gegenrichtung:/);
});

test('The same named lesson receives the model online and in existing offline diagrams', () => {
  const diagram=load('lib/lesson-diagrams.js').getLessonDiagram('wissen-vertiefung-kompass-nordrichtungen-2026','richtungswinkel');
  const html=renderToStaticMarkup(React.createElement(load('components/LessonDiagram.js').default,{diagram}));
  assert.match(html,/role="img"/);assert.match(html,/Richtungswinkel sichtbar machen/);
  assert.match(html,/keine Magnetnadel/);assert.match(html,/keine Deklination/);
  assert.ok(Array.isArray(diagram.steps));
  assert.equal(load('lib/lesson-diagrams.js').getLessonDiagram('wissen-vertiefung-kompass-nordrichtungen-2026','anderes-thema'),null);
});
