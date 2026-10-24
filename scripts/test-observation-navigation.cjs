const test = require('node:test');
const assert = require('node:assert/strict');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const { createLoader } = require('./helpers/project-module.cjs');
const { observationCases: cases } = createLoader()('lib/observation-workshop.js');
const file = 'components/ObservationWorkshop.js';
const menu = h => h.nodes(node => node.type?.name === 'PageMenu')[0];
const title = h => h.nodes(node => node.props?.id === 'beobachtung-fall')[0]?.props.children;
const body = h => h.nodes(node => node.props?.id === 'beobachtung-inhalt')[0];
const choose = (h, id) => h.nodes(node => node.type === 'select' && node.props.id === 'beobachtung-case')[0].props.onChange({ target: { value: id } });
const button = (h, label) => { const node = h.nodes(node => node.type === 'button' && text(node) === label)[0]; assert.ok(node, label); return node; };
function fixture(t, query, options) { const h = setup(file, query, options); t.after(() => h.dispose()); return h; }

test('A bare workshop starts the first case, while explicit invalid IDs never substitute unrelated content', t => {
  const first = fixture(t, {});
  assert.equal(title(first), cases[0].title);
  for (const value of ['missing', '', null, [cases[0].id], [cases[0].id, cases[1].id]]) {
    const h = fixture(t, { eintrag: value });
    assert.equal(title(h), undefined); assert.equal(menu(h).props.openInitially, true);
    assert.match(text(body(h)), /nicht verfügbar/);
    assert.ok(!text(body(h)).includes(cases[0].stages[0].evidence));
    assert.equal(h.nodes(node => node.type === 'select')[0].props.value, '');
  }
});

test('Every old case link shows its own initial learning text with search, categories and reset confined to the lower menu', t => {
  const h = fixture(t, {});
  assert.equal(nodes(body(h), node => ['select', 'input'].includes(node.type)).length, 0);
  assert.equal(nodes(menu(h), node => node.type === 'input' && node.props.type === 'search').length, 1);
  assert.ok(nodes(menu(h), node => node.type === 'optgroup').length > 1);
  for (const entry of cases) {
    h.navigate({ eintrag: entry.id });
    assert.equal(title(h), entry.title);
    assert.ok(text(body(h)).includes(entry.stages[0].evidence));
    assert.ok(!text(body(h)).includes(entry.stages[1].evidence));
    assert.ok(text(body(h)).includes(entry.stages[0].question));
    assert.match(text(body(h)), /ausdrücklich konstruierte Lernbeispiele/);
    assert.match(text(body(h)), /Bei einem echten Notfall hat die zuständige Fachhilfe Vorrang/);
    const source = nodes(body(h), node => node.type === 'details').at(-1);
    assert.equal(!!source.props.open, false); assert.match(text(source), /4\. Oktober 2026/);
    for (const citation of entry.sources) assert.ok(nodes(source, node => node.type === 'a' && node.props.href === citation.url).length);
    assert.ok(nodes(source, node => node.props?.href === '/jagdrecht').length);
  }
  assert.equal(h.calls.length, 0);
});

test('Search keeps the current case selected; a choice waits for a committed URL, creates history and focuses matching content', async t => {
  const h = fixture(t, { eintrag: cases[0].id, retained: 'yes' });
  let focused = 0, scrolled = 0, complete;
  h.nodes(node => node.props?.id === 'beobachtung-fall')[0].props.ref.current = { focus() { focused++; }, scrollIntoView() { scrolled++; } };
  h.input('zz-no-result');
  assert.equal(h.calls.length, 0); assert.equal(title(h), cases[0].title);
  assert.equal(h.nodes(node => node.type === 'select')[0].props.value, cases[0].id);
  assert.ok(h.nodes(node => node.type === 'option' && node.props.value === cases[0].id).length);
  h.click('Suche zurücksetzen');
  h.router.push = (href, as, options) => { h.calls.push({ href, options }); return new Promise(resolve => { complete = resolve; }); };
  const pending = choose(h, cases[1].id); h.render();
  assert.equal(title(h), cases[0].title); assert.equal(focused, 0);
  assert.deepEqual(h.calls[0], { href: { pathname: '/lernen/beobachtungswerkstatt', query: { eintrag: cases[1].id, retained: 'yes' }, hash: 'beobachtung-fall' }, options: { shallow: true, scroll: false } });
  h.navigate(h.calls[0].href.query); complete(true); await pending; h.render();
  assert.equal(title(h), cases[1].title); assert.equal(focused, 1); assert.equal(scrolled, 1);
  h.navigate({ eintrag: cases[0].id }); assert.equal(title(h), cases[0].title);
  h.navigate(h.calls[0].href.query); assert.equal(title(h), cases[1].title);
  const reload = fixture(t, h.calls[0].href.query); assert.equal(title(reload), cases[1].title);
});

test('Hydration defers defaults, history and picker effects until the actual incoming case is known', async t => {
  const h = fixture(t, {}, { ready: false });
  assert.equal(title(h), undefined); assert.equal(menu(h).props.openInitially, false);
  assert.match(text(body(h)), /vorbereitet/);
  await choose(h, cases[1].id); assert.equal(h.calls.length, 0);
  h.router.isReady = true; h.navigate({ eintrag: cases[2].id });
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(title(h), cases[2].title); assert.equal(h.menu.opened, 0);
  const pushes = h.calls.length; await choose(h, 'missing'); assert.equal(h.calls.length, pushes);
});

test('The full round keeps 24 explanations, blocks double/stale actions and resets only the current case stage without changing its URL', async t => {
  const h = fixture(t, {});
  let oldReset;
  for (const entry of cases) {
    await choose(h, entry.id); h.render();
    for (const [index, stage] of entry.stages.entries()) {
      const stale = button(h, stage.choices[stage.answer]).props.onClick;
      stale(); stale(); h.render();
      assert.ok(text(body(h)).includes(stage.explanation));
      oldReset ||= button(h, 'Alle acht Fälle neu beginnen').props.onClick;
      if (index < entry.stages.length - 1) {
        const next = button(h, 'Nächste Information aufdecken').props.onClick;
        next(); next(); h.render();
        assert.ok(text(body(h)).includes(entry.stages[index + 1].question));
        stale(); h.render();
      }
    }
  }
  assert.match(text(menu(h)), /24 von 24 Entscheidungen beantwortet · 24 richtig/);
  oldReset(); h.render(); assert.match(text(menu(h)), /24 von 24/);
  const query = { ...h.router.query };
  const reset = button(h, 'Alle acht Fälle neu beginnen').props.onClick;
  h.click('Alle acht Fälle neu beginnen');
  assert.deepEqual(h.router.query, query); assert.equal(title(h), cases.at(-1).title);
  assert.match(text(menu(h)), /0 von 24 Entscheidungen/);
  assert.ok(text(body(h)).includes(cases.at(-1).stages[0].question));
  h.click(cases.at(-1).stages[0].choices[cases.at(-1).stages[0].answer]);
  reset(); h.render(); assert.match(text(menu(h)), /1 von 24 Entscheidungen/);
});

test('Returning through history resets revealed information and rejects handlers from the earlier identical case view', t => {
  const h = fixture(t, { eintrag: cases[0].id }); const stage = cases[0].stages[0];
  const staleAnswer = button(h, stage.choices[stage.answer]).props.onClick;
  h.click(stage.choices[stage.answer]);
  const staleNext = button(h, 'Nächste Information aufdecken').props.onClick;
  h.click('Nächste Information aufdecken');
  const staleBack = button(h, 'Vorige Information').props.onClick;
  h.navigate({ eintrag: cases[1].id }); h.navigate({ eintrag: cases[0].id });
  staleAnswer(); staleNext(); staleBack(); h.render();
  assert.ok(!text(body(h)).includes(cases[0].stages[1].evidence));
  assert.match(text(menu(h)), /1 von 24 Entscheidungen/);
  h.click('Nächste Information aufdecken'); assert.ok(text(body(h)).includes(cases[0].stages[1].evidence));
});

test('A current failed push preserves matching content and retry; cancelled, superseded and unmounted failures stay silent', async t => {
  const h = fixture(t, { eintrag: cases[0].id }); const rejects = [];
  h.router.push = () => new Promise((resolve, reject) => rejects.push(reject));
  const first = choose(h, cases[1].id); const second = choose(h, cases[2].id);
  rejects[0](new Error('old')); await first; h.render(); assert.equal(h.menu.opened, 0);
  rejects[1](new Error('network')); await second; h.render();
  assert.equal(title(h), cases[0].title); assert.equal(h.router.query.eintrag, cases[0].id);
  assert.equal(h.menu.opened, 1); assert.match(text(menu(h)), /Fall konnte nicht geöffnet/);
  const third = choose(h, cases[1].id); rejects[2](Object.assign(new Error('cancelled'), { cancelled: true })); await third; h.render();
  assert.equal(h.menu.opened, 1); assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
  const fourth = choose(h, cases[1].id);
  const answer = button(h, cases[0].stages[0].choices[0]).props.onClick;
  h.dispose(); answer(); rejects[3](new Error('unmounted')); await fourth;
  assert.equal(h.menu.opened, 1);
});

test('Re-selecting the committed case supersedes pending requests even after an older request finishes', async t => {
  const h = fixture(t, { eintrag: cases[0].id }); const rejects = [];
  h.router.push = href => { h.calls.push({ href }); return new Promise((resolve, reject) => rejects.push(reject)); };
  const first = choose(h, cases[1].id); const second = choose(h, cases[2].id);
  rejects[0](Object.assign(new Error('old cancelled'), { cancelled: true })); await first;
  const latest = choose(h, cases[0].id); assert.equal(h.calls.length, 3);
  rejects[1](new Error('superseded')); await second;
  rejects[2](Object.assign(new Error('cancelled'), { cancelled: true })); await latest; h.render();
  assert.equal(title(h), cases[0].title); assert.equal(h.menu.opened, 0);
});

test('A late error cannot reopen the menu after external history, including away and back to the identical case', async t => {
  for (const visits of [[cases[2].id], [cases[2].id, cases[0].id]]) {
    const h = fixture(t, { eintrag: cases[0].id }); let reject;
    h.router.push = () => new Promise((resolve, fail) => { reject = fail; });
    const pending = choose(h, cases[1].id);
    for (const id of visits) h.navigate({ eintrag: id });
    reject(new Error('late failure')); await pending; h.render();
    assert.equal(title(h), cases.find(entry => entry.id === visits.at(-1)).title);
    assert.equal(h.menu.opened, 0); assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
  }
});
