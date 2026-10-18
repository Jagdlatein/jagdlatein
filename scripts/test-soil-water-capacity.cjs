const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const load = createLoader();
const { calculateSoilWaterCapacity: calculate } = load('lib/soil-water-capacity.js');

test('Uniform-profile units match independent hand calculations and decimal input', () => {
  assert.equal(calculate({ fieldCapacity: 30, wiltingPoint: 10, depthCm: 50 }).capacityMm, 100);
  assert.equal(calculate({ fieldCapacity: 30, wiltingPoint: 10, depthCm: 25 }).capacityMm, 50);
  assert.equal(calculate({ fieldCapacity: 30, wiltingPoint: 30, depthCm: 50 }).capacityMm, 0);
  assert.equal(calculate({ fieldCapacity: '30,5', wiltingPoint: '10,5', depthCm: '50' }).capacityMm, 100);
  assert.equal(calculate({ fieldCapacity: 40, wiltingPoint: 15, depthCm: 80 }).capacityMm, 200);
});

test('Empty, malformed, reversed and out-of-range inputs show validation instead of a misleading capacity', () => {
  for (const invalid of ['', ' ', null, undefined, false, [], {}, '0x10', '1e3', '3,2,1', NaN, Infinity]) {
    assert.equal(calculate({ fieldCapacity: invalid, wiltingPoint: 10, depthCm: 50 }).valid, false);
  }
  for (const values of [{ fieldCapacity: 101, wiltingPoint: 10, depthCm: 50 }, { fieldCapacity: 30, wiltingPoint: -1, depthCm: 50 }, { fieldCapacity: 5, wiltingPoint: 10, depthCm: 50 }, { fieldCapacity: 30, wiltingPoint: 10, depthCm: 0 }, { fieldCapacity: 30, wiltingPoint: 10, depthCm: 1001 }]) {
    const result = calculate(values);
    assert.equal(result.valid, false);
    assert.ok(result.message && !('capacityMm' in result));
  }
});

test('The lesson model is accessible, explicit about fictitious values and uses the same online/offline diagram renderer', () => {
  const React = local('react');
  const { renderToStaticMarkup } = local('react-dom/server');
  const Component = load('components/LessonDiagram.js').default;
  const { getLessonDiagram } = load('lib/lesson-diagrams.js');
  const diagram = getLessonDiagram('wissen-pruefung-bodenwasser-wurzelraum-2026', 'wurzelraumspeicher');
  const html = renderToStaticMarkup(React.createElement(Component, { diagram }));
  assert.equal((html.match(/type="number"/g) || []).length, 3);
  assert.match(html, /100 mm/);
  assert.match(html, /keine Messwerte/);
  assert.match(html, /kein aktueller Füllstand/);
  assert.match(html, /aria-live="polite"/);
  assert.doesNotMatch(html, /<button|<iframe|<img/);
  assert.equal(getLessonDiagram('wissen-pruefung-bodenwasser-wurzelraum-2026', 'wasserbindung'), null);
  assert.match(renderToStaticMarkup(React.createElement(Component, { diagram: getLessonDiagram('wissen-ausbau-koerperfunktion-kreislauf-2026', 'blutweg') })), /Den Blutweg einmal im Kreis verfolgen/);
});

test('Changing the actual learning fields updates the result immediately and invalid edits remove the stale number', () => {
  const React = local('react');
  const { renderToStaticMarkup } = local('react-dom/server');
  const state = [];
  let cursor = 0;
  const hooked = { ...React, useId: () => 'soil-fixture', useState(initial) {
    const slot = cursor++;
    if (!(slot in state)) state[slot] = initial;
    return [state[slot], next => { state[slot] = typeof next === 'function' ? next(state[slot]) : next; }];
  } };
  const Component = createLoader({ react: hooked })('components/SoilWaterCapacity.js').default;
  const render = () => { cursor = 0; return Component({}); };
  function find(node, id) {
    if (!node || typeof node !== 'object') return null;
    if (node.props?.id === id) return node;
    for (const child of React.Children.toArray(node.props?.children)) { const result = find(child, id); if (result) return result; }
    return null;
  }
  find(render(), 'soil-fixture-depth').props.onChange({ target: { value: '25' } });
  assert.match(renderToStaticMarkup(render()), />50 mm</);
  find(render(), 'soil-fixture-fc').props.onChange({ target: { value: '5' } });
  let html = renderToStaticMarkup(render());
  assert.match(html, /nicht kleiner/);
  assert.doesNotMatch(html, />50 mm<|NaN|Infinity/);
  find(render(), 'soil-fixture-fc').props.onChange({ target: { value: '' } });
  html = renderToStaticMarkup(render());
  assert.match(html, /alle drei Lernwerte/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});
