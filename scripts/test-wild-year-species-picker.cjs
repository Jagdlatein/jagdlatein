const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader();
const Picker = load('components/WildYearSpeciesPicker.js').default;
const { wildYearCatalog } = load('lib/wild-year-catalog.js');
const buttons = tree => nodes(tree, node => node.type === 'button' && node.props['data-wildjahr-species']);

test('The actual species picker presents every canonical species once as short grouped buttons without another selection window or search', () => {
  const tree = Picker({ selectedSlug: null, disabled: false, onSelect() {} });
  const choices = buttons(tree);
  assert.equal(choices.length, wildYearCatalog.length);
  assert.equal(new Set(choices.map(button => button.props['data-wildjahr-species'])).size, wildYearCatalog.length);
  const groups = [...new Set(wildYearCatalog.map(entry => entry.group))];
  assert.deepEqual(choices.map(button => button.props['data-wildjahr-species']), groups.flatMap(group => wildYearCatalog.filter(entry => entry.group === group).map(entry => entry.slug)));
  for (const entry of wildYearCatalog) {
    const button = choices.find(choice => choice.props['data-wildjahr-species'] === entry.slug);
    assert.equal(text(button), entry.name, entry.slug);
    assert.equal(button.props.type, 'button');
    assert.equal(button.props.disabled, false);
    assert.equal(button.props['aria-pressed'], false);
  }
  assert.deepEqual(nodes(tree, node => /^h[2-6]$/.test(node.type)).map(text), groups);
  assert.equal(nodes(tree, node => ['select', 'option', 'input', 'dialog', 'details', 'form', 'a', 'img'].includes(node.type)).length, 0);
  const html = renderToStaticMarkup(React.createElement(Picker, { selectedSlug: null, disabled: false }));
  assert.equal((html.match(/<button\b/g) || []).length, wildYearCatalog.length);
  assert.doesNotMatch(html, /<select|<dialog|<details|<form|<input|<img/);
});

test('Each real species button delegates only its own canonical slug; selection is committed by the parent rather than changed locally', () => {
  const selected = 'rehwild', calls = [];
  const tree = Picker({ selectedSlug: selected, disabled: false, onSelect(slug) { calls.push(slug); } });
  for (const button of buttons(tree)) {
    assert.equal(button.props['aria-pressed'], button.props['data-wildjahr-species'] === selected);
    button.props.onClick();
  }
  assert.deepEqual(calls, buttons(tree).map(button => button.props['data-wildjahr-species']));
  assert.equal(buttons(tree).filter(button => button.props['aria-pressed']).length, 1, 'Clicks do not optimistically alter the committed selection');
  assert.equal(buttons(tree).find(button => button.props['aria-pressed']).props['data-wildjahr-species'], selected);
  const changed = Picker({ selectedSlug: 'wolf', disabled: false });
  assert.equal(buttons(changed).find(button => button.props['aria-pressed']).props['data-wildjahr-species'], 'wolf');
});

test('An unready picker disables every native species button in both its actual tree and server HTML', () => {
  const tree = Picker({ selectedSlug: 'rehwild', disabled: true, onSelect() {} });
  assert.ok(buttons(tree).every(button => button.props.disabled));
  assert.equal(buttons(tree).filter(button => button.props['aria-pressed']).length, 1);
  const html = renderToStaticMarkup(React.createElement(Picker, { selectedSlug: 'rehwild', disabled: true }));
  assert.equal((html.match(/\bdisabled=""/g) || []).length, wildYearCatalog.length);
  assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1);
});
