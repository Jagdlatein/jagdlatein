const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, local } = require('./helpers/project-module.cjs');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const load = createLoader({ '../../components/WildYear': { __esModule: true, default: () => null } });
const page = load('pages/lernen/wildjahr.js');
const { readWildYearSelection } = load('lib/wild-year-selection.js');
const input = h => h.nodes(n => n.type === 'input' && n.props.id === 'wildjahr-month')[0];
const heading = h => h.nodes(n => n.props.id === 'wildjahr-current')[0];
const picker = h => h.nodes(n => n.type?.name === 'WildYearSpeciesPicker')[0];
const choices = h => {
  const child = picker(h);
  return child ? nodes(child.type(child.props), n => n.type === 'button' && n.props['data-wildjahr-species']) : [];
};
const props = (query, currentMonth = 10) => ({ currentMonth, initialSelection: readWildYearSelection(query, currentMonth) });

test('The server calendar follows Zurich month boundaries, including summer time and New Year', () => {
  for (const [iso, expected] of [
    ['2026-09-30T21:59:59Z', 9], ['2026-09-30T22:00:00Z', 10],
    ['2026-12-31T22:59:59Z', 12], ['2026-12-31T23:00:00Z', 1],
    ['2026-03-31T21:59:59Z', 3], ['2026-03-31T22:00:00Z', 4],
    ['2026-10-31T22:59:59Z', 10], ['2026-10-31T23:00:00Z', 11],
  ]) assert.equal(page.currentWildYearMonth(new Date(iso)), expected, iso);
  const result = page.getServerSideProps();
  assert.deepEqual(Object.keys(result.props), ['currentMonth', 'initialSelection', 'annualOverview']);
  assert.equal(result.props.annualOverview, null);
  assert.ok(result.props.currentMonth >= 1 && result.props.currentMonth <= 12);
  assert.deepEqual(result.props.initialSelection, { slug: null, month: result.props.currentMonth });
  assert.deepEqual(page.getServerSideProps({ query: { art: 'rehwild', monat: '4' } }).props.initialSelection, { slug: 'rehwild', month: 4 });
});

test('Server HTML and first hydration retain the same request selection before router readiness', () => {
  for (const query of [{ art: 'gamswild' }, { art: 'rehwild', monat: '4' }, { art: 'rotwild', monat: '11' }]) {
    const requestProps = page.getServerSideProps({ query }).props;
    const h = setup('components/WildYear.js', {}, { ready: false, props: requestProps });
    assert.equal(input(h).props.value, requestProps.initialSelection.month);
    assert.equal(picker(h).props.selectedSlug, requestProps.initialSelection.slug);
    assert.equal(choices(h).filter(button => button.props['aria-pressed']).length, 1);
    assert.equal(choices(h).find(button => button.props['aria-pressed']).props['data-wildjahr-species'], requestProps.initialSelection.slug);
    assert.equal(input(h).props.disabled, true);
    const renderLoad = createLoader({
      'next/router': { useRouter: () => ({ isReady: false, query: {} }) },
      'next/image': ({ priority, ...rest }) => React.createElement('img', rest),
      './LearningToolLayout': { __esModule: true, default: ({ children }) => React.createElement('main', null, children) },
      './PageMenu': { __esModule: true, default: () => null, openPageMenu() {}, closePageMenu() {} },
      './LearningPhoto': { LearningPhotoCredit: () => null },
    });
    const html = renderToStaticMarkup(React.createElement(renderLoad('components/WildYear.js').default, requestProps));
    assert.match(html, new RegExp(`value="${requestProps.initialSelection.month}"`));
    assert.match(html, /id="wildjahr-current"/);
    h.router.isReady = true; h.navigate(query);
    assert.equal(input(h).props.value, requestProps.initialSelection.month);
    h.dispose();
  }
});

test('Explicit malformed, repeated or out-of-range month/species links show a chooser, not an unrelated phase', () => {
  for (const monat of ['', ' ', '0', '13', '-1', '2.5', '1e1', 'foo', ['4', '5'], ['4'], true, null]) {
    const query = { art: 'rehwild', monat };
    const requestProps = page.getServerSideProps({ query }).props;
    assert.equal(requestProps.initialSelection.month, null);
    const h = setup('components/WildYear.js', query, { props: requestProps });
    assert.equal(heading(h), undefined, JSON.stringify(monat));
    assert.match(text(h.tree), /Diese Auswahl ist nicht verfügbar/);
    assert.match(text(h.tree), /Wähle eine Wildart unten im Menü/);
    assert.match(text(h.tree), /Monat passt du danach mit dem Balken an/);
    assert.equal(h.nodes(node => node.type === 'select').length, 0, 'An invalid month is repaired by the explicit species choice, not another month picker');
    h.dispose();
  }
  for (const art of ['', 'unknown', ['rehwild'], ['rehwild', 'rotwild'], null]) {
    const h = setup('components/WildYear.js', { art, monat: '7' }, { props: props({ art, monat: '7' }) });
    assert.equal(heading(h), undefined); h.dispose();
  }
  assert.deepEqual(readWildYearSelection({ monat: ' 04 ' }, 10), { slug: null, month: 4 });
});

test('A ready router and History are authoritative, including removal back to the server calendar month', async () => {
  const h = setup('components/WildYear.js', { art: 'rehwild', monat: '4', ref: 'suche' }, { props: props({ art: 'rehwild', monat: '4' }) });
  await input(h).props.onChange({ target: { value: '7' } }); h.render();
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].href.query.monat, '7');
  assert.equal(h.calls[0].href.query.ref, 'suche'); assert.equal(input(h).props.value, 7);
  h.navigate({ art: 'rotwild', monat: '11' }); assert.equal(input(h).props.value, 11); assert.match(text(heading(h)), /Rothirsch/);
  h.navigate({ art: 'rehwild', monat: '4' }); assert.equal(input(h).props.value, 4); assert.match(text(heading(h)), /Reh/);
  h.navigate({}); assert.equal(input(h), undefined); assert.equal(heading(h), undefined);
  assert.match(text(h.tree), /Wähle zuerst eine Wildart/);
  h.navigate({ art: 'gamswild' }); assert.equal(input(h).props.value, 10); assert.match(text(heading(h)), /Gams/);
  h.navigate({ art: 'gamswild', monat: '11' }); assert.equal(input(h).props.value, 11);
  h.navigate({ monat: 'invalid' }); assert.equal(heading(h), undefined);
  h.dispose();
});

test('An unready client without server selection cannot flash a default animal or write a URL', async () => {
  const h = setup('components/WildYear.js', { art: 'rehwild', monat: '7' }, { ready: false, props: {} });
  assert.equal(heading(h), undefined); assert.match(text(h.tree), /wird geladen/);
  assert.ok(choices(h).every(button => button.props.disabled));
  await picker(h).props.onSelect('rotwild');
  assert.equal(h.calls.length, 0);
  h.router.isReady = true; h.render(); assert.equal(input(h).props.value, 7); assert.match(text(heading(h)), /Reh/); h.dispose();
});
