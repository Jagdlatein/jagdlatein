const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./helpers/project-module.cjs');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const load = createLoader();
const { wildYearSpecies, wildYearSources, wildYearSearchEntries, getWildYearProfile } = load('lib/wild-year.js');
const { getWildYearTransition } = load('lib/wild-year-transition.js');
const preview = h => h.nodes(node => node.type?.name === 'WildYearNextMonth');
function commit(h, query) {
  h.router.asPath = `/lernen/wildjahr?${new URLSearchParams(query)}#wildjahr-top`;
  h.navigate(query);
}

test('The real parent includes the next-month text before overview, practice and the one closed final footer for all 384 monthly views', t => {
  const h = setup('components/WildYear.js', { art: 'rehwild', monat: '1' }, { props: { currentMonth: 10 } });
  t.after(() => h.dispose());
  let checked = 0;
  for (const species of wildYearSpecies) for (let month = 1; month <= 12; month++) {
    commit(h, { art: species.slug, monat: String(month) });
    const child = preview(h);
    assert.equal(child.length, 1);
    assert.deepEqual(child[0].props, { speciesSlug: species.slug, month });
    const projected = child[0].type(child[0].props);
    const sequence = h.nodes(() => true);
    const footer = h.nodes(node => node.type === 'details')[0];
    for (const name of ['WildYearOverview', 'WildYearPractice']) {
      const later = h.nodes(node => node.type?.name === name)[0];
      assert.ok(sequence.indexOf(child[0]) < sequence.indexOf(later));
      assert.ok(sequence.indexOf(later) < sequence.indexOf(footer));
    }
    assert.equal(footer.props.open, undefined);
    const evidence = nodes(footer, node => node.props?.['data-wild-year-claim']);
    const authored = ['coat', 'crown', 'reproduction', 'behavior'].flatMap(key => species[key]);
    assert.equal(evidence.length, authored.length);
    assert.equal(new Set(evidence.map(node => node.props['data-wild-year-claim'])).size, authored.length);
    for (const change of getWildYearTransition(species.slug, month).changes) {
      assert.ok(text(projected).includes(change.toClaim.text));
      const group = evidence.find(node => node.props['data-wild-year-claim'] === change.toClaim.id);
      assert.ok(group);
      assert.deepEqual(nodes(group, node => node.type === 'a').map(node => node.props.href), change.toClaim.sourceIds.map(id => wildYearSources[id].url));
    }
    assert.equal(nodes(projected, node => ['a', 'button', 'input', 'select', 'dialog'].includes(node.type)).length, 0);
    checked++;
  }
  assert.equal(checked, 384);
});

test('The preview follows committed URL content through failure, pending work and History rather than displaying an intended month early', async t => {
  const h = setup('components/WildYear.js', { art: 'wildkatze', monat: '3' }, { props: { currentMonth: 10 } });
  t.after(() => h.dispose());
  let reject, resolve;
  h.router.push = () => new Promise((yes, no) => { resolve = yes; reject = no; });
  const choose = month => h.nodes(node => node.props?.id === 'wildjahr-month')[0].props.onChange({ target: { value: String(month) } });
  const before = text(preview(h)[0].type(preview(h)[0].props));
  const failure = choose(4); h.render();
  assert.equal(text(preview(h)[0].type(preview(h)[0].props)), before);
  reject(new Error('isolated refusal')); await failure; h.render();
  assert.equal(text(preview(h)[0].type(preview(h)[0].props)), before);
  const accepted = choose(4); h.render();
  assert.equal(preview(h)[0].props.month, 3);
  commit(h, { art: 'wildkatze', monat: '4' }); resolve(true); await accepted; h.render();
  assert.equal(preview(h)[0].props.month, 4);
  assert.equal(text(h.nodes(node => node.props?.id === 'wildjahr-current')[0]), `${getWildYearProfile('wildkatze', 4).species.name} im April`);
  commit(h, { art: 'eichhoernchen', monat: '12' });
  const last = preview(h)[0];
  assert.deepEqual(last.props, { speciesSlug: 'eichhoernchen', month: 12 });
  assert.match(text(last.type(last.props)), /Dezember und Januar/);
  commit(h, { art: 'wildkatze', monat: '3' });
  assert.equal(text(preview(h)[0].type(preview(h)[0].props)), before);
});

test('Unready, bare, repeated and unknown selections and an overview-only species never show a borrowed next-month model', t => {
  for (const [query, ready] of [[{ art: 'rehwild', monat: '1' }, false], [{}, true], [{ art: ['wildkatze', 'rehwild'] }, true], [{ art: 'unknown' }, true], [{ art: 'wolf', monat: '3' }, true]]) {
    const h = setup('components/WildYear.js', query, { ready, props: { currentMonth: 10 } });
    t.after(() => h.dispose());
    assert.equal(preview(h).length, 0);
    assert.equal(h.calls.length, 0);
  }
});

test('The two added monthly calendars use their own learning search terms without borrowed deer terminology', () => {
  for (const [slug, terms] of [['wildkatze', ['Ranz', 'Ersatzwürfe']], ['eichhoernchen', ['Kobel', 'Nesthocker']]]) {
    const entry = wildYearSearchEntries.find(item => item.speciesSlug === slug);
    for (const term of terms) assert.ok(entry.keywords.includes(term));
    assert.ok(!entry.keywords.includes('Brunft'));
    assert.ok(!entry.keywords.includes('Setzzeit'));
    assert.equal(entry.href, `/lernen/wildjahr?art=${slug}`);
  }
});
