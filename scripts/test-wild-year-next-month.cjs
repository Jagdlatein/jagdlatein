const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader();
const { wildYearSpecies, wildYearSources, getWildYearProfile } = load('lib/wild-year.js');
const { getWildYearTransition } = load('lib/wild-year-transition.js');
const NextMonth = load('components/WildYearNextMonth.js').default;

test('Every authored species/month transition projects exactly the changed field phases, original text and precise evidence without modifying the model', () => {
  const original = JSON.stringify(wildYearSpecies);
  let checked = 0, changed = 0, unchanged = 0;
  for (const species of wildYearSpecies) for (let month = 1; month <= 12; month++) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const from = getWildYearProfile(species.slug, month), to = getWildYearProfile(species.slug, nextMonth);
    const expected = from.sections.filter(section => section.claim.id !== to.sections.find(next => next.key === section.key).claim.id);
    const actual = getWildYearTransition(species.slug, month);
    assert.deepEqual(Object.keys(actual).sort(), ['speciesSlug', 'speciesName', 'fromMonth', 'fromMonthName', 'toMonth', 'toMonthName', 'cyclicYearBoundary', 'changes'].sort());
    assert.equal(actual.speciesSlug, species.slug); assert.equal(actual.speciesName, species.name);
    assert.equal(actual.fromMonth, month); assert.equal(actual.toMonth, nextMonth);
    assert.equal(actual.fromMonthName, from.monthName); assert.equal(actual.toMonthName, to.monthName);
    assert.equal(actual.cyclicYearBoundary, month === 12);
    assert.deepEqual(actual.changes.map(change => change.key), expected.map(section => section.key));
    for (const [index, change] of actual.changes.entries()) {
      const next = to.sections.find(section => section.key === change.key);
      assert.ok(typeof change.label === 'string' && change.label.length > 0);
      assert.equal(change.label, expected[index].label); assert.equal(change.label, next.label);
      assert.equal(change.fromClaim, expected[index].claim);
      assert.equal(change.toClaim, next.claim);
      assert.notEqual(change.fromClaim.id, change.toClaim.id);
      for (const claim of [change.fromClaim, change.toClaim]) for (const id of claim.sourceIds) assert.ok(wildYearSources[id], `${species.slug}/${claim.id}/${id}`);
    }
    if (actual.changes.length) changed++; else unchanged++;
    checked++;
  }
  assert.equal(checked, wildYearSpecies.length * 12);
  assert.ok(changed > 0 && unchanged > 0, 'Both actual transitions and unchanged model bands are covered');
  assert.equal(JSON.stringify(wildYearSpecies), original);
});

test('The actual component displays exact next-phase explanations only for changed fields, with no controls or intervening source links', () => {
  for (const species of wildYearSpecies) for (let month = 1; month <= 12; month++) {
    const transition = getWildYearTransition(species.slug, month);
    const tree = NextMonth({ speciesSlug: species.slug, month });
    assert.equal(tree.props.id, 'wildjahr-next-month');
    assert.equal(text(nodes(tree, node => node.type === 'h2')[0]), 'Nächster Monat');
    const articles = nodes(tree, node => node.type === 'article');
    assert.equal(articles.length, transition.changes.length);
    assert.ok(text(tree).includes(`${species.name}: ${transition.fromMonthName} → ${transition.toMonthName}`));
    assert.ok(text(tree).includes('Er sagt keine Veränderung bei einem einzelnen Tier voraus.'));
    for (const [index, article] of articles.entries()) {
      const change = transition.changes[index];
      assert.equal(article.props['data-wild-year-transition'], change.key);
      assert.equal(article.props['data-wild-year-from-claim'], change.fromClaim.id);
      assert.equal(article.props['data-wild-year-to-claim'], change.toClaim.id);
      assert.equal(text(nodes(article, node => node.type === 'h3')[0]), `${transition.toMonthName}: ${change.toClaim.title}`);
      assert.deepEqual(nodes(article, node => node.type === 'p').map(text), [change.label, `${transition.fromMonthName}: ${change.fromClaim.title}`, change.toClaim.text]);
    }
    if (!articles.length) {
      assert.ok(text(tree).includes('ordnet dieses Modell dieselben Phasen zu.'));
      assert.ok(text(tree).includes('Daraus folgt nicht, dass sich draußen nichts verändert.'));
    }
    assert.equal(nodes(tree, node => ['button', 'input', 'select', 'form', 'dialog', 'details', 'a', 'img', 'video'].includes(node.type)).length, 0);
  }
});

test('December always wraps to January as a cyclic model comparison, including species with unchanged December phases', () => {
  for (const species of wildYearSpecies) {
    const transition = getWildYearTransition(species.slug, 12);
    assert.equal(transition.toMonth, 1); assert.equal(transition.toMonthName, 'Januar'); assert.equal(transition.cyclicYearBoundary, true);
    const html = renderToStaticMarkup(React.createElement(NextMonth, { speciesSlug: species.slug, month: 12 }));
    assert.match(html, /Dezember und Januar werden als benachbarte Monate des wiederkehrenden Jahresmodells verglichen/);
    assert.doesNotMatch(html, /<button|<input|<select|<a |<details|<dialog/);
    const other = NextMonth({ speciesSlug: species.slug, month: 11 });
    assert.ok(!text(other).includes('Dezember und Januar werden als benachbarte Monate'));
  }
});

test('Missing, unknown, overview-only, repeated and invalid values never receive fallback Gams or January content', () => {
  for (const slug of [undefined, null, '', 'unknown', 'wolf', 'constructor', '__proto__', ['rehwild'], ['rehwild', 'rotwild'], {}, true]) {
    assert.equal(getWildYearTransition(slug, 6), null, JSON.stringify(slug));
    assert.equal(NextMonth({ speciesSlug: slug, month: 6 }), null);
  }
  for (const month of [undefined, null, '', '6', ['6'], ['6', '7'], 0, 13, -1, 1.5, NaN, Infinity, true, {}]) {
    assert.equal(getWildYearTransition('rehwild', month), null, String(month));
    assert.equal(NextMonth({ speciesSlug: 'rehwild', month }), null);
  }
  assert.equal(getWildYearTransition(), null);
});

test('Identical validated selection renders identical server and client markup without browser state or time', () => {
  const oldWindow = global.window;
  try {
    for (const [speciesSlug, month] of [['rehwild', 7], ['rotwild', 8], ['biber', 12], ['stockente', 3], ['hermelin', 10]]) {
      delete global.window;
      const server = renderToStaticMarkup(React.createElement(NextMonth, { speciesSlug, month }));
      global.window = { location: { hash: '#wildjahr-top', search: `?art=${speciesSlug}&monat=${month}` } };
      const client = renderToStaticMarkup(React.createElement(NextMonth, { speciesSlug, month }));
      assert.equal(client, server);
    }
  } finally { if (oldWindow === undefined) delete global.window; else global.window = oldWindow; }
});
