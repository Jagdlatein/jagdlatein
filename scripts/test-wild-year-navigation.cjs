const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { createLoader } = require('./helpers/project-module.cjs');
const load = createLoader();
const { wildYearSpecies, wildYearSources, getWildYearProfile } = load('lib/wild-year.js');
const { wildlifePhotographs } = load('lib/wildlife-photographs.js');
const { readWildYearSelection } = load('lib/wild-year-selection.js');
const file = 'components/WildYear.js';
const base = '/lernen/wildjahr';
const heading = h => h.nodes(node => node.props?.id === 'wildjahr-current')[0];
const range = h => h.nodes(node => node.type === 'input' && node.props.id === 'wildjahr-month')[0];
const species = h => h.nodes(node => node.type === 'select' && node.props.id === 'wildjahr-species')[0];
const pageMenu = h => h.nodes(node => node.type?.name === 'PageMenu')[0];
const alerts = h => h.nodes(node => node.props?.role === 'alert');
const chooseMonth = (h, month) => range(h).props.onChange({ target: { value: String(month) } });
const chooseSpecies = (h, slug) => species(h).props.onChange({ target: { value: slug } });
function address(query, hash = 'wildjahr-current') {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
  }
  return `${base}${params.size ? `?${params}` : ''}${hash ? `#${hash}` : ''}`;
}
function fixture(t, query = { art: 'gamswild', monat: '6' }, options = {}) {
  const h = setup(file, query, {
    ...options,
    props: options.props || { currentMonth: 10, initialSelection: readWildYearSelection(query, 10) },
    router: { asPath: address(query), ...options.router },
  });
  t.after(() => h.dispose());
  return h;
}
function history(h, query, hash = 'wildjahr-current') {
  h.router.asPath = address(query, hash);
  h.navigate(query);
}
function pendingRouter(h) {
  const requests = [];
  h.router.push = (href, as, options) => {
    const request = { href, as, options };
    h.calls.push({ href, options });
    requests.push(request);
    return new Promise((resolve, reject) => Object.assign(request, { resolve, reject }));
  };
  return requests;
}
async function commit(h, request, action) {
  history(h, request.href.query, request.href.hash);
  request.resolve(true);
  await action;
  h.render();
}
function focusProbe(h) {
  const calls = { focus: 0, scroll: 0 };
  heading(h).props.ref.current = {
    focus(options) { assert.deepEqual(options, { preventScroll: true }); calls.focus++; },
    scrollIntoView(options) { assert.deepEqual(options, { block: 'start', behavior: 'auto' }); calls.scroll++; },
  };
  return calls;
}
// Compare the actual React ancestor slots, types and keys, not newly created
// JSX object identities. This checks range retention without claiming device QA.
function mountPath(node, id, path = []) {
  if (Array.isArray(node)) {
    for (const [index, child] of node.entries()) {
      const result = mountPath(child, id, [...path, { slot: index }]);
      if (result) return result;
    }
    return null;
  }
  if (!node || typeof node !== 'object') return null;
  const next = [...path, { type: node.type, key: node.key }];
  return node.props?.id === id ? next : mountPath(node.props?.children, id, next);
}

test('All 120 views retain exact visible claims, immediate limits, photos and separately mapped closed final sources', t => {
  const h = fixture(t);
  let checked = 0;
  for (const animal of wildYearSpecies) for (let month = 1; month <= 12; month++) {
    history(h, { art: animal.slug, monat: String(month) });
    const expected = getWildYearProfile(animal.slug, month);
    const picture = wildlifePhotographs[animal.slug];
    assert.equal(text(heading(h)), `${animal.name} im ${expected.monthName}`);
    assert.equal(range(h).props.value, month);
    assert.equal(species(h).props.value, animal.slug);
    const cards = h.nodes(node => node.type === 'article');
    assert.equal(cards.length, 4);
    for (const [index, section] of expected.sections.entries()) {
      assert.equal(text(nodes(cards[index], node => node.type === 'h3')[0]), section.claim.title);
      assert.ok(text(cards[index]).includes(section.label));
      assert.ok(text(cards[index]).includes(section.claim.text));
      assert.equal(nodes(cards[index], node => node.type === 'details').length, 0, 'Knowledge remains visible');
    }
    const footer = h.nodes(node => node.type === 'details')[0];
    assert.ok(footer && !footer.props.open);
    assert.equal(text(nodes(footer, node => node.type === 'summary')[0]), 'Quellen und Bildnachweis');
    assert.ok(text(footer).includes(animal.reviewedOn));
    const sourceGroups = nodes(footer, node => node.type === 'section');
    assert.equal(sourceGroups.length, 4);
    for (const [index, section] of expected.sections.entries()) {
      assert.equal(text(nodes(sourceGroups[index], node => node.type === 'h3')[0]), `${section.label}: ${section.claim.title}`);
      assert.deepEqual(nodes(sourceGroups[index], node => node.type === 'a').map(node => ({ href: node.props.href, label: text(node) })),
        section.claim.sourceIds.map(id => ({ href: wildYearSources[id].url, label: wildYearSources[id].label })));
    }
    const credit = nodes(footer, node => node.type?.name === 'LearningPhotoCredit');
    assert.equal(credit.length, 1); assert.deepEqual(credit[0].props.media, picture);
    const image = h.nodes(node => node.props?.src === picture.src)[0];
    assert.ok(image); assert.equal(image.props.width, picture.width); assert.equal(image.props.height, picture.height);
    assert.equal(image.props.alt, `${picture.name}: dokumentarisches Artporträt, unabhängig vom ausgewählten Monat`);
    const shown = text(h.tree), beforeSources = shown.slice(0, shown.indexOf('Quellen und Bildnachweis'));
    for (const limitation of [animal.uncertainty,
      'Typische Phasen in Mitteleuropa. Wetter, Höhenlage, Alter und Individuum verschieben die Übergänge. Die Monatsbänder sind eine Orientierung.',
      'Artporträt zur Orientierung. Dieses Foto belegt weder den gewählten Monat noch eine Fortpflanzungsphase.',
      'Ein Tier zeigt nicht immer alle Merkmale der typischen Jahresphase. Beobachtungen am besten mit Datum, Ort und erkennbaren Merkmalen festhalten.']) assert.ok(beforeSources.includes(limitation));
    assert.equal(h.nodes(node => node.type === 'select').length, nodes(pageMenu(h), node => node.type === 'select').length);
    assert.equal(nodes(pageMenu(h), node => node.type === 'input' && node.props.type === 'range').length, 0);
    checked++;
  }
  assert.equal(checked, 120); assert.equal(h.calls.length, 0);
});

test('A real month push preserves committed text/photo until commit, carries context and keeps the same range without heading focus', async t => {
  const initial = { art: 'rehwild', monat: '6', ref: 'suche', q: 'Reh' };
  const h = fixture(t, initial), requests = pendingRouter(h), focus = focusProbe(h);
  const path = mountPath(h.tree, 'wildjahr-month');
  const photo = h.nodes(node => node.props?.src === wildlifePhotographs.rehwild.src)[0].props.src;
  const action = chooseMonth(h, 7); h.render();
  assert.deepEqual(requests[0].href, { pathname: base, query: { ...initial, monat: '7' }, hash: 'wildjahr-current' });
  assert.deepEqual(requests[0].options, { shallow: true, scroll: false }); assert.equal(requests[0].as, undefined);
  assert.equal(range(h).props.value, 6); assert.equal(text(heading(h)), 'Reh im Juni');
  assert.deepEqual(h.router.query, initial); assert.equal(focus.focus, 0);
  assert.equal(h.nodes(node => node.props?.src === photo).length, 1);
  await commit(h, requests[0], action);
  assert.equal(range(h).props.value, 7); assert.equal(text(heading(h)), 'Reh im Juli');
  assert.deepEqual(mountPath(h.tree, 'wildjahr-month'), path);
  assert.deepEqual(focus, { focus: 0, scroll: 0 });
});

test('Species commits and external History focus only their committed heading; reselecting a settled pair writes no extra stop', async t => {
  const h = fixture(t, { art: 'rehwild', monat: '6' }), requests = pendingRouter(h), focus = focusProbe(h);
  const action = chooseSpecies(h, 'rotwild'); h.render();
  assert.equal(text(heading(h)), 'Reh im Juni'); assert.equal(focus.focus, 0);
  assert.deepEqual(requests[0].href.query, { art: 'rotwild', monat: '6' });
  await commit(h, requests[0], action);
  assert.equal(text(heading(h)), 'Rothirsch im Juni'); assert.equal(focus.focus, 1);
  history(h, { art: 'rehwild', monat: '6' }); assert.equal(focus.focus, 2);
  history(h, { art: 'rotwild', monat: '6' }); assert.equal(focus.focus, 3);
  await chooseMonth(h, 6); h.render(); assert.equal(h.calls.length, 1); assert.equal(focus.focus, 3);
  await chooseSpecies(h, 'rotwild'); h.render(); assert.equal(h.calls.length, 1); assert.equal(focus.focus, 4);
  const reload = fixture(t, h.router.query); assert.equal(text(heading(reload)), 'Rothirsch im Juni');
});

test('Overlapping month/species actions combine with the displayed other field, never an uncommitted target', async t => {
  for (const order of ['month-first', 'species-first']) {
    const h = fixture(t, { art: 'gamswild', monat: '6' }), requests = pendingRouter(h), focus = focusProbe(h);
    const first = order === 'month-first' ? chooseMonth(h, 7) : chooseSpecies(h, 'rehwild');
    h.render();
    const second = order === 'month-first' ? chooseSpecies(h, 'rehwild') : chooseMonth(h, 7);
    h.render();
    assert.deepEqual(requests[1].href.query, order === 'month-first' ? { art: 'rehwild', monat: '6' } : { art: 'gamswild', monat: '7' });
    assert.equal(species(h).props.value, 'gamswild'); assert.equal(range(h).props.value, 6);
    await commit(h, requests[1], second);
    requests[0].reject(new Error('older request failed')); await first; h.render();
    assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 0);
    assert.equal(species(h).props.value, order === 'month-first' ? 'rehwild' : 'gamswild');
    assert.equal(range(h).props.value, order === 'month-first' ? 6 : 7);
    assert.equal(focus.focus, order === 'month-first' ? 1 : 0);
  }
});

test('Reselecting the displayed month cancels another pending month even after an older request has settled', async t => {
  const h = fixture(t), requests = pendingRouter(h), focus = focusProbe(h);
  const first = chooseMonth(h, 7), second = chooseMonth(h, 8);
  requests[0].reject(Object.assign(new Error('cancelled'), { cancelled: true })); await first; h.render();
  const current = chooseMonth(h, 6); h.render();
  assert.equal(requests.length, 3); assert.deepEqual(requests[2].href.query, { art: 'gamswild', monat: '6' });
  requests[1].reject(new Error('superseded')); await second; h.render();
  await commit(h, requests[2], current);
  assert.equal(range(h).props.value, 6); assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 0);
  assert.equal(focus.focus, 0);
});

test('Real failure leaves the committed selection intact; cancellation and false-return transitions stay silent and clear focus intent', async t => {
  const initial = { art: 'rehwild', monat: '6' }, h = fixture(t, initial), requests = pendingRouter(h), focus = focusProbe(h);
  const failure = chooseSpecies(h, 'rotwild'); requests[0].reject(new Error('offline')); await failure; h.render();
  assert.deepEqual(h.router.query, initial); assert.equal(text(heading(h)), 'Reh im Juni');
  assert.equal(alerts(h).length, 1); assert.match(text(alerts(h)[0]), /Auswahl konnte nicht geöffnet werden/);
  assert.equal(h.menu.opened, 1); assert.equal(focus.focus, 0);
  const cancelled = chooseMonth(h, 7); requests[1].reject(Object.assign(new Error('cancelled'), { cancelled: true })); await cancelled; h.render();
  assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 1); assert.equal(focus.focus, 0);
  const refused = chooseMonth(h, 7); requests[2].resolve(false); await refused; h.render();
  assert.equal(alerts(h).length, 0); assert.equal(range(h).props.value, 6);
  history(h, { art: 'rehwild', monat: '7' });
  assert.equal(focus.focus, 1, 'An unrelated subsequent History commit cannot inherit a refused slider intent');
});

test('External History, hash/context changes and an away-and-back visit invalidate old failure and old input callbacks', async t => {
  const initial = { art: 'gamswild', monat: '6' };
  for (const visits of [
    [{ art: 'rehwild', monat: '4' }],
    [{ art: 'rehwild', monat: '4' }, initial],
    [{ ...initial, ref: 'anderer-einstieg' }],
  ]) {
    const h = fixture(t, initial), requests = pendingRouter(h), focus = focusProbe(h);
    const stale = species(h).props.onChange;
    const action = chooseMonth(h, 7);
    for (const query of visits) history(h, query);
    const focused = focus.focus;
    requests[0].reject(new Error('late failure')); await action; h.render();
    assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 0); assert.equal(focus.focus, focused);
    await stale({ target: { value: 'rotwild' } }); h.render();
    assert.equal(requests.length, 1, 'A departed selector cannot navigate again, including after return to equal values');
    assert.deepEqual(h.router.query, visits.at(-1));
  }
  const h = fixture(t, initial), requests = pendingRouter(h), focus = focusProbe(h);
  const action = chooseMonth(h, 7); history(h, initial, 'anderer-anker');
  const focused = focus.focus; requests[0].reject(new Error('late after hash')); await action; h.render();
  assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 0); assert.equal(focus.focus, focused);
});

test('Unmount rejects stale range/species handlers and late errors without focus, menu or URL work', async t => {
  const h = fixture(t), requests = pendingRouter(h), focus = focusProbe(h);
  const staleRange = range(h).props.onChange, staleSpecies = species(h).props.onChange;
  const action = chooseMonth(h, 7); h.dispose(); requests[0].reject(new Error('late after unmount')); await action; h.render();
  await staleRange({ target: { value: '8' } }); await staleSpecies({ target: { value: 'rehwild' } }); h.render();
  assert.equal(requests.length, 1); assert.equal(alerts(h).length, 0); assert.equal(h.menu.opened, 0); assert.equal(focus.focus, 0);
});

test('Invalid-link picker timers cannot outlive a valid commit or unmount; repair preserves the valid other field', async t => {
  const h = fixture(t, { art: 'missing', monat: '7', ref: 'suche' }), requests = pendingRouter(h);
  assert.equal(heading(h), undefined); assert.equal(pageMenu(h).props.openInitially, true);
  const repair = chooseSpecies(h, 'rehwild');
  assert.deepEqual(requests[0].href.query, { art: 'rehwild', monat: '7', ref: 'suche' });
  await commit(h, requests[0], repair); await new Promise(resolve => setTimeout(resolve, 1));
  assert.equal(h.menu.opened, 0); assert.equal(text(heading(h)), 'Reh im Juli');
  const disposed = fixture(t, { art: 'missing', monat: '7' }); disposed.dispose();
  await new Promise(resolve => setTimeout(resolve, 1)); assert.equal(disposed.menu.opened, 0);
  const month = fixture(t, { art: 'rotwild', monat: ['6', '7'] }), monthRequests = pendingRouter(month);
  const monthRepair = month.nodes(node => node.props?.id === 'wildjahr-repair-month')[0].props.onChange({ target: { value: '9' } });
  assert.deepEqual(monthRequests[0].href.query, { art: 'rotwild', monat: '9' });
  await commit(month, monthRequests[0], monthRepair); assert.equal(text(heading(month)), 'Rothirsch im September');
});

test('The server-selected view stays unchanged while unready and controls cannot navigate before authoritative readiness', async t => {
  const server = { currentMonth: 10, initialSelection: { slug: 'rotwild', month: 11 } };
  const h = fixture(t, { art: 'rehwild', monat: '4' }, { ready: false, props: server }), requests = pendingRouter(h);
  assert.equal(text(heading(h)), 'Rothirsch im November'); assert.equal(range(h).props.disabled, true); assert.equal(species(h).props.disabled, true);
  await chooseMonth(h, 7); await chooseSpecies(h, 'gamswild'); h.render(); assert.equal(requests.length, 0);
  assert.equal(pageMenu(h).props.openInitially, false);
  h.router.isReady = true; h.render(); assert.equal(text(heading(h)), 'Reh im April');
  history(h, { art: 'rotwild', monat: '11' }); assert.equal(text(heading(h)), 'Rothirsch im November');
  history(h, {}); assert.equal(range(h).props.value, 10); assert.equal(species(h).props.value, 'gamswild');
});
